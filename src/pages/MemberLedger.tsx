import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useCMSMode } from '@/contexts/CMSModeContext';
import { useMemberLedger } from '@/hooks/useMemberData';
import { useReceiptAnalysis } from '@/hooks/useReceiptAnalysis';
import { format } from 'date-fns';
import DateRangeFilter from '@/components/DateRangeFilter';
import ReceiptDetailModal from '@/components/ReceiptDetailModal';
import SpendingAnalysisTable from '@/components/SpendingAnalysisTable';
import { MobileErrorBoundary } from '@/components/MobileErrorBoundary';
import denBg from '@/assets/den-bg-neon.jpg';

const chipBase =
  'inline-flex items-center justify-center border border-white/40 text-white px-5 py-2.5 font-mono text-[10px] tracking-[0.4em] uppercase hover:bg-white hover:text-black transition-colors touch-manipulation';

const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="font-mono text-[10px] tracking-[0.5em] uppercase text-white/60 mb-4 text-center">
    {children}
  </p>
);

const Hairline: React.FC = () => (
  <div className="w-full flex justify-center my-12">
    <div className="h-px w-16 bg-white/25" />
  </div>
);

type TabKey = 'transactions' | 'analysis';

const MemberLedger: React.FC = () => {
  const { isCMSMode } = useCMSMode();
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>('transactions');

  const { ledgerEntries, loading, error } = useMemberLedger(dateRange);
  const { analysisData, loading: analysisLoading } = useReceiptAnalysis(dateRange);

  const handleReceiptClick = (entry: any) => {
    if (entry.activity_type === 'receipt' && entry.receipt) {
      setSelectedReceipt({ receipt: entry.receipt, date: entry.activity_date });
      setReceiptModalOpen(true);
    }
  };

  const tabBtn = (key: TabKey, label: string) => (
    <button
      onClick={() => setTab(key)}
      className={`px-5 py-2.5 font-mono text-[10px] tracking-[0.4em] uppercase border transition-colors ${
        tab === key
          ? 'bg-white text-black border-white'
          : 'border-white/30 text-white/70 hover:border-white hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <MobileErrorBoundary>
      <div
        className="min-h-screen relative overflow-y-auto"
        style={{
          touchAction: 'pan-y pinch-zoom',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
          style={{ backgroundImage: `url(${denBg})`, filter: 'contrast(1.05)' }}
        />
        <div className="fixed inset-0 bg-black/75 -z-10" />

        <div className="relative z-10 text-white">
          {!isCMSMode && <Navigation />}

          <div
            className="container mx-auto px-6 pb-20 max-w-5xl"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 140px)' }}
          >
            {/* Breadcrumb */}
            <div className="mb-10">
              <Link
                to="/den/member"
                className="inline-flex items-center font-mono text-[10px] tracking-[0.4em] uppercase text-white/60 hover:text-white transition-colors"
              >
                ← Back to Member Home
              </Link>
            </div>

            {/* Header */}
            <div className="text-center mb-12">
              <p className="font-mono text-[10px] md:text-xs tracking-[0.5em] uppercase text-white/70 mb-6">
                Ledger
              </p>
              <h1 className="font-display uppercase text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[0.9] mb-6">
                Member Ledger
              </h1>
              <p className="font-sans text-base md:text-lg text-white/80 max-w-md mx-auto leading-relaxed">
                Spend. Receipts. Habits. The bear keeps count.
              </p>
            </div>

            {/* Date filter */}
            <Eyebrow>Filter</Eyebrow>
            <div className="border border-white/15 bg-black/40 backdrop-blur-sm p-4 md:p-6 mb-8">
              <div className="bg-white text-black p-4 rounded">
                <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {tabBtn('transactions', 'Transactions')}
              {tabBtn('analysis', 'Table of Danger')}
            </div>

            {tab === 'transactions' ? (
              <div className="border border-white/15 bg-black/40 backdrop-blur-sm p-6 md:p-8">
                <div className="mb-6 text-center">
                  <h2 className="font-display uppercase text-2xl md:text-3xl tracking-tight mb-2">
                    Transaction History
                  </h2>
                  <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/50">
                    Tap a receipt to view details
                  </p>
                </div>

                {loading ? (
                  <p className="text-center font-mono text-[10px] tracking-[0.4em] uppercase text-white/60 py-8">
                    Loading
                  </p>
                ) : error ? (
                  <p className="text-center font-sans text-white/70 py-8">
                    Couldn't load transactions. Try again shortly.
                  </p>
                ) : ledgerEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="font-sans text-white/70 mb-6">
                      No transactions yet for this period.
                    </p>
                    <Link to="/den/member" className={chipBase}>Upload a receipt</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ledgerEntries.map((entry) => {
                      const clickable = entry.activity_type === 'receipt' && entry.receipt;
                      return (
                        <div
                          key={entry.id}
                          onClick={() => handleReceiptClick(entry)}
                          className={`flex items-center justify-between gap-4 p-4 border border-white/15 bg-black/30 transition-colors ${
                            clickable ? 'cursor-pointer hover:bg-white/10 hover:border-white/40' : ''
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="font-sans text-white truncate">{entry.description}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1 font-mono text-[9px] tracking-[0.3em] uppercase text-white/50">
                              <span>{format(new Date(entry.activity_date), 'dd MMM yyyy')}</span>
                              {entry.receipt?.venue_location && (
                                <>
                                  <span>·</span>
                                  <span>{entry.receipt.venue_location}</span>
                                </>
                              )}
                              {clickable && (
                                <>
                                  <span>·</span>
                                  <span className="text-white">View</span>
                                </>
                              )}
                            </div>
                          </div>
                          {entry.amount != null && (
                            <div className="text-right shrink-0">
                              <p className="font-display text-xl md:text-2xl tracking-tight">
                                £{entry.amount.toFixed(2)}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-white/15 bg-black/40 backdrop-blur-sm p-4 md:p-6">
                <div className="bg-white text-black p-4 rounded">
                  <SpendingAnalysisTable data={analysisData} loading={analysisLoading} />
                </div>
              </div>
            )}

            <Hairline />
          </div>

          <ReceiptDetailModal
            isOpen={receiptModalOpen}
            onClose={() => setReceiptModalOpen(false)}
            receipt={selectedReceipt?.receipt || null}
            receiptDate={selectedReceipt?.date || ''}
          />

          <Footer />
        </div>
      </div>
    </MobileErrorBoundary>
  );
};

export default MemberLedger;
