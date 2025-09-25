import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, MapPin, Calendar } from 'lucide-react';
import { WalkCard } from '@/hooks/useResearch';

interface DraftWalkCardProps {
  walkCard: WalkCard;
  onStartWalk: (cardId: string) => void;
}

export const DraftWalkCard: React.FC<DraftWalkCardProps> = ({ walkCard, onStartWalk }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{walkCard.title}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Calendar className="h-3 w-3" />
              {formatDate(walkCard.created_at)}
            </CardDescription>
          </div>
          <Button 
            onClick={() => onStartWalk(walkCard.id)}
            className="h-9 px-4"
          >
            <Play className="mr-2 h-4 w-4" />
            Start Walk
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{walkCard.croft_zones.length} croft zones</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {walkCard.croft_zones.slice(0, 3).map((zone) => (
              <span key={zone} className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                {zone}
              </span>
            ))}
            {walkCard.croft_zones.length > 3 && (
              <span className="px-2 py-1 bg-muted text-muted-foreground rounded-md text-xs">
                +{walkCard.croft_zones.length - 3} more
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};