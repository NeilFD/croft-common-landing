import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';
import { Users, Target, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { AdvancedFilters } from '@/components/analytics/AdvancedFilters';
import { EnhancedAnalyticsStats } from '@/components/analytics/EnhancedAnalyticsStats';
import { MemberAnalyticsTable, EnhancedMemberAnalytics } from '@/components/analytics/MemberAnalyticsTable';

interface AdvancedFilters {
  dateStart?: Date;
  dateEnd?: Date;
  minAge?: number;
  maxAge?: number;
  interests: string[];
  venueAreas: string[];
  minSpend?: number;
  maxSpend?: number;
  tierBadges: string[];
  searchTerm: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface MemberSegment {
  segment_name: string;
  segment_description: string;
  member_count: number;
  avg_spend: number;
  criteria: any;
}

const EnhancedAdminMemberAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<EnhancedMemberAnalytics[]>([]);
  const [filteredAnalytics, setFilteredAnalytics] = useState<EnhancedMemberAnalytics[]>([]);
  const [segments, setSegments] = useState<MemberSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const [filters, setFilters] = useState<AdvancedFilters>({
    interests: [],
    venueAreas: [],
    tierBadges: [],
    searchTerm: '',
    sortBy: 'total_spend',
    sortOrder: 'desc'
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    applyClientSideFilters();
  }, [analytics, filters.searchTerm, filters.sortBy, filters.sortOrder]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      console.log('Starting enhanced member analytics fetch...');
      
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        console.error('No session found');
        toast.error('Authentication required');
        return;
      }

      console.log('Calling advanced-analytics function with filters:', filters);
      const { data, error } = await supabase.functions.invoke('advanced-analytics', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: {
          dateStart: filters.dateStart?.toISOString(),
          dateEnd: filters.dateEnd?.toISOString(),
          minAge: filters.minAge,
          maxAge: filters.maxAge,
          interests: filters.interests.length > 0 ? filters.interests : undefined,
          venueAreas: filters.venueAreas.length > 0 ? filters.venueAreas : undefined,
          minSpend: filters.minSpend,
          maxSpend: filters.maxSpend,
          tierBadges: filters.tierBadges.length > 0 ? filters.tierBadges : undefined
        }
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Function error details:', error);
        throw new Error(`Function error: ${error.message || JSON.stringify(error)}`);
      }
      
      console.log('Enhanced analytics data received:', data?.analytics?.length || 0, 'members');
      setAnalytics(data?.analytics || []);
      setSegments(data?.segments || []);
    } catch (error) {
      console.error('Error fetching enhanced analytics:', error);
      toast.error('Failed to load enhanced member analytics');
    } finally {
      setLoading(false);
    }
  };

  const applyClientSideFilters = () => {
    let filtered = [...analytics];

    // Search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(member =>
        member.display_name?.toLowerCase().includes(term) ||
        member.first_name?.toLowerCase().includes(term) ||
        member.last_name?.toLowerCase().includes(term)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[filters.sortBy as keyof EnhancedMemberAnalytics];
      const bVal = b[filters.sortBy as keyof EnhancedMemberAnalytics];
      
      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredAnalytics(filtered);
  };

  const handleFiltersChange = (newFilters: AdvancedFilters) => {
    setFilters(newFilters);
    // Only refetch if server-side filters changed
    if (
      newFilters.dateStart !== filters.dateStart ||
      newFilters.dateEnd !== filters.dateEnd ||
      newFilters.minAge !== filters.minAge ||
      newFilters.maxAge !== filters.maxAge ||
      JSON.stringify(newFilters.interests) !== JSON.stringify(filters.interests) ||
      JSON.stringify(newFilters.venueAreas) !== JSON.stringify(filters.venueAreas) ||
      newFilters.minSpend !== filters.minSpend ||
      newFilters.maxSpend !== filters.maxSpend ||
      JSON.stringify(newFilters.tierBadges) !== JSON.stringify(filters.tierBadges)
    ) {
      setTimeout(fetchAnalytics, 500); // Debounce
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Name', 'Age', 'Total Spend', 'LTV', 'Transactions', 'Risk Score', 
      'Visit Frequency', 'Tier', 'Active Days', 'Last Visit',
      'Interests', 'Favorite Venues', 'Categories', 'Payment Methods'
    ];

    const rows = filteredAnalytics.map(member => [
      member.display_name || `${member.first_name} ${member.last_name}`,
      member.age || 'N/A',
      member.total_spend.toFixed(2),
      member.lifetime_value.toFixed(0),
      member.total_transactions,
      member.retention_risk_score,
      member.visit_frequency.toFixed(1),
      member.tier_badge,
      member.active_days,
      member.last_visit_date || 'N/A',
      member.interests?.join('; ') || '',
      member.favorite_venues?.join('; ') || '',
      member.categories?.join('; ') || '',
      member.payment_methods?.join('; ') || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enhanced-member-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearFilters = () => {
    setFilters({
      interests: [],
      venueAreas: [],
      tierBadges: [],
      searchTerm: '',
      sortBy: 'total_spend',
      sortOrder: 'desc'
    });
  };

  const handleViewMember = (memberId: string) => {
    // TODO: Open member deep-dive modal or navigate to member detail page
    setSelectedMember(memberId);
    toast.info(`Opening deep-dive for member ${memberId}`, {
      description: 'Individual member profiles coming in Phase 2'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Enhanced Member Analytics | Admin</title>
        <meta name="description" content="Advanced member intelligence platform with demographic filtering, behavioral insights, and predictive analytics" />
      </Helmet>

      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <Card className="border-2 border-black shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-brutalist flex items-center gap-3">
                <BarChart3 className="h-8 w-8" />
                Enhanced Member Intelligence Platform
              </CardTitle>
              <p className="text-muted-foreground">
                Advanced analytics with demographic filters, behavioral insights, risk scoring, and lifetime value predictions
              </p>
            </CardHeader>
          </Card>

          {/* Member Segments Overview */}
          {segments.length > 0 && (
            <Card className="border-2 border-black">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Member Segments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {segments.map((segment) => (
                    <Card key={segment.segment_name} className="border border-muted">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{segment.segment_name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-2xl font-bold">{segment.member_count}</div>
                          <div className="text-xs text-muted-foreground">{segment.segment_description}</div>
                          <div className="text-sm">Avg Spend: £{segment.avg_spend.toFixed(0)}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Stats */}
          <EnhancedAnalyticsStats members={filteredAnalytics} isLoading={loading} />

          {/* Advanced Filters */}
          <AdvancedFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onExport={exportToCSV}
            onClearFilters={handleClearFilters}
            isLoading={loading}
          />

          {/* Enhanced Analytics Table */}
          <MemberAnalyticsTable
            members={filteredAnalytics}
            onViewMember={handleViewMember}
            isLoading={loading}
          />
        </div>
      </div>
    </>
  );
};

export default EnhancedAdminMemberAnalytics;