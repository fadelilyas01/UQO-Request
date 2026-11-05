"""
Commande d'initialisation des comptes d'administration et de gestion pour l'UQO.
Usage: python manage.py create_demo_data
"""

import os
import secrets
import string
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()


def generate_compliant_password(length=14):
    """
    Genere un mot de passe aleatoire robuste conforme au validateur de complexite :
    - Au moins 1 majuscule
    - Au moins 1 minuscule
    - Au moins 1 chiffre
    - Au moins 1 caractere special
    """
    upper = secrets.choice(string.ascii_uppercase)
    lower = secrets.choice(string.ascii_lowercase)
    digit = secrets.choice(string.digits)
    symbol = secrets.choice("!@#$%^&*-_=+")
    all_chars = string.ascii_letters + string.digits + "!@#$%^&*-_=+"
    rest = ''.join(secrets.choice(all_chars) for _ in range(length - 4))
    pwd_list = list(upper + lower + digit + symbol + rest)
    secrets.SystemRandom().shuffle(pwd_list)
    return ''.join(pwd_list)


class Command(BaseCommand):
    help = 'Initialise les comptes administrateur et gestionnaire de l\'UQO et purge les comptes par defaut'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force l\'execution meme si DEBUG=False',
        )

    def handle(self, *args, **options):
        if not settings.DEBUG and not options.get('force'):
            raise CommandError(
                "Securite : create_demo_data est desactive en production (DEBUG=False). "
                "Utilisez --force uniquement si vous etes certain de votre operation."
            )

        self.stdout.write(self.style.NOTICE('Initialisation des comptes officiels UQO...'))

        # 1. Purge des anciens comptes de demonstration et etudiants par defaut
        old_emails = [
            'admin@uqo.ca',
            'gestionnaire@uqo.ca',
            'jean.dupont@uqo.ca',
            'sophie.martin@uqo.ca'
        ]
        deleted_count, _ = User.objects.filter(email__in=old_emails).delete()
        if deleted_count > 0:
            self.stdout.write(self.style.WARNING(
                f'Purge effectuee : {deleted_count} ancien(s) compte(s) ou etudiant(s) par defaut supprime(s).'
            ))

        admin_pwd = os.getenv('DEMO_ADMIN_PASSWORD') or generate_compliant_password(14)
        manager_pwd = os.getenv('DEMO_MANAGER_PASSWORD') or generate_compliant_password(14)

        # 2. Compte Administrateur Officiel UQO
        admin, created = User.objects.get_or_create(
            email='ilyasfadel01@uqo.ca',
            defaults={
                'username': 'ilyasfadel01',
                'first_name': 'Ilyas',
                'last_name': 'Fadel',
                'role': User.Role.MANAGER,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin.set_password(admin_pwd)
            admin.save()
            self.stdout.write(self.style.SUCCESS('Compte administrateur cree avec succes :'))
            self.stdout.write(f'  Email       : {admin.email}')
            self.stdout.write(f'  Mot de passe: {admin_pwd}')
        else:
            self.stdout.write(self.style.WARNING(f'Compte administrateur existant : {admin.email}'))

        # 3. Compte Gestionnaire Officiel UQO
        manager, created = User.objects.get_or_create(
            email='fadelilyas@uqo.ca',
            defaults={
                'username': 'fadelilyas',
                'first_name': 'Ilyas',
                'last_name': 'Fadel',
                'role': User.Role.MANAGER,
                'is_staff': True,
                'is_superuser': False,
            }
        )
        if created:
            manager.set_password(manager_pwd)
            manager.save()
            self.stdout.write(self.style.SUCCESS('Compte gestionnaire cree avec succes :'))
            self.stdout.write(f'  Email       : {manager.email}')
            self.stdout.write(f'  Mot de passe: {manager_pwd}')
        else:
            self.stdout.write(self.style.WARNING(f'Compte gestionnaire existant : {manager.email}'))

        self.stdout.write(self.style.SUCCESS(
            'Initialisation terminee. L\'espace etudiant est libre pour inscription personnelle via @uqo.ca.'
        ))
