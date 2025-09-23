import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MapPin, Building2, Search, Edit, Trash2, Upload } from 'lucide-react';
import { useResearch } from '@/hooks/useResearch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VenueUpload } from './VenueUpload';

export const ManageTab = () => {
  const { geoAreas, venues, walkCards, loading, createGeoArea, createVenue } = useResearch();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGeoArea, setSelectedGeoArea] = useState<string>('all');
  const [newGeoAreaName, setNewGeoAreaName] = useState('');
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueAddress, setNewVenueAddress] = useState('');
  const [newVenueGeoArea, setNewVenueGeoArea] = useState('');
  const [showGeoAreaDialog, setShowGeoAreaDialog] = useState(false);
  const [showVenueDialog, setShowVenueDialog] = useState(false);

  const filteredVenues = venues.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGeoArea = selectedGeoArea === 'all' || venue.geo_area_id === selectedGeoArea;
    return matchesSearch && matchesGeoArea;
  });

  const handleCreateGeoArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGeoAreaName.trim()) return;
    
    await createGeoArea(newGeoAreaName.trim());
    setNewGeoAreaName('');
    setShowGeoAreaDialog(false);
  };

  const handleCreateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVenueName.trim() || !newVenueGeoArea) return;
    
    await createVenue({
      name: newVenueName.trim(),
      address: newVenueAddress.trim() || undefined,
      geo_area_id: newVenueGeoArea,
    });
    
    setNewVenueName('');
    setNewVenueAddress('');
    setNewVenueGeoArea('');
    setShowVenueDialog(false);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="venues" className="w-full">
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
              <Dialog open={showVenueDialog} onOpenChange={setShowVenueDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Venue
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Venue</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateVenue} className="space-y-4">
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
                      <Label htmlFor="venue-geo-area">Geo Area *</Label>
                      <Select value={newVenueGeoArea} onValueChange={setNewVenueGeoArea} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select geo area" />
                        </SelectTrigger>
                        <SelectContent>
                          {geoAreas.map((area) => (
                            <SelectItem key={area.id} value={area.id}>
                              {area.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading}>Create</Button>
                      <Button type="button" variant="outline" onClick={() => setShowVenueDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Venue Upload Section */}
          <VenueUpload />

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
            {filteredVenues.map((venue) => {
              const geoArea = geoAreas.find(area => area.id === venue.geo_area_id);
              return (
                <Card key={venue.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{venue.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {geoArea?.name}
                        </div>
                        {venue.address && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            {venue.address}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="geo-areas" className="space-y-4">
          {/* Geo Areas Header */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Geo Areas</h2>
              <p className="text-sm text-muted-foreground">Manage research areas</p>
            </div>
            <Dialog open={showGeoAreaDialog} onOpenChange={setShowGeoAreaDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Area
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Geo Area</DialogTitle>
                </DialogHeader>
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
                    <Button type="submit" disabled={loading}>Create</Button>
                    <Button type="button" variant="outline" onClick={() => setShowGeoAreaDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Geo Areas List */}
          <div className="grid gap-4">
            {geoAreas.map((area) => {
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
                        <Button variant="ghost" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="walk-cards" className="space-y-4">
          {/* Walk Cards Header */}
          <div>
            <h2 className="text-lg font-semibold">Walk Cards</h2>
            <p className="text-sm text-muted-foreground">Manage research sessions</p>
          </div>

          {/* Walk Cards List */}
          <div className="grid gap-4">
            {walkCards.map((card) => (
              <Card key={card.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{card.title}</CardTitle>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      card.status === 'Active' ? 'bg-green-100 text-green-700' :
                      card.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {card.status}
                    </div>
                  </div>
                  <CardDescription>
                    {card.date} • {card.time_block} • {card.weather_preset}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {card.croft_zones.map((zone) => (
                      <span key={zone} className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                        {zone}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};