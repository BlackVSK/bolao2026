from django.core.management.base import BaseCommand
from apps.world_cup.sync import sync_matches_from_api


class Command(BaseCommand):
    help = 'Sincroniza os jogos da Copa do Mundo com a API football-data.org'

    def handle(self, *args, **options):
        self.stdout.write('Iniciando sync...')
        stats = sync_matches_from_api()
        self.stdout.write(self.style.SUCCESS(
            f'Sync concluída — '
            f'criados: {stats["created"]} | '
            f'atualizados: {stats["updated"]} | '
            f'finalizados: {stats["finished"]} | '
            f'ignorados: {stats["skipped"]} | '
            f'erros: {stats["errors"]}'
        ))
