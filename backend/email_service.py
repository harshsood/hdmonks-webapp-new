import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        self.smtp_username = os.environ.get('SMTP_USERNAME', '')
        self.smtp_password = os.environ.get('SMTP_PASSWORD', '')
        self.from_email = os.environ.get('FROM_EMAIL', self.smtp_username)
        self.admin_email = os.environ.get('ADMIN_EMAIL', 'admin@hdmonks.com')
        
        # Check if email is configured
        self.is_configured = bool(self.smtp_username and self.smtp_password)
        
        if not self.is_configured:
            logger.warning("Email service not configured. Email notifications will be logged only.")
    
    def send_email(self, to_email: str, subject: str, body: str, is_html: bool = False) -> bool:
        """Send an email"""
        if not self.is_configured:
            logger.info(f"EMAIL (not sent - not configured): To: {to_email}, Subject: {subject}")
            return False
        
        try:
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'html' if is_html else 'plain'))
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    def send_contact_inquiry_notification(self, inquiry: Dict[str, Any]) -> bool:
        """Send notification email for new contact inquiry"""
        subject = f"New Contact Inquiry from {inquiry['name']}"
        
        body = f"""
        <h2>New Contact Inquiry</h2>
        <p><strong>Name:</strong> {inquiry['name']}</p>
        <p><strong>Email:</strong> {inquiry['email']}</p>
        <p><strong>Phone:</strong> {inquiry.get('phone', 'Not provided')}</p>
        <p><strong>Company:</strong> {inquiry.get('company', 'Not provided')}</p>
        <p><strong>Service Interest:</strong> {inquiry.get('service_interest', 'Not specified')}</p>
        <p><strong>Message:</strong></p>
        <p>{inquiry['message']}</p>
        <p><strong>Submitted:</strong> {inquiry['created_at']}</p>
        """
        
        # Send to admin
        admin_sent = self.send_email(self.admin_email, subject, body, is_html=True)
        
        # Send confirmation to customer
        customer_subject = "Thank you for contacting HD MONKS"
        customer_body = f"""
        <h2>Thank you for your inquiry!</h2>
        <p>Dear {inquiry['name']},</p>
        <p>We have received your inquiry and will get back to you within 24 hours.</p>
        <p><strong>Your message:</strong></p>
        <p>{inquiry['message']}</p>
        <p>Best regards,<br>HD MONKS Team</p>
        """
        
        customer_sent = self.send_email(inquiry['email'], customer_subject, customer_body, is_html=True)
        
        return admin_sent or customer_sent
    
    def send_booking_confirmation(self, booking: Dict[str, Any]) -> bool:
        """Send confirmation email for consultation booking"""
        customer_name = booking.get("full_name") or booking.get("name", "Customer")
        subject = f"Consultation Booking Confirmed - {booking['date']} at {booking['time']}"
        
        # Send to admin
        admin_body = f"""
        <h2>New Consultation Booking</h2>
        <p><strong>Name:</strong> {customer_name}</p>
        <p><strong>Email:</strong> {booking['email']}</p>
        <p><strong>Phone:</strong> {booking['phone']}</p>
        <p><strong>Company:</strong> {booking.get('company', 'Not provided')}</p>
        <p><strong>Service Interest:</strong> {booking['service_interest']}</p>
        <p><strong>Date & Time:</strong> {booking['date']} at {booking['time']}</p>
        <p><strong>Message:</strong> {booking.get('message', 'No additional message')}</p>
        <p><strong>Booking ID:</strong> {booking['id']}</p>
        """
        
        admin_sent = self.send_email(self.admin_email, f"New Booking: {subject}", admin_body, is_html=True)
        
        # Send confirmation to customer
        customer_body = f"""
        <h2>Consultation Booking Confirmed</h2>
        <p>Dear {customer_name},</p>
        <p>Your consultation has been successfully booked!</p>
        
        <h3>Booking Details:</h3>
        <p><strong>Date:</strong> {booking['date']}</p>
        <p><strong>Time:</strong> {booking['time']}</p>
        <p><strong>Service:</strong> {booking['service_interest']}</p>
        <p><strong>Booking ID:</strong> {booking['id']}</p>
        
        <p>We will send you a meeting link closer to the appointment date.</p>
        <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
        
        <p>Best regards,<br>HD MONKS Team</p>
        """
        
        customer_sent = self.send_email(booking['email'], subject, customer_body, is_html=True)
        
        return admin_sent or customer_sent
    
    def send_booking_reminder(self, booking: Dict[str, Any]) -> bool:
        """Send reminder email for upcoming consultation"""
        subject = f"Reminder: Your consultation tomorrow at {booking['time']}"
        
        body = f"""
        <h2>Consultation Reminder</h2>
        <p>Dear {booking['name']},</p>
        <p>This is a reminder that you have a consultation scheduled for tomorrow:</p>
        
        <h3>Booking Details:</h3>
        <p><strong>Date:</strong> {booking['date']}</p>
        <p><strong>Time:</strong> {booking['time']}</p>
        <p><strong>Service:</strong> {booking['service_interest']}</p>
        
        <p>We look forward to speaking with you!</p>
        
        <p>Best regards,<br>HD MONKS Team</p>
        """
        
        return self.send_email(booking['email'], subject, body, is_html=True)


# Global email service instance
email_service = EmailService()