from django.utils import timezone
from django.db.models import Sum, Value, IntegerField
from django.db.models.functions import Coalesce
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Prediction
from .serializers import PredictionSerializer, RankingSerializer
from apps.users.models import User


class PredictionListCreateView(generics.ListCreateAPIView):
    serializer_class = PredictionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Prediction.objects.filter(user=self.request.user).select_related('match', 'user')

    def perform_create(self, serializer):
        match = serializer.validated_data.get('match')
        if timezone.now() >= match.match_datetime:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('O prazo para palpites nesta partida já encerrou.')
        serializer.save(user=self.request.user)


class PredictionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PredictionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Prediction.objects.filter(user=self.request.user).select_related('match', 'user')

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if timezone.now() >= instance.match.match_datetime:
            return Response(
                {'detail': 'O prazo para palpites nesta partida já encerrou.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)


class RankingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        ranking = (
            User.objects
            .annotate(
                total_points=Coalesce(
                    Sum('predictions__points'),
                    Value(0),
                    output_field=IntegerField()
                )
            )
            .order_by('-total_points', 'username')
            .values('id', 'username', 'total_points')
        )

        result = [
            {
                'user_id': item['id'],
                'username': item['username'],
                'total_points': item['total_points'],
            }
            for item in ranking
        ]

        serializer = RankingSerializer(result, many=True)
        return Response(serializer.data)
