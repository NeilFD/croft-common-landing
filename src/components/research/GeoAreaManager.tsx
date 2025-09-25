import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Plus, X } from 'lucide-react';
import { GeoArea, useResearch } from '@/hooks/useResearch';

interface GeoAreaManagerProps {
  walkCardId: string;
  onUpdate?: () => void;
  onClose?: () => void;
}

export const GeoAreaManager: React.FC<GeoAreaManagerProps> = ({ 
  walkCardId, 
  onUpdate,
  onClose
}) => {
  const { 
    geoAreas, 
    fetchWalkCardGeoAreas, 
    addGeoAreaToWalkCard, 
    removeGeoAreaFromWalkCard 
  } = useResearch();
  
  const [selectedGeoAreaIds, setSelectedGeoAreaIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadWalkCardGeoAreas = async () => {
      if (walkCardId) {
        const walkGeoAreas = await fetchWalkCardGeoAreas(walkCardId);
        setSelectedGeoAreaIds(walkGeoAreas.map(area => area.id));
      }
    };

    loadWalkCardGeoAreas();
  }, [walkCardId, fetchWalkCardGeoAreas]);

  const handleToggleGeoArea = async (geoAreaId: string, isSelected: boolean) => {
    setLoading(true);
    try {
      if (isSelected) {
        await addGeoAreaToWalkCard(walkCardId, geoAreaId);
        setSelectedGeoAreaIds(prev => [...prev, geoAreaId]);
      } else {
        await removeGeoAreaFromWalkCard(walkCardId, geoAreaId);
        setSelectedGeoAreaIds(prev => prev.filter(id => id !== geoAreaId));
      }
      onUpdate?.();
    } finally {
      setLoading(false);
    }
  };

  const selectedGeoAreas = geoAreas.filter(area => 
    selectedGeoAreaIds.includes(area.id)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Geo Areas
          </div>
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Areas */}
        {selectedGeoAreas.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Active Areas</h4>
            <div className="flex flex-wrap gap-2">
              {selectedGeoAreas.map(area => (
                <Badge 
                  key={area.id} 
                  variant="default" 
                  className="flex items-center gap-1"
                >
                  {area.name}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-auto p-0 w-4 h-4 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleToggleGeoArea(area.id, false)}
                    disabled={loading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Available Areas */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Available Areas</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {geoAreas
              .filter(area => !selectedGeoAreaIds.includes(area.id))
              .map(area => (
                <div key={area.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`geo-area-${area.id}`}
                    checked={false}
                    onCheckedChange={(checked) => 
                      handleToggleGeoArea(area.id, checked as boolean)
                    }
                    disabled={loading}
                  />
                  <label 
                    htmlFor={`geo-area-${area.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {area.name}
                  </label>
                </div>
              ))}
          </div>
        </div>

        {geoAreas.filter(area => !selectedGeoAreaIds.includes(area.id)).length === 0 && (
          <p className="text-sm text-muted-foreground">
            All geo areas are already selected
          </p>
        )}
      </CardContent>
    </Card>
  );
};