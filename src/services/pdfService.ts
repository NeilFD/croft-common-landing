import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WalkCard, Venue, WalkEntry } from '@/hooks/useResearch';

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

export const generateWalkCardPDF = async (data: PDFWalkData): Promise<Blob> => {
  const { walkCard, venues, walkEntries, geoAreas } = data;
  const doc = new jsPDF();

  // Header with branding
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Croft Common', 20, 25);
  
  doc.setFontSize(16);
  doc.text('Field Research Report', 20, 35);

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
      const geoArea = venue ? geoAreas.find(g => g.id === venue.geo_area_id) : null;
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

  // Summary statistics
  const finalY = (doc as any).lastAutoTable?.finalY + 20 || 180;
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('Summary', 20, finalY);
  
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Total Venues Visited: ${new Set(walkEntries.map(e => e.venue_id)).size}`, 20, finalY + 15);
  doc.text(`Total Visits: ${walkEntries.length}`, 20, finalY + 25);
  doc.text(`Total People Count: ${walkEntries.reduce((sum, e) => sum + (e.people_count || 0), 0)}`, 20, finalY + 35);
  doc.text(`Total Laptop Count: ${walkEntries.reduce((sum, e) => sum + (e.laptop_count || 0), 0)}`, 20, finalY + 45);

  // Weather notes if available
  if (walkCard.weather_notes) {
    doc.text('Weather Notes:', 20, finalY + 60);
    const splitNotes = doc.splitTextToSize(walkCard.weather_notes, 170);
    doc.text(splitNotes, 20, finalY + 70);
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated on ${new Date().toLocaleString('en-GB')}`, 20, pageHeight - 15);
  doc.text('Croft Common Field Research', 120, pageHeight - 15);

  return doc.output('blob');
};