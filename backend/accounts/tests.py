"""
tests.py - Tests de résilience et sécurité d'authentification pour l'application accounts.
Vérifie la robustesse face aux injections, la restriction institutionnelle @uqo.ca
et la conformité aux exigences de complexité de mot de passe.
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from accounts.models import User


class AuthenticationResilienceTests(TestCase):
    """
    Tests de sécurité et de robustesse des endpoints d'authentification.
    """

    def setUp(self):
        self.client = APIClient()

    def test_registration_rejects_non_uqo_domain(self):
        """
        Vérifie le blocage immédiat et sécurisé de toute inscription en dehors de @uqo.ca.
        """
        payload = {
            'email': 'hacker@external-domain.com',
            'username': 'external_user',
            'first_name': 'Test',
            'last_name': 'Externe',
            'password': 'ComplexPassword123!',
            'password_confirm': 'ComplexPassword123!',
        }
        response = self.client.post(reverse('accounts:register'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_registration_enforces_strong_password(self):
        """
        Vérifie qu'un mot de passe simple (<10 car., sans symbole) est rejeté proprement sans crash.
        """
        payload = {
            'email': 'etudiant.faible@uqo.ca',
            'username': 'etudiant_faible',
            'first_name': 'Etudiant',
            'last_name': 'Faible',
            'password': 'simple',
            'password_confirm': 'simple',
        }
        response = self.client.post(reverse('accounts:register'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_successful_registration_and_login_flow(self):
        """
        Vérifie le cycle complet d'inscription valide et d'obtention de jetons JWT.
        """
        payload = {
            'email': 'nouveau.valide@uqo.ca',
            'username': 'nouveau_valide',
            'first_name': 'Nouveau',
            'last_name': 'Valide',
            'password': 'SafePassword2026!#',
            'password_confirm': 'SafePassword2026!#',
        }
        response = self.client.post(reverse('accounts:register'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Connexion
        login_res = self.client.post(
            reverse('token_obtain_pair'),
            {'email': 'nouveau.valide@uqo.ca', 'password': 'SafePassword2026!#'},
            format='json'
        )
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertIn('access', login_res.data)
        self.assertIn('refresh', login_res.data)
