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
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead className="w-[160px]">Customer</TableHead>
              <TableHead className="w-[80px] text-center">Overall</TableHead>
              <TableHead className="w-[70px] text-center">Hosp.</TableHead>
              <TableHead className="w-[70px] text-center">Food</TableHead>
              <TableHead className="w-[70px] text-center">Drink</TableHead>
              <TableHead className="w-[70px] text-center">Team</TableHead>
              <TableHead className="w-[70px] text-center">Venue</TableHead>
              <TableHead className="w-[70px] text-center">Price</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead className="text-right w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((feedback) => (
              <TableRow key={feedback.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  {format(new Date(feedback.created_at), 'MMM dd, yyyy')}
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(feedback.created_at), 'HH:mm')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <div className="truncate">
                      <div className="truncate">{feedback.is_anonymous ? 'Anonymous' : feedback.name || 'Unknown'}</div>
                      {feedback.is_anonymous && (
                        <Badge variant="outline" className="text-xs mt-0.5">Anon</Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${getRatingColor(feedback.overall_rating)} text-white font-bold text-sm`}>
                    {feedback.overall_rating?.toFixed(1) || '-'}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="font-medium text-sm">
                    {feedback.hospitality_rating?.toFixed(1) || '-'}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="font-medium text-sm">
                    {feedback.food_rating?.toFixed(1) || '-'}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="font-medium text-sm">
                    {feedback.drink_rating?.toFixed(1) || '-'}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="font-medium text-sm">
                    {feedback.team_rating?.toFixed(1) || '-'}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="font-medium text-sm">
                    {feedback.venue_rating?.toFixed(1) || '-'}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="font-medium text-sm">
                    {feedback.price_rating?.toFixed(1) || '-'}
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
