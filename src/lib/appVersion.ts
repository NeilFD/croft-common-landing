import { Capacitor } from '@capacitor/core';
import packageJson from '../../package.json';

export interface AppVersionInfo {
  version: string;
  buildNumber?: string;
  platform: 'iOS' | 'Android' | 'Web';
  buildTimestamp?: string;
}

export const getAppVersion = async (): Promise<AppVersionInfo> => {
  const platform = Capacitor.getPlatform();
  
  let buildNumber: string | undefined;
  let appVersion = packageJson.version;

  // Get native build info if available
  if (Capacitor.isNativePlatform()) {
    try {
      // Dynamic import for native platforms only
      const { App } = await import('@capacitor/app');
      const info = await App.getInfo();
      appVersion = info.version;
      buildNumber = info.build;
    } catch (error) {
      console.warn('Failed to get native app info:', error);
    }
  }

  return {
    version: appVersion,
    buildNumber,
    platform: platform === 'ios' ? 'iOS' : platform === 'android' ? 'Android' : 'Web',
    buildTimestamp: import.meta.env.BUILD_TIME,
  };
};
