from django.urls import path
from .views import (
    PredictionListCreateView, PredictionDetailView, RankingView,
    AdminPredictionListView, AdminPredictionUpsertView,
)

urlpatterns = [
    path('', PredictionListCreateView.as_view(), name='prediction-list-create'),
    path('/ranking', RankingView.as_view(), name='prediction-ranking'),
    path('/admin', AdminPredictionListView.as_view(), name='prediction-admin-list'),
    path('/admin/upsert', AdminPredictionUpsertView.as_view(), name='prediction-admin-upsert'),
    path('/<int:pk>', PredictionDetailView.as_view(), name='prediction-detail'),
]
