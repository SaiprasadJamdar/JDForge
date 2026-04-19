"""Email utility — sends OTP via SMTP."""
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from backend.config import get_settings

logger = logging.getLogger(__name__)


def send_otp_email(to_email: str, otp_code: str) -> bool:
    """Send OTP to `to_email`.
    Returns True on success, False on failure (so the caller can still surface
    the OTP in logs during local dev even if SMTP isn't configured).
    """
    settings = get_settings()

    if not settings.smtp_user or not settings.smtp_password:
        # No SMTP configured — log so developer can read OTP in terminal
        logger.warning(
            "SMTP not configured. OTP for %s is: %s  (set SMTP_USER + SMTP_PASSWORD in .env)",
            to_email, otp_code,
        )
        return True   # don't block the flow

    subject = "JDForge — Your password reset OTP"
    html = f"""
    <div style="font-family:Inter,sans-serif;background:#0f172a;padding:40px 0;">
      <div style="max-width:420px;margin:0 auto;background:#1e293b;border-radius:20px;padding:40px;border:1px solid #334155;">
        <div style="text-align:center;margin-bottom:28px;">
          <div style="display:inline-block;background:#2563eb;border-radius:14px;padding:12px 16px;">
            <span style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">JDForge</span>
          </div>
        </div>
        <h2 style="color:#f8fafc;font-size:20px;font-weight:800;margin:0 0 8px;">Password Reset</h2>
        <p style="color:#94a3b8;font-size:14px;margin:0 0 28px;">Use the code below to reset your password. It expires in {settings.otp_expire_minutes} minutes.</p>
        <div style="background:#0f172a;border-radius:14px;padding:24px;text-align:center;letter-spacing:14px;margin-bottom:28px;">
          <span style="font-size:36px;font-weight:900;color:#60a5fa;">{otp_code}</span>
        </div>
        <p style="color:#475569;font-size:12px;text-align:center;">If you didn't request this, you can ignore this email.</p>
      </div>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_user}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.sendmail(settings.smtp_user, [to_email], msg.as_string())
        logger.info("OTP email sent to %s", to_email)
        return True
    except Exception as e:
        logger.error("Failed to send OTP email: %s", e)
        return False
