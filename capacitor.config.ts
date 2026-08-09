import type { CapacitorConfig } from '@capacitor/cli';

/**
 * FieldTrack Capacitor Android Configuration
 * 
 * Your current Wi-Fi Local IP: http://10.114.255.57:3000
 * Production SaaS Domain: https://fieldtrack.yourdomain.com
 */

const LOCAL_WIFI_IP = 'http://10.114.255.57:3000';
const PRODUCTION_URL = 'https://fieldtrack.yourdomain.com';

// Priority: CAPACITOR_SERVER_URL > NEXT_PUBLIC_APP_URL > LOCAL_WIFI_IP
const SERVER_URL = process.env.CAPACITOR_SERVER_URL || process.env.NEXT_PUBLIC_APP_URL || LOCAL_WIFI_IP;

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
