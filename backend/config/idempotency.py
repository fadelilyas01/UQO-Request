"""
idempotency.py - Middleware et utilitaire d'Idempotence pour l'API UQO-Requests.
Standard Zéro-Double-Soumission (Rule 7.9) :
Garantit qu'une requête critique rejouée (double-clic ou retry réseau)
renvoie la même réponse sans recréer de doublon en base de données.
"""

import json
import logging
import hashlib
from django.core.cache import cache
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)

IDEMPOTENCY_HEADER = 'HTTP_IDEMPOTENCY_KEY'
CACHE_TTL_SECONDS = 300  # Conservation du résultat pendant 5 minutes


class IdempotencyMiddleware(MiddlewareMixin):
    """
    Middleware d'interception d'en-tête Idempotency-Key sur les mutations HTTP.
    """

    def process_request(self, request):
        if request.method not in ['POST', 'PUT', 'PATCH', 'DELETE']:
            return None

        # Exclure les routes de rafraichissement et d'obtention de jetons
        if '/auth/token/' in request.path:
            return None

        idempotency_key = request.META.get(IDEMPOTENCY_HEADER)
        if not idempotency_key or not isinstance(idempotency_key, str) or len(idempotency_key.strip()) < 8:
            return None

        clean_key = idempotency_key.strip()
        user = getattr(request, 'user', None)
        user_identifier = (
            getattr(user, 'id', None)
            if user and getattr(user, 'is_authenticated', False)
            else request.META.get('REMOTE_ADDR', 'anon')
        )
        cache_key = f"uqo:idempotency:{user_identifier}:{hashlib.sha256(clean_key.encode()).hexdigest()}"

        request._idempotency_cache_key = cache_key
        cached_result = cache.get(cache_key)

        if cached_result:
            if cached_result.get('status') == 'IN_PROGRESS':
                return JsonResponse(
                    {
                        'error': "Une opération identique est déjà en cours d'exécution. Veuillez patienter.",
                        'code': 'concurrent_request'
                    },
                    status=409
                )

            if cached_result.get('status') == 'COMPLETED':
                logger.info(f"[Idempotence Active] Réponse en cache renvoyée pour la clé {clean_key[:8]}...")
                response_data = cached_result.get('data', {})
                response = JsonResponse(
                    response_data,
                    status=cached_result.get('status_code', 200),
                    safe=False
                )
                response.data = response_data
                response['X-Idempotent-Replay'] = 'true'
                return response

        # Enregistrer le verrou de traitement en cours (timeout 30s)
        cache.set(cache_key, {'status': 'IN_PROGRESS'}, timeout=30)
        return None

    def process_response(self, request, response):
        cache_key = getattr(request, '_idempotency_cache_key', None)
        if not cache_key:
            return response

        # Si l'opération a réussi ou renvoyé une erreur métier prévisible (4xx)
        if response.status_code < 500:
            try:
                # Si le contenu est du JSON
                content_type = response.get('Content-Type', '')
                if 'application/json' in content_type:
                    data = json.loads(response.content.decode('utf-8')) if response.content else {}
                    cache.set(
                        cache_key,
                        {
                            'status': 'COMPLETED',
                            'status_code': response.status_code,
                            'data': data,
                        },
                        timeout=CACHE_TTL_SECONDS
                    )
            except Exception as e:
                logger.debug(f"[Idempotence] Erreur lors de la mise en cache de la réponse: {e}")
                cache.delete(cache_key)
        else:
            # En cas d'erreur 500, libérer le verrou pour permettre un retry
            cache.delete(cache_key)

        return response
