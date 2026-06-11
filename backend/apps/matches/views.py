from rest_framework import generics, permissions
from .models import Match
from .serializers import MatchSerializer
from apps.users.views import IsAdminUser


class MatchListCreateView(generics.ListCreateAPIView):
    queryset = Match.objects.all().order_by('match_datetime')
    serializer_class = MatchSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]


class MatchDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]
