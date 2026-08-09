export interface EmailProvider {
  sendVerificationEmail(to: string, name: string, token: string): Promise<boolean>;
  sendAccessGrantedEmail(to: string, name: string, duration: string, employeeLimit: number): Promise<boolean>;
  sendAccessRevokedEmail(to: string, name: string, reason?: string): Promise<boolean>;
}

import { DevEmailProvider } from './dev-provider';
import { ResendEmailProvider } from './resend-provider';

export function getEmailProvider(): EmailProvider {
  const providerType = process.env.EMAIL_PROVIDER || 'dev';

  if (providerType === 'resend' && process.env.RESEND_API_KEY) {
    return new ResendEmailProvider(process.env.RESEND_API_KEY);
  }

  return new DevEmailProvider();
}
