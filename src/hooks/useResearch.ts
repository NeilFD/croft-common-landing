import { useState, useEffect } from 'react';
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
  address?: string;
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
  people_count: number;
  laptop_count: number;
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
  const [loading, setLoading] = useState(false);

  // Fetch geo areas
  const fetchGeoAreas = async () => {
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
  };

  // Fetch venues
  const fetchVenues = async () => {
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
  };

  // Fetch walk cards
  const fetchWalkCards = async () => {
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
  };

  // Fetch walk entries for a specific card
  const fetchWalkEntries = async (walkCardId: string) => {
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
  };

  // Create new walk card
  const createWalkCard = async (cardData: Partial<WalkCard>) => {
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

  // Upsert walk entry
  const upsertWalkEntry = async (entryData: Partial<WalkEntry>) => {
    try {
      const { error } = await supabase
        .from('walk_entries')
        .upsert({
          walk_card_id: entryData.walk_card_id!,
          venue_id: entryData.venue_id!,
          people_count: entryData.people_count || 0,
          laptop_count: entryData.laptop_count || 0,
          is_closed: entryData.is_closed || false,
          flag_anomaly: entryData.flag_anomaly || false,
          notes: entryData.notes,
          photo_url: entryData.photo_url,
        }, {
          onConflict: 'walk_card_id,venue_id'
        });
      
      if (error) throw error;
      
      if (entryData.walk_card_id) {
        await fetchWalkEntries(entryData.walk_card_id);
      }
    } catch (error) {
      console.error('Error updating walk entry:', error);
      toast.error('Failed to update entry');
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
  const createVenue = async (venueData: Partial<Venue>) => {
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
    loading,
    fetchGeoAreas,
    fetchVenues,
    fetchWalkCards,
    fetchWalkEntries,
    createWalkCard,
    updateWalkCardStatus,
    upsertWalkEntry,
    createGeoArea,
    createVenue,
  };
};