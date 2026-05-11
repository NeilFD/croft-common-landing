import React from 'react';
import { CinemaManagement as CinemaManagementComponent } from '../components/CinemaManagement';
import { CinemaBookings } from '../components/CinemaBookings';

export const CinemaPage = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Cinema Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage secret cinema events and screenings
        </p>
      </div>

      <CinemaManagementComponent />
      <CinemaBookings />
    </div>
  );
};
