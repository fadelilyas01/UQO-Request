"""
Modeles de donnees pour l'application accounts.
Definit le modele User personnalise avec gestion RBAC (USER / MANAGER) et authentification par email.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Modele utilisateur personnalise etendant AbstractUser.
    Utilise l'adresse courriel comme identifiant principal de connexion.
    """

    class Role(models.TextChoices):
        USER = 'USER', 'Utilisateur'
        MANAGER = 'MANAGER', 'Gestionnaire'

    email = models.EmailField(
        'Adresse email',
        unique=True,
        error_messages={
            'unique': 'Un utilisateur avec cette adresse email existe déjà.',
        }
    )

    role = models.CharField(
        'Rôle',
        max_length=10,
        choices=Role.choices,
        default=Role.USER,
        help_text="Détermine les permissions d'accès et le rôle fonctionnel dans le système."
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"

    @property
    def is_manager(self):
        """Indique si l'utilisateur possede les privileges de gestionnaire."""
        return self.role == self.Role.MANAGER

    @property
    def is_regular_user(self):
        """Indique si l'utilisateur est un utilisateur standard."""
        return self.role == self.Role.USER
