"""
tests.py - Suite de tests de résilience, d'idempotence et de robustesse zéro-crash pour requests_app.
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from accounts.models import User
from requests_app.models import Request, StatusHistory, Comment


class IdempotencyAndResilienceTests(TestCase):
    """
    Validation de la protection anti-double soumission (Rule 7.9)
    et de la résilience du backend face aux requêtes concurrentes.
    """

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='etudiant.test@uqo.ca',
            username='etudiant.test',
            password='Password123!',
            first_name='Etudiant',
            last_name='Test',
            role='USER'
        )
        self.client.force_authenticate(user=self.user)

    def test_idempotency_prevents_duplicate_requests(self):
        """
        Vérifie qu'un double clic ou retry réseau avec la même clé d'idempotence
        ne crée qu'une SEULE demande en base de données et renvoie la même réponse.
        """
        idempotency_key = "test-uuid-anti-double-click-12345"
        payload = {
            'title': 'Demande de relevé officiel',
            'type': 'ADMINISTRATIVE',
            'description': 'Description détaillée pour fin de test de robustesse des boutons.'
        }

        # Premier clic / soumission
        response1 = self.client.post(
            reverse('requests_app:request-list'),
            payload,
            format='json',
            HTTP_IDEMPOTENCY_KEY=idempotency_key
        )
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        created_id = response1.data['id']

        # Deuxième clic immédiat (simulant le double-clic de l'utilisateur)
        response2 = self.client.post(
            reverse('requests_app:request-list'),
            payload,
            format='json',
            HTTP_IDEMPOTENCY_KEY=idempotency_key
        )

        # La seconde requête doit renvoyer la réponse originale sans créer de doublon
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response2.data['id'], created_id)
        self.assertEqual(response2.get('X-Idempotent-Replay'), 'true')

        # Vérification en base de données : un seul objet créé
        self.assertEqual(Request.objects.filter(user=self.user).count(), 1)

    def test_status_transition_atomicity(self):
        """
        Vérifie que la transition de statut par un gestionnaire est strictement atomique
        et consigne l'historique de traçabilité.
        """
        # Créer une demande initiale
        req = Request.objects.create(
            user=self.user,
            title='Demande de révision de note',
            type='ACADEMIC',
            description='Description de la demande de révision.',
            status='SUBMITTED'
        )

        # Créer un gestionnaire
        manager = User.objects.create_user(
            email='gestionnaire.test@uqo.ca',
            username='gestionnaire.test',
            password='Password123!',
            first_name='Admin',
            last_name='Gestionnaire',
            role='MANAGER'
        )
        self.client.force_authenticate(user=manager)

        # Effectuer le changement de statut
        url = reverse('requests_app:request-change-status', kwargs={'pk': req.id})
        res = self.client.post(
            url,
            {
                'new_status': 'IN_PROGRESS',
                'comment': 'Prise en charge officielle du dossier.'
            },
            format='json'
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        req.refresh_from_db()
        self.assertEqual(req.status, 'IN_PROGRESS')

        # Vérifier l'historique créé
        history = StatusHistory.objects.filter(request=req)
        self.assertEqual(history.count(), 1)
        self.assertEqual(history.first().old_status, 'SUBMITTED')
        self.assertEqual(history.first().new_status, 'IN_PROGRESS')

        # Vérifier le commentaire associé créé
        comment = Comment.objects.filter(request=req)
        self.assertEqual(comment.count(), 1)
        self.assertEqual(comment.first().content, 'Prise en charge officielle du dossier.')

    def test_custom_exception_handler_sanitizes_errors(self):
        """
        Vérifie que le gestionnaire d'exception intercepte les erreurs inattendues (500)
        et renvoie une réponse JSON propre sans divulguer de stack trace ou de détails internes (CWE-209).
        """
        from config.exceptions import custom_exception_handler

        dummy_exception = Exception("Database lock contention or disk failure")
        response = custom_exception_handler(dummy_exception, {'view': None})

        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['code'], 'internal_server_error')
        # S'assurer qu'aucun détail interne sensible n'est exposé au client
        self.assertNotIn('Database lock contention', response.data['error'])
