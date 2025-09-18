import React from 'react';
import { UserAnalytics as UserAnalyticsComponent } from '../components/UserAnalytics';

export const UserAnalyticsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Detailed user behavior and engagement metrics
        </p>
      </div>

      <UserAnalyticsComponent embedded={false} />
    </div>
  );
};