/**
 * Sends REPP's emails through an SMTP account (by default Gmail with an "app password").
 * Set SMTP_USER and SMTP_PASS; without them, local development prints the email to the console instead.
 */
import nodemailer from 'nodemailer';
import { config } from '../config.js';

const transporter = config.smtp.user && config.smtp.pass
  ? nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: { user: config.smtp.user, pass: config.smtp.pass }
    })
  : null;

export const emailConfigured = Boolean(transporter);

export async function sendEmail(to: string, subject: string, text: string, html: string): Promise<void> {
  if (!transporter) {
    if (process.env.NODE_ENV === 'production') throw new Error('Email sending is not configured (SMTP_USER / SMTP_PASS).');
    console.log(`[mail] (not sent, SMTP not configured) to ${to}: ${subject}\n${text}`);
    return;
  }
  await transporter.sendMail({ from: config.smtp.from || `REPP <${config.smtp.user}>`, to, subject, text, html });
}
