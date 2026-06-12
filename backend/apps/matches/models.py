from django.db import models


class Match(models.Model):
    home_team = models.CharField(max_length=100, verbose_name='Time da casa', blank=False, null=False)
    home_flag = models.CharField(max_length=20, verbose_name='Bandeira da casa')
    away_team = models.CharField(max_length=100, verbose_name='Time visitante', blank=False, null=False)
    away_flag = models.CharField(max_length=20, verbose_name='Bandeira visitante', blank=False, null=False)
    match_datetime = models.DateTimeField(verbose_name='Data e hora da partida', blank=False, null=False)
    home_score = models.IntegerField(null=True, blank=True, verbose_name='Gols da casa')
    away_score = models.IntegerField(null=True, blank=True, verbose_name='Gols visitante')
    is_finished = models.BooleanField(default=False, verbose_name='Finalizada')
    external_id = models.IntegerField(
        null=True, blank=True, unique=True,
        verbose_name='ID externo (football-data.org)',
        help_text='ID do jogo na API externa. Preenchido automaticamente pela sync.'
    )

    class Meta:
        verbose_name = 'Partida'
        verbose_name_plural = 'Partidas'
        ordering = ['match_datetime']

    def __str__(self):
        return f'{self.home_flag} {self.home_team} vs {self.away_team} {self.away_flag}'
