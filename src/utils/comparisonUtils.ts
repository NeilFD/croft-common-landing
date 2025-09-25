export interface ComparisonResult {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  label: string;
}

export class ComparisonUtils {
  static compareValues(current: number, previous: number, label: string): ComparisonResult {
    const change = current - previous;
    const changePercent = previous !== 0 ? (change / previous) * 100 : 0;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(changePercent) < 5) {
      trend = 'stable';
    } else if (changePercent > 0) {
      trend = 'up';
    } else {
      trend = 'down';
    }

    return {
      current,
      previous,
      change,
      changePercent: Math.round(changePercent * 10) / 10,
      trend,
      label
    };
  }

  static calculateWeekOverWeek<T>(
    data: T[],
    dateSelector: (item: T) => string,
    valueSelector: (items: T[]) => number
  ): ComparisonResult[] {
    // Group data by week
    const weekGroups = new Map<string, T[]>();
    
    data.forEach(item => {
      const date = new Date(dateSelector(item));
      const weekStart = this.getWeekStart(date);
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weekGroups.has(weekKey)) {
        weekGroups.set(weekKey, []);
      }
      weekGroups.get(weekKey)!.push(item);
    });

    // Calculate week values and comparisons
    const weekKeys = Array.from(weekGroups.keys()).sort();
    const comparisons: ComparisonResult[] = [];

    for (let i = 1; i < weekKeys.length; i++) {
      const currentWeek = weekGroups.get(weekKeys[i])!;
      const previousWeek = weekGroups.get(weekKeys[i - 1])!;
      
      const currentValue = valueSelector(currentWeek);
      const previousValue = valueSelector(previousWeek);
      
      comparisons.push(
        this.compareValues(
          currentValue, 
          previousValue, 
          `Week ${weekKeys[i]} vs Week ${weekKeys[i - 1]}`
        )
      );
    }

    return comparisons;
  }

  static calculateDayOverDay<T>(
    data: T[],
    dateSelector: (item: T) => string,
    valueSelector: (items: T[]) => number
  ): ComparisonResult[] {
    // Group data by day
    const dayGroups = new Map<string, T[]>();
    
    data.forEach(item => {
      const date = dateSelector(item);
      if (!dayGroups.has(date)) {
        dayGroups.set(date, []);
      }
      dayGroups.get(date)!.push(item);
    });

    // Calculate day values and comparisons
    const dates = Array.from(dayGroups.keys()).sort();
    const comparisons: ComparisonResult[] = [];

    for (let i = 1; i < dates.length; i++) {
      const currentDay = dayGroups.get(dates[i])!;
      const previousDay = dayGroups.get(dates[i - 1])!;
      
      const currentValue = valueSelector(currentDay);
      const previousValue = valueSelector(previousDay);
      
      comparisons.push(
        this.compareValues(
          currentValue, 
          previousValue, 
          `${dates[i]} vs ${dates[i - 1]}`
        )
      );
    }

    return comparisons;
  }

  private static getWeekStart(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday as week start
    return new Date(date.setDate(diff));
  }

  static formatTrend(comparison: ComparisonResult): string {
    if (comparison.trend === 'stable') {
      return 'No significant change';
    }
    
    const direction = comparison.trend === 'up' ? '↗' : '↘';
    const sign = comparison.change > 0 ? '+' : '';
    
    return `${direction} ${sign}${comparison.change} (${sign}${comparison.changePercent}%)`;
  }

  static getTrendColor(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
        return 'text-muted-foreground';
    }
  }

  static calculateAnomalyScore(
    current: number,
    historicalAverage: number,
    historicalStdDev: number
  ): { score: number; level: 'normal' | 'mild' | 'moderate' | 'severe' } {
    if (historicalStdDev === 0) {
      return { score: 0, level: 'normal' };
    }

    const score = Math.abs(current - historicalAverage) / historicalStdDev;
    
    if (score < 1) return { score, level: 'normal' };
    if (score < 2) return { score, level: 'mild' };
    if (score < 3) return { score, level: 'moderate' };
    return { score, level: 'severe' };
  }
}