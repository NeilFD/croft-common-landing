import React from 'react';
import { useStreakDashboard } from '@/hooks/useStreakDashboard';

export const StreakCalendarDebug: React.FC = () => {
  const { dashboardData, loading, error } = useStreakDashboard();

  if (loading) return <div>Loading streak data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!dashboardData) return <div>No data</div>;

  const targetWeek = dashboardData.calendar_weeks?.find(w => w.week_start === '2025-08-25');

  return (
    <div className="p-4 border rounded-lg bg-muted">
      <h3 className="text-lg font-semibold mb-4">Streak Calendar Debug</h3>
      
      <div className="space-y-2">
        <div>
          <strong>Target Week (2025-08-25):</strong>
          {targetWeek ? (
            <pre className="text-sm bg-background p-2 rounded mt-1">
              {JSON.stringify(targetWeek, null, 2)}
            </pre>
          ) : (
            <span className="text-destructive ml-2">Not found in calendar weeks</span>
          )}
        </div>

        <div>
          <strong>Total Calendar Weeks:</strong> {dashboardData.calendar_weeks?.length || 0}
        </div>

        <div>
          <strong>Weeks with receipts:</strong>
          {dashboardData.calendar_weeks?.filter(w => w.receipts_count > 0).length || 0}
        </div>

        <div>
          <strong>Complete Weeks:</strong>
          {dashboardData.calendar_weeks?.filter(w => w.is_complete).length || 0}
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer font-medium">All Calendar Weeks</summary>
          <pre className="text-xs bg-background p-2 rounded mt-2 overflow-auto max-h-40">
            {JSON.stringify(dashboardData.calendar_weeks, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};