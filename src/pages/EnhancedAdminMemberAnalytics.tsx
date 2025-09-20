import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';
import { Users, Target, BarChart3, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { AdvancedFilters } from '@/components/analytics/AdvancedFilters';
import { EnhancedAnalyticsStats } from '@/components/analytics/EnhancedAnalyticsStats';
import { MemberAnalyticsTable, EnhancedMemberAnalytics } from '@/components/analytics/MemberAnalyticsTable';
import { MemberDeepDiveModal, MemberDeepDiveData } from '@/components/analytics/MemberDeepDiveModal';
import CampaignManager from '@/components/analytics/CampaignManager';

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
  const [memberDeepDive, setMemberDeepDive] = useState<MemberDeepDiveData | null>(null);
  const [deepDiveLoading, setDeepDiveLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics');

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

      const noServerFilters = !filters.dateStart && !filters.dateEnd &&
        !filters.minAge && !filters.maxAge &&
        filters.interests.length === 0 && filters.venueAreas.length === 0 &&
        !filters.minSpend && !filters.maxSpend &&
        filters.tierBadges.length === 0;

      const mapBasicToEnhanced = (rows: any[]): EnhancedMemberAnalytics[] => {
        return (rows || []).map((b: any) => ({
          user_id: b.user_id,
          first_name: b.first_name,
          last_name: b.last_name,
          display_name: b.display_name,
          age: undefined,
          interests: [],
          tier_badge: 'bronze',
          total_transactions: Number(b.total_transactions || 0),
          total_spend: Number(b.total_spend || 0),
          avg_transaction: Number(b.avg_transaction || 0),
          first_transaction_date: b.first_transaction_date,
          last_transaction_date: b.last_transaction_date,
          active_months: Number(b.active_months || 0),
          active_days: Number(b.active_days || 0),
          categories: b.categories || [],
          payment_methods: b.payment_methods || [],
          currency: b.currency || 'GBP',
          current_month_spend: Number(b.current_month_spend || 0),
          current_week_spend: Number(b.current_week_spend || 0),
          current_month_transactions: Number(b.current_month_transactions || 0),
          favorite_venues: [],
          visit_frequency: 0,
          last_visit_date: b.last_transaction_date,
          preferred_visit_times: [],
          retention_risk_score: 0,
          lifetime_value: Number(b.total_spend || 0),
        }));
      };

      const fallbackToBasic = async (): Promise<EnhancedMemberAnalytics[]> => {
        // Try member-analytics Edge Function first (admin-scoped)
        try {
          const { data: basicFn, error: basicFnError } = await supabase.functions.invoke('member-analytics', {
            headers: {
              Authorization: `Bearer ${session.session.access_token}`,
              'Content-Type': 'application/json'
            }
          });
          if (!basicFnError && Array.isArray(basicFn?.analytics) && basicFn.analytics.length > 0) {
            console.warn('Using basic member-analytics edge function fallback');
            return mapBasicToEnhanced(basicFn.analytics);
          }
        } catch (e) {
          console.warn('member-analytics edge function fallback failed, trying direct RPC...', e);
        }
        // Then direct RPC as last resort
        const { data: basicRpc, error: basicRpcError } = await supabase.rpc('get_member_analytics');
        if (basicRpcError) {
          console.error('Basic RPC fallback error:', basicRpcError);
          return [];
        }
        return mapBasicToEnhanced(basicRpc || []);
      };

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

      let effectiveAnalytics: EnhancedMemberAnalytics[] | null = null;

      if (!error && Array.isArray(data?.analytics)) {
        if ((data.analytics as any[]).length > 0) {
          effectiveAnalytics = data.analytics as EnhancedMemberAnalytics[];
        } else if (noServerFilters) {
          console.warn('Advanced analytics returned 0 members with no filters; falling back to basic analytics.');
          effectiveAnalytics = await fallbackToBasic();
        } else {
          effectiveAnalytics = [];
        }
      } else {
        console.warn('Edge function failed or returned no data, falling back to direct RPC...', error);
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_advanced_member_analytics', {
          p_date_start: filters.dateStart ? filters.dateStart.toISOString().split('T')[0] : null,
          p_date_end: filters.dateEnd ? filters.dateEnd.toISOString().split('T')[0] : null,
          p_min_age: filters.minAge || null,
          p_max_age: filters.maxAge || null,
          p_interests: filters.interests.length ? filters.interests : null,
          p_interests_logic: 'match_any',
          p_venue_slugs: filters.venueAreas.length ? filters.venueAreas : null,
          p_venue_logic: 'match_any',
          p_min_spend: filters.minSpend || null,
          p_max_spend: filters.maxSpend || null,
          p_tier_badges: filters.tierBadges.length ? filters.tierBadges : null
        });

        if (rpcError) {
          console.error('RPC fallback error:', rpcError);
          throw new Error(rpcError.message);
        }
        if (Array.isArray(rpcData) && rpcData.length > 0) {
          effectiveAnalytics = (rpcData as any) as EnhancedMemberAnalytics[];
        } else if (noServerFilters) {
          console.warn('Advanced RPC returned 0 members with no filters; falling back to basic analytics.');
          effectiveAnalytics = await fallbackToBasic();
        } else {
          effectiveAnalytics = [];
        }
      }
      
      console.log('Enhanced analytics data received:', effectiveAnalytics?.length || 0, 'members');
      setAnalytics(effectiveAnalytics || []);
      setSegments((data as any)?.segments || []);
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
      (member.total_spend || 0).toFixed(2),
      (member.lifetime_value || 0).toFixed(0),
      member.total_transactions || 0,
      member.retention_risk_score || 0,
      (member.visit_frequency || 0).toFixed(1),
      member.tier_badge || '',
      member.active_days || 0,
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

  const handleViewMember = async (memberId: string) => {
    setSelectedMember(memberId);
    setDeepDiveLoading(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error('Authentication required');
        return;
      }

      console.log('Fetching deep-dive data for member:', memberId);
      const { data, error } = await supabase.functions.invoke('member-deep-dive', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: { memberId }
      });

      if (error) {
        console.error('Deep-dive fetch error:', error);
        throw error;
      }

      setMemberDeepDive(data);
    } catch (error) {
      console.error('Error fetching member deep-dive:', error);
      toast.error('Failed to load member details');
    } finally {
      setDeepDiveLoading(false);
    }
  };

  const handleSendCampaign = async (campaign: any) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error('Authentication required');
        return;
      }

      console.log('Sending campaign:', campaign);
      const { data, error } = await supabase.functions.invoke('campaign-manager', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: campaign
      });

      if (error) {
        console.error('Campaign send error:', error);
        throw error;
      }

      toast.success(data.message);
      console.log('Campaign sent successfully:', data);
    } catch (error) {
      console.error('Error sending campaign:', error);
      throw error;
    }
  };

  const handleSendNotification = (memberId: string) => {
    // TODO: Implement individual member notification
    toast.info(`Sending notification to member ${memberId}`, {
      description: 'Individual notifications coming soon'
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
                Advanced analytics with demographic filters, behavioral insights, risk scoring, and campaign management
              </p>
            </CardHeader>
          </Card>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Member Analytics
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Campaign Manager
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="space-y-6">
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
                              <div className="text-sm">Avg Spend: £{(segment.avg_spend || 0).toFixed(0)}</div>
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
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-6">
              {/* Campaign Manager */}
              <CampaignManager
                segments={segments}
                isLoading={loading}
                onSendCampaign={handleSendCampaign}
              />
            </TabsContent>
          </Tabs>

          {/* Member Deep Dive Modal */}
          <MemberDeepDiveModal
            isOpen={!!selectedMember}
            onClose={() => {
              setSelectedMember(null);
              setMemberDeepDive(null);
            }}
            memberId={selectedMember}
            memberData={memberDeepDive}
            isLoading={deepDiveLoading}
            onSendNotification={handleSendNotification}
          />
        </div>
      </div>
    </>
  );
};

export default EnhancedAdminMemberAnalytics;