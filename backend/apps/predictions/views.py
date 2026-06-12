from django.utils import timezone
from django.db.models import Sum, Value, IntegerField
from django.db.models.functions import Coalesce
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Prediction
from .serializers import PredictionSerializer, AdminPredictionSerializer, RankingSerializer
from apps.users.models import User
from apps.users.views import IsAdminUser


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
        # Admin pode ver/editar qualquer palpite
        if self.request.user.is_admin:
            return Prediction.objects.all().select_related('match', 'user')
        return Prediction.objects.filter(user=self.request.user).select_related('match', 'user')

    def update(self, request, *args, **kwargs):
        # Admin não tem bloqueio de horário
        if not request.user.is_admin:
            instance = self.get_object()
            if timezone.now() >= instance.match.match_datetime:
                return Response(
                    {'detail': 'O prazo para palpites nesta partida já encerrou.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        return super().update(request, *args, **kwargs)


class AdminPredictionListView(generics.ListAPIView):
    """Lista todos os palpites de todos os usuários. Apenas admin."""
    serializer_class = AdminPredictionSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = Prediction.objects.all().select_related('match', 'user').order_by(
            'match__match_datetime', 'user__username'
        )
        match_id = self.request.query_params.get('match')
        if match_id:
            qs = qs.filter(match_id=match_id)
        user_id = self.request.query_params.get('user')
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs


class AdminPredictionUpsertView(APIView):
    """Cria ou atualiza palpite de qualquer usuário. Apenas admin."""
    permission_classes = [IsAdminUser]

    def post(self, request):
        user_id = request.data.get('user')
        match_id = request.data.get('match')
        home_score = request.data.get('home_score')
        away_score = request.data.get('away_score')

        if None in (user_id, match_id, home_score, away_score):
            return Response({'detail': 'Campos obrigatórios: user, match, home_score, away_score.'}, status=400)

        try:
            from apps.users.models import User
            from apps.matches.models import Match
            user = User.objects.get(id=user_id)
            match = Match.objects.get(id=match_id)
        except Exception as e:
            return Response({'detail': str(e)}, status=404)

        pred, created = Prediction.objects.update_or_create(
            user=user,
            match=match,
            defaults={'home_score': int(home_score), 'away_score': int(away_score)}
        )
        serializer = AdminPredictionSerializer(pred)
        return Response(serializer.data, status=201 if created else 200)


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
