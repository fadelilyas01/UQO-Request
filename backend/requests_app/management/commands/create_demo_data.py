import secrets
"""
Commande d'initialisation de donnees de demonstration pour tests locaux.
Usage: python manage.py create_demo_data
"""

import os
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.contrib.auth import get_user_model
from requests_app.models import Request, StatusHistory, Comment

User = get_user_model()


class Command(BaseCommand):
    help = 'Cree des donnees d\'exemple pour tester l\'application en developpement'

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

        self.stdout.write('Creation des donnees de demonstration...')

        admin_pwd = os.getenv('DEMO_ADMIN_PASSWORD') or secrets.token_urlsafe(16)
        manager_pwd = os.getenv('DEMO_MANAGER_PASSWORD') or secrets.token_urlsafe(16)
        user_pwd = os.getenv('DEMO_USER_PASSWORD') or secrets.token_urlsafe(16)

        # 1. Utilisateur Administrateur
        admin, created = User.objects.get_or_create(
            email='admin@uqo.ca',
            defaults={
                'username': 'admin',
                'first_name': 'Admin',
                'last_name': 'Système',
                'role': 'MANAGER',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin.set_password(admin_pwd)
            admin.save()
            self.stdout.write(self.style.SUCCESS(f'Compte administrateur cree : {admin.email}'))

        # 2. Utilisateur Gestionnaire
        manager, created = User.objects.get_or_create(
            email='gestionnaire@uqo.ca',
            defaults={
                'username': 'gestionnaire',
                'first_name': 'Marie',
                'last_name': 'Tremblay',
                'role': 'MANAGER',
            }
        )
        if created:
            manager.set_password(manager_pwd)
            manager.save()
            self.stdout.write(self.style.SUCCESS(f'Compte gestionnaire cree : {manager.email}'))

        # 3. Utilisateurs etudiants
        user1, created = User.objects.get_or_create(
            email='jean.dupont@uqo.ca',
            defaults={
                'username': 'jean.dupont',
                'first_name': 'Jean',
                'last_name': 'Dupont',
                'role': 'USER',
            }
        )
        if created:
            user1.set_password(user_pwd)
            user1.save()
            self.stdout.write(self.style.SUCCESS(f'Compte etudiant 1 cree : {user1.email}'))

        user2, created = User.objects.get_or_create(
            email='sophie.martin@uqo.ca',
            defaults={
                'username': 'sophie.martin',
                'first_name': 'Sophie',
                'last_name': 'Martin',
                'role': 'USER',
            }
        )
        if created:
            user2.set_password(user_pwd)
            user2.save()
            self.stdout.write(self.style.SUCCESS(f'Compte etudiant 2 cree : {user2.email}'))

        # 4. Demandes de demonstration avec differents statuts
        req1, created = Request.objects.get_or_create(
            title="Demande de report d'examen",
            user=user1,
            defaults={
                'type': 'ACADEMIC',
                'description': "Demande de report d'examen final pour conflit horaire avec une evaluation concomitante.",
                'status': 'SUBMITTED',
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Demande creee : {req1.title}'))

        req2, created = Request.objects.get_or_create(
            title="Accès aux ressources de calcul",
            user=user1,
            defaults={
                'type': 'TECHNICAL',
                'description': "Demande d'attribution de ressources de calcul intensif pour le projet terminal de session.",
                'status': 'IN_PROGRESS',
            }
        )
        if created:
            StatusHistory.objects.create(
                request=req2,
                changed_by=manager,
                old_status='SUBMITTED',
                new_status='IN_PROGRESS'
            )
            Comment.objects.create(
                request=req2,
                author=manager,
                content="Demande prise en charge. Analyse des quotas disponibles en cours."
            )
            self.stdout.write(self.style.SUCCESS(f'Demande creee : {req2.title}'))

        req3, created = Request.objects.get_or_create(
            title="Révision de note - Évaluation 2",
            user=user2,
            defaults={
                'type': 'ACADEMIC',
                'description': "Demande de revision pour l'evaluation pratique suite a une erreur de bareme signalee.",
                'status': 'APPROVED',
            }
        )
        if created:
            StatusHistory.objects.create(
                request=req3,
                changed_by=manager,
                old_status='SUBMITTED',
                new_status='IN_PROGRESS'
            )
            StatusHistory.objects.create(
                request=req3,
                changed_by=manager,
                old_status='IN_PROGRESS',
                new_status='APPROVED'
            )
            Comment.objects.create(
                request=req3,
                author=manager,
                content="Apres revision du bareme par l'enseignant responsable, la note est ajustee."
            )
            self.stdout.write(self.style.SUCCESS(f'Demande creee : {req3.title}'))

        self.stdout.write(self.style.SUCCESS('Initialisation des donnees terminee avec succes.'))
