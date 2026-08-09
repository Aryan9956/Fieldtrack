import { EmailProvider } from './index';

export interface SentEmailLog {
  id: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  sentAt: Date;
  verificationLink?: string;
}

// In-memory log array for local development testing UI
export const devEmailLogs: SentEmailLog[] = [];

export class DevEmailProvider implements EmailProvider {
  async sendVerificationEmail(to: string, name: string, token: string): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

    const subject = `[FieldTrack Dev] Verify your email address, ${name}`;
    const text = `Hello ${name},\n\nPlease verify your email for FieldTrack by visiting:\n${verifyUrl}\n\nThis token will expire in 24 hours.`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4f46e5;">FieldTrack Email Verification</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Thank you for registering on FieldTrack. Please click the button below to verify your email address:</p>
        <p style="margin: 24px 0;">
          <a href="${verifyUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email Address</a>
        </p>
        <p style="color: #666; font-size: 13px;">Or copy and paste this URL into your browser:<br><a href="${verifyUrl}">${verifyUrl}</a></p>
      </div>
    `;

    const emailLog: SentEmailLog = {
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      to,
      subject,
      text,
      html,
      sentAt: new Date(),
      verificationLink: verifyUrl,
    };

    devEmailLogs.unshift(emailLog);

    console.log('\n============== 📧 DEV EMAIL SENT ==============');
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`VERIFICATION LINK: ${verifyUrl}`);
    console.log('=================================================\n');

    return true;
  }

  async sendAccessGrantedEmail(to: string, name: string, duration: string, employeeLimit: number): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const loginUrl = `${baseUrl}/login`;

    const subject = `[FieldTrack Dev] Access Granted! Welcome to FieldTrack`;
    const text = `Hello ${name},\n\nGreat news! Super Admin has approved your access to FieldTrack.\nDuration: ${duration}\nEmployee Limit: ${employeeLimit}\n\nLog in here: ${loginUrl}`;

    devEmailLogs.unshift({
      id: `email_${Date.now()}`,
      to,
      subject,
      text,
      html: `<p>${text.replace(/\n/g, '<br>')}</p>`,
      sentAt: new Date(),
    });

    console.log('\n============== 📧 ACCESS GRANTED EMAIL ==============');
    console.log(`TO: ${to}`);
    console.log(`LOGIN LINK: ${loginUrl}`);
    console.log('======================================================\n');

    return true;
  }

  async sendAccessRevokedEmail(to: string, name: string, reason?: string): Promise<boolean> {
    const subject = `[FieldTrack Dev] Account Access Update`;
    const text = `Hello ${name},\n\nYour FieldTrack access has been updated/revoked. Reason: ${reason || 'Administrator decision'}. Please contact support.`;

    devEmailLogs.unshift({
      id: `email_${Date.now()}`,
      to,
      subject,
      text,
      html: `<p>${text.replace(/\n/g, '<br>')}</p>`,
      sentAt: new Date(),
    });

    console.log('\n============== 📧 ACCESS REVOKED EMAIL ==============');
    console.log(`TO: ${to}`);
    console.log(`REASON: ${reason || 'N/A'}`);
    console.log('======================================================\n');

    return true;
  }
}
