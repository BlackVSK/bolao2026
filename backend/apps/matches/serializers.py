from rest_framework import serializers
from .models import Match


class MatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = [
            'id',
            'home_team',
            'home_flag',
            'away_team',
            'away_flag',
            'match_datetime',
            'home_score',
            'away_score',
            'is_finished',
        ]
