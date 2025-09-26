import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MapPin, Building2, Search, Edit, Trash2, Play, Eye, Filter, ArrowUpDown } from 'lucide-react';
import { useResearch, GeoArea } from '@/hooks/useResearch';
import { EditWalkCardModal } from './EditWalkCardModal';
import { WalkHistoryCard } from './WalkHistoryCard';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const ManageTab = () => {
  const { toast } = useToast();
  const venueFormRef = useRef<HTMLDivElement>(null);
  
  const { 
    geoAreas, 
    venues, 
    walkCards, 
    loading, 
    createGeoArea, 
    createVenue, 
    updateVenue, 
    deleteVenue, 
    updateGeoArea, 
    deleteGeoArea,
    updateWalkCardStatus,
    fetchWalkCardGeoAreas,
    deleteWalkCard,
    recalculateAllCapacityPercentages
  } = useResearch();
  
  const [activeTab, setActiveTab] = useState('venues');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGeoArea, setSelectedGeoArea] = useState<string>('all');
  
  // Venue form states
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [editingVenue, setEditingVenue] = useState<string | null>(null);
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueAddress, setNewVenueAddress] = useState('');
  const [newVenueGeoArea, setNewVenueGeoArea] = useState('');
  const [newVenueMaxCapacity, setNewVenueMaxCapacity] = useState('');
  
  // Geo area form states
  const [showGeoAreaForm, setShowGeoAreaForm] = useState(false);
  const [editingGeoArea, setEditingGeoArea] = useState<string | null>(null);
  const [newGeoAreaName, setNewGeoAreaName] = useState('');
  
  // Walk Cards filtering and sorting
  const [walkCardSearch, setWalkCardSearch] = useState('');
  const [walkCardStatusFilter, setWalkCardStatusFilter] = useState<string>('all');
  const [walkCardSortBy, setWalkCardSortBy] = useState<string>('date-desc');
  const [walkCardGeoAreas, setWalkCardGeoAreas] = useState<{[key: string]: GeoArea[]}>({});

  const handleStartWalk = async (cardId: string) => {
    await updateWalkCardStatus(cardId, 'Active');
  };

  const handleReopenWalk = async (cardId: string) => {
    await updateWalkCardStatus(cardId, 'Active');
  };

  const handleDeleteWalk = async (cardId: string) => {
    if (window.confirm('Are you sure you want to delete this walk card? This cannot be undone.')) {
      await deleteWalkCard(cardId);
    }
  };

  // Load geo areas for walk cards
  const loadWalkCardGeoAreas = async () => {
    const geoAreaMap: {[key: string]: GeoArea[]} = {};
    for (const card of walkCards) {
      try {
        const areas = await fetchWalkCardGeoAreas(card.id);
        geoAreaMap[card.id] = areas;
      } catch (error) {
        console.error(`Failed to fetch geo areas for walk card ${card.id}:`, error);
        geoAreaMap[card.id] = [];
      }
    }
    setWalkCardGeoAreas(geoAreaMap);
  };

  useEffect(() => {
    if (walkCards.length > 0) {
      loadWalkCardGeoAreas();
    }
  }, [walkCards, fetchWalkCardGeoAreas]);


const filteredVenues = venues.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGeoArea = selectedGeoArea === 'all' || venue.geo_area_id === selectedGeoArea;
    return matchesSearch && matchesGeoArea;
  });

  // Filter and sort walk cards
  const filteredAndSortedWalkCards = walkCards
    .filter(card => {
      const matchesSearch = card.title.toLowerCase().includes(walkCardSearch.toLowerCase());
      const matchesStatus = walkCardStatusFilter === 'all' || card.status === walkCardStatusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (walkCardSortBy) {
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'status':
          const statusOrder = { 'Active': 0, 'Draft': 1, 'Completed': 2 };
          return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
        default:
          return 0;
      }
    });

  const resetVenueForm = () => {
    setNewVenueName('');
    setNewVenueAddress('');
    setNewVenueGeoArea('');
    setNewVenueMaxCapacity('');
    setShowVenueForm(false);
    setEditingVenue(null);
  };

  const resetGeoAreaForm = () => {
    setNewGeoAreaName('');
    setShowGeoAreaForm(false);
    setEditingGeoArea(null);
  };

  const handleCreateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVenueName.trim() || !newVenueGeoArea) return;
    
    if (editingVenue) {
      await updateVenue(editingVenue, {
        name: newVenueName.trim(),
        address: newVenueAddress.trim() === '' ? null : newVenueAddress.trim(),
        geo_area_id: newVenueGeoArea,
        max_capacity: newVenueMaxCapacity.trim() === '' ? null : Number(newVenueMaxCapacity.trim()),
      });
    } else {
      await createVenue({
        name: newVenueName.trim(),
        address: newVenueAddress.trim() === '' ? null : newVenueAddress.trim(),
        geo_area_id: newVenueGeoArea,
        max_capacity: newVenueMaxCapacity.trim() === '' ? null : Number(newVenueMaxCapacity.trim()),
      });
    }
    
    resetVenueForm();
  };

  const handleEditVenue = (venue: any) => {
    try {
      console.log('Editing venue:', venue);
      
      // Validate venue object
      if (!venue || !venue.id) {
        console.error('Invalid venue object:', venue);
        toast({
          title: "Error",
          description: "Unable to edit venue - invalid data",
          variant: "destructive",
        });
        return;
      }

      // Safely extract venue properties with defaults
      const venueName = venue.name || '';
      const venueAddress = venue.address || '';
      const venueGeoAreaId = venue.geo_area_id || '';
      const venueMaxCapacity = venue.max_capacity ? String(venue.max_capacity) : '';

      console.log('Setting venue form data:', {
        name: venueName,
        address: venueAddress,
        geo_area_id: venueGeoAreaId,
        max_capacity: venueMaxCapacity
      });

      setNewVenueName(venueName);
      setNewVenueAddress(venueAddress);
      setNewVenueGeoArea(venueGeoAreaId);
      setNewVenueMaxCapacity(venueMaxCapacity);
      setEditingVenue(venue.id);
      setShowVenueForm(true);
      
      // Show toast notification
      toast({
        title: "Editing Venue",
        description: `Now editing "${venueName}" - scroll up to see the form`,
      });
      
      // Scroll to form after a brief delay to ensure it's rendered
      setTimeout(() => {
        if (venueFormRef.current) {
          venueFormRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          // Focus the first input
          const firstInput = venueFormRef.current.querySelector('input');
          if (firstInput) {
            firstInput.focus();
          }
        }
      }, 100);
      
      console.log('Venue form opened successfully for:', venue.name);
    } catch (error) {
      console.error('Error in handleEditVenue:', error, 'Venue:', venue);
      toast({
        title: "Error",
        description: "Failed to open venue edit form",
        variant: "destructive",
      });
    }
  };

  const handleCreateGeoArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGeoAreaName.trim()) return;
    
    if (editingGeoArea) {
      await updateGeoArea(editingGeoArea, { name: newGeoAreaName.trim() });
    } else {
      await createGeoArea(newGeoAreaName.trim());
    }
    
    resetGeoAreaForm();
  };

  const handleEditGeoArea = (area: any) => {
    setNewGeoAreaName(area.name);
    setEditingGeoArea(area.id);
    setShowGeoAreaForm(true);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="venues">Venues</TabsTrigger>
          <TabsTrigger value="geo-areas">Geo Areas</TabsTrigger>
          <TabsTrigger value="walk-cards">Walk Cards</TabsTrigger>
        </TabsList>

        <TabsContent value="venues" className="space-y-4">
          {/* Venues Header */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Venues</h2>
              <p className="text-sm text-muted-foreground">Manage competitor venues</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={recalculateAllCapacityPercentages}
                disabled={loading}
              >
                Recalculate Capacity %
              </Button>
              <Button onClick={() => setShowVenueForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Venue
              </Button>
            </div>
          </div>

          {/* Inline Venue Form */}
          {showVenueForm && (
            <Card ref={venueFormRef} className="border-primary/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {editingVenue ? 'Edit Venue' : 'New Venue'}
                  {editingVenue && (
                    <span className="text-sm font-normal text-muted-foreground">
                      - {newVenueName || 'Unnamed venue'}
                    </span>
                  )}
                </CardTitle>
                {editingVenue && (
                  <CardDescription>
                    Make your changes and click Update to save
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateVenue} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="venue-name">Name *</Label>
                      <Input
                        id="venue-name"
                        value={newVenueName}
                        onChange={(e) => setNewVenueName(e.target.value)}
                        placeholder="Venue name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="venue-address">Address</Label>
                      <Input
                        id="venue-address"
                        value={newVenueAddress}
                        onChange={(e) => setNewVenueAddress(e.target.value)}
                        placeholder="Street address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="venue-max-capacity">Max Capacity</Label>
                      <Input
                        id="venue-max-capacity"
                        type="number"
                        min="1"
                        value={newVenueMaxCapacity}
                        onChange={(e) => setNewVenueMaxCapacity(e.target.value)}
                        placeholder="e.g. 100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="venue-geo-area">Geo Area *</Label>
                      <Select value={newVenueGeoArea} onValueChange={setNewVenueGeoArea} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select geo area" />
                        </SelectTrigger>
                        <SelectContent>
                          {geoAreas.length === 0 ? (
                            <SelectItem value="" disabled>No areas available</SelectItem>
                          ) : (
                            geoAreas.map((area) => (
                              <SelectItem key={area.id} value={area.id}>
                                {area.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading}>
                      {editingVenue ? 'Update' : 'Create'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetVenueForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Venues Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedGeoArea} onValueChange={setSelectedGeoArea}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {geoAreas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Venues List */}
          <div className="grid gap-4">
            {filteredVenues.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {venues.length === 0 ? 'No venues added yet.' : 'No venues match your search.'}
              </div>
            ) : (
              filteredVenues.filter(venue => venue && venue.id).map((venue) => {
                const geoArea = geoAreas.find(area => area.id === venue.geo_area_id);
                return (
                  <Card key={venue.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold">{venue.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {geoArea?.name || 'Unknown area'}
                          </div>
                          {venue.address && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              {venue.address}
                            </div>
                          )}
                          {venue.max_capacity && (
                            <div className="text-sm text-muted-foreground">
                              Max capacity: {venue.max_capacity} people
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Edit button clicked for venue:', venue?.name || 'Unknown');
                              handleEditVenue(venue);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (window.confirm(`Delete "${venue.name}"? This cannot be undone.`)) {
                                await deleteVenue(venue.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="geo-areas" className="space-y-4">
          {/* Geo Areas Header */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Geo Areas</h2>
              <p className="text-sm text-muted-foreground">Manage research areas</p>
            </div>
            <Button onClick={() => setShowGeoAreaForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Area
            </Button>
          </div>

          {/* Inline Geo Area Form */}
          {showGeoAreaForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingGeoArea ? 'Edit Geo Area' : 'New Geo Area'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateGeoArea} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="area-name">Name *</Label>
                    <Input
                      id="area-name"
                      value={newGeoAreaName}
                      onChange={(e) => setNewGeoAreaName(e.target.value)}
                      placeholder="Area name"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading}>
                      {editingGeoArea ? 'Update' : 'Create'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetGeoAreaForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Geo Areas List */}
          <div className="grid gap-4">
            {geoAreas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No geo areas added yet.
              </div>
            ) : (
              geoAreas.map((area) => {
                const venueCount = venues.filter(venue => venue.geo_area_id === area.id).length;
                return (
                  <Card key={area.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{area.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {venueCount} venue{venueCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditGeoArea(area)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (window.confirm(`Delete "${area.name}"? This cannot be undone.`)) {
                                await deleteGeoArea(area.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="walk-cards" className="space-y-4">
          {/* Walk Cards Header */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Walk Cards Archive</h2>
              <p className="text-sm text-muted-foreground">View and manage all research sessions</p>
            </div>
            <div className="text-sm text-muted-foreground">
              {walkCards.length} total cards
            </div>
          </div>

          {/* Walk Cards Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search walk cards..."
                value={walkCardSearch}
                onChange={(e) => setWalkCardSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={walkCardStatusFilter} onValueChange={setWalkCardStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={walkCardSortBy} onValueChange={setWalkCardSortBy}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="title-asc">Title A-Z</SelectItem>
                <SelectItem value="title-desc">Title Z-A</SelectItem>
                <SelectItem value="status">By Status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Walk Cards List */}
          <div className="space-y-4">
            {filteredAndSortedWalkCards.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {walkCards.length === 0 
                  ? 'No walk cards yet. Create one from the Run tab.'
                  : 'No walk cards match your search criteria.'
                }
              </div>
            ) : (
              filteredAndSortedWalkCards.map((card) => {
                return (
                  <div key={card.id} className="relative">
                    <WalkHistoryCard 
                      walkCard={card}
                      onReopen={card.status === 'Completed' ? handleReopenWalk : undefined}
                      onDelete={handleDeleteWalk}
                    />
                    
                    {/* Additional management buttons for non-completed cards */}
                    {card.status !== 'Completed' && (
                      <div className="absolute top-4 right-4 flex gap-2 z-10">
                        {card.status === 'Draft' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleStartWalk(card.id)}
                            disabled={loading}
                          >
                            <Play className="mr-1 h-3 w-3" />
                            Start Walk
                          </Button>
                        )}
                        {card.status === 'Active' && (
                          <Button size="sm" variant="outline" disabled>
                            <Eye className="mr-1 h-3 w-3" />
                            Active (Go to Run tab)
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {/* Edit button for completed cards */}
                    {card.status === 'Completed' && (
                      <div className="absolute top-4 right-4 z-10">
                        <EditWalkCardModal 
                          walkCard={card}
                          onSuccess={() => {
                            loadWalkCardGeoAreas();
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};