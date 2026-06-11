from django.db import models


class Match(models.Model):
    home_team = models.CharField(max_length=100, verbose_name='Time da casa')
    home_flag = models.CharField(max_length=20, verbose_name='Bandeira da casa')
    away_team = models.CharField(max_length=100, verbose_name='Time visitante')
    away_flag = models.CharField(max_length=20, verbose_name='Bandeira visitante')
    match_datetime = models.DateTimeField(verbose_name='Data e hora da partida')
    home_score = models.IntegerField(null=True, blank=True, verbose_name='Gols da casa')
    away_score = models.IntegerField(null=True, blank=True, verbose_name='Gols visitante')
    is_finished = models.BooleanField(default=False, verbose_name='Finalizada')

    class Meta:
        verbose_name = 'Partida'
        verbose_name_plural = 'Partidas'
        ordering = ['match_datetime']

    def __str__(self):
        return f'{self.home_flag} {self.home_team} vs {self.away_team} {self.away_flag}'
