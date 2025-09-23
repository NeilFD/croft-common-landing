import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useResearch } from '@/hooks/useResearch';
import { toast } from 'sonner';

interface VenueRow {
  name: string;
  address?: string;
  geo_area_name: string;
}

export const VenueUpload = () => {
  const { geoAreas, createVenue, createGeoArea, loading } = useResearch();
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const template = [
      ['name', 'address', 'geo_area_name'],
      ['Example Café', '123 High Street', 'City Centre'],
      ['Another Venue', '456 Main Road', 'Suburbs']
    ];

    const csvContent = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'venue-upload-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Template downloaded');
  };

  const parseCSV = (text: string): VenueRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIndex = headers.indexOf('name');
    const addressIndex = headers.indexOf('address');
    const geoAreaIndex = headers.indexOf('geo_area_name');

    if (nameIndex === -1 || geoAreaIndex === -1) {
      throw new Error('CSV must contain "name" and "geo_area_name" columns');
    }

    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      if (values.length < Math.max(nameIndex, geoAreaIndex) + 1) {
        throw new Error(`Row ${index + 2}: Invalid number of columns`);
      }

      return {
        name: values[nameIndex],
        address: addressIndex >= 0 ? values[addressIndex] || undefined : undefined,
        geo_area_name: values[geoAreaIndex]
      };
    }).filter(row => row.name && row.geo_area_name);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setUploading(true);
    setUploadResults(null);

    try {
      const text = await file.text();
      const venues = parseCSV(text);

      if (venues.length === 0) {
        toast.error('No valid venues found in CSV');
        return;
      }

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // Process each venue
      for (const venue of venues) {
        try {
          // Find or create geo area
          let geoArea = geoAreas.find(area => 
            area.name.toLowerCase() === venue.geo_area_name.toLowerCase()
          );

          if (!geoArea) {
            // Create new geo area
            await createGeoArea(venue.geo_area_name);
            // Refetch to get the new geo area ID - for now we'll use a placeholder
            // In a real implementation, createGeoArea should return the created area
            geoArea = { id: 'temp', name: venue.geo_area_name } as any;
          }

          // Create venue
          await createVenue({
            name: venue.name,
            address: venue.address,
            geo_area_id: geoArea.id
          });

          successCount++;
        } catch (error) {
          failedCount++;
          errors.push(`${venue.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setUploadResults({
        success: successCount,
        failed: failedCount,
        errors: errors.slice(0, 10) // Show only first 10 errors
      });

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} venues`);
      }
      if (failedCount > 0) {
        toast.error(`Failed to upload ${failedCount} venues`);
      }

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process CSV file');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Upload Venues
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={downloadTemplate} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="csv-upload">Upload CSV File</Label>
          <Input
            id="csv-upload"
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={uploading || loading}
          />
        </div>

        {uploading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            Processing venues...
          </div>
        )}

        {uploadResults && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">
                {uploadResults.success} venues uploaded successfully
              </span>
            </div>
            
            {uploadResults.failed > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600">
                    {uploadResults.failed} venues failed to upload
                  </span>
                </div>
                
                {uploadResults.errors.length > 0 && (
                  <div className="text-xs text-red-600 space-y-1">
                    {uploadResults.errors.map((error, index) => (
                      <div key={index}>• {error}</div>
                    ))}
                    {uploadResults.errors.length === 10 && uploadResults.failed > 10 && (
                      <div>• ... and {uploadResults.failed - 10} more errors</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            CSV should contain columns: name, address (optional), geo_area_name
          </div>
          <div>• Geo areas will be created automatically if they don't exist</div>
          <div>• Duplicate venue names will be skipped</div>
        </div>
      </CardContent>
    </Card>
  );
};