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
  Trash2,
  FileText,
  Share
} from 'lucide-react';
import { WalkCard, WalkEntry, useResearch } from '@/hooks/useResearch';
import { format } from 'date-fns';
import { generateWalkCardPDF } from '@/services/pdfService';
import { shareViaWhatsApp, downloadPDF } from '@/services/whatsappService';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const { venues, geoAreas } = useResearch();
  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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

  const fetchWalkEntries = async (): Promise<WalkEntry[]> => {
    try {
      // Get original walk date from walk card creation
      const walkDate = new Date(walkCard.created_at);
      const walkDateStr = walkDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Get all entries for this walk card
      const { data, error } = await supabase
        .from('walk_entries')
        .select('*')
        .eq('walk_card_id', walkCard.id)
        .order('recorded_at', { ascending: true });

      if (error) {
        console.error('Error fetching walk entries:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Filter to only include entries from the original walk date
      const originalWalkEntries = data.filter(entry => {
        const entryDate = new Date(entry.recorded_at).toISOString().split('T')[0];
        return entryDate === walkDateStr;
      });

      // Group entries by venue_id to handle duplicates
      const venueEntriesMap = new Map<string, WalkEntry[]>();
      originalWalkEntries.forEach(entry => {
        const venueId = entry.venue_id;
        if (!venueEntriesMap.has(venueId)) {
          venueEntriesMap.set(venueId, []);
        }
        venueEntriesMap.get(venueId)!.push(entry);
      });

      // Process entries: keep originals and only legitimate second visits
      const processedEntries: WalkEntry[] = [];
      const legitimateSecondVisitVenues = new Set(['Full Moon', 'The Canteen', 'Caribbean Croft']);

      venueEntriesMap.forEach((entries, venueId) => {
        // Find the venue name
        const venue = venues.find(v => v.id === venueId);
        const venueName = venue?.name || '';

        if (entries.length === 1) {
          // Single visit - always include
          processedEntries.push(entries[0]);
        } else if (entries.length > 1) {
          // Multiple visits - sort by recorded_at
          const sortedEntries = entries.sort((a, b) => 
            new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
          );

          // Always include the first visit
          processedEntries.push(sortedEntries[0]);

          // Only include second visit if it's a legitimate venue
          if (legitimateSecondVisitVenues.has(venueName) && sortedEntries.length > 1) {
            processedEntries.push(sortedEntries[1]);
          }
        }
      });

      // Sort final entries by recorded_at
      return processedEntries.sort((a, b) => 
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
      );

    } catch (error) {
      console.error('Failed to fetch walk entries:', error);
      throw new Error('Failed to fetch walk data');
    }
  };

  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true);
      
      const walkCardEntries = await fetchWalkEntries();
      
      if (walkCardEntries.length === 0) {
        toast({
          title: "No data available",
          description: "This walk card has no venue visits to include in the report.",
          variant: "destructive"
        });
        return;
      }

      const pdfBlob = await generateWalkCardPDF({
        walkCard,
        venues,
        walkEntries: walkCardEntries,
        geoAreas
      });

      downloadPDF(pdfBlob, walkCard);
      
      toast({
        title: "PDF Generated",
        description: "The walk card report has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleShareWhatsApp = async () => {
    try {
      setIsGeneratingPDF(true);
      
      const walkCardEntries = await fetchWalkEntries();
      
      if (walkCardEntries.length === 0) {
        toast({
          title: "No data available",
          description: "This walk card has no venue visits to share.",
          variant: "destructive"
        });
        return;
      }

      const pdfBlob = await generateWalkCardPDF({
        walkCard,
        venues,
        walkEntries: walkCardEntries,
        geoAreas
      });

      const success = await shareViaWhatsApp(pdfBlob, walkCard, (toastData) => {
        toast({
          title: toastData.title,
          description: toastData.description,
          variant: toastData.variant as any
        });
      });
      
      if (!success) {
        toast({
          title: "Share Cancelled",
          description: "The sharing process was cancelled.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error sharing via WhatsApp:', error);
      toast({
        title: "Error",
        description: "Failed to prepare report for sharing. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
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
            {walkCard.status === 'Completed' && (
              <>
                <Button 
                  onClick={handleGeneratePDF}
                  variant="outline" 
                  size="sm"
                  className="w-full sm:w-auto"
                  disabled={isGeneratingPDF}
                >
                  <FileText className="mr-1 h-3 w-3" />
                  {isGeneratingPDF ? "Generating..." : "PDF Report"}
                </Button>
                <Button 
                  onClick={handleShareWhatsApp}
                  variant="outline" 
                  size="sm"
                  className="w-full sm:w-auto"
                  disabled={isGeneratingPDF}
                >
                  <Share className="mr-1 h-3 w-3" />
                  Share WhatsApp
                </Button>
              </>
            )}
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