from django.db import models
from django.conf import settings
from apps.matches.models import Match


class Prediction(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='predictions',
        verbose_name='Usuário'
    )
    match = models.ForeignKey(
        Match,
        on_delete=models.CASCADE,
        related_name='predictions',
        verbose_name='Partida'
    )
    home_score = models.IntegerField(verbose_name='Palpite casa')
    away_score = models.IntegerField(verbose_name='Palpite visitante')
    points = models.IntegerField(default=0, editable=False, verbose_name='Pontos')

    class Meta:
        verbose_name = 'Palpite'
        verbose_name_plural = 'Palpites'
        unique_together = [('user', 'match')]

    def __str__(self):
        return f'{self.user.username} - {self.match} ({self.home_score}x{self.away_score})'

    def calculate_points(self):
        """
        Calculate points based on match result.
        - Exact score: 3 points
        - Correct winner or draw: 1 point
        - Wrong: 0 points
        """
        match = self.match
        if not match.is_finished or match.home_score is None or match.away_score is None:
            return 0

        # Exact score
        if self.home_score == match.home_score and self.away_score == match.away_score:
            return 3

        # Determine results
        def result(home, away):
            if home > away:
                return 'home'
            elif away > home:
                return 'away'
            else:
                return 'draw'

        pred_result = result(self.home_score, self.away_score)
        match_result = result(match.home_score, match.away_score)

        if pred_result == match_result:
            return 1

        return 0
