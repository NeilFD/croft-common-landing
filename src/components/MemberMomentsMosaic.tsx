import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Plus, Trash2 } from 'lucide-react';
import { useMemberMoments, MemberMoment } from '@/hooks/useMemberMoments';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import MemberMomentUpload from './MemberMomentUpload';
import OptimizedImage from './OptimizedImage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MemberMomentsMosaic: React.FC = () => {
  const { moments, loading, deleteMoment } = useMemberMoments();
  const { user } = useAuth();
  const [showUpload, setShowUpload] = useState(false);
  const [selectedMoment, setSelectedMoment] = useState<MemberMoment | null>(null);

  const handleMomentClick = (moment: MemberMoment) => {
    setSelectedMoment(moment);
  };

  const handleDelete = async (momentId: string) => {
    await deleteMoment(momentId);
  };

  const getMemberName = (moment: MemberMoment) => {
    if (moment.profiles?.first_name || moment.profiles?.last_name) {
      return `${moment.profiles.first_name || ''} ${moment.profiles.last_name || ''}`.trim();
    }
    return 'Anonymous Member';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="aspect-square bg-muted rounded-lg animate-pulse"
            style={{ height: `${200 + Math.random() * 100}px` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Members' Moments</h2>
          <p className="text-muted-foreground">
            Capturing memories from Croft Common
          </p>
        </div>
        {user && (
          <Button onClick={() => setShowUpload(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Share Moment
          </Button>
        )}
      </div>

      {/* Empty State */}
      {moments.length === 0 && (
        <Card className="p-8">
          <CardContent className="text-center space-y-4">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
              <Calendar className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No moments yet</h3>
              <p className="text-muted-foreground">
                Be the first to share a memory from Croft Common!
              </p>
            </div>
            {user && (
              <Button onClick={() => setShowUpload(true)} className="mt-4">
                Share Your First Moment
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Masonry Grid */}
      {moments.length > 0 && (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {moments.map((moment) => (
            <div
              key={moment.id}
              className="break-inside-avoid mb-4 cursor-pointer group"
              onClick={() => handleMomentClick(moment)}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02]">
                <div className="relative">
                  <OptimizedImage
                    src={moment.image_url}
                    alt={moment.tagline}
                    className="w-full h-auto object-cover"
                  />
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-4 text-white">
                    <div className="space-y-2">
                      <p className="text-sm font-medium line-clamp-2">
                        {moment.tagline}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {getMemberName(moment)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(moment.date_taken), 'MMM dd')}
                        </div>
                      </div>
                      {moment.is_featured && (
                        <Badge variant="secondary" className="text-xs">
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Delete button for own moments */}
                  {user?.id === moment.user_id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete moment?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete your moment. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(moment.id);
                            }}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <MemberMomentUpload
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
      />

      {/* Detail Modal */}
      {selectedMoment && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={() => setSelectedMoment(null)}
        >
          <Card className="max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <CardContent className="p-0">
              <OptimizedImage
                src={selectedMoment.image_url}
                alt={selectedMoment.tagline}
                className="w-full h-auto max-h-[60vh] object-contain"
              />
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedMoment.tagline}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {getMemberName(selectedMoment)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(selectedMoment.date_taken), 'MMMM dd, yyyy')}
                    </div>
                  </div>
                  {selectedMoment.is_featured && (
                    <Badge variant="secondary" className="mt-2">
                      Featured Moment
                    </Badge>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedMoment(null)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MemberMomentsMosaic;