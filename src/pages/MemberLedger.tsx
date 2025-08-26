import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Receipt, Calendar } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useCMSMode } from '@/contexts/CMSModeContext';
import { useMemberLedger } from '@/hooks/useMemberData';
import { format } from 'date-fns';

const MemberLedger: React.FC = () => {
  const { isCMSMode } = useCMSMode();
  const { ledgerEntries, loading, error } = useMemberLedger();

  return (
    <div className="min-h-screen bg-background">
      {isCMSMode && <Navigation />}
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link 
            to="/common-room/member" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Member Home
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Member Ledger</h1>
          <p className="text-muted-foreground">Track your spending and receipts</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading your transaction history...</p>
            ) : error ? (
              <p className="text-red-500">Error loading transactions: {error}</p>
            ) : ledgerEntries.length === 0 ? (
              <p className="text-muted-foreground">No transactions yet. Upload a receipt to get started!</p>
            ) : (
              <div className="space-y-4">
                {ledgerEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {entry.activity_type === 'receipt' ? (
                        <Receipt className="h-5 w-5 text-primary" />
                      ) : (
                        <Calendar className="h-5 w-5 text-primary" />
                      )}
                      <div>
                        <p className="font-medium">{entry.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(entry.activity_date), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>
                    {entry.amount && (
                      <div className="text-right">
                        <p className="font-semibold">
                          £{entry.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {entry.currency || 'GBP'}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isCMSMode && <Footer />}
    </div>
  );
};

export default MemberLedger;