import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Edit, Save, X } from 'lucide-react';

interface EventNotesTabProps {
  eventId: string;
  notes: string | null;
}

export const EventNotesTab = ({ eventId, notes }: EventNotesTabProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(notes || '');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    setLoading(true);
    
    try {
      const { error } = await supabase.rpc('update_management_event', {
        p_id: eventId,
        patch: { notes: editedNotes }
      });

      if (error) throw error;

      toast.success('Notes updated successfully');
      queryClient.invalidateQueries({ queryKey: ['management-event', eventId] });
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating notes:', error);
      toast.error(error.message || 'Failed to update notes');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedNotes(notes || '');
    setIsEditing(false);
  };

  return (
    <Card className="border-industrial">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-brutalist uppercase tracking-wide">EVENT NOTES</CardTitle>
          
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="font-brutalist uppercase tracking-wide border-industrial"
            >
              <Edit className="h-4 w-4 mr-2" />
              EDIT
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="font-brutalist uppercase tracking-wide border-industrial"
              >
                <X className="h-4 w-4 mr-2" />
                CANCEL
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={loading}
                className="btn-primary font-brutalist uppercase tracking-wide"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'SAVING...' : 'SAVE'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isEditing ? (
          <Textarea
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            placeholder="Add notes about this event..."
            className="font-industrial min-h-[200px]"
          />
        ) : (
          <div className="min-h-[200px]">
            {notes ? (
              <p className="font-industrial whitespace-pre-wrap">{notes}</p>
            ) : (
              <p className="font-industrial text-muted-foreground italic">
                No notes added yet. Click edit to add notes about this event.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};