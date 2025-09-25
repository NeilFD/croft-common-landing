import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WalkCard, Venue, WalkEntry } from '@/hooks/useResearch';
import { supabase } from '@/integrations/supabase/client';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

interface PDFWalkData {
  walkCard: WalkCard;
  venues: Venue[];
  walkEntries: WalkEntry[];
  geoAreas: { id: string; name: string }[];
}

const loadLogoAsBase64 = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(''); // Fallback to no logo if loading fails
    img.src = '/brand/logo.png';
  });
};

export const generateWalkCardPDF = async (data: PDFWalkData): Promise<Blob> => {
  const { walkCard, venues, walkEntries } = data;
  const doc = new jsPDF();

  // Calculate visited geo areas from actual walk entries instead of using all geo areas
  const visitedVenues = walkEntries
    .map(entry => venues.find(v => v.id === entry.venue_id))
    .filter(Boolean);
  
  const visitedGeoAreaIds = new Set(visitedVenues.map(venue => venue.geo_area_id));
  const visitedGeoAreas = data.geoAreas.filter(area => visitedGeoAreaIds.has(area.id));

  // Generate AI summary first
  let aiSummary = '';
  try {
    const { data: summaryData, error: summaryError } = await supabase.functions.invoke('generate-walk-summary', {
      body: { walkData: { walkCard, venues, walkEntries, geoAreas: visitedGeoAreas } }
    });
    
    if (!summaryError && summaryData?.summary) {
      aiSummary = summaryData.summary;
    }
  } catch (error) {
    console.warn('Failed to generate AI summary:', error);
  }

  // Load and add logo
  const logoBase64 = await loadLogoAsBase64();
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 20, 15, 15, 15);
    } catch (error) {
      console.warn('Failed to add logo to PDF:', error);
    }
  }

  // Header with branding
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Croft Common', 40, 25);
  
  doc.setFontSize(16);
  doc.text('Field Research Report', 40, 35);

  // Walk card details
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text(`Walk: ${walkCard.title}`, 20, 50);
  doc.text(`Date: ${new Date(walkCard.created_at).toLocaleDateString('en-GB')}`, 20, 60);
  doc.text(`Status: ${walkCard.status}`, 20, 70);
  
  if (walkCard.weather_preset) {
    doc.text(`Weather: ${walkCard.weather_preset}`, 120, 50);
  }
  if (walkCard.weather_temp_c !== null) {
    doc.text(`Temperature: ${walkCard.weather_temp_c}°C`, 120, 60);
  }

  // Get venues with their walk entries and sort chronologically
  const venueVisits = walkEntries
    .map(entry => {
      const venue = venues.find(v => v.id === entry.venue_id);
      const geoArea = venue ? visitedGeoAreas.find(g => g.id === venue.geo_area_id) : null;
      return venue ? { venue, entry, geoAreaName: geoArea?.name || 'N/A' } : null;
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a!.entry.recorded_at).getTime() - new Date(b!.entry.recorded_at).getTime());

  // Create table data
  const tableData = venueVisits.map((visit, index) => {
    const { venue, entry, geoAreaName } = visit!;
    const visitTime = new Date(entry.recorded_at).toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return [
      index + 1,
      visitTime,
      venue.name,
      geoAreaName,
      entry.people_count || 0,
      entry.laptop_count || 0,
      entry.visit_number,
      entry.notes || '',
      entry.flag_anomaly ? 'Yes' : 'No'
    ];
  });

  // Add venues table
  autoTable(doc, {
    startY: 85,
    head: [['#', 'Time', 'Venue', 'Area', 'People', 'Laptops', 'Visit #', 'Notes', 'Anomaly']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [51, 65, 85], // slate-600
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    margin: { left: 10, right: 10 },
  });

  // Summary section with improved spacing and layout
  const finalY = (doc as any).lastAutoTable?.finalY + 30 || 190;
  
  // Add separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(20, finalY - 5, 190, finalY - 5);
  
  // Summary header
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text('Walk Summary', 20, finalY + 10);
  
  let currentY = finalY + 25;
  
  // AI-generated summary if available
  if (aiSummary) {
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const summaryLines = doc.splitTextToSize(aiSummary, 170);
    doc.text(summaryLines, 20, currentY);
    currentY += (summaryLines.length * 5) + 15;
  }
  
  // Statistics section
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('Key Statistics', 20, currentY);
  currentY += 15;
  
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  
  // Left column stats
  doc.text(`Total Venues Visited: ${new Set(walkEntries.map(e => e.venue_id)).size}`, 20, currentY);
  doc.text(`Total Visits: ${walkEntries.length}`, 20, currentY + 12);
  doc.text(`Total People Count: ${walkEntries.reduce((sum, e) => sum + (e.people_count || 0), 0)}`, 20, currentY + 24);
  doc.text(`Total Laptop Count: ${walkEntries.reduce((sum, e) => sum + (e.laptop_count || 0), 0)}`, 20, currentY + 36);
  
  // Right column stats  
  const anomalies = walkEntries.filter(e => e.flag_anomaly).length;
  const notesCount = walkEntries.filter(e => e.notes && e.notes.trim()).length;
  doc.text(`Anomalies Flagged: ${anomalies}`, 105, currentY);
  doc.text(`Entries with Notes: ${notesCount}`, 105, currentY + 12);
  doc.text(`Areas with Visits: ${visitedGeoAreas.length}`, 105, currentY + 24);
  
  currentY += 55;

  // Weather notes if available
  if (walkCard.weather_notes) {
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Weather Notes', 20, currentY);
    currentY += 15;
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const splitNotes = doc.splitTextToSize(walkCard.weather_notes, 170);
    doc.text(splitNotes, 20, currentY);
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated on ${new Date().toLocaleString('en-GB')}`, 20, pageHeight - 15);
  doc.text('Croft Common Field Research', 120, pageHeight - 15);

  return doc.output('blob');
};