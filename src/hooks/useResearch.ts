import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface GeoArea {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Venue {
  id: string;
  name: string;
  geo_area_id: string;
  address?: string | null;
  max_capacity?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalkCard {
  id: string;
  title: string;
  date: string;
  time_block: 'EarlyMorning' | 'MidMorning' | 'Lunch' | 'MidAfternoon' | 'EarlyEvening' | 'Evening' | 'Late';
  weather_preset: 'Sunny' | 'Overcast' | 'Rain' | 'Mixed' | 'ColdSnap' | 'Heatwave';
  weather_temp_c?: number;
  weather_notes?: string;
  croft_zones: string[];
  created_by_user_id: string;
  status: 'Draft' | 'Active' | 'Completed';
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WalkEntry {
  id: string;
  walk_card_id: string;
  venue_id: string;
  visit_number: number;
  people_count: number;
  laptop_count: number;
  capacity_percentage?: number | null;
  is_closed: boolean;
  notes?: string;
  photo_url?: string;
  flag_anomaly: boolean;
  recorded_at: string;
  created_at: string;
  updated_at: string;
}

export const useResearch = () => {
  const { user } = useAuth();
  const [geoAreas, setGeoAreas] = useState<GeoArea[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [walkCards, setWalkCards] = useState<WalkCard[]>([]);
  const [walkEntries, setWalkEntries] = useState<WalkEntry[]>([]);
  const [allWalkEntries, setAllWalkEntries] = useState<WalkEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch geo areas
  const fetchGeoAreas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('geo_areas')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setGeoAreas(data || []);
    } catch (error) {
      console.error('Error fetching geo areas:', error);
      toast.error('Failed to load geo areas');
    }
  }, []);

  // Fetch venues
  const fetchVenues = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setVenues(data || []);
    } catch (error) {
      console.error('Error fetching venues:', error);
      toast.error('Failed to load venues');
    }
  }, []);

  // Fetch walk cards
  const fetchWalkCards = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('walk_cards')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setWalkCards(data || []);
    } catch (error) {
      console.error('Error fetching walk cards:', error);
      toast.error('Failed to load walk cards');
    }
  }, []);

  // Fetch walk entries for a specific card
  const fetchWalkEntries = useCallback(async (walkCardId: string) => {
    try {
      const { data, error } = await supabase
        .from('walk_entries')
        .select('*')
        .eq('walk_card_id', walkCardId);
      
      if (error) throw error;
      setWalkEntries(data || []);
    } catch (error) {
      console.error('Error fetching walk entries:', error);
      toast.error('Failed to load walk entries');
    }
  }, []);

  // Fetch all walk entries for analysis
  const fetchAllWalkEntries = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('walk_entries')
        .select('*')
        .order('recorded_at', { ascending: false });
      
      if (error) throw error;
      setAllWalkEntries(data || []);
    } catch (error) {
      console.error('Error fetching all walk entries:', error);
      toast.error('Failed to load walk entries for analysis');
    }
  }, []);

  // Recalculate capacity percentages for all existing data
  const recalculateAllCapacityPercentages = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('recalculate_all_capacity_percentages');
      
      if (error) throw error;
      
      const updatedCount = data?.[0]?.updated_count || 0;
      
      // Refresh all walk entries to show updated capacity percentages
      await fetchAllWalkEntries();
      
      toast.success(`Updated capacity percentages for ${updatedCount} walk entries`);
    } catch (error) {
      console.error('Error recalculating capacity percentages:', error);
      toast.error('Failed to recalculate capacity percentages');
    } finally {
      setLoading(false);
    }
  }, [fetchAllWalkEntries]);

  // Fetch geo areas for a walk card
  const fetchWalkCardGeoAreas = useCallback(async (walkCardId: string): Promise<GeoArea[]> => {
    try {
      const { data, error } = await supabase
        .from('walk_card_geo_areas')
        .select(`
          geo_area_id,
          geo_areas (
            id,
            name,
            is_active,
            created_at,
            updated_at
          )
        `)
        .eq('walk_card_id', walkCardId);
      
      if (error) throw error;
      return data?.map(item => item.geo_areas as GeoArea).filter(Boolean) || [];
    } catch (error) {
      console.error('Error fetching walk card geo areas:', error);
      return [];
    }
  }, []);

  // Add geo area to walk card
  const addGeoAreaToWalkCard = async (walkCardId: string, geoAreaId: string) => {
    try {
      const { error } = await supabase
        .from('walk_card_geo_areas')
        .insert({ walk_card_id: walkCardId, geo_area_id: geoAreaId });
      
      if (error) throw error;
      toast.success('Geo area added to walk');
    } catch (error) {
      console.error('Error adding geo area to walk card:', error);
      toast.error('Failed to add geo area');
    }
  };

  // Remove geo area from walk card
  const removeGeoAreaFromWalkCard = async (walkCardId: string, geoAreaId: string) => {
    try {
      const { error } = await supabase
        .from('walk_card_geo_areas')
        .delete()
        .eq('walk_card_id', walkCardId)
        .eq('geo_area_id', geoAreaId);
      
      if (error) throw error;
      toast.success('Geo area removed from walk');
    } catch (error) {
      console.error('Error removing geo area from walk card:', error);
      toast.error('Failed to remove geo area');
    }
  };

  // Create new walk card
  const createWalkCard = async (cardData: Partial<WalkCard>, selectedGeoAreaIds: string[] = []) => {
    if (!user) return null;

    try {
      setLoading(true);
      
      // Generate title if not provided
      const title = cardData.title || `${cardData.date} ${cardData.time_block}`;
      
      const { data, error } = await supabase
        .from('walk_cards')
        .insert({
          date: cardData.date!,
          time_block: cardData.time_block!,
          weather_preset: cardData.weather_preset!,
          title,
          created_by_user_id: user.id,
          croft_zones: cardData.croft_zones || [],
          weather_temp_c: cardData.weather_temp_c,
          weather_notes: cardData.weather_notes,
        })
        .select()
        .single();
      
      if (error) throw error;

      // Link selected geo areas to the walk card
      if (selectedGeoAreaIds.length > 0) {
        const geoAreaLinks = selectedGeoAreaIds.map(geoAreaId => ({
          walk_card_id: data.id,
          geo_area_id: geoAreaId
        }));

        const { error: linkError } = await supabase
          .from('walk_card_geo_areas')
          .insert(geoAreaLinks);

        if (linkError) throw linkError;
      }
      
      await fetchWalkCards();
      toast.success('Walk card created successfully');
      return data;
    } catch (error) {
      console.error('Error creating walk card:', error);
      toast.error('Failed to create walk card');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update walk card status
  const updateWalkCardStatus = async (cardId: string, status: WalkCard['status']) => {
    try {
      setLoading(true);
      
      const updates: Partial<WalkCard> = { status };
      if (status === 'Active') {
        updates.started_at = new Date().toISOString();
      } else if (status === 'Completed') {
        updates.completed_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('walk_cards')
        .update(updates)
        .eq('id', cardId);
      
      if (error) throw error;
      
      await fetchWalkCards();
      toast.success(`Walk card ${status.toLowerCase()}`);
    } catch (error) {
      console.error('Error updating walk card:', error);
      toast.error('Failed to update walk card');
    } finally {
      setLoading(false);
    }
  };

  // Update walk card
  const updateWalkCard = async (cardId: string, updates: Partial<Omit<WalkCard, 'id' | 'created_at' | 'updated_at' | 'created_by_user_id'>>) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('walk_cards')
        .update(updates)
        .eq('id', cardId);
      
      if (error) throw error;
      
      await fetchWalkCards();
      toast.success('Walk card updated');
    } catch (error) {
      console.error('Error updating walk card:', error);
      toast.error('Failed to update walk card');
    } finally {
      setLoading(false);
    }
  };

  // Upsert walk entry
  const upsertWalkEntry = async (entryData: Partial<WalkEntry>) => {
    try {
      setLoading(true);
      
      // If no visit_number provided, determine the next visit number for this venue by querying the database
      let visitNumber = entryData.visit_number;
      if (!visitNumber) {
        // Query database directly to get the current maximum visit number for this venue and walk card
        const { data: existingEntries, error: queryError } = await supabase
          .from('walk_entries')
          .select('visit_number')
          .eq('venue_id', entryData.venue_id!)
          .eq('walk_card_id', entryData.walk_card_id!)
          .order('visit_number', { ascending: false })
          .limit(1);
        
        if (queryError) throw queryError;
        
        visitNumber = existingEntries && existingEntries.length > 0 ? existingEntries[0].visit_number + 1 : 1;
      }

      const { error } = await supabase
        .from('walk_entries')
        .upsert({
          walk_card_id: entryData.walk_card_id!,
          venue_id: entryData.venue_id!,
          visit_number: visitNumber,
          people_count: entryData.people_count || 0,
          laptop_count: entryData.laptop_count || 0,
          is_closed: entryData.is_closed || false,
          flag_anomaly: entryData.flag_anomaly || false,
          notes: entryData.notes,
          photo_url: entryData.photo_url,
          recorded_at: entryData.recorded_at || new Date().toISOString(),
        }, {
          onConflict: 'walk_card_id,venue_id,visit_number'
        });
      
      if (error) throw error;
      
      // Immediately refresh walk entries to ensure UI updates
      if (entryData.walk_card_id) {
        await fetchWalkEntries(entryData.walk_card_id);
      }
    } catch (error) {
      console.error('Error updating walk entry:', error);
      throw error; // Re-throw to allow component to handle error
    } finally {
      setLoading(false);
    }
  };

  // Create geo area
  const createGeoArea = async (name: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('geo_areas')
        .insert({ name });
      
      if (error) throw error;
      
      await fetchGeoAreas();
      toast.success('Geo area created');
    } catch (error) {
      console.error('Error creating geo area:', error);
      toast.error('Failed to create geo area');
    } finally {
      setLoading(false);
    }
  };

  // Create venue
  const createVenue = async (venueData: { name: string; geo_area_id: string; address?: string | null; max_capacity?: number | null }) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('venues')
        .insert(venueData);
      
      if (error) throw error;
      
      await fetchVenues();
      toast.success('Venue created');
    } catch (error) {
      console.error('Error creating venue:', error);
      toast.error('Failed to create venue');
    } finally {
      setLoading(false);
    }
  };

  // Update venue
  const updateVenue = async (venueId: string, updates: Partial<Venue>) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('venues')
        .update(updates)
        .eq('id', venueId);
      
      if (error) throw error;
      
      await fetchVenues();
      toast.success('Venue updated');
    } catch (error) {
      console.error('Error updating venue:', error);
      toast.error('Failed to update venue');
    } finally {
      setLoading(false);
    }
  };

  // Delete venue
  const deleteVenue = async (venueId: string) => {
    // Optimistic update: remove from local state immediately
    const previous = venues;
    setVenues((prev) => prev.filter((v) => v.id !== venueId));

    try {
      setLoading(true);
      const { error } = await supabase
        .from('venues')
        .update({ is_active: false })
        .eq('id', venueId);

      if (error) throw error;

      // Ensure state is in sync with backend
      await fetchVenues();
      toast.success('Venue deleted');
    } catch (error) {
      console.error('Error deleting venue:', error);
      // Revert local state on failure
      setVenues(previous);
      toast.error('Failed to delete venue');
    } finally {
      setLoading(false);
    }
  };
  // Update geo area
  const updateGeoArea = async (areaId: string, updates: Partial<GeoArea>) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('geo_areas')
        .update(updates)
        .eq('id', areaId);
      
      if (error) throw error;
      
      await fetchGeoAreas();
      toast.success('Geo area updated');
    } catch (error) {
      console.error('Error updating geo area:', error);
      toast.error('Failed to update geo area');
    } finally {
      setLoading(false);
    }
  };

  // Delete geo area
  const deleteGeoArea = async (areaId: string) => {
    const previous = geoAreas;
    // Optimistic update: remove locally first
    setGeoAreas((prev) => prev.filter((a) => a.id !== areaId));
    try {
      setLoading(true);
      const { error } = await supabase
        .from('geo_areas')
        .update({ is_active: false })
        .eq('id', areaId);
      if (error) throw error;
      await fetchGeoAreas();
      toast.success('Geo area deleted');
    } catch (error) {
      console.error('Error deleting geo area:', error);
      // Revert on failure
      setGeoAreas(previous);
      toast.error('Failed to delete geo area');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchGeoAreas();
      fetchVenues();
      fetchWalkCards();
    }
  }, [user]);

  return {
    geoAreas,
    venues,
    walkCards,
    walkEntries,
    allWalkEntries,
    loading,
    fetchGeoAreas,
    fetchVenues,
    fetchWalkCards,
    fetchWalkEntries,
    fetchAllWalkEntries,
    fetchWalkCardGeoAreas,
    addGeoAreaToWalkCard,
    removeGeoAreaFromWalkCard,
    createWalkCard,
    updateWalkCardStatus,
    updateWalkCard,
    upsertWalkEntry,
    createGeoArea,
    createVenue,
    updateVenue,
    deleteVenue,
    updateGeoArea,
    deleteGeoArea,
    recalculateAllCapacityPercentages,
  };
};