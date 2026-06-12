from celery import shared_task
from .sync import sync_matches_from_api


@shared_task(name='world_cup.sync_matches')
def sync_matches_task():
    """Task Celery que sincroniza os jogos da Copa. Agendada a cada hora."""
    return sync_matches_from_api()
