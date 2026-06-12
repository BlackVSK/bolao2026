from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    username = models.CharField(max_length=150, unique=True)
    is_admin = models.BooleanField(default=False)

    # Keep is_staff and is_superuser only for admin users
    # They are inherited from AbstractUser vsf

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'

    def __str__(self):
        return self.username
