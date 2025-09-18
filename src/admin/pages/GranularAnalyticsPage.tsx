import React from 'react';
import { GranularAnalytics as GranularAnalyticsComponent } from '../components/GranularAnalytics';

export const GranularAnalyticsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Granular Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Deep-dive analytics with detailed breakdowns and metrics
        </p>
      </div>

      <GranularAnalyticsComponent />
    </div>
  );
};