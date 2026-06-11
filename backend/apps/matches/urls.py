from django.urls import path
from .views import MatchListCreateView, MatchDetailView

urlpatterns = [
    path('', MatchListCreateView.as_view(), name='match-list-create'),
    path('/<int:pk>', MatchDetailView.as_view(), name='match-detail'),
]
