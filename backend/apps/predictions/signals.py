from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.matches.models import Match
from .models import Prediction


@receiver(post_save, sender=Match)
def update_predictions_on_match_finish(sender, instance, **kwargs):
    """
    When a match is marked as finished, recalculate points
    for all predictions related to that match.
    """
    if instance.is_finished and instance.home_score is not None and instance.away_score is not None:
        predictions = Prediction.objects.filter(match=instance)
        for prediction in predictions:
            points = prediction.calculate_points()
            if prediction.points != points:
                Prediction.objects.filter(pk=prediction.pk).update(points=points)
