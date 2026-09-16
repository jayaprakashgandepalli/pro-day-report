import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prodayreport.app',
  appName: 'PRO Day Report',
  webDir: 'public',
  server: {
    url: 'https://sri.uniknaturals.in',
    cleartext: true
  }
};

export default config;
