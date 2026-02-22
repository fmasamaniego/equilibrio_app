import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def send_email(to_email: str, subject: str, body: str) -> bool:
    """
    Envía un email si SMTP está configurado en variables de entorno.
    Retorna True si se envió, False si no (sin lanzar excepción).
    Variables requeridas: SMTP_HOST, SMTP_USER, SMTP_PASS.
    Opcionales: SMTP_PORT (default 587), EMAIL_FROM.
    """
    smtp_host = os.getenv("SMTP_HOST")
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")

    if not all([smtp_host, smtp_user, smtp_pass]):
        return False  # SMTP no configurado, se omite silenciosamente

    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    email_from = os.getenv("EMAIL_FROM", smtp_user)

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = email_from
        msg["To"] = to_email
        msg.attach(MIMEText(body, "plain", "utf-8"))

        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(email_from, to_email, msg.as_string())
        return True
    except Exception:
        return False  # No interrumpir el flujo principal si falla el email
