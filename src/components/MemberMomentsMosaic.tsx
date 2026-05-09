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
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const hasActiveFilters = !!(searchQuery || startDate || endDate || selectedTagFilter);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between mb-2 gap-3 flex-wrap px-2 md:px-0">
        <div>
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/60 mb-2 md:mb-3">Member</p>
          <h1 className="font-display uppercase text-3xl md:text-5xl tracking-tight leading-none">
            Moments
          </h1>
          <p className="font-sans text-xs md:text-sm text-white/70 mt-2 md:mt-3">Yours. Tagged. Kept.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile filters toggle */}
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className={cn(
              'md:hidden px-4 h-11 border font-mono text-[10px] tracking-[0.4em] uppercase transition-colors',
              filtersOpen || hasActiveFilters
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-white border-white/40 hover:bg-white hover:text-black'
            )}
          >
            {filtersOpen ? 'Close' : hasActiveFilters ? 'Filters •' : 'Filter'}
          </button>
          {user && (
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="px-4 md:px-6 h-11 border border-white bg-white text-black font-mono text-[10px] tracking-[0.4em] uppercase hover:bg-black hover:text-white transition-colors"
            >
              Share
            </button>
          )}
        </div>
      </div>

      {/* Search and Filter Controls — hidden on mobile until toggled, always visible on md+ */}
      <div className={cn('mb-4 md:mb-6 space-y-4 px-2 md:px-0', filtersOpen ? 'block' : 'hidden md:block')}>
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
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
          <div className="flex gap-2 flex-wrap">
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
            
            {hasActiveFilters && (
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
      </div>

      {/* Results count — compact on mobile */}
      <div className="text-xs md:text-sm text-white/50 font-mono tracking-wider uppercase px-2 md:px-0">
        {filteredMoments.length} {filteredMoments.length === 1 ? 'moment' : 'moments'}
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
                    : 'Be the first to share a moment.'}
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
        <div className="columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-4 space-y-2 md:space-y-4">
          {filteredMoments.map((moment) => (
            <div
              key={moment.id}
              className="break-inside-avoid mb-2 md:mb-4 cursor-pointer group relative overflow-hidden bg-black"
              onClick={() => handleMomentClick(moment)}
            >
              {/* Full-bleed image */}
              <img
                src={moment.image_url}
                alt={moment.tagline}
                className="w-full h-auto object-cover block transition-transform duration-300 group-hover:scale-[1.02]"
              />

              {/* Top gradient + featured pill */}
              {moment.is_featured && (
                <div className="absolute top-2 left-2 z-10 px-2 h-6 inline-flex items-center bg-white text-black font-mono text-[9px] tracking-[0.3em] uppercase">
                  Featured
                </div>
              )}

              {/* Owner controls */}
              {user?.id === moment.user_id && (
                <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-black/70 hover:bg-black text-white border border-white/30"
                    onClick={(e) => { e.stopPropagation(); setEditingMoment(moment); }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-black/70 hover:bg-black text-white border border-white/30"
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
                          onClick={(e) => { e.stopPropagation(); handleDelete(moment.id); }}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              {/* Bottom overlay: tagline + meta over gradient */}
              <div className="absolute inset-x-0 bottom-0 z-10 pt-10 pb-2 px-2 md:px-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
                <p className="font-sans text-xs md:text-sm text-white line-clamp-2 leading-snug mb-1.5">
                  {moment.tagline}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-white/70 truncate">
                    {getMemberName(moment)}
                  </span>
                  <button
                    type="button"
                    aria-label={moment.user_has_liked ? 'Unlike' : 'Like'}
                    onClick={(e) => {
                      e.stopPropagation();
                      moment.user_has_liked ? unlikeMoment(moment.id) : likeMoment(moment.id);
                    }}
                    className="inline-flex items-center gap-1 h-7 px-2 bg-black/40 backdrop-blur-sm border border-white/20 hover:bg-black/70 transition-colors"
                  >
                    <Heart
                      className={cn(
                        'h-3.5 w-3.5 stroke-2',
                        moment.user_has_liked
                          ? 'fill-red-500 stroke-red-500'
                          : 'fill-transparent stroke-white'
                      )}
                    />
                    {!!moment.like_count && moment.like_count > 0 && (
                      <span className="font-mono text-[10px] text-white">{moment.like_count}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <MemberMomentUpload
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onPosted={refetchMoments}
      />

      {/* Edit Modal */}
      {editingMoment && (
        <MemberMomentEdit
          moment={editingMoment}
          isOpen={!!editingMoment}
          onClose={() => setEditingMoment(null)}
        />
      )}

      {/* Detail Modal — full-bleed image, dark chrome */}
      {selectedMoment && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex flex-col"
          onClick={() => setSelectedMoment(null)}
        >
          {/* Top bar with visible close */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 h-14 border-b border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/60">
              Moment
            </span>
            <button
              type="button"
              onClick={() => setSelectedMoment(null)}
              className="px-4 h-9 border border-white bg-white text-black font-mono text-[10px] tracking-[0.4em] uppercase hover:bg-black hover:text-white transition-colors"
            >
              Close
            </button>
          </div>

          {/* Image area - full bleed */}
          <div
            className="flex-1 flex items-center justify-center overflow-hidden p-2 md:p-6"
            onClick={() => setSelectedMoment(null)}
          >
            <img
              src={selectedMoment.image_url}
              alt={selectedMoment.tagline}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Info bar */}
          <div
            className="flex-shrink-0 px-4 md:px-6 py-4 border-t border-white/10 bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <p className="font-sans text-sm md:text-base text-white leading-snug flex-1">
                {selectedMoment.tagline}
              </p>
              <button
                type="button"
                aria-label={selectedMoment.user_has_liked ? 'Unlike' : 'Like'}
                onClick={() => {
                  selectedMoment.user_has_liked
                    ? unlikeMoment(selectedMoment.id)
                    : likeMoment(selectedMoment.id);
                }}
                className="inline-flex items-center gap-1.5 h-8 px-3 border border-white/30 hover:bg-white/10 transition-colors"
              >
                <Heart
                  className={cn(
                    'h-4 w-4 stroke-2',
                    selectedMoment.user_has_liked
                      ? 'fill-red-500 stroke-red-500'
                      : 'fill-transparent stroke-white'
                  )}
                />
                {!!selectedMoment.like_count && selectedMoment.like_count > 0 && (
                  <span className="font-mono text-[10px] text-white">{selectedMoment.like_count}</span>
                )}
              </button>
            </div>

            {selectedMoment.tags && selectedMoment.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedMoment.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 h-6 border border-white/30 font-mono text-[9px] tracking-[0.3em] uppercase text-white/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 font-mono text-[10px] tracking-[0.3em] uppercase text-white/60">
              <span>{getMemberName(selectedMoment)}</span>
              <span>{format(new Date(selectedMoment.date_taken), 'dd MMM yyyy')}</span>
            </div>
          </div>
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
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedMoment(null)}
        >
          <div className="bg-white rounded-lg overflow-hidden shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            {/* Image Area - takes most of the space */}
            <div className="flex-1 flex items-center justify-center bg-gray-50 min-h-[60vh]">
              <img
                src={selectedMoment.image_url}
                alt={selectedMoment.tagline}
                className="max-w-full max-h-full object-contain"
                onClick={e => e.stopPropagation()}
                style={{ maxHeight: 'calc(90vh - 200px)' }}
              />
            </div>
            
            {/* Info Panel - fixed at bottom */}
            <div className="flex-shrink-0 bg-white p-4 border-t" onClick={e => e.stopPropagation()}>
              <div className="max-w-full mx-auto">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{selectedMoment.tagline}</h3>
                
                {/* Tags */}
                {selectedMoment.tags && selectedMoment.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedMoment.tags.map(tag => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="bg-gray-100 text-gray-700 border-gray-300"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{getMemberName(selectedMoment)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(selectedMoment.date_taken), 'MMMM dd, yyyy')}</span>
                    </div>
                    {selectedMoment.is_featured && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 w-fit">
                        Featured Moment
                      </Badge>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setSelectedMoment(null)}
                    className="w-full sm:w-auto"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberMomentsMosaic;