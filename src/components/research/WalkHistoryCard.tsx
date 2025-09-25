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
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base flex-1 min-w-0 truncate">{walkCard.title}</CardTitle>
            <Badge 
              variant={walkCard.status === 'Completed' ? 'default' : 'secondary'}
              className="shrink-0"
            >
              {walkCard.status}
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1 min-w-0">
              <Calendar className="h-3 w-3 shrink-0" />
              <span className="truncate">{formatDate(walkCard.date)}</span>
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <Clock className="h-3 w-3 shrink-0" />
              <span className="truncate">{walkCard.time_block}</span>
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <CloudRain className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {walkCard.weather_preset}
                {walkCard.weather_temp_c && ` ${walkCard.weather_temp_c}°C`}
              </span>
            </div>
          </div>
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
              <p className="text-sm break-words">{walkCard.weather_notes}</p>
            </div>
          )}

          {/* Timing */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-muted-foreground">
            {walkCard.started_at && (
              <div className="min-w-0">
                <span className="truncate">Started: {formatTime(walkCard.started_at)}</span>
              </div>
            )}
            {walkCard.completed_at && (
              <div className="min-w-0">
                <span className="truncate">Completed: {formatTime(walkCard.completed_at)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {onReopen && walkCard.status === 'Completed' && (
              <Button 
                variant="outline" 
                size="sm"
                className="w-full sm:w-auto"
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
                className="w-full sm:w-auto"
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