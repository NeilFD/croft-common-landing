import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Cloud, Users } from 'lucide-react';
import { WalkCard } from '@/hooks/useResearch';

interface WalkHistoryCardProps {
  walkCard: WalkCard;
}

export const WalkHistoryCard: React.FC<WalkHistoryCardProps> = ({ walkCard }) => {
  const formatTimeBlock = (timeBlock: string) => {
    return timeBlock.replace(/([A-Z])/g, ' $1').trim();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDate(walkCard.date)}
              <Clock className="h-3 w-3" />
              {formatTimeBlock(walkCard.time_block)}
              <Cloud className="h-3 w-3" />
              {walkCard.weather_preset}
            </div>
            
            {walkCard.croft_zones.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {walkCard.croft_zones.map((zone) => (
                  <Badge key={zone} variant="outline" className="text-xs">
                    {zone}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="text-right">
            <Badge variant="secondary">{walkCard.status}</Badge>
            {walkCard.completed_at && (
              <p className="text-xs text-muted-foreground mt-1">
                Completed {new Date(walkCard.completed_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};