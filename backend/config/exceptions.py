"""
exceptions.py - Gestionnaire d'exceptions global Django REST Framework.
Standard Zéro-Crash & Zero-Divulgation (CWE-209) :
Intercepte toute exception non gérée ou 500 pour :
1. La consigner dans les logs internes avec traceback complet
2. Renvoyer une réponse JSON propre, sécurisée, en français clair
3. Ne jamais exposer de stack trace, nom de table ou chemin système au client
"""

import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import PermissionDenied, ValidationError as DjangoValidationError
from django.http import Http404

logger = logging.getLogger('django.request')


def custom_exception_handler(exc, context):
    """
    Gestionnaire centralisé des exceptions pour l'ensemble des endpoints API.
    Garantit une réponse JSON propre et protège les détails techniques du système.
    """
    # Appel du gestionnaire DRF natif pour les erreurs standard (ValidationError, etc.)
    response = exception_handler(exc, context)

    if response is not None:
        return response

    # Gestion des exceptions Django natives hors-DRF
    if isinstance(exc, Http404):
        return Response(
            {'error': "La ressource demandée n'a pas été trouvée sur le serveur.", 'code': 'not_found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if isinstance(exc, PermissionDenied):
        return Response(
            {'error': "Vous ne disposez pas des autorisations nécessaires pour effectuer cette opération.", 'code': 'forbidden'},
            status=status.HTTP_403_FORBIDDEN
        )

    if isinstance(exc, DjangoValidationError):
        return Response(
            {'error': exc.message if hasattr(exc, 'message') else str(exc), 'code': 'validation_error'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Erreur inattendue (500) : consignation interne complète
    view_name = context.get('view').__class__.__name__ if context.get('view') else 'UnknownView'
    logger.exception(f"[Zéro-Crash Exception Interceptée] Erreur inattendue dans la vue {view_name}: {exc}")

    # Réponse fail-safe sans divulgation technique (CWE-209)
    return Response(
        {
            'error': "Une interruption temporaire du service est survenue. Vos données n'ont pas été altérées.",
            'code': 'internal_server_error'
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
