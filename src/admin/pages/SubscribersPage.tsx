import React from 'react';
import { SubscribersTable as SubscribersTableComponent } from '../components/SubscribersTable';

export const SubscribersPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscribers</h1>
        <p className="text-muted-foreground mt-2">
          Manage notification subscribers and their preferences
        </p>
      </div>

      <SubscribersTableComponent />
    </div>
  );
};