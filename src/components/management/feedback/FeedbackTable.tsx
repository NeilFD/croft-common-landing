import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Share2, Star, User } from 'lucide-react';
import { format } from 'date-fns';
import { FeedbackDetailDialog } from './FeedbackDetailDialog';
import { ShareFeedbackDialog } from './ShareFeedbackDialog';

interface FeedbackTableProps {
  data: any[];
  isLoading: boolean;
}

export function FeedbackTable({ data, isLoading }: FeedbackTableProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareData, setShareData] = useState<any>(null);

  if (isLoading) {
    return <div className="text-center py-8">Loading feedback...</div>;
  }

  if (!data.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No feedback submissions found
      </div>
    );
  }

  const getRatingColor = (rating: number | null) => {
    if (!rating) return 'bg-gray-500';
    if (rating >= 4.5) return 'bg-green-500';
    if (rating >= 3.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleShare = (feedback: any) => {
    setShareData(feedback);
    setShareDialogOpen(true);
  };

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Overall</TableHead>
              <TableHead>Ratings</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((feedback) => (
              <TableRow key={feedback.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">
                  {format(new Date(feedback.created_at), 'MMM dd, yyyy')}
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(feedback.created_at), 'HH:mm')}
                  </div>
                </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <div>
                    <div>{feedback.is_anonymous ? 'Anonymous' : feedback.name || 'Unknown'}</div>
                    {feedback.is_anonymous && (
                      <Badge variant="outline" className="text-xs mt-1">Anonymous</Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${getRatingColor(feedback.overall_rating)} flex items-center justify-center text-white font-bold text-sm`}>
                    {feedback.overall_rating?.toFixed(1) || 'N/A'}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {[
                    { key: 'hospitality', value: feedback.hospitality_rating },
                    { key: 'food', value: feedback.food_rating },
                    { key: 'drink', value: feedback.drink_rating },
                    { key: 'team', value: feedback.team_rating },
                    { key: 'venue', value: feedback.venue_rating },
                    { key: 'price', value: feedback.price_rating }
                  ].map(({ key, value }) => (
                    value && (
                      <Badge key={key} variant="secondary" className="text-xs">
                        {key}: {value?.toFixed(1)}
                      </Badge>
                    )
                  ))}
                </div>
              </TableCell>
                <TableCell className="max-w-xs">
                  <div className="truncate text-sm text-muted-foreground">
                    {feedback.message || 'No comment'}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFeedback(feedback);
                      }}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(feedback);
                      }}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <FeedbackDetailDialog
        feedback={selectedFeedback}
        open={!!selectedFeedback}
        onClose={() => setSelectedFeedback(null)}
      />

      <ShareFeedbackDialog
        feedback={shareData}
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
      />
    </>
  );
}
