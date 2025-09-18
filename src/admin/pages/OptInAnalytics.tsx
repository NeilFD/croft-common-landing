import React from 'react';
import { OptInAnalytics as OptInAnalyticsComponent } from '../components/OptInAnalytics';

export const OptInAnalytics = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Opt-in Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Track notification opt-in rates and engagement over time
        </p>
      </div>

      <OptInAnalyticsComponent embedded={false} />
    </div>
  );
};