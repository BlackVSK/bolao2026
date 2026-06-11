from django.urls import path
from .views import PredictionListCreateView, PredictionDetailView, RankingView

urlpatterns = [
    path('', PredictionListCreateView.as_view(), name='prediction-list-create'),
    path('/ranking', RankingView.as_view(), name='prediction-ranking'),
    path('/<int:pk>', PredictionDetailView.as_view(), name='prediction-detail'),
]
