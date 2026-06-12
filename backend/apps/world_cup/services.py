import unicodedata
import requests
from django.core.cache import cache
from django.conf import settings

BASE_URL = 'https://api.football-data.org/v4'
COMPETITION = 'WC'

# Mapeamento de nomes em inglês (API externa) → português (nosso sistema)
# Adicione entradas conforme necessário ao longo do torneio
TEAM_NAME_MAP = {
    'brazil': 'brasil',
    'germany': 'alemanha',
    'france': 'frança',
    'spain': 'espanha',
    'england': 'inglaterra',
    'portugal': 'portugal',
    'argentina': 'argentina',
    'netherlands': 'holanda',
    'belgium': 'bélgica',
    'croatia': 'croácia',
    'switzerland': 'suíça',
    'sweden': 'suécia',
    'norway': 'noruega',
    'austria': 'áustria',
    'turkey': 'turquia',
    'czech republic': 'república tcheca',
    'czechia': 'república tcheca',
    'scotland': 'escócia',
    'bosnia and herzegovina': 'bósnia e herzegovina',
    'bosnia & herzegovina': 'bósnia e herzegovina',
    'bosnia-herzegovina': 'bósnia e herzegovina',
    'united states': 'estados unidos',
    'usa': 'estados unidos',
    'canada': 'canadá',
    'mexico': 'méxico',
    'colombia': 'colômbia',
    'ecuador': 'equador',
    'paraguay': 'paraguai',
    'uruguay': 'uruguai',
    'new zealand': 'nova zelândia',
    'japan': 'japão',
    'south korea': 'coreia do sul',
    'korea republic': 'coreia do sul',
    'australia': 'austrália',
    'iran': 'irã',
    'iraq': 'iraque',
    'saudi arabia': 'arábia saudita',
    'qatar': 'catar',
    'jordan': 'jordânia',
    'uzbekistan': 'uzbequistão',
    'morocco': 'marrocos',
    'senegal': 'senegal',
    'ghana': 'gana',
    'egypt': 'egito',
    'algeria': 'argélia',
    'tunisia': 'tunísia',
    'south africa': 'áfrica do sul',
    'cape verde': 'cabo verde',
    'ivory coast': 'costa do marfim',
    "côte d'ivoire": 'costa do marfim',
    'dr congo': 'rd do congo',
    'democratic republic of congo': 'rd do congo',
    'panama': 'panamá',
    'haiti': 'haiti',
    'curaçao': 'curaçau',
}


def _normalize(name: str) -> str:
    """Minúsculas + remove acentos para comparação robusta."""
    return unicodedata.normalize('NFKD', name.lower()).encode('ascii', 'ignore').decode()


def _to_bolao_name(external_name: str) -> str:
    """Converte nome da API externa para o nome usado no bolão."""
    if not external_name:
        return ''
    lower = external_name.lower().strip()
    if lower in TEAM_NAME_MAP:
        return TEAM_NAME_MAP[lower]
    norm = _normalize(lower)
    for eng, pt in TEAM_NAME_MAP.items():
        if _normalize(eng) == norm:
            return pt
    return external_name


def _get_headers() -> dict:
    return {'X-Auth-Token': settings.FOOTBALL_API_KEY}


def _fetch(url: str, params: dict = None) -> dict | None:
    """Faz a requisição HTTP à API externa. Retorna None em caso de falha."""
    try:
        response = requests.get(url, headers=_get_headers(), params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.RequestException:
        return None


def get_standings() -> tuple[dict, int]:
    """
    Retorna grupos e classificação.
    Cache: 5 minutos. Em falha, tenta retornar cache antigo; senão 503.
    """
    cache_key = 'wc_standings'
    cached = cache.get(cache_key)
    if cached:
        return cached, 200

    data = _fetch(f'{BASE_URL}/competitions/{COMPETITION}/standings')
    if data is not None:
        cache.set(cache_key, data, timeout=300)  # 5 min
        cache.set(f'{cache_key}_stale', data, timeout=3600)
        return data, 200

    stale = cache.get(f'{cache_key}_stale')
    if stale:
        return stale, 200

    return {'error': 'Serviço indisponível'}, 503


def get_matches(stage: str = None) -> tuple[dict, int]:
    """
    Retorna lista de jogos da API externa (sem enriquecimento).
    stage opcional (ex: 'GROUP_STAGE', 'ROUND_OF_16').
    Cache: 2 minutos.
    """
    cache_key = f'wc_matches_{stage or "all"}'
    cached = cache.get(cache_key)
    if cached:
        return cached, 200

    params = {'stage': stage} if stage else None
    data = _fetch(f'{BASE_URL}/competitions/{COMPETITION}/matches', params=params)
    if data is not None:
        cache.set(cache_key, data, timeout=120)  # 2 min
        cache.set(f'{cache_key}_stale', data, timeout=3600)
        return data, 200

    stale = cache.get(f'{cache_key}_stale')
    if stale:
        return stale, 200

    return {'error': 'Serviço indisponível'}, 503


def get_scorers() -> tuple[dict, int]:
    """
    Retorna artilharia.
    Cache: 5 minutos.
    """
    cache_key = 'wc_scorers'
    cached = cache.get(cache_key)
    if cached:
        return cached, 200

    data = _fetch(f'{BASE_URL}/competitions/{COMPETITION}/scorers')
    if data is not None:
        cache.set(cache_key, data, timeout=300)  # 5 min
        cache.set(f'{cache_key}_stale', data, timeout=3600)
        return data, 200

    stale = cache.get(f'{cache_key}_stale')
    if stale:
        return stale, 200

    return {'error': 'Serviço indisponível'}, 503


def get_enriched_matches(stage: str = None) -> tuple[list, int]:
    """
    Retorna jogos da API externa enriquecidos com dados do bolão.

    Cada item da lista contém:
      - Todos os campos do jogo externo (times, placar, status, fase)
      - bolao_match: dados do Match do bolão correspondente (id, match_datetime,
        home_score, away_score, is_finished, home_flag, away_flag)
        ou None se não houver correspondência

    Correspondência: normaliza home_team + away_team de ambos os lados e cruza.
    Cache: 2 minutos.
    """
    from apps.matches.models import Match

    cache_key = f'wc_enriched_{stage or "all"}'
    cached = cache.get(cache_key)
    if cached is not None:
        return cached, 200

    # Busca jogos externos
    params = {'stage': stage} if stage else None
    external_data = _fetch(f'{BASE_URL}/competitions/{COMPETITION}/matches', params=params)

    if external_data is None:
        stale = cache.get(f'{cache_key}_stale')
        if stale:
            return stale, 200
        return [{'error': 'Serviço indisponível'}], 503

    external_matches = external_data.get('matches', [])

    # Carrega todos os matches do bolão e indexa por (home_norm, away_norm)
    bolao_matches = Match.objects.all()
    bolao_index = {}
    for m in bolao_matches:
        key = (_normalize(m.home_team), _normalize(m.away_team))
        bolao_index[key] = m

    result = []
    for ext in external_matches:
        home_name = ext.get('homeTeam') or {}
        away_name_raw = ext.get('awayTeam') or {}
        home_name = home_name.get('name') or ''
        away_name = away_name_raw.get('name') or ''

        # Converte para português e normaliza para busca
        home_pt = _to_bolao_name(home_name)
        away_pt = _to_bolao_name(away_name)
        lookup_key = (_normalize(home_pt), _normalize(away_pt))

        bolao_match = bolao_index.get(lookup_key)

        enriched = dict(ext)
        if bolao_match:
            enriched['bolao_match'] = {
                'id': bolao_match.id,
                'match_datetime': bolao_match.match_datetime.isoformat(),
                'home_score': bolao_match.home_score,
                'away_score': bolao_match.away_score,
                'is_finished': bolao_match.is_finished,
                'home_flag': bolao_match.home_flag,
                'away_flag': bolao_match.away_flag,
            }
        else:
            enriched['bolao_match'] = None

        result.append(enriched)

    cache.set(cache_key, result, timeout=120)
    cache.set(f'{cache_key}_stale', result, timeout=3600)
    return result, 200


def get_live_data_for_bolao_match(bolao_match_id: int) -> dict | None:
    """
    Dado um ID de Match do bolão, retorna os dados ao vivo da API externa
    (status, placar ao vivo) se houver correspondência.
    Usa o cache de enriched_matches para não fazer chamadas extras.
    """
    from apps.matches.models import Match

    try:
        bolao_match = Match.objects.get(id=bolao_match_id)
    except Match.DoesNotExist:
        return None

    home_norm = _normalize(bolao_match.home_team)
    away_norm = _normalize(bolao_match.away_team)

    # Tenta cache de enriched primeiro
    enriched, _ = get_enriched_matches()
    if isinstance(enriched, list):
        for ext in enriched:
            if ext.get('bolao_match') and ext['bolao_match']['id'] == bolao_match_id:
                return {
                    'live_status': ext.get('status'),
                    'live_home_score': ext.get('score', {}).get('fullTime', {}).get('home'),
                    'live_away_score': ext.get('score', {}).get('fullTime', {}).get('away'),
                    'live_minute': ext.get('minute'),
                }

    return None
