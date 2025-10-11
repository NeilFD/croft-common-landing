import React, { useEffect, useState } from 'react';
import { getAppVersion, AppVersionInfo } from '@/lib/appVersion';
import { format } from 'date-fns';

const AppVersionFooter: React.FC = () => {
  const [versionInfo, setVersionInfo] = useState<AppVersionInfo | null>(null);

  useEffect(() => {
    getAppVersion().then(setVersionInfo);
  }, []);

  const formatBuildDate = (timestamp?: string) => {
    if (!timestamp) return null;
    try {
      return format(new Date(timestamp), 'd MMM yyyy HH:mm');
    } catch {
      return null;
    }
  };

  const buildDate = formatBuildDate(versionInfo?.buildTimestamp);

  return (
    <div>
      <p className="text-xs md:text-sm text-muted-foreground text-center font-mono">
        {versionInfo ? (
          <>
            CroftCommon v{versionInfo.version}
            {versionInfo.buildNumber && ` (${versionInfo.buildNumber})`}
            {' • '}
            {versionInfo.platform}
            {buildDate && ` • Built: ${buildDate}`}
          </>
        ) : (
          'Loading version…'
        )}
      </p>
    </div>
  );
};

export default AppVersionFooter;
