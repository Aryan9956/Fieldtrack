import type { CapacitorConfig } from '@capacitor/cli';

/**
 * FieldTrack Capacitor Android Configuration
 * 
 * Live Production SaaS Domain: https://fieldtrack.netlify.app
 */

const PRODUCTION_URL = 'https://fieldtrack.netlify.app';
const SERVER_URL = process.env.CAPACITOR_SERVER_URL || process.env.NEXT_PUBLIC_APP_URL || PRODUCTION_URL;

const config: CapacitorConfig = {
  appId: 'com.fieldtrack.app',
  appName: 'FieldTrack',
  webDir: 'public',
  server: {
    url: SERVER_URL,
    cleartext: true,
    androidScheme: 'https',
  },
  plugins: {
    CapacitorCookies: {
      enabled: true,
    },
  },
};

export default config;
