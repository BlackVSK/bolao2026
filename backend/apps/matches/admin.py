from django.contrib import admin
from .models import Match


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = [
        'home_team', 'home_flag', 'away_team', 'away_flag',
        'match_datetime', 'home_score', 'away_score', 'is_finished'
    ]
    list_filter = ['is_finished', 'match_datetime']
    list_editable = ['home_score', 'away_score', 'is_finished']
    search_fields = ['home_team', 'away_team']
    ordering = ['match_datetime']
