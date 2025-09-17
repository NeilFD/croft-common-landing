import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon } from 'lucide-react';

const TraditionalStreakCalendar: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card className="w-full bg-background border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Streak Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center text-muted-foreground">
            Loading streak calendar...
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TraditionalStreakCalendar;