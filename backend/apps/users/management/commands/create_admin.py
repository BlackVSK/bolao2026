from django.core.management.base import BaseCommand
from apps.users.models import User


class Command(BaseCommand):
    help = 'Creates an admin user for the bolão application'

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, required=True, help='Admin username')
        parser.add_argument('--password', type=str, required=True, help='Admin password')

    def handle(self, *args, **options):
        username = options['username']
        password = options['password']

        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.WARNING(f'User "{username}" already exists.')
            )
            return

        user = User.objects.create_superuser(
            username=username,
            password=password,
            is_admin=True,
        )
        self.stdout.write(
            self.style.SUCCESS(f'Admin user "{username}" created successfully.')
        )
