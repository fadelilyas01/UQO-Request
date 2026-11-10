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

    def test_pdf_receipt_generation_with_sha256(self):
        """
        Vérifie la génération du reçu officiel PDF avec calcul de l'empreinte SHA-256 en direct.
        """
        req = Request.objects.create(
            user=self.user,
            title='Demande de relevé officiel',
            type='ADMINISTRATIVE',
            description='Description complète pour vérification de l\'attestation scellée.',
            status='SUBMITTED'
        )

        url = reverse('requests_app:request-download-receipt', kwargs={'pk': req.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertTrue(len(response.content) > 1000)
        self.assertTrue(response.content.startswith(b'%PDF-'))
        self.assertIn('X-Integrity-SHA256', response)
        self.assertEqual(len(response['X-Integrity-SHA256']), 64)

    def test_attachment_upload_and_security(self):
        """
        Vérifie l'upload d'une pièce justificative, le rejet des formats interdits et le calcul d'empreinte.
        """
        from django.core.files.uploadedfile import SimpleUploadedFile

        req = Request.objects.create(
            user=self.user,
            title='Demande avec pièce jointe',
            type='ACADEMIC',
            description='Description de la requête avec justificatif médical.',
            status='SUBMITTED'
        )

        url = reverse('requests_app:request-attachments', kwargs={'pk': req.id})

        # 1. Rejet d'un fichier exécutable interdit (.exe / application/x-dosexec)
        forbidden_file = SimpleUploadedFile("virus.exe", b"MZDummyPayloadContent", content_type="application/x-dosexec")
        res_fail = self.client.post(url, {'file': forbidden_file}, format='multipart')
        self.assertEqual(res_fail.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Acceptation d'un document PDF légitime
        valid_pdf = SimpleUploadedFile("certificat.pdf", b"%PDF-1.4 Fake PDF Content for Unit Test", content_type="application/pdf")
        res_ok = self.client.post(url, {'file': valid_pdf}, format='multipart')
        self.assertEqual(res_ok.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_ok.data['file_name'], 'certificat.pdf')
        self.assertTrue(len(res_ok.data['file_hash']) == 64)

    def test_notification_flow_on_status_change(self):
        """
        Vérifie qu'un changement de statut émet une notification in-app pour l'étudiant.
        """
        req = Request.objects.create(
            user=self.user,
            title='Demande pour notification',
            type='TECHNICAL',
            description='Description technique de la demande.',
            status='SUBMITTED'
        )

        manager = User.objects.create_user(
            email='manager.notif@uqo.ca',
            username='manager.notif',
            password='Password123!',
            first_name='Admin',
            last_name='Notif',
            role='MANAGER'
        )
        self.client.force_authenticate(user=manager)

        # Transition
        url = reverse('requests_app:request-change-status', kwargs={'pk': req.id})
        self.client.post(url, {'new_status': 'IN_PROGRESS', 'comment': 'Prise en charge'}, format='json')

        # Se reconnecter en tant qu'étudiant
        self.client.force_authenticate(user=self.user)
        unread_res = self.client.get(reverse('requests_app:notification-unread-count'))
        self.assertEqual(unread_res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(unread_res.data['unread_count'], 1)
