import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Receipt, Calendar, TrendingUp } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useCMSMode } from '@/contexts/CMSModeContext';
import { useMemberLedger } from '@/hooks/useMemberData';
import { useReceiptAnalysis } from '@/hooks/useReceiptAnalysis';
import { format } from 'date-fns';
import DateRangeFilter from '@/components/DateRangeFilter';
import ReceiptDetailModal from '@/components/ReceiptDetailModal';
import SpendingAnalysisTable from '@/components/SpendingAnalysisTable';

const MemberLedger: React.FC = () => {
  const { isCMSMode } = useCMSMode();
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  
  console.log('MemberLedger: Component mounted, dateRange:', dateRange);
  
  const { ledgerEntries, loading, error } = useMemberLedger(dateRange);
  const { analysisData, loading: analysisLoading } = useReceiptAnalysis(dateRange);

  console.log('MemberLedger: ledgerEntries:', ledgerEntries, 'loading:', loading, 'error:', error);

  const handleReceiptClick = (entry: any) => {
    console.log('Receipt clicked:', entry);
    if (entry.activity_type === 'receipt' && entry.receipt) {
      setSelectedReceipt({
        receipt: entry.receipt,
        date: entry.activity_date
      });
      setReceiptModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 mt-8">
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
          <p className="text-muted-foreground">Track your spending, receipts, and analyze your habits</p>
        </div>

        <div className="mb-6">
          <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
        </div>

        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="transactions">Transaction History</TabsTrigger>
            <TabsTrigger value="analysis">Table of Danger</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Click on receipt entries to view details
                </p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground">Loading your transaction history...</p>
                ) : error ? (
                  <p className="text-red-500">Error loading transactions: {error}</p>
                ) : ledgerEntries.length === 0 ? (
                  <p className="text-muted-foreground">No transactions found for the selected period.</p>
                ) : (
                  <div className="space-y-4">
                    {ledgerEntries.map((entry) => (
                      <div 
                        key={entry.id} 
                        className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                          entry.activity_type === 'receipt' && entry.receipt
                            ? 'cursor-pointer hover:bg-muted/50' 
                            : ''
                        }`}
                        onClick={() => handleReceiptClick(entry)}
                      >
                        <div className="flex items-center gap-3">
                          {entry.activity_type === 'receipt' ? (
                            <Receipt className="h-5 w-5 text-primary" />
                          ) : (
                            <Calendar className="h-5 w-5 text-primary" />
                          )}
                          <div>
                            <p className="font-medium">{entry.description}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{format(new Date(entry.activity_date), 'dd MMM yyyy')}</span>
                              {entry.receipt?.venue_location && (
                                <>
                                  <span>•</span>
                                  <span>{entry.receipt.venue_location}</span>
                                </>
                              )}
                              {entry.activity_type === 'receipt' && entry.receipt && (
                                <>
                                  <span>•</span>
                                  <span className="text-primary">Click to view</span>
                                </>
                              )}
                            </div>
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
          </TabsContent>

          <TabsContent value="analysis">
            <SpendingAnalysisTable data={analysisData} loading={analysisLoading} />
          </TabsContent>
        </Tabs>

        <ReceiptDetailModal
          isOpen={receiptModalOpen}
          onClose={() => setReceiptModalOpen(false)}
          receipt={selectedReceipt?.receipt || null}
          receiptDate={selectedReceipt?.date || ''}
        />
      </div>

      <Footer />
    </div>
  );
};

export default MemberLedger;