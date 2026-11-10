"""
Modeles de donnees pour l'application requests_app.
Definit les entites Request, StatusHistory et Comment avec validation du graphe des transitions d'etats.
"""

from django.db import models
from django.conf import settings


class Request(models.Model):
    """
    Entite principale representant une demande etudiante ou administrative.
    Cycle de vie : SUBMITTED -> IN_PROGRESS -> APPROVED | REJECTED.
    """

    class Status(models.TextChoices):
        SUBMITTED = 'SUBMITTED', 'Soumise'
        IN_PROGRESS = 'IN_PROGRESS', 'En cours'
        APPROVED = 'APPROVED', 'Approuvée'
        REJECTED = 'REJECTED', 'Rejetée'

    class Type(models.TextChoices):
        ACADEMIC = 'ACADEMIC', 'Académique'
        ADMINISTRATIVE = 'ADMINISTRATIVE', 'Administrative'
        TECHNICAL = 'TECHNICAL', 'Technique'
        OTHER = 'OTHER', 'Autre'

    ALLOWED_TRANSITIONS = {
        'SUBMITTED': ['IN_PROGRESS', 'APPROVED', 'REJECTED'],
        'IN_PROGRESS': ['APPROVED', 'REJECTED'],
        'APPROVED': [],
        'REJECTED': [],
    }

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='requests',
        verbose_name='Demandeur'
    )
    title = models.CharField('Titre', max_length=200)
    type = models.CharField(
        'Type',
        max_length=20,
        choices=Type.choices,
        default=Type.OTHER
    )
    description = models.TextField('Description')
    status = models.CharField(
        'Statut',
        max_length=20,
        choices=Status.choices,
        default=Status.SUBMITTED
    )
    created_at = models.DateTimeField('Date de création', auto_now_add=True)
    updated_at = models.DateTimeField('Dernière modification', auto_now=True)

    class Meta:
        verbose_name = 'Demande'
        verbose_name_plural = 'Demandes'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"

    def can_be_edited(self):
        """Verifie si la demande est encore editable par son createur."""
        return self.status == self.Status.SUBMITTED

    def can_transition_to(self, new_status):
        """Verifie si la transition vers new_status est permise par la machine a etats."""
        allowed = self.ALLOWED_TRANSITIONS.get(self.status, [])
        return new_status in allowed


class StatusHistory(models.Model):
    """
    Piste d'audit et historique chronologique des transitions d'etats des demandes.
    """

    request = models.ForeignKey(
        Request,
        on_delete=models.CASCADE,
        related_name='status_history',
        verbose_name='Demande'
    )
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='status_changes',
        verbose_name='Modifié par'
    )
    old_status = models.CharField('Ancien statut', max_length=20)
    new_status = models.CharField('Nouveau statut', max_length=20)
    changed_at = models.DateTimeField('Date du changement', auto_now_add=True)

    class Meta:
        verbose_name = 'Historique de statut'
        verbose_name_plural = 'Historiques de statut'
        ordering = ['-changed_at']

    def __str__(self):
        return f"{self.request.title}: {self.old_status} -> {self.new_status}"


class Comment(models.Model):
    """
    Commentaires et echanges associes a une demande entre demandeur et gestionnaires.
    """

    request = models.ForeignKey(
        Request,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='Demande'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='request_comments',
        verbose_name='Auteur'
    )
    content = models.TextField('Contenu')
    created_at = models.DateTimeField('Date de création', auto_now_add=True)

    class Meta:
        verbose_name = 'Commentaire'
        verbose_name_plural = 'Commentaires'
        ordering = ['created_at']

    def __str__(self):
        return f"Commentaire de {self.author} sur {self.request.title}"


class Notification(models.Model):
    """
    Notifications in-app pour avertir les usagers des évolutions de leurs dossiers.
    """

    class NotificationType(models.TextChoices):
        STATUS_CHANGE = 'STATUS_CHANGE', 'Changement de statut'
        COMMENT = 'COMMENT', 'Nouveau commentaire'
        NEW_REQUEST = 'NEW_REQUEST', 'Nouvelle requête déposée'
        SYSTEM = 'SYSTEM', 'Message système'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Destinataire'
    )
    request = models.ForeignKey(
        Request,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
        verbose_name='Demande associée'
    )
    title = models.CharField('Titre', max_length=200)
    message = models.TextField('Message')
    notification_type = models.CharField(
        'Type',
        max_length=30,
        choices=NotificationType.choices,
        default=NotificationType.STATUS_CHANGE
    )
    is_read = models.BooleanField('Lu', default=False)
    created_at = models.DateTimeField('Date', auto_now_add=True)

    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.notification_type}] {self.user.email} - {self.title}"


class RequestAttachment(models.Model):
    """
    Pièces justificatives et documents officiels joints à une requête.
    Scellés avec empreinte cryptographique SHA-256 calculée lors du téléversement (Rule 1.3).
    """

    request = models.ForeignKey(
        Request,
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name='Demande'
    )
    file = models.FileField('Fichier', upload_to='attachments/%Y/%m/')
    file_name = models.CharField('Nom d\'origine', max_length=255)
    file_size = models.PositiveIntegerField('Taille en octets')
    content_type = models.CharField('Type MIME', max_length=100)
    file_hash = models.CharField('Empreinte SHA-256', max_length=64)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploaded_attachments',
        verbose_name='Déposé par'
    )
    created_at = models.DateTimeField('Date de dépôt', auto_now_add=True)

    class Meta:
        verbose_name = 'Pièce jointe'
        verbose_name_plural = 'Pièces jointes'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.file_name} (#{self.request_id})"

