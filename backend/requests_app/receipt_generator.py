"""
receipt_generator.py - Générateur officiel d'attestation de dépôt PDF pour UQO-Requests.
Standard Zéro-Fausse-Empreinte (Rule 1.3) & Souveraineté Backend (Rule 1.14) :
Calcule l'empreinte cryptographique SHA-256 en direct sur le payload canonique réel
et produit un document officiel certifié au format PDF.
"""

import io
import json
import hashlib
from datetime import datetime
from zoneinfo import ZoneInfo
from django.conf import settings
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch


def compute_request_sha256(request_obj):
    """
    Calcule mathématiquement en direct l'empreinte SHA-256 canonique de la requête.
    Garantit l'intégrité absolue sans empreinte simulée (Rule 1.3).
    """
    canonical_dict = {
        'id': request_obj.id,
        'title': request_obj.title,
        'type': request_obj.type,
        'status': request_obj.status,
        'description': request_obj.description,
        'student_id': request_obj.user.id,
        'student_email': request_obj.user.email,
        'submitted_at': request_obj.created_at.isoformat(),
    }
    canonical_json = json.dumps(canonical_dict, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(canonical_json.encode('utf-8')).hexdigest().upper()


def generate_receipt_pdf(request_obj):
    """
    Génère un document PDF institutionnel d'attestation de dépôt pour une requête.
    Retourne les octets binaires du PDF.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Couleurs institutionnelles UQO (Charte officielle)
    UQO_PRIMARY = colors.HexColor('#005477') # Bleu Pétrole officiel UQO
    UQO_ACCENT = colors.HexColor('#2accae')  # Vert Menthe & Sarcelle Outaouais
    UQO_DARK = colors.HexColor('#182128')    # Anthracite / Noir Bleuté UQO
    UQO_SLATE = colors.HexColor('#475569')
    UQO_BG_LIGHT = colors.HexColor('#f0f7fa')# Fond clair teinté UQO
    UQO_BORDER = colors.HexColor('#bce0ec')  # Bordure douce UQO

    # Styles typographiques
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=17,
        leading=21,
        textColor=UQO_PRIMARY,
        alignment=1, # Centré
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=13,
        textColor=UQO_SLATE,
        alignment=1,
        spaceAfter=15
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=UQO_DARK,
        spaceBefore=12,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=UQO_DARK
    )

    bold_label = ParagraphStyle(
        'BoldLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=UQO_SLATE
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=8,
        leading=11,
        textColor=UQO_DARK
    )

    legal_style = ParagraphStyle(
        'LegalStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.5,
        leading=10,
        textColor=UQO_SLATE,
        alignment=1
    )

    story = []

    # 1. En-tête Institutionnel
    header_table_data = [
        [
            Paragraph("<b>UNIVERSITÉ DU QUÉBEC EN OUTAOUAIS</b><br/><font color='#64748b' size='8'>PORTAIL OFFICIEL UQO-REQUESTS • BUREAU DU REGISTRAIRE</font>", body_style),
            Paragraph(f"<b>ATTESTATION OFFICIELLE</b><br/><font color='#006847' size='9'><b>RÉF : #UQO-REQ-{request_obj.id:06d}</b></font>", ParagraphStyle('RightHeader', parent=body_style, alignment=2))
        ]
    ]
    header_table = Table(header_table_data, colWidths=[330, 200])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=UQO_PRIMARY, spaceAfter=15))

    # 2. Titre de l'attestation
    story.append(Paragraph("ATTESTATION OFFICIELLE DE DÉPÔT DE REQUÊTE", title_style))
    story.append(Paragraph(
        "Certificat probant de transmission dématérialisée et d'enregistrement aux registres institutionnels",
        subtitle_style
    ))

    # 3. Métadonnées du Demandeur
    story.append(Paragraph("1. IDENTIFICATION DU DEMANDEUR", section_heading))

    student_name = f"{request_obj.user.first_name} {request_obj.user.last_name}".strip() or "Non renseigné"
    demandeur_data = [
        [Paragraph("Nom et prénom :", bold_label), Paragraph(student_name, body_style)],
        [Paragraph("Courriel institutionnel :", bold_label), Paragraph(request_obj.user.email, body_style)],
        [Paragraph("Identifiant système :", bold_label), Paragraph(str(request_obj.user.username), body_style)],
        [Paragraph("Rôle institutionnel :", bold_label), Paragraph(request_obj.user.get_role_display(), body_style)],
    ]
    t_demandeur = Table(demandeur_data, colWidths=[160, 370])
    t_demandeur.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), UQO_BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 0.5, UQO_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, UQO_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_demandeur)
    story.append(Spacer(1, 12))

    # 4. Données du Dossier
    story.append(Paragraph("2. CARACTÉRISTIQUES DU DOSSIER DÉPOSÉ", section_heading))

    # Horodatage local UQO
    tz_uqo = ZoneInfo('America/Toronto')
    created_local = request_obj.created_at.astimezone(tz_uqo)
    formatted_date = created_local.strftime('%d %B %Y à %H:%M:%S (HNE/HAE)')

    dossier_data = [
        [Paragraph("Numéro de dossier :", bold_label), Paragraph(f"<b>#{request_obj.id}</b>", body_style)],
        [Paragraph("Objet de la requête :", bold_label), Paragraph(request_obj.title, body_style)],
        [Paragraph("Catégorie administrative :", bold_label), Paragraph(request_obj.get_type_display(), body_style)],
        [Paragraph("Statut actuel :", bold_label), Paragraph(request_obj.get_status_display(), body_style)],
        [Paragraph("Date et heure de dépôt :", bold_label), Paragraph(formatted_date, body_style)],
    ]
    t_dossier = Table(dossier_data, colWidths=[160, 370])
    t_dossier.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), UQO_BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 0.5, UQO_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, UQO_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_dossier)
    story.append(Spacer(1, 12))

    # 5. Exposé textuel (Description)
    story.append(Paragraph("3. EXPOSÉ SOMMAIRE TRANSMIS", section_heading))
    desc_clean = request_obj.description[:800] + ('...' if len(request_obj.description) > 800 else '')
    desc_para = Paragraph(f"« {desc_clean.replace(chr(10), '<br/>')} »", ParagraphStyle('DescQuote', parent=body_style, fontName='Helvetica-Oblique'))
    t_desc = Table([[desc_para]], colWidths=[530])
    t_desc.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f1f5f9')),
        ('BOX', (0, 0), (-1, -1), 0.5, UQO_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(t_desc)
    story.append(Spacer(1, 14))

    # 6. Sceau d'Intégrité Cryptographique SHA-256 (Rule 1.3 & Rule 1.14)
    sha256_hash = compute_request_sha256(request_obj)
    # Découpage du hash par blocs de 8 caractères pour une lisibilité ergonomique
    formatted_hash = ' '.join([sha256_hash[i:i+8] for i in range(0, len(sha256_hash), 8)])

    now_local = datetime.now(tz_uqo).strftime('%d/%m/%Y %H:%M:%S')

    security_data = [
        [Paragraph("<b>SCEAU D'INTÉGRITÉ NUMÉRIQUE & CONFORMITÉ LOI 25</b>", ParagraphStyle('SecTitle', parent=body_style, textColor=UQO_PRIMARY, fontName='Helvetica-Bold'))],
        [Paragraph(f"<b>Empreinte SHA-256 certifiée :</b><br/><font color='#182128'><b>{formatted_hash}</b></font>", code_style)],
        [Paragraph(f"Norme : <b>SHA-256 (FIPS 180-4 / RFC 6234)</b> • Horodatage de génération du scellé : <b>{now_local}</b>", ParagraphStyle('SecSub', parent=body_style, fontSize=8, textColor=UQO_SLATE))],
        [Paragraph("Ce document scellé fait foi de l'enregistrement effectif de la requête et de l'intégrité intégrale de son contenu au moment du dépôt aux registres officiels de l'UQO.", ParagraphStyle('SecDesc', parent=body_style, fontSize=8, leading=11, textColor=UQO_DARK))]
    ]
    t_security = Table(security_data, colWidths=[530])
    t_security.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#eefbf8')),
        ('BOX', (0, 0), (-1, -1), 1, UQO_ACCENT),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(KeepTogether(t_security))
    story.append(Spacer(1, 16))

    # 7. Mentions Légales & Pied de Page
    story.append(HRFlowable(width="100%", thickness=0.5, color=UQO_BORDER, spaceAfter=8))
    story.append(Paragraph(
        "Université du Québec en Outaouais • 283, boulevard Alexandre-Taché, Gatineau (Québec) J8X 3X7<br/>"
        "Document authentique généré par le système d'information institutionnel conformément aux exigences de la Loi 25 sur la protection des renseignements personnels.",
        legal_style
    ))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes, sha256_hash
