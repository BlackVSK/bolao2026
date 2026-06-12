from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('matches', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='match',
            name='external_id',
            field=models.IntegerField(
                blank=True,
                null=True,
                unique=True,
                verbose_name='ID externo (football-data.org)',
                help_text='ID do jogo na API externa. Preenchido automaticamente pela sync.',
            ),
        ),
    ]
