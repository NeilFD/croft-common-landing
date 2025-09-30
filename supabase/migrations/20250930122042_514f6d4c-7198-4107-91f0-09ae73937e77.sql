-- Update BEO table foreign keys to point to management_events instead of events

-- Drop existing foreign key constraints
ALTER TABLE event_menus DROP CONSTRAINT IF EXISTS event_menus_event_id_fkey;
ALTER TABLE event_staffing DROP CONSTRAINT IF EXISTS event_staffing_event_id_fkey;
ALTER TABLE event_schedule DROP CONSTRAINT IF EXISTS event_schedule_event_id_fkey;
ALTER TABLE event_room_layouts DROP CONSTRAINT IF EXISTS event_room_layouts_event_id_fkey;
ALTER TABLE event_equipment DROP CONSTRAINT IF EXISTS event_equipment_event_id_fkey;
ALTER TABLE event_beo_versions DROP CONSTRAINT IF EXISTS event_beo_versions_event_id_fkey;

-- Add new foreign key constraints pointing to management_events
ALTER TABLE event_menus 
  ADD CONSTRAINT event_menus_event_id_fkey 
  FOREIGN KEY (event_id) REFERENCES management_events(id) ON DELETE CASCADE;

ALTER TABLE event_staffing 
  ADD CONSTRAINT event_staffing_event_id_fkey 
  FOREIGN KEY (event_id) REFERENCES management_events(id) ON DELETE CASCADE;

ALTER TABLE event_schedule 
  ADD CONSTRAINT event_schedule_event_id_fkey 
  FOREIGN KEY (event_id) REFERENCES management_events(id) ON DELETE CASCADE;

ALTER TABLE event_room_layouts 
  ADD CONSTRAINT event_room_layouts_event_id_fkey 
  FOREIGN KEY (event_id) REFERENCES management_events(id) ON DELETE CASCADE;

ALTER TABLE event_equipment 
  ADD CONSTRAINT event_equipment_event_id_fkey 
  FOREIGN KEY (event_id) REFERENCES management_events(id) ON DELETE CASCADE;

ALTER TABLE event_beo_versions 
  ADD CONSTRAINT event_beo_versions_event_id_fkey 
  FOREIGN KEY (event_id) REFERENCES management_events(id) ON DELETE CASCADE;