import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Calendar, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useCMSMode } from '@/contexts/CMSModeContext';

interface LedgerEntry {
  id: string;
  activity_type: string;
  activity_date: string;
  amount?: number;
  currency?: string;
  description: string;
  metadata?: any;
}

const MemberLedger: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isCMSMode } = useCMSMode();
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/common-room/main');
      return;
    }

    if (user) {
      fetchLedgerEntries();
    }
  }, [user, loading, navigate]);

  const fetchLedgerEntries = async () => {
    try {
      setLoadingLedger(true);
      const { data, error } = await supabase
        .from('member_ledger')
        .select('*')
        .eq('user_id', user?.id)
        .order('activity_date', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      setLedgerEntries(data || []);
    } catch (error) {
      console.error('Error fetching ledger:', error);
      toast({
        title: "Error",
        description: "Failed to load ledger entries",
        variant: "destructive"
      });
    } finally {
      setLoadingLedger(false);
    }
  };

  if (loading || loadingLedger) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {isCMSMode && <Navigation />}
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            to="/common-room/member" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Member Home
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-2">
            <FileText className="h-8 w-8" />
            My Ledger
          </h1>
          <p className="text-muted-foreground">
            Track your visits, spending, and activity history
          </p>
        </div>

        {/* Ledger Entries */}
        <div className="space-y-4">
          {ledgerEntries.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No ledger entries yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your check-ins and receipts will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            ledgerEntries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        entry.activity_type === 'check_in' 
                          ? 'bg-green-100 text-green-600' 
                          : entry.activity_type === 'receipt'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {entry.activity_type === 'check_in' ? (
                          <Calendar className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{entry.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(entry.activity_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {entry.amount && (
                      <div className="text-right">
                        <p className="font-semibold text-primary">
                          {entry.currency}£{entry.amount.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {isCMSMode && <Footer />}
    </div>
  );
};

export default MemberLedger;