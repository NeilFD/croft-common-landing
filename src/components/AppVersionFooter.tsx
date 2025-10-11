import React, { useEffect, useState } from 'react';
import { getAppVersion, AppVersionInfo } from '@/lib/appVersion';
import { format } from 'date-fns';

const AppVersionFooter: React.FC = () => {
  const [versionInfo, setVersionInfo] = useState<AppVersionInfo | null>(null);

  useEffect(() => {
    getAppVersion().then(setVersionInfo);
  }, []);

  if (!versionInfo) return null;

  const formatBuildDate = (timestamp?: string) => {
    if (!timestamp) return null;
    try {
      return format(new Date(timestamp), 'd MMM yyyy HH:mm');
    } catch {
      return null;
    }
  };

  const buildDate = formatBuildDate(versionInfo.buildTimestamp);

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <p className="text-xs md:text-sm text-muted-foreground text-center font-mono">
        CroftCommon v{versionInfo.version}
        {versionInfo.buildNumber && ` (${versionInfo.buildNumber})`}
        {' • '}
        {versionInfo.platform}
        {buildDate && ` • Built: ${buildDate}`}
      </p>
    </div>
  );
};

export default AppVersionFooter;
