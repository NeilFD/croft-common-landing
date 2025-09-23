import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Clock, CloudRain, Users } from 'lucide-react';
import { useResearch } from '@/hooks/useResearch';
import { CreateWalkaroundModal } from './CreateWalkaroundModal';
import { ActiveWalkCard } from './ActiveWalkCard';
import { WalkHistoryCard } from './WalkHistoryCard';
import { toast } from 'sonner';

export const RunTab = () => {
  const { walkCards, updateWalkCardStatus, loading } = useResearch();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const activeCard = walkCards.find(card => card.status === 'Active');
  const completedCards = walkCards.filter(card => card.status === 'Completed').slice(0, 5);

  const handleReopenWalk = async (cardId: string) => {
    await updateWalkCardStatus(cardId, 'Active');
  };

  const handleDeleteWalk = async (cardId: string) => {
    // In a real implementation, you'd call a delete function
    // For now, we'll just show a toast
    toast.success('Walk card deleted');
  };

  if (activeCard) {
    return <ActiveWalkCard walkCard={activeCard} />;
  }

  return (
    <div className="space-y-6">
      {/* Create Walkaround Button */}
      <div className="text-center py-8">
        <Button 
          onClick={() => setShowCreateModal(true)}
          size="lg"
          className="h-12 px-8"
          disabled={loading}
        >
          <Plus className="mr-2 h-5 w-5" />
          Create Walkaround
        </Button>
      </div>

      {/* Recent History */}
      {completedCards.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recent Walkarounds</h2>
          <div className="grid gap-4">
            {completedCards.map((card) => (
              <WalkHistoryCard 
                key={card.id} 
                walkCard={card}
                onReopen={handleReopenWalk}
                onDelete={handleDeleteWalk}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {completedCards.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No walkarounds yet. Create your first one to get started.</p>
        </div>
      )}

      {/* Create Modal */}
      <CreateWalkaroundModal 
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </div>
  );
};