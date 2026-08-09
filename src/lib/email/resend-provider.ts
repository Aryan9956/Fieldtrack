import { EmailProvider } from './index';

export class ResendEmailProvider implements EmailProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendVerificationEmail(to: string, name: string, token: string): Promise<boolean> {
    // Stub for Resend API implementation if RESEND_API_KEY is provided
    console.log(`[Resend Email] Sending verification to ${to} with token ${token}`);
    return true;
  }

  async sendAccessGrantedEmail(to: string, name: string, duration: string, employeeLimit: number): Promise<boolean> {
    console.log(`[Resend Email] Sending access granted to ${to}`);
    return true;
  }

  async sendAccessRevokedEmail(to: string, name: string, reason?: string): Promise<boolean> {
    console.log(`[Resend Email] Sending access revoked to ${to}`);
    return true;
  }
}
