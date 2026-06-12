from rest_framework import serializers
from .models import Prediction
from apps.matches.serializers import MatchSerializer


class PredictionSerializer(serializers.ModelSerializer):
    match_detail = MatchSerializer(source='match', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Prediction
        fields = ['id', 'user', 'username', 'match', 'match_detail', 'home_score', 'away_score', 'points']
        read_only_fields = ['user', 'points']

    def validate(self, attrs):
        from django.utils import timezone
        match = attrs.get('match')
        if match is None and self.instance is not None:
            match = self.instance.match
        if match and timezone.now() >= match.match_datetime:
            raise serializers.ValidationError(
                'O prazo para palpites nesta partida já encerrou.'
            )
        return attrs


class AdminPredictionSerializer(serializers.ModelSerializer):
    """Serializer para uso admin — expõe user_id, username e match completo."""
    match_detail = MatchSerializer(source='match', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = Prediction
        fields = ['id', 'user_id', 'username', 'match', 'match_detail', 'home_score', 'away_score', 'points']


class RankingSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    total_points = serializers.IntegerField()
