from django.urls import path
from .views import StandingsView, MatchesView, ScorersView, EnrichedMatchesView, SyncMatchesView

urlpatterns = [
    path('standings/', StandingsView.as_view(), name='wc-standings'),
    path('matches/', MatchesView.as_view(), name='wc-matches'),
    path('matches-enriched/', EnrichedMatchesView.as_view(), name='wc-matches-enriched'),
    path('scorers/', ScorersView.as_view(), name='wc-scorers'),
    path('sync/', SyncMatchesView.as_view(), name='wc-sync'),
]
