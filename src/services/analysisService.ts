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
  peakTimeBlock: string;
  performanceRank: number;
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
      const occupancyRate = Math.min((averagePeople / 50) * 100, 100); // Assume max capacity of 50
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

      // Calculate performance score (0-100)
      const performanceScore = Math.round(
        (averagePeople * 0.4 + 
         occupancyRate * 0.3 + 
         (stats.totalVisits * 2) * 0.2 + 
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

    return Array.from(timeBlockStats.entries()).map(([timeBlock, stats]) => ({
      timeBlock,
      totalPeople: stats.totalPeople,
      averagePeople: Math.round((stats.totalPeople / stats.entryCount) * 10) / 10,
      venueCount: stats.venueIds.size,
      walkCount: stats.walkIds.size,
      occupancyRate: Math.round(((stats.totalPeople / stats.entryCount) / 50) * 100 * 10) / 10
    })).sort((a, b) => b.totalPeople - a.totalPeople);
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

      analyses.push({
        geoAreaId,
        geoAreaName: geoArea.name,
        totalPeople: stats.totalPeople,
        averagePeople: Math.round((stats.totalPeople / stats.visitCount) * 10) / 10,
        venueCount: stats.venueIds.size,
        visitCount: stats.visitCount,
        occupancyRate: Math.round(((stats.totalPeople / stats.visitCount) / 50) * 100 * 10) / 10,
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
}