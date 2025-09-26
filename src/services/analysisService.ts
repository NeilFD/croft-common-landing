import { WalkCard, WalkEntry, Venue, GeoArea } from '@/hooks/useResearch';

export interface AnalyticsMetrics {
  totalPeople: number;
  totalVenues: number;
  averagePeoplePerVenue: number;
  averageLaptopsPerVenue: number;
  totalWalks: number;
}

export interface VenuePerformance {
  venueId: string;
  venueName: string;
  geoAreaName: string;
  totalPeople: number;
  averagePeople: number;
  totalVisits: number;
  occupancyRate: number;
  laptopDensity: number;
  capacityUtilization: number;
  peakCapacityPercentage: number;
  anomalyCount: number;
  lastVisited: string;
  peakTime: string;
  performanceScore: number;
}

export interface TimeBlockAnalysis {
  timeBlock: string;
  totalPeople: number;
  averagePeople: number;
  venueCount: number;
  walkCount: number;
  occupancyRate: number;
  averageCapacityUtilization: number;
}

export interface DayComparison {
  date: string;
  dayName: string;
  totalPeople: number;
  totalVenues: number;
  averagePeople: number;
  walkCount: number;
  weatherPreset: string;
  temperature?: number;
}

export interface GeoAreaAnalysis {
  geoAreaId: string;
  geoAreaName: string;
  totalPeople: number;
  averagePeople: number;
  venueCount: number;
  visitCount: number;
  occupancyRate: number;
  averageCapacityUtilization: number;
  peakTimeBlock: string;
  performanceRank: number;
}

export interface DayOfWeekAnalysis {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  dayName: string;
  averageOccupancy: number;
  averageCapacityUtilization: number;
  totalPeople: number;
  totalVisits: number;
  venueCount: number;
  walkCount: number;
}

export interface EnhancedTimeBlockAnalysis {
  timeBlock: string;
  totalPeople: number;
  averagePeople: number;
  venueCount: number;
  walkCount: number;
  occupancyRate: number;
  averageCapacityUtilization: number;
  geoAreaId?: string;
  geoAreaName?: string;
}

export class AnalysisService {
  static calculateMetrics(
    walkEntries: WalkEntry[],
    walkCards: WalkCard[],
    venues: Venue[]
  ): AnalyticsMetrics {
    const totalPeople = walkEntries.reduce((sum, entry) => sum + entry.people_count, 0);
    const totalVenues = new Set(walkEntries.map(entry => entry.venue_id)).size;
    const averagePeoplePerVenue = totalVenues > 0 ? totalPeople / totalVenues : 0;
    const averageLaptopsPerVenue = totalVenues > 0 ? 
      walkEntries.reduce((sum, entry) => sum + entry.laptop_count, 0) / totalVenues : 0;

    return {
      totalPeople,
      totalVenues,
      averagePeoplePerVenue: Math.round(averagePeoplePerVenue * 10) / 10,
      averageLaptopsPerVenue: Math.round(averageLaptopsPerVenue * 10) / 10,
      totalWalks: walkCards.length
    };
  }

  static calculateVenuePerformance(
    walkEntries: WalkEntry[],
    venues: Venue[],
    geoAreas: GeoArea[],
    walkCards: WalkCard[]
  ): VenuePerformance[] {
    const venueMap = new Map(venues.map(v => [v.id, v]));
    const geoAreaMap = new Map(geoAreas.map(g => [g.id, g]));
    const walkCardMap = new Map(walkCards.map(wc => [wc.id, wc]));

    const venueStats = new Map<string, {
      entries: WalkEntry[];
      totalPeople: number;
      totalVisits: number;
      anomalyCount: number;
      lastVisited: string;
      timeBlocks: Map<string, number>;
    }>();

    // Group entries by venue
    walkEntries.forEach(entry => {
      if (!venueStats.has(entry.venue_id)) {
        venueStats.set(entry.venue_id, {
          entries: [],
          totalPeople: 0,
          totalVisits: 0,
          anomalyCount: 0,
          lastVisited: entry.recorded_at,
          timeBlocks: new Map()
        });
      }

      const stats = venueStats.get(entry.venue_id)!;
      stats.entries.push(entry);
      stats.totalPeople += entry.people_count;
      stats.totalVisits++;
      if (entry.flag_anomaly) stats.anomalyCount++;
      if (entry.recorded_at > stats.lastVisited) {
        stats.lastVisited = entry.recorded_at;
      }

      // Track time blocks
      const walkCard = walkCardMap.get(entry.walk_card_id);
      if (walkCard) {
        const current = stats.timeBlocks.get(walkCard.time_block) || 0;
        stats.timeBlocks.set(walkCard.time_block, current + entry.people_count);
      }
    });

    // Calculate performance metrics
    const performances: VenuePerformance[] = [];
    venueStats.forEach((stats, venueId) => {
      const venue = venueMap.get(venueId);
      if (!venue) return;

      const geoArea = geoAreaMap.get(venue.geo_area_id);
      const averagePeople = stats.totalVisits > 0 ? stats.totalPeople / stats.totalVisits : 0;

      // Calculate capacity utilization metrics
      const maxCapacity = venue.max_capacity || 50; // Default to 50 if not set
      const occupancyRate = Math.min((averagePeople / maxCapacity) * 100, 100);
      
      // Calculate capacity utilization from all entries for this venue
      const capacityPercentages = stats.entries
        .map(e => e.capacity_percentage)
        .filter(cp => cp !== null && cp !== undefined) as number[];
      
      const capacityUtilization = capacityPercentages.length > 0 
        ? capacityPercentages.reduce((sum, cp) => sum + cp, 0) / capacityPercentages.length
        : (averagePeople / maxCapacity) * 100;
      
      const peakCapacityPercentage = capacityPercentages.length > 0 
        ? Math.max(...capacityPercentages)
        : Math.min((stats.entries.reduce((max, e) => Math.max(max, e.people_count), 0) / maxCapacity) * 100, 100);

      const laptopDensity = stats.entries.reduce((sum, e) => sum + e.laptop_count, 0) / stats.totalVisits;

      // Find peak time block
      let peakTime = 'Unknown';
      let maxPeople = 0;
      stats.timeBlocks.forEach((people, timeBlock) => {
        if (people > maxPeople) {
          maxPeople = people;
          peakTime = timeBlock;
        }
      });

      // Calculate performance score (0-100) - based on people and occupancy only
      const performanceScore = Math.round(
        (averagePeople * 0.5 + 
         occupancyRate * 0.4 + 
         (stats.anomalyCount === 0 ? 10 : Math.max(0, 10 - stats.anomalyCount)) * 0.1)
      );

      performances.push({
        venueId,
        venueName: venue.name,
        geoAreaName: geoArea?.name || 'Unknown',
        totalPeople: stats.totalPeople,
        averagePeople: Math.round(averagePeople * 10) / 10,
        totalVisits: stats.totalVisits,
        occupancyRate: Math.round(occupancyRate * 10) / 10,
        laptopDensity: Math.round(laptopDensity * 10) / 10,
        capacityUtilization: Math.round(capacityUtilization * 10) / 10,
        peakCapacityPercentage: Math.round(peakCapacityPercentage * 10) / 10,
        anomalyCount: stats.anomalyCount,
        lastVisited: stats.lastVisited,
        peakTime,
        performanceScore
      });
    });

    return performances.sort((a, b) => b.performanceScore - a.performanceScore);
  }

  static calculateTimeBlockAnalysis(
    walkEntries: WalkEntry[],
    walkCards: WalkCard[]
  ): TimeBlockAnalysis[] {
    const walkCardMap = new Map(walkCards.map(wc => [wc.id, wc]));
    const timeBlockStats = new Map<string, {
      totalPeople: number;
      venueIds: Set<string>;
      walkIds: Set<string>;
      entryCount: number;
    }>();

    walkEntries.forEach(entry => {
      const walkCard = walkCardMap.get(entry.walk_card_id);
      if (!walkCard) return;

      const timeBlock = walkCard.time_block;
      if (!timeBlockStats.has(timeBlock)) {
        timeBlockStats.set(timeBlock, {
          totalPeople: 0,
          venueIds: new Set(),
          walkIds: new Set(),
          entryCount: 0
        });
      }

      const stats = timeBlockStats.get(timeBlock)!;
      stats.totalPeople += entry.people_count;
      stats.venueIds.add(entry.venue_id);
      stats.walkIds.add(entry.walk_card_id);
      stats.entryCount++;
    });

    return Array.from(timeBlockStats.entries()).map(([timeBlock, stats]) => {
      // Calculate average capacity utilization for this time block
      const entriesForBlock = walkEntries.filter(entry => {
        const walkCard = walkCardMap.get(entry.walk_card_id);
        return walkCard && walkCard.time_block === timeBlock;
      });
      
      const capacityPercentages = entriesForBlock
        .map(e => e.capacity_percentage)
        .filter(cp => cp !== null && cp !== undefined) as number[];
      
      const averageCapacityUtilization = capacityPercentages.length > 0 
        ? capacityPercentages.reduce((sum, cp) => sum + cp, 0) / capacityPercentages.length
        : 0;

      return {
        timeBlock,
        totalPeople: stats.totalPeople,
        averagePeople: Math.round((stats.totalPeople / stats.entryCount) * 10) / 10,
        venueCount: stats.venueIds.size,
        walkCount: stats.walkIds.size,
        occupancyRate: Math.round(((stats.totalPeople / stats.entryCount) / 50) * 100 * 10) / 10,
        averageCapacityUtilization: Math.round(averageCapacityUtilization * 10) / 10
      };
    }).sort((a, b) => b.totalPeople - a.totalPeople);
  }

  static calculateDayComparisons(
    walkEntries: WalkEntry[],
    walkCards: WalkCard[]
  ): DayComparison[] {
    const walkCardMap = new Map(walkCards.map(wc => [wc.id, wc]));
    const dayStats = new Map<string, {
      totalPeople: number;
      venueIds: Set<string>;
      walkCards: WalkCard[];
    }>();

    walkEntries.forEach(entry => {
      const walkCard = walkCardMap.get(entry.walk_card_id);
      if (!walkCard) return;

      const date = walkCard.date;
      if (!dayStats.has(date)) {
        dayStats.set(date, {
          totalPeople: 0,
          venueIds: new Set(),
          walkCards: []
        });
      }

      const stats = dayStats.get(date)!;
      stats.totalPeople += entry.people_count;
      stats.venueIds.add(entry.venue_id);
      
      // Add walkCard if not already included
      if (!stats.walkCards.find(wc => wc.id === walkCard.id)) {
        stats.walkCards.push(walkCard);
      }
    });

    return Array.from(dayStats.entries()).map(([date, stats]) => {
      const walkCard = stats.walkCards[0]; // Use first walk card for weather data
      const dayName = new Date(date).toLocaleDateString('en-GB', { weekday: 'long' });
      
      return {
        date,
        dayName,
        totalPeople: stats.totalPeople,
        totalVenues: stats.venueIds.size,
        averagePeople: Math.round((stats.totalPeople / stats.venueIds.size) * 10) / 10,
        walkCount: stats.walkCards.length,
        weatherPreset: walkCard?.weather_preset || 'Unknown',
        temperature: walkCard?.weather_temp_c
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  static calculateGeoAreaAnalysis(
    walkEntries: WalkEntry[],
    venues: Venue[],
    geoAreas: GeoArea[],
    walkCards: WalkCard[]
  ): GeoAreaAnalysis[] {
    const venueMap = new Map(venues.map(v => [v.id, v]));
    const walkCardMap = new Map(walkCards.map(wc => [wc.id, wc]));
    
    const geoStats = new Map<string, {
      totalPeople: number;
      visitCount: number;
      venueIds: Set<string>;
      timeBlockPeople: Map<string, number>;
    }>();

    walkEntries.forEach(entry => {
      const venue = venueMap.get(entry.venue_id);
      if (!venue) return;

      const geoAreaId = venue.geo_area_id;
      if (!geoStats.has(geoAreaId)) {
        geoStats.set(geoAreaId, {
          totalPeople: 0,
          visitCount: 0,
          venueIds: new Set(),
          timeBlockPeople: new Map()
        });
      }

      const stats = geoStats.get(geoAreaId)!;
      stats.totalPeople += entry.people_count;
      stats.visitCount++;
      stats.venueIds.add(entry.venue_id);

      // Track time blocks for peak analysis
      const walkCard = walkCardMap.get(entry.walk_card_id);
      if (walkCard) {
        const current = stats.timeBlockPeople.get(walkCard.time_block) || 0;
        stats.timeBlockPeople.set(walkCard.time_block, current + entry.people_count);
      }
    });

    const analyses: GeoAreaAnalysis[] = [];
    geoStats.forEach((stats, geoAreaId) => {
      const geoArea = geoAreas.find(g => g.id === geoAreaId);
      if (!geoArea) return;

      // Find peak time block
      let peakTimeBlock = 'Unknown';
      let maxPeople = 0;
      stats.timeBlockPeople.forEach((people, timeBlock) => {
        if (people > maxPeople) {
          maxPeople = people;
          peakTimeBlock = timeBlock;
        }
      });

      // Calculate average capacity utilization for this geo area
      const entriesForGeoArea = walkEntries.filter(entry => {
        const venue = venueMap.get(entry.venue_id);
        return venue && venue.geo_area_id === geoAreaId;
      });
      
      const capacityPercentages = entriesForGeoArea
        .map(e => e.capacity_percentage)
        .filter(cp => cp !== null && cp !== undefined) as number[];
      
      const averageCapacityUtilization = capacityPercentages.length > 0 
        ? capacityPercentages.reduce((sum, cp) => sum + cp, 0) / capacityPercentages.length
        : 0;

      analyses.push({
        geoAreaId,
        geoAreaName: geoArea.name,
        totalPeople: stats.totalPeople,
        averagePeople: Math.round((stats.totalPeople / stats.visitCount) * 10) / 10,
        venueCount: stats.venueIds.size,
        visitCount: stats.visitCount,
        occupancyRate: Math.round(((stats.totalPeople / stats.visitCount) / 50) * 100 * 10) / 10,
        averageCapacityUtilization: Math.round(averageCapacityUtilization * 10) / 10,
        peakTimeBlock,
        performanceRank: 0 // Will be set after sorting
      });
    });

    // Sort by total people and assign ranks
    analyses.sort((a, b) => b.totalPeople - a.totalPeople);
    analyses.forEach((analysis, index) => {
      analysis.performanceRank = index + 1;
    });

    return analyses;
  }

  static calculateDayOfWeekAnalysis(
    walkEntries: WalkEntry[],
    walkCards: WalkCard[],
    venues: Venue[],
    geoAreaFilter?: string
  ): DayOfWeekAnalysis[] {
    const walkCardMap = new Map(walkCards.map(wc => [wc.id, wc]));
    const venueMap = new Map(venues.map(v => [v.id, v]));
    
    const dayStats = new Map<number, {
      totalPeople: number;
      visitCount: number;
      venueIds: Set<string>;
      walkIds: Set<string>;
      capacityPercentages: number[];
    }>();

    // Filter entries by geo area if specified
    const filteredEntries = geoAreaFilter 
      ? walkEntries.filter(entry => {
          const venue = venueMap.get(entry.venue_id);
          return venue && venue.geo_area_id === geoAreaFilter;
        })
      : walkEntries;

    filteredEntries.forEach(entry => {
      const walkCard = walkCardMap.get(entry.walk_card_id);
      if (!walkCard) return;

      const date = new Date(walkCard.date);
      const dayOfWeek = date.getDay();

      if (!dayStats.has(dayOfWeek)) {
        dayStats.set(dayOfWeek, {
          totalPeople: 0,
          visitCount: 0,
          venueIds: new Set(),
          walkIds: new Set(),
          capacityPercentages: []
        });
      }

      const stats = dayStats.get(dayOfWeek)!;
      stats.totalPeople += entry.people_count;
      stats.visitCount++;
      stats.venueIds.add(entry.venue_id);
      stats.walkIds.add(entry.walk_card_id);
      
      if (entry.capacity_percentage !== null && entry.capacity_percentage !== undefined) {
        stats.capacityPercentages.push(entry.capacity_percentage);
      }
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return Array.from(dayStats.entries()).map(([dayOfWeek, stats]) => {
      const averageCapacityUtilization = stats.capacityPercentages.length > 0
        ? stats.capacityPercentages.reduce((sum, cp) => sum + cp, 0) / stats.capacityPercentages.length
        : 0;

      const averageOccupancy = stats.visitCount > 0 ? stats.totalPeople / stats.visitCount : 0;

      return {
        dayOfWeek,
        dayName: dayNames[dayOfWeek],
        averageOccupancy: Math.round(averageOccupancy * 10) / 10,
        averageCapacityUtilization: Math.round(averageCapacityUtilization * 10) / 10,
        totalPeople: stats.totalPeople,
        totalVisits: stats.visitCount,
        venueCount: stats.venueIds.size,
        walkCount: stats.walkIds.size
      };
    }).sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  }

  static calculateEnhancedTimeBlockAnalysis(
    walkEntries: WalkEntry[],
    walkCards: WalkCard[],
    venues: Venue[],
    geoAreaFilter?: string
  ): EnhancedTimeBlockAnalysis[] {
    const walkCardMap = new Map(walkCards.map(wc => [wc.id, wc]));
    const venueMap = new Map(venues.map(v => [v.id, v]));
    const geoAreaMap = new Map(venues.map(v => [v.geo_area_id, v.geo_area_id]));
    
    // Filter entries by geo area if specified
    const filteredEntries = geoAreaFilter 
      ? walkEntries.filter(entry => {
          const venue = venueMap.get(entry.venue_id);
          return venue && venue.geo_area_id === geoAreaFilter;
        })
      : walkEntries;

    const timeBlockStats = new Map<string, {
      totalPeople: number;
      venueIds: Set<string>;
      walkIds: Set<string>;
      entryCount: number;
      capacityPercentages: number[];
    }>();

    filteredEntries.forEach(entry => {
      const walkCard = walkCardMap.get(entry.walk_card_id);
      if (!walkCard) return;

      const timeBlock = walkCard.time_block;
      if (!timeBlockStats.has(timeBlock)) {
        timeBlockStats.set(timeBlock, {
          totalPeople: 0,
          venueIds: new Set(),
          walkIds: new Set(),
          entryCount: 0,
          capacityPercentages: []
        });
      }

      const stats = timeBlockStats.get(timeBlock)!;
      stats.totalPeople += entry.people_count;
      stats.venueIds.add(entry.venue_id);
      stats.walkIds.add(entry.walk_card_id);
      stats.entryCount++;
      
      if (entry.capacity_percentage !== null && entry.capacity_percentage !== undefined) {
        stats.capacityPercentages.push(entry.capacity_percentage);
      }
    });

    // Get geo area name if filtering
    let geoAreaName: string | undefined;
    if (geoAreaFilter) {
      const venue = venues.find(v => v.geo_area_id === geoAreaFilter);
      // We'd need to get the actual geo area name from geoAreas array
      geoAreaName = geoAreaFilter; // Placeholder - would need geoAreas parameter
    }

    return Array.from(timeBlockStats.entries()).map(([timeBlock, stats]) => {
      const averageCapacityUtilization = stats.capacityPercentages.length > 0 
        ? stats.capacityPercentages.reduce((sum, cp) => sum + cp, 0) / stats.capacityPercentages.length
        : 0;

      return {
        timeBlock,
        totalPeople: stats.totalPeople,
        averagePeople: Math.round((stats.totalPeople / stats.entryCount) * 10) / 10,
        venueCount: stats.venueIds.size,
        walkCount: stats.walkIds.size,
        occupancyRate: Math.round(((stats.totalPeople / stats.entryCount) / 50) * 100 * 10) / 10,
        averageCapacityUtilization: Math.round(averageCapacityUtilization * 10) / 10,
        geoAreaId: geoAreaFilter,
        geoAreaName
      };
    }).sort((a, b) => b.totalPeople - a.totalPeople);
  }
}