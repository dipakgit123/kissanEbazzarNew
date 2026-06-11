'use strict';

const nodemailer = require('nodemailer');

const CONTACT_RECEIVER_EMAIL = process.env.CONTACT_RECEIVER_EMAIL || 'punddipak9@gmail.com';
const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

class ContactController {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async submitInquiry(req, res) {
    try {
      const {
        name = '',
        email = '',
        phone = '',
        subject = '',
        message = ''
      } = req.body || {};

      const trimmedName = String(name).trim();
      const trimmedEmail = String(email).trim().toLowerCase();
      const trimmedPhone = String(phone).trim();
      const trimmedSubject = String(subject).trim();
      const trimmedMessage = String(message).trim();
      const safeName = escapeHtml(trimmedName);
      const safeEmail = escapeHtml(trimmedEmail);
      const safePhone = escapeHtml(trimmedPhone || 'Not provided');
      const safeSubject = escapeHtml(trimmedSubject);
      const safeMessage = escapeHtml(trimmedMessage);

      if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, subject, and message are required'
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }

      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return res.status(503).json({
          success: false,
          message: 'Contact email service is not configured'
        });
      }

      await this.transporter.sendMail({
        from: `"Animal E Bazar Contact" <${process.env.SMTP_USER}>`,
        to: CONTACT_RECEIVER_EMAIL,
        replyTo: trimmedEmail,
        subject: `[Contact Us] ${trimmedSubject}`,
        text: [
          `Name: ${trimmedName}`,
          `Email: ${trimmedEmail}`,
          `Phone: ${trimmedPhone || 'Not provided'}`,
          `Subject: ${trimmedSubject}`,
          '',
          'Message:',
          trimmedMessage
        ].join('\n'),
        html: `
          <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
            <h2 style="margin: 0 0 16px;">New Contact Us Submission</h2>
            <table style="border-collapse: collapse; width: 100%; max-width: 680px;">
              <tr>
                <td style="padding: 8px 0; font-weight: 700; width: 120px;">Name</td>
                <td style="padding: 8px 0;">${safeName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 700;">Email</td>
                <td style="padding: 8px 0;">${safeEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 700;">Phone</td>
                <td style="padding: 8px 0;">${safePhone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 700;">Subject</td>
                <td style="padding: 8px 0;">${safeSubject}</td>
              </tr>
            </table>
            <div style="margin-top: 20px; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; background: #f9fafb;">
              <div style="font-weight: 700; margin-bottom: 8px;">Message</div>
              <div style="white-space: pre-wrap;">${safeMessage}</div>
            </div>
          </div>
        `
      });

      return res.status(200).json({
        success: true,
        message: 'Your message has been sent successfully'
      });
    } catch (error) {
      console.error('Contact form submission failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send your message'
      });
    }
  }
}

module.exports = new ContactController();
