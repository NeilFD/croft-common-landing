import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface AnonymousNameModalProps {
  onSubmit: (name: string) => void;
  onCancel: () => void;
  score: number;
}

const AnonymousNameModal = ({ onSubmit, onCancel, score }: AnonymousNameModalProps) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    await onSubmit(name.trim());
    setIsSubmitting(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center touch-manipulation"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white text-black p-8 rounded-lg shadow-2xl border-4 border-black min-w-[400px] max-w-[90vw] touch-manipulation select-none"
           onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-mono tracking-wider mb-2">GAME OVER!</h2>
            <p className="text-lg font-mono">Final Score: {score}</p>
          </div>
          <Button
            onClick={onCancel}
            onTouchEnd={(e) => {
              e.preventDefault();
              onCancel();
            }}
            variant="ghost"
            size="sm"
            className="text-black hover:bg-black/10 touch-manipulation select-none"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="playerName" className="text-sm font-mono uppercase tracking-wider">
              Enter Your Name for New High Score
            </Label>
            <Input
              id="playerName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onTouchStart={(e) => {
                e.stopPropagation();
                // Force focus on iOS
                e.currentTarget.focus();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.currentTarget.focus();
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.currentTarget.focus();
              }}
              onFocus={(e) => {
                e.stopPropagation();
                console.log('Input focused on mobile');
              }}
              placeholder="Your name..."
              className="mt-2 font-mono touch-manipulation select-text min-h-[52px] text-base border-2 border-black focus:border-black focus:ring-2 focus:ring-black/20"
              maxLength={30}
              required
              autoFocus
              autoComplete="off"
              readOnly={false}
              style={{ 
                WebkitUserSelect: 'text',
                WebkitTouchCallout: 'default',
                WebkitTapHighlightColor: 'rgba(0,0,0,0.1)'
              }}
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                if (!name.trim() || isSubmitting) return;
                handleSubmit(e);
              }}
              className="flex-1 bg-black text-white hover:bg-gray-800 font-mono touch-manipulation select-none min-h-[48px] text-base"
            >
              {isSubmitting ? 'SAVING...' : 'SAVE SCORE'}
            </Button>
            <Button
              type="button"
              onClick={onCancel}
              onTouchEnd={(e) => {
                e.preventDefault();
                onCancel();
              }}
              variant="outline"
              className="flex-1 border-black text-black hover:bg-black/10 font-mono touch-manipulation select-none min-h-[48px] text-base"
            >
              SKIP
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnonymousNameModal;