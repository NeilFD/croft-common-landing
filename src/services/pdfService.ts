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
  doc.text(`Date: ${new Date(walkCard.date || walkCard.created_at).toLocaleDateString('en-GB')}`, 20, 60);
  doc.text(`Status: ${walkCard.status}`, 20, 70);
  
  if (walkCard.weather_preset) {
    doc.text(`Weather: ${walkCard.weather_preset}`, 120, 50);
  }
  if (walkCard.weather_temp_c !== null) {
    doc.text(`Temperature: ${walkCard.weather_temp_c}°C`, 120, 60);
  }

  // Process venue visits - entries are already filtered and deduplicated
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
    
    const occupancyPercent = entry.capacity_percentage !== null && entry.capacity_percentage !== undefined 
      ? `${entry.capacity_percentage.toFixed(0)}%` 
      : 'N/A';
    
    return [
      visitTime,
      venue.name,
      geoAreaName,
      entry.people_count || 0,
      entry.laptop_count || 0,
      entry.visit_number,
      occupancyPercent,
      entry.notes || '',
      entry.flag_anomaly ? 'Yes' : 'No'
    ];
  });

  // Add venues table
  autoTable(doc, {
    startY: 85,
    head: [['Time', 'Venue', 'Area', 'People', 'Laptops', 'Visit #', 'Occupancy %', 'Notes', 'Anomaly']],
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
  
  // AI-generated summary with page break handling
  if (aiSummary) {
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const summaryLines = doc.splitTextToSize(aiSummary, 170);
    
    const pageHeight = doc.internal.pageSize.height;
    const marginBottom = 30; // Space for footer
    const lineHeight = 5;
    
    for (let i = 0; i < summaryLines.length; i++) {
      // Check if we need a new page
      if (currentY + lineHeight > pageHeight - marginBottom) {
        doc.addPage();
        currentY = 30; // Top margin for new page
        
        // Add header on new page
        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text('Walk Summary (continued)', 20, currentY - 10);
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
      }
      
      doc.text(summaryLines[i], 20, currentY);
      currentY += lineHeight;
    }
    
    currentY += 15; // Extra space after summary
  }
  
  // Check if we need a new page for statistics
  const pageHeight = doc.internal.pageSize.height;
  const marginBottom = 30;
  if (currentY + 80 > pageHeight - marginBottom) {
    doc.addPage();
    currentY = 30;
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
  
  // Calculate capacity metrics
  const entriesWithCapacity = walkEntries.filter(e => e.capacity_percentage !== null && e.capacity_percentage !== undefined);
  const avgCapacityUtilization = entriesWithCapacity.length > 0 
    ? (entriesWithCapacity.reduce((sum, e) => sum + (e.capacity_percentage || 0), 0) / entriesWithCapacity.length).toFixed(1)
    : 'N/A';
  const peakCapacity = entriesWithCapacity.length > 0 
    ? Math.max(...entriesWithCapacity.map(e => e.capacity_percentage || 0)).toFixed(1)
    : 'N/A';
  
  doc.text(`Average Capacity Utilization: ${avgCapacityUtilization}${avgCapacityUtilization !== 'N/A' ? '%' : ''}`, 20, currentY + 48);
  doc.text(`Peak Capacity Reached: ${peakCapacity}${peakCapacity !== 'N/A' ? '%' : ''}`, 20, currentY + 60);
  
  // Right column stats  
  const anomalies = walkEntries.filter(e => e.flag_anomaly).length;
  const notesCount = walkEntries.filter(e => e.notes && e.notes.trim()).length;
  doc.text(`Anomalies Flagged: ${anomalies}`, 105, currentY);
  doc.text(`Entries with Notes: ${notesCount}`, 105, currentY + 12);
  doc.text(`Areas with Visits: ${visitedGeoAreas.length}`, 105, currentY + 24);
  
  currentY += 85;

  // Add capacity analysis section
  if (entriesWithCapacity.length > 0) {
    // Check if we need a new page for capacity analysis
    if (currentY + 80 > pageHeight - marginBottom) {
      doc.addPage();
      currentY = 30;
    }
    
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Capacity Analysis by Venue', 20, currentY);
    currentY += 15;
    
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    
    // Group entries by venue for capacity analysis
    const venueCapacityAnalysis = walkEntries.reduce((acc, entry) => {
      const venue = venues.find(v => v.id === entry.venue_id);
      if (venue && venue.max_capacity && entry.people_count !== null && entry.capacity_percentage !== null) {
        if (!acc[venue.id]) {
          acc[venue.id] = { 
            name: venue.name, 
            maxCapacity: venue.max_capacity, 
            visits: [] 
          };
        }
        acc[venue.id].visits.push({ 
          people: entry.people_count || 0, 
          capacity: entry.capacity_percentage || 0 
        });
      }
      return acc;
    }, {} as Record<string, { name: string; maxCapacity: number; visits: { people: number; capacity: number }[] }>);
    
    Object.values(venueCapacityAnalysis).forEach((venue) => {
      if (venue.visits.length > 0) {
        const avgCapacity = (venue.visits.reduce((sum, v) => sum + v.capacity, 0) / venue.visits.length).toFixed(1);
        const maxCapacity = Math.max(...venue.visits.map(v => v.capacity)).toFixed(1);
        const maxPeople = Math.max(...venue.visits.map(v => v.people));
        
        // Check if we need a new line/page
        if (currentY > pageHeight - marginBottom - 20) {
          doc.addPage();
          currentY = 30;
        }
        
        doc.text(`${venue.name} (max: ${venue.maxCapacity}): Avg ${avgCapacity}%, Peak ${maxCapacity}% (${maxPeople} people)`, 20, currentY);
        currentY += 12;
      }
    });
    
    currentY += 15;
  }

  // Weather notes if available
  if (walkCard.weather_notes) {
    // Check if we need a new page for weather notes
    if (currentY + 40 > pageHeight - marginBottom) {
      doc.addPage();
      currentY = 30;
    }
    
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Weather Notes', 20, currentY);
    currentY += 15;
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const splitNotes = doc.splitTextToSize(walkCard.weather_notes, 170);
    doc.text(splitNotes, 20, currentY);
  }

  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);
    const currentPageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated on ${new Date().toLocaleString('en-GB')}`, 20, currentPageHeight - 15);
    doc.text('Croft Common Field Research', 120, currentPageHeight - 15);
    if (totalPages > 1) {
      doc.text(`Page ${pageNum} of ${totalPages}`, 170, currentPageHeight - 15);
    }
  }

  return doc.output('blob');
};