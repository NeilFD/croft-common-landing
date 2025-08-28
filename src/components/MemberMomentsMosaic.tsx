import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, User, Plus, Trash2, Search, CalendarIcon, Tag, Edit } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMemberMoments, MemberMoment } from '@/hooks/useMemberMoments';
import { useAuth } from '@/hooks/useAuth';
import { format, isAfter, isBefore, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import MemberMomentUpload from './MemberMomentUpload';
import MemberMomentEdit from './MemberMomentEdit';
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
  const { moments, loading, deleteMoment, refetchMoments } = useMemberMoments();
  const { user } = useAuth();
  const [showUpload, setShowUpload] = useState(false);
  const [editingMoment, setEditingMoment] = useState<MemberMoment | null>(null);
  const [selectedMoment, setSelectedMoment] = useState<MemberMoment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('');

  // Get all unique tags for filtering
  const allTags = useMemo(() => {
    if (!moments) return [];
    const tagSet = new Set<string>();
    moments.forEach(moment => {
      if (moment.tags) {
        moment.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [moments]);

  // Enhanced filtering that includes tags
  const filteredMoments = useMemo(() => {
    if (!moments) return [];
    
    return moments.filter((moment) => {
      // Search in tagline, member name, and tags
      const searchMatches = searchQuery === '' || (
        moment.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getMemberName(moment).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (moment.tags && moment.tags.some(tag => 
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      );
      
      // Date range filtering
      const momentDate = new Date(moment.date_taken);
      const dateMatches = (!startDate || isAfter(momentDate, startDate) || isSameDay(momentDate, startDate)) &&
                         (!endDate || isBefore(momentDate, endDate) || isSameDay(momentDate, endDate));
      
      // Tag filtering
      const tagMatches = !selectedTagFilter || 
                        (moment.tags && moment.tags.includes(selectedTagFilter));
      
      return searchMatches && dateMatches && tagMatches;
    });
  }, [moments, searchQuery, startDate, endDate, selectedTagFilter]);

  const handleMomentClick = (moment: MemberMoment) => {
    setSelectedMoment(moment);
  };

  const handleDelete = async (momentId: string) => {
    await deleteMoment(momentId);
  };

  const getMemberName = (moment: MemberMoment) => {
    if (moment.profiles) {
      const { first_name, last_name } = moment.profiles;
      if (first_name || last_name) {
        return `${first_name || ''} ${last_name || ''}`.trim();
      }
    }
    return 'Member';
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedTagFilter('');
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Moments</h2>
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

      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search moments or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Date Range Filters */}
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "MMM d, yyyy") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "MMM d, yyyy") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            
            {(searchQuery || startDate || endDate || selectedTagFilter) && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Tag Filter Buttons */}
        {allTags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by tag:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <Button
                  key={tag}
                  variant={selectedTagFilter === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTagFilter(selectedTagFilter === tag ? '' : tag)}
                  className={`text-xs h-7 ${
                    selectedTagFilter === tag
                      ? 'bg-background text-accent border-accent' 
                      : 'bg-background text-foreground border-accent hover:border-accent hover:bg-accent/5'
                  }`}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          {filteredMoments.length} {filteredMoments.length === 1 ? 'moment' : 'moments'} found
        </div>
      </div>

      {/* Empty State */}
      {filteredMoments.length === 0 && !loading && (
        <Card className="p-8">
          <CardContent className="text-center space-y-4">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
              <Calendar className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {searchQuery || startDate || endDate || selectedTagFilter ? 'No matching moments' : 'No moments yet'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery || startDate || endDate || selectedTagFilter
                  ? 'Try adjusting your search, date, or tag filters'
                  : 'Be the first to share a memory from Croft Common!'}
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
      {filteredMoments.length > 0 && !loading && (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {filteredMoments.map((moment, index) => (
            <div
              key={moment.id}
              className="break-inside-avoid mb-4 cursor-pointer group"
              onClick={() => handleMomentClick(moment)}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02]">
                <div className="relative">
                  <img
                    src={moment.image_url}
                    alt={moment.tagline}
                    className="w-full h-auto object-cover"
                  />
                  
                  {/* Action buttons for moment owner */}
                  {user?.id === moment.user_id && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 bg-background/80 hover:bg-background"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingMoment(moment);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8 bg-background/80 hover:bg-background text-destructive hover:text-destructive"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-3 w-3" />
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
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Always visible footer */}
                <div className="p-3 space-y-2">
                  {moment.is_featured && (
                    <Badge variant="secondary" className="w-fit text-xs">
                      Featured
                    </Badge>
                  )}
                  <p className="text-sm font-medium line-clamp-2">{moment.tagline}</p>
                  
                  {/* Tags */}
                  {moment.tags && moment.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {moment.tags.slice(0, 3).map(tag => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs bg-background text-foreground border-accent"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {moment.tags.length > 3 && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-background text-muted-foreground border-muted"
                        >
                          +{moment.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {getMemberName(moment)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(moment.date_taken), 'MMM dd')}
                    </div>
                  </div>
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

      {/* Edit Modal */}
      {editingMoment && (
        <MemberMomentEdit
          moment={editingMoment}
          isOpen={!!editingMoment}
          onClose={() => setEditingMoment(null)}
        />
      )}

      {/* Detail Modal */}
      {selectedMoment && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-background/90 backdrop-blur-sm"
          onClick={() => setSelectedMoment(null)}
        >
          <Card className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <CardContent className="p-0">
              <img
                src={selectedMoment.image_url}
                alt={selectedMoment.tagline}
                className="w-full h-auto max-h-[50vh] sm:max-h-[60vh] object-contain"
              />
              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedMoment.tagline}</h3>
                  
                  {/* Tags */}
                  {selectedMoment.tags && selectedMoment.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedMoment.tags.map(tag => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="bg-background text-foreground border-accent"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-sm text-muted-foreground">
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