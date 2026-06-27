from django.apps import AppConfig
from django.db.models.signals import post_migrate


def ensure_default_demo_accounts(**kwargs):
    from django.contrib.auth.models import User

    librarian = User.objects.filter(username='libuser').first()
    if not librarian:
        librarian = User.objects.create_user(
            username='libuser',
            email='libuser@example.com',
            password='Pass1234!',
            is_staff=True,
        )
    else:
        librarian.is_staff = True
        librarian.email = librarian.email or 'libuser@example.com'
        librarian.set_password('Pass1234!')
        librarian.save(update_fields=['is_staff', 'email', 'password'])

    member = User.objects.filter(username='memberuser').first()
    if not member:
        member = User.objects.create_user(
            username='memberuser',
            email='memberuser@example.com',
            password='Pass1234!',
            is_staff=False,
        )
    else:
        member.is_staff = False
        member.email = member.email or 'memberuser@example.com'
        member.set_password('Pass1234!')
        member.save(update_fields=['is_staff', 'email', 'password'])

    from .models import Member

    Member.objects.get_or_create(
        email='memberuser@example.com',
        defaults={'name': 'memberuser', 'status': 'Active'},
    )


class LibraryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'library'

    def ready(self):
        post_migrate.connect(ensure_default_demo_accounts, sender=self)
