-- Fix client_files foreign key to reference management_events instead of events
ALTER TABLE client_files 
  DROP CONSTRAINT IF EXISTS client_files_event_id_fkey;

ALTER TABLE client_files 
  ADD CONSTRAINT client_files_event_id_fkey 
  FOREIGN KEY (event_id) 
  REFERENCES management_events(id) 
  ON DELETE CASCADE;