import nodemailer from "nodemailer";
import { env } from "../config/env";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
    return transporter;
  }
  return null;
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
): Promise<void> {
  const t = getTransporter();
  if (t) {
    try {
      await t.sendMail({
        from: env.SMTP_FROM,
        to,
        subject,
        text: body,
      });
      console.log(`[EMAIL] Sent to ${to}: ${subject}`);
    } catch (err) {
      console.error(`[EMAIL] Failed to send to ${to}:`, err);
      // Fallback to console
      console.log(`[EMAIL FALLBACK] To: ${to} | Subject: ${subject}`);
      console.log(`[EMAIL FALLBACK] Body: ${body}`);
    }
  } else {
    // No SMTP configured — console only
    console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
    console.log(`[EMAIL] Body: ${body}`);
    console.log(
      `[EMAIL] Tip: Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env for real email`,
    );
  }
}
