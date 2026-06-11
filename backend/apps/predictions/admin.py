from django.contrib import admin
from .models import Prediction


@admin.register(Prediction)
class PredictionAdmin(admin.ModelAdmin):
    list_display = ['user', 'match', 'home_score', 'away_score', 'points']
    list_filter = ['match__is_finished']
    search_fields = ['user__username', 'match__home_team', 'match__away_team']
    readonly_fields = ['points']
    ordering = ['-points', 'user__username']
