from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .services import get_standings, get_matches, get_scorers, get_enriched_matches
from .sync import sync_matches_from_api


class StandingsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        data, status_code = get_standings()
        return Response(data, status=status_code)


class MatchesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        stage = request.query_params.get('stage')
        data, status_code = get_matches(stage=stage)
        return Response(data, status=status_code)


class ScorersView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        data, status_code = get_scorers()
        return Response(data, status=status_code)


class EnrichedMatchesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        stage = request.query_params.get('stage')
        data, status_code = get_enriched_matches(stage=stage)
        return Response(data, status=status_code)


class SyncMatchesView(APIView):
    """Endpoint para disparar sync manual. Apenas admin."""

    def post(self, request):
        from apps.users.views import IsAdminUser
        self.permission_classes = [IsAdminUser]
        self.check_permissions(request)

        stats = sync_matches_from_api()
        return Response({'ok': True, 'stats': stats})
