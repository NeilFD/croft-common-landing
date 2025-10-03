-- Add is_cleo field to messages table for AI assistant identification
ALTER TABLE messages ADD COLUMN is_cleo BOOLEAN NOT NULL DEFAULT false;

-- Add index for faster Cleo message queries
CREATE INDEX idx_messages_is_cleo ON messages(is_cleo) WHERE is_cleo = true;

-- Update existing messages table comment
COMMENT ON COLUMN messages.is_cleo IS 'Identifies messages sent by Cleo AI assistant';
