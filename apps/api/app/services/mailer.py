import smtplib
import logging
from abc import ABC, abstractmethod
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
from datetime import datetime

from app.core.config import settings

logger = logging.getLogger(__name__)


class MailerAdapter(ABC):
    """Abstract interface for sending email notifications."""

    @abstractmethod
    def send(self, to: str, subject: str, html_content: str, text_content: Optional[str] = None) -> bool:
        pass


class SMTPMailer(MailerAdapter):
    """SMTP mailer implementation with Mailhog / production support and graceful fallback."""

    def __init__(self, host: str = None, port: int = None, from_email: str = None):
        self.host = host or settings.SMTP_HOST
        self.port = port or settings.SMTP_PORT
        self.from_email = from_email or settings.SMTP_FROM

    def send(self, to: str, subject: str, html_content: str, text_content: Optional[str] = None) -> bool:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = self.from_email
        msg["To"] = to

        if text_content:
            msg.attach(MIMEText(text_content, "plain"))
        else:
            msg.attach(MIMEText(html_content, "plain"))

        msg.attach(MIMEText(html_content, "html"))

        try:
            with smtplib.SMTP(self.host, self.port, timeout=5) as server:
                server.sendmail(self.from_email, [to], msg.as_string())
            logger.info(f"Email sent successfully to {to}: '{subject}'")
            return True
        except Exception as e:
            logger.warning(
                f"Failed to send email to {to} via SMTP ({self.host}:{self.port}): {e}. "
                f"Falling back to logging."
            )
            # Log email contents for demo/debug
            logger.info(f"[LOGGED EMAIL] To: {to} | Subject: {subject}\nContent: {html_content}")
            return False


_mailer_instance: Optional[MailerAdapter] = None


def get_mailer() -> MailerAdapter:
    """Retrieve singleton mailer instance."""
    global _mailer_instance
    if _mailer_instance is None:
        _mailer_instance = SMTPMailer()
    return _mailer_instance


# ---------------------------------------------------------------------------
# Email Templates & Sending Helpers
# ---------------------------------------------------------------------------

def send_candidate_application_email(
    to_email: str,
    candidate_name: str,
    job_title: str,
    requisition_code: str,
    application_code: str,
    submitted_at: datetime,
) -> bool:
    """Send confirmation email to candidate on successful application submission."""
    mailer = get_mailer()
    subject = f"Application Received — {job_title} ({application_code})"
    date_str = submitted_at.strftime("%B %d, %Y at %I:%M %p UTC")

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; color: #1e293b; background-color: #f8fafc; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
        <h2 style="color: #2563eb; margin-top: 0;">Application Received</h2>
        <p>Dear {candidate_name},</p>
        <p>Thank you for your interest in joining our team! We have successfully received your application for the following position:</p>
        
        <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Job Title:</strong> {job_title}</p>
          <p style="margin: 4px 0;"><strong>Requisition Code:</strong> {requisition_code}</p>
          <p style="margin: 4px 0;"><strong>Application ID:</strong> <span style="font-family: monospace; color: #2563eb; font-weight: bold;">{application_code}</span></p>
          <p style="margin: 4px 0;"><strong>Submitted On:</strong> {date_str}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> Received — Under Review</p>
        </div>

        <p>Our recruitment team is currently reviewing candidate profiles and resumes. You can track real-time status updates from your dashboard on TalentBridge.</p>
        <p style="color: #64748b; font-size: 13px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          Best regards,<br>
          TalentBridge Recruiting Team
        </p>
      </div>
    </body>
    </html>
    """

    return mailer.send(to=to_email, subject=subject, html_content=html)


def send_admin_new_application_email(
    admin_email: str,
    requisition_code: str,
    job_title: str,
    candidate_name: str,
    candidate_email: str,
    application_code: str,
) -> bool:
    """Send notification email to internal recruiter / admin when a new application is submitted."""
    mailer = get_mailer()
    subject = f"New Application for {requisition_code}: {candidate_name}"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; color: #1e293b; background-color: #f8fafc; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
        <h2 style="color: #2563eb; margin-top: 0;">New Application Submitted</h2>
        <p>A new candidate application has just been received for requisition <strong>{requisition_code}</strong>.</p>
        
        <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Requisition:</strong> {job_title} ({requisition_code})</p>
          <p style="margin: 4px 0;"><strong>Candidate:</strong> {candidate_name} ({candidate_email})</p>
          <p style="margin: 4px 0;"><strong>Application ID:</strong> <span style="font-family: monospace; color: #2563eb; font-weight: bold;">{application_code}</span></p>
        </div>

        <p>Log in to the Admin Console to review the candidate's frozen profile, view resume attachments, and update application status.</p>
        <p style="color: #64748b; font-size: 13px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          TalentBridge Automated System
        </p>
      </div>
    </body>
    </html>
    """

    return mailer.send(to=admin_email, subject=subject, html_content=html)
