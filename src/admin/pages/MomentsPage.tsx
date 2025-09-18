import React from 'react';
import MomentsModeration from '../components/MomentsModeration';

export const MomentsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Moments Moderation</h1>
        <p className="text-muted-foreground mt-2">
          Review and moderate member moments and content
        </p>
      </div>

      <MomentsModeration />
    </div>
  );
};