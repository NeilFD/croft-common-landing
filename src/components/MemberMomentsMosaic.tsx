import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// UI Components
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Alert Dialog Components
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

// Icons
import { 
  Calendar, 
  User, 
  Plus, 
  Trash2, 
  Search, 
  CalendarIcon, 
  Tag,
  Pencil,
  Heart
} from 'lucide-react';

// Custom Components & Hooks
import { cn } from '@/lib/utils';
import SearchInput from './SearchInput';
import { SearchErrorBoundary } from './SearchErrorBoundary';
import { useMemberMoments, MemberMoment } from '@/hooks/useMemberMoments';
import { useAuth } from '@/hooks/useAuth';
import MemberMomentUpload from './MemberMomentUpload';
import MemberMomentEdit from './MemberMomentEdit';
import OptimizedImage from './OptimizedImage';

const MemberMomentsMosaic: React.FC = () => {
  const { moments, loading, deleteMoment, refetchMoments, likeMoment, unlikeMoment } = useMemberMoments();
  const { user } = useAuth();
  const [showUpload, setShowUpload] = useState(false);
  const [editingMoment, setEditingMoment] = useState<MemberMoment | null>(null);
  const [selectedMoment, setSelectedMoment] = useState<MemberMoment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('');

  // Helper function to get member name (moved before filtering logic)
  const getMemberName = (moment: MemberMoment) => {
    if (moment.profiles) {
      const { first_name, last_name } = moment.profiles;
      if (first_name || last_name) {
        return `${first_name || ''} ${last_name || ''}`.trim();
      }
    }
    return 'Member';
  };

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

  // Enhanced filtering that includes tags with native date comparison
  const filteredMoments = useMemo(() => {
    if (!moments) return [];
    
    console.log('🔍 MemberMomentsMosaic: Filtering with searchQuery:', searchQuery); // Debug log
    
    try {
      const filtered = moments.filter((moment) => {
        const query = searchQuery.toLowerCase().trim();
        
        // Search in tagline, member name, and tags (enhanced)
        const searchMatches = query === '' || (
          // Search in tagline
          moment.tagline?.toLowerCase().includes(query) ||
          // Search in member name
          getMemberName(moment).toLowerCase().includes(query) ||
          // Search in tags (enhanced with better matching)
          (moment.tags && moment.tags.some(tag => 
            tag.toLowerCase().includes(query) || 
            tag.toLowerCase().replace(/\s+/g, '').includes(query.replace(/\s+/g, ''))
          )) ||
          // Search for exact tag matches
          (moment.tags && moment.tags.some(tag => 
            tag.toLowerCase() === query
          ))
        );
        
        // Date range filtering with native JavaScript (defensive)
        let dateMatches = true;
        try {
          if (startDate || endDate) {
            const momentDate = new Date(moment.date_taken);
            const momentTime = momentDate.getTime();
            
            if (startDate) {
              const startTime = new Date(startDate).getTime();
              dateMatches = dateMatches && (momentTime >= startTime || 
                momentDate.toDateString() === startDate.toDateString());
            }
            
            if (endDate && dateMatches) {
              const endTime = new Date(endDate).getTime();
              dateMatches = dateMatches && (momentTime <= endTime || 
                momentDate.toDateString() === endDate.toDateString());
            }
          }
        } catch (error) {
          console.warn('Date filtering error:', error);
          dateMatches = true; // Fallback to show all moments if date filtering fails
        }
        
        // Tag filtering
        const tagMatches = !selectedTagFilter || 
                          (moment.tags && moment.tags.includes(selectedTagFilter));
        
        return searchMatches && dateMatches && tagMatches;
      });
      
      console.log('🔍 MemberMomentsMosaic: Filtered results count:', filtered.length); // Debug log
      return filtered;
    } catch (error) {
      console.warn('Filtering error:', error);
      return moments; // Fallback to show all moments if filtering fails
    }
  }, [moments, searchQuery, startDate, endDate, selectedTagFilter]);

  const handleMomentClick = (moment: MemberMoment) => {
    setSelectedMoment(moment);
  };

  const handleDelete = async (momentId: string) => {
    await deleteMoment(momentId);
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
          <div className="flex-1">
            <SearchErrorBoundary
              fallbackValue={searchQuery}
              onFallbackChange={setSearchQuery}
              placeholder="Search moments or tags..."
            >
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search moments or tags..."
              />
            </SearchErrorBoundary>
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

      {/* Empty State - Only show if no moments exist or user has been searching/filtering */}
      {filteredMoments.length === 0 && !loading && (
        <div className={cn(
          "transition-all duration-300",
          (searchQuery || startDate || endDate || selectedTagFilter) ? "opacity-60" : "opacity-100"
        )}>
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
        </div>
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
                  
                  {/* Heart Like Button - Bottom Left of Image */}
                  <div className="absolute bottom-2 left-2 z-10">
                    <TooltipProvider>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-8 px-2 gap-1.5 rounded-full backdrop-blur-sm border",
                              "transition-all duration-200 hover:scale-105",
                              moment.user_has_liked || (moment.like_count && moment.like_count > 0)
                                ? "bg-background/10 border-destructive text-destructive hover:bg-background/20"
                                : "bg-background/10 border-white/20 text-white hover:bg-background/20"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (moment.user_has_liked) {
                                unlikeMoment(moment.id);
                              } else {
                                likeMoment(moment.id);
                              }
                            }}
                          >
                             <Heart 
                               className={cn(
                                 "h-4 w-4 transition-all stroke-2",
                                 moment.user_has_liked || (moment.like_count && moment.like_count > 0)
                                   ? "fill-red-500 stroke-red-600"
                                   : "fill-white/90 stroke-white/20"
                               )}
                             />
                            {moment.like_count && moment.like_count > 0 && (
                              <span className="text-xs font-medium min-w-[1ch]">
                                {moment.like_count}
                              </span>
                            )}
                          </Button>
                        </TooltipTrigger>
                        {moment.likers && moment.likers.length > 0 && (
                          <TooltipContent 
                            side="top" 
                            className="max-w-xs bg-popover border border-border text-popover-foreground"
                          >
                            <div className="text-sm">
                              <span className="font-medium">Liked by:</span>
                              <div className="mt-1">
                                {moment.likers.map((liker, index) => {
                                  const name = liker.first_name && liker.last_name 
                                    ? `${liker.first_name} ${liker.last_name}`.trim()
                                    : liker.first_name || liker.last_name || 'Member';
                                  
                                  if (index === moment.likers!.length - 1) {
                                    return name;
                                  } else if (index === moment.likers!.length - 2) {
                                    return `${name} and `;
                                  } else if (moment.likers!.length > 3 && index === 2) {
                                    return `${name}, and ${moment.likers!.length - 3} others`;
                                  } else {
                                    return `${name}, `;
                                  }
                                }).join('')}
                              </div>
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  {/* Action buttons for moment owner */}
                  {user?.id === moment.user_id && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 bg-accent/90 hover:bg-accent text-accent-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingMoment(moment);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
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
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedMoment(null)}
        >
          <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col bg-white" onClick={e => e.stopPropagation()}>
            <CardContent className="p-0 flex flex-col h-full">
              {/* Image Container */}
              <div className="flex-1 flex items-center justify-center p-4 min-h-0">
                <img
                  src={selectedMoment.image_url}
                  alt={selectedMoment.tagline}
                  className="max-w-full max-h-full object-contain"
                  style={{ 
                    width: 'auto', 
                    height: 'auto',
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}
                />
              </div>
              
              {/* Information Panel */}
              <div className="flex-shrink-0 p-4 bg-white border-t">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-gray-900">{selectedMoment.tagline}</h3>
                  
                  {/* Tags */}
                  {selectedMoment.tags && selectedMoment.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedMoment.tags.map(tag => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="bg-gray-50 text-gray-700 border-gray-300"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{getMemberName(selectedMoment)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(selectedMoment.date_taken), 'MMMM dd, yyyy')}</span>
                    </div>
                  </div>
                  
                  {selectedMoment.is_featured && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Featured Moment
                    </Badge>
                  )}
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedMoment(null)}
                    className="w-full mt-4"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MemberMomentsMosaic;