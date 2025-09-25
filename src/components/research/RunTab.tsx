import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Clock, CloudRain, Users } from 'lucide-react';
import { useResearch } from '@/hooks/useResearch';
import { CreateWalkaroundModal } from './CreateWalkaroundModal';
import { ActiveWalkCard } from './ActiveWalkCard';
import { WalkHistoryCard } from './WalkHistoryCard';
import { DraftWalkCard } from './DraftWalkCard';
import { GeoAreaManager } from './GeoAreaManager';
import { toast } from 'sonner';

export const RunTab = () => {
  const { walkCards, updateWalkCardStatus, loading } = useResearch();
  const [managingAreasForCard, setManagingAreasForCard] = useState<string | null>(null);
  

  const activeCard = walkCards.find(card => card.status === 'Active');
  const draftCards = walkCards.filter(card => card.status === 'Draft');

  const handleReopenWalk = async (cardId: string) => {
    await updateWalkCardStatus(cardId, 'Active');
  };

  const handleStartWalk = async (cardId: string) => {
    await updateWalkCardStatus(cardId, 'Active');
  };

  const handleManageAreas = (cardId: string) => {
    setManagingAreasForCard(cardId);
  };

  const handleCloseAreaManager = () => {
    setManagingAreasForCard(null);
  };

  const handleDeleteWalk = async (cardId: string) => {
    // In a real implementation, you'd call a delete function
    // For now, we'll just show a toast
    toast.success('Walk card deleted');
  };

  if (activeCard) {
    return <ActiveWalkCard walkCard={activeCard} />;
  }

  // Show geo area manager for draft card if managing areas
  if (managingAreasForCard) {
    return (
      <div className="space-y-6">
        <GeoAreaManager 
          walkCardId={managingAreasForCard}
          onClose={handleCloseAreaManager}
          onUpdate={handleCloseAreaManager}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Draft Cards - Ready to Start */}
      {draftCards.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Ready to Start</h2>
            <CreateWalkaroundModal
              trigger={
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New
                </Button>
              }
            />
          </div>
          <div className="grid gap-4">
            {draftCards.map((card) => (
              <DraftWalkCard 
                key={card.id} 
                walkCard={card}
                onStartWalk={handleStartWalk}
                onManageAreas={handleManageAreas}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create New Button - Only shown when no drafts */}
      {draftCards.length === 0 && (
        <div className="text-center py-8">
          <CreateWalkaroundModal
            trigger={
              <Button size="lg" className="h-12 px-8">
                <Plus className="mr-2 h-5 w-5" />
                Create Walkaround
              </Button>
            }
          />
        </div>
      )}

      {/* Empty State */}
      {draftCards.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No walkarounds yet. Create your first one to get started.</p>
        </div>
      )}

    </div>
  );
};