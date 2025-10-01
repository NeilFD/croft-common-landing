import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Star, User, Calendar } from 'lucide-react';

interface FeedbackDetailDialogProps {
  feedback: any;
  open: boolean;
  onClose: () => void;
}

export function FeedbackDetailDialog({ feedback, open, onClose }: FeedbackDetailDialogProps) {
  if (!feedback) return null;

  const categories = ['hospitality', 'food', 'drink', 'team', 'venue', 'price'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Feedback Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="font-medium">
                {feedback.is_anonymous ? 'Anonymous' : feedback.name || 'Unknown'}
              </span>
              {feedback.is_anonymous && <Badge variant="outline">Anonymous</Badge>}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {format(new Date(feedback.created_at), 'MMM dd, yyyy HH:mm')}
            </div>
          </div>

          {/* Overall Rating */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-2">Overall Rating</div>
            <div className="flex items-center gap-2">
              <div className="text-4xl font-bold">
                {feedback.overall_rating?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-muted-foreground">/5</div>
            </div>
          </div>

          {/* Category Ratings */}
          <div>
            <div className="text-sm font-medium mb-3">Category Ratings</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'hospitality', value: feedback.hospitality_rating },
                { key: 'food', value: feedback.food_rating },
                { key: 'drink', value: feedback.drink_rating },
                { key: 'team', value: feedback.team_rating },
                { key: 'venue', value: feedback.venue_rating },
                { key: 'price', value: feedback.price_rating }
              ].map(({ key, value }) => (
                <div key={key} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm capitalize">{key}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">
                        {value?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comment */}
          {feedback.message && (
            <div>
              <div className="text-sm font-medium mb-2">Comment</div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{feedback.message}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
