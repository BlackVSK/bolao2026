import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('bolao')

# Lê configuração do Django settings (prefixo CELERY_)
app.config_from_object('django.conf:settings', namespace='CELERY')

# Descobre tasks automaticamente em todos os apps instalados
app.autodiscover_tasks()

# Agenda periódico: sync a cada hora
app.conf.beat_schedule = {
    'sync-world-cup-matches-hourly': {
        'task': 'world_cup.sync_matches',
        'schedule': crontab(minute=0),  # no início de cada hora
    },
}
