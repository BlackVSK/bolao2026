from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.views import CustomTokenObtainPairView

urlpatterns = [
    path('painel-interno/', admin.site.urls),  # URL não-óbvia para o admin Django
    path('api/auth/login', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users', include('apps.users.urls')),
    path('api/matches', include('apps.matches.urls')),
    path('api/predictions', include('apps.predictions.urls')),
]
