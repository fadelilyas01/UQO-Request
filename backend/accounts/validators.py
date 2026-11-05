import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


def validate_uqo_email(value):
    """
    Valide que l'adresse email appartient exclusivement au domaine officiel @uqo.ca.
    Rejette toute autre adresse ou domaine externe.
    """
    if not value or not isinstance(value, str):
        raise ValidationError(_("Adresse courriel invalide."))

    email = value.strip().lower()
    pattern = r'^[a-zA-Z0-9_.+-]+@uqo\.ca$'
    if not re.match(pattern, email):
        raise ValidationError(
            _("Seules les adresses institutionnelles se terminant par @uqo.ca sont autorisées à accéder à la plateforme.")
        )


class ComplexPasswordValidator:
    """
    Validateur Django imposant des règles de complexité renforcées (Zero-Vulnerability Standard) :
    - Au moins 10 caractères
    - Au moins une majuscule (A-Z)
    - Au moins une minuscule (a-z)
    - Au moins un chiffre (0-9)
    - Au moins un caractère spécial (!@#$%^&*...)
    """

    def __init__(self, min_length=10):
        self.min_length = min_length

    def validate(self, password, user=None):
        if len(password) < self.min_length:
            raise ValidationError(
                _(f"Le mot de passe doit comporter au moins {self.min_length} caractères."),
                code='password_too_short',
            )

        if not re.search(r'[A-Z]', password):
            raise ValidationError(
                _("Le mot de passe doit contenir au moins une lettre majuscule (A-Z)."),
                code='password_no_upper',
            )

        if not re.search(r'[a-z]', password):
            raise ValidationError(
                _("Le mot de passe doit contenir au moins une lettre minuscule (a-z)."),
                code='password_no_lower',
            )

        if not re.search(r'[0-9]', password):
            raise ValidationError(
                _("Le mot de passe doit contenir au moins un chiffre (0-9)."),
                code='password_no_digit',
            )

        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?~`]', password):
            raise ValidationError(
                _("Le mot de passe doit contenir au moins un caractère spécial (ex: !@#$%^&*)."),
                code='password_no_symbol',
            )

    def get_help_text(self):
        return _(
            f"Votre mot de passe doit comporter au moins {self.min_length} caractères et inclure au moins "
            "une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial."
        )
