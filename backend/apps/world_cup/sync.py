"""
Sincronização de partidas da Copa do Mundo com a API football-data.org.

Fluxo:
  1. Busca todos os jogos da competição WC via API externa
  2. Para cada jogo, faz upsert no modelo Match usando external_id como chave
  3. Se o jogo passou a ser FINISHED, atualiza placar + is_finished e dispara
     o signal existente que recalcula pontos de todos os palpites daquele jogo

Chamado pelo Celery Beat a cada hora (ver tasks.py).
Pode também ser invocado manualmente via endpoint admin ou manage.py.
"""

import logging
from datetime import datetime, timezone

from django.utils.dateparse import parse_datetime

from apps.matches.models import Match
from .services import _fetch, BASE_URL, COMPETITION, TEAM_NAME_MAP, _normalize

logger = logging.getLogger(__name__)

# Mapeamento nome inglês → código de bandeira ISO usado no bolão
# Espelha o COUNTRIES do frontend (countries.js)
FLAG_MAP = {
    'brazil': 'br',
    'germany': 'de',
    'france': 'fr',
    'spain': 'es',
    'england': 'gb-eng',
    'portugal': 'pt',
    'argentina': 'ar',
    'netherlands': 'nl',
    'belgium': 'be',
    'croatia': 'hr',
    'switzerland': 'ch',
    'sweden': 'se',
    'norway': 'no',
    'austria': 'at',
    'turkey': 'tr',
    'czech republic': 'cz',
    'czechia': 'cz',
    'scotland': 'gb-sct',
    'bosnia and herzegovina': 'ba',
    'bosnia & herzegovina': 'ba',
    'bosnia-herzegovina': 'ba',
    'bosnia herzegovina': 'ba',
    'united states': 'us',
    'usa': 'us',
    'canada': 'ca',
    'mexico': 'mx',
    'colombia': 'co',
    'ecuador': 'ec',
    'paraguay': 'py',
    'uruguay': 'uy',
    'new zealand': 'nz',
    'japan': 'jp',
    'south korea': 'kr',
    'korea republic': 'kr',
    'australia': 'au',
    'iran': 'ir',
    'iraq': 'iq',
    'saudi arabia': 'sa',
    'qatar': 'qa',
    'jordan': 'jo',
    'uzbekistan': 'uz',
    'morocco': 'ma',
    'senegal': 'sn',
    'ghana': 'gh',
    'egypt': 'eg',
    'algeria': 'dz',
    'tunisia': 'tn',
    'south africa': 'za',
    'cape verde': 'cv',
    'ivory coast': 'ci',
    "côte d'ivoire": 'ci',
    'dr congo': 'cd',
    'democratic republic of congo': 'cd',
    'panama': 'pa',
    'haiti': 'ht',
    'curaçao': 'cw',
    'peru': 'pe',
    'chile': 'cl',
    'venezuela': 've',
    'bolivia': 'bo',
}


def _team_flag(name: str) -> str:
    """Retorna o código ISO da bandeira dado o nome em inglês."""
    if not name:
        return ''
    key = name.lower().strip()
    return FLAG_MAP.get(key, FLAG_MAP.get(_normalize(key), ''))


def _team_name_pt(name: str) -> str:
    """Retorna o nome do time em português."""
    if not name:
        return name or ''
    key = name.lower().strip()
    if key in TEAM_NAME_MAP:
        return TEAM_NAME_MAP[key]
    norm = _normalize(key)
    for eng, pt in TEAM_NAME_MAP.items():
        if _normalize(eng) == norm:
            return pt
    # Sem correspondência — usa o nome original da API
    return name


def sync_matches_from_api() -> dict:
    """
    Sincroniza todos os jogos da Copa do Mundo com o banco local.

    Retorna um dict com estatísticas:
      created: jogos novos inseridos
      updated: jogos existentes atualizados
      finished: jogos que passaram para is_finished=True (pontos recalculados)
      skipped: jogos ignorados (times TBD ou sem dados suficientes)
      errors: erros encontrados
    """
    stats = {'created': 0, 'updated': 0, 'finished': 0, 'skipped': 0, 'errors': 0}

    data = _fetch(f'{BASE_URL}/competitions/{COMPETITION}/matches')
    if data is None:
        logger.error('sync_matches_from_api: falha ao buscar jogos da API externa')
        stats['errors'] += 1
        return stats

    external_matches = data.get('matches', [])
    logger.info('sync_matches_from_api: %d jogos recebidos da API', len(external_matches))

    for ext in external_matches:
        try:
            _sync_single(ext, stats)
        except Exception as exc:
            logger.exception('sync_matches_from_api: erro ao processar jogo %s: %s', ext.get('id'), exc)
            stats['errors'] += 1

    logger.info(
        'sync_matches_from_api: criados=%d atualizados=%d finalizados=%d ignorados=%d erros=%d',
        stats['created'], stats['updated'], stats['finished'], stats['skipped'], stats['errors'],
    )
    return stats


def _sync_single(ext: dict, stats: dict) -> None:
    """Processa um único jogo da API externa."""
    external_id = ext.get('id')
    if not external_id:
        stats['skipped'] += 1
        return

    home_name_en = (ext.get('homeTeam') or {}).get('name') or ''
    away_name_en = (ext.get('awayTeam') or {}).get('name') or ''

    # Jogos futuros na fase eliminatória ainda não têm times definidos
    if not home_name_en or not away_name_en:
        # Atualiza apenas resultado se o jogo já existe no banco
        try:
            match = Match.objects.get(external_id=external_id)
            _apply_result(match, ext, stats)
        except Match.DoesNotExist:
            stats['skipped'] += 1
        return

    home_name_pt = _team_name_pt(home_name_en)
    away_name_pt = _team_name_pt(away_name_en)
    home_flag = _team_flag(home_name_en)
    away_flag = _team_flag(away_name_en)

    utc_date = ext.get('utcDate')
    if not utc_date:
        stats['skipped'] += 1
        return

    match_datetime = parse_datetime(utc_date)
    if match_datetime is None:
        stats['skipped'] += 1
        return

    # Upsert por external_id
    try:
        match = Match.objects.get(external_id=external_id)
        created = False
    except Match.DoesNotExist:
        match = Match(external_id=external_id)
        created = True

    match.home_team = home_name_pt
    match.away_team = away_name_pt
    match.home_flag = home_flag
    match.away_flag = away_flag
    match.match_datetime = match_datetime

    was_finished = match.is_finished

    _apply_result(match, ext, stats, save=False)

    if created:
        match.save()
        stats['created'] += 1
    else:
        match.save()
        if not was_finished and match.is_finished:
            stats['finished'] += 1
        else:
            stats['updated'] += 1


def _apply_result(match: Match, ext: dict, stats: dict, save: bool = True) -> None:
    """Aplica placar e status do jogo externo ao objeto Match."""
    status = ext.get('status', '')
    score = ext.get('score') or {}
    full_time = score.get('fullTime') or {}

    is_finished = status == 'FINISHED'
    home_score = full_time.get('home')
    away_score = full_time.get('away')

    match.is_finished = is_finished
    match.home_score = home_score if home_score is not None else match.home_score
    match.away_score = away_score if away_score is not None else match.away_score

    if save:
        match.save()
