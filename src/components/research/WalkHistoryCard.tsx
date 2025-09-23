import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  CloudRain, 
  Users, 
  MapPin, 
  RotateCcw,
  Trash2
} from 'lucide-react';
import { WalkCard } from '@/hooks/useResearch';
import { format } from 'date-fns';

interface WalkHistoryCardProps {
  walkCard: WalkCard;
  onReopen?: (cardId: string) => void;
  onDelete?: (cardId: string) => void;
}

export const WalkHistoryCard: React.FC<WalkHistoryCardProps> = ({ 
  walkCard, 
  onReopen, 
  onDelete 
}) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    try {
      return format(new Date(timeString), 'HH:mm');
    } catch {
      return timeString;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{walkCard.title}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(walkCard.date)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {walkCard.time_block}
              </div>
              <div className="flex items-center gap-1">
                <CloudRain className="h-3 w-3" />
                {walkCard.weather_preset}
                {walkCard.weather_temp_c && ` ${walkCard.weather_temp_c}°C`}
              </div>
            </div>
          </div>
          <Badge 
            variant={walkCard.status === 'Completed' ? 'default' : 'secondary'}
          >
            {walkCard.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Croft Zones */}
          {walkCard.croft_zones.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Croft Zones</div>
              <div className="flex flex-wrap gap-1">
                {walkCard.croft_zones.map((zone) => (
                  <Badge key={zone} variant="outline" className="text-xs">
                    {zone}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Weather Notes */}
          {walkCard.weather_notes && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Weather Notes</div>
              <p className="text-sm">{walkCard.weather_notes}</p>
            </div>
          )}

          {/* Timing */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div>
              {walkCard.started_at && (
                <span>Started: {formatTime(walkCard.started_at)}</span>
              )}
            </div>
            <div>
              {walkCard.completed_at && (
                <span>Completed: {formatTime(walkCard.completed_at)}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {onReopen && walkCard.status === 'Completed' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onReopen(walkCard.id)}
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                Reopen
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onDelete(walkCard.id)}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};