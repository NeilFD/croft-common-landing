-- Email Template Content Migration
-- Insert all email template content into cms_global_content table

-- Welcome Email Content
INSERT INTO public.cms_global_content (content_type, content_key, content_value, published, created_by) VALUES 
-- Email settings
('email_template', 'welcome_email_from_address', 'Croft Common <hello@thehive-hospitality.com>', true, NULL),
('email_template', 'welcome_email_subject', 'You''re In', true, NULL),

-- Header content
('email_template', 'welcome_email_header_title', 'CROFT COMMON', true, NULL),
('email_template', 'welcome_email_greeting_template', 'Hi {displayName},', true, NULL),

-- Main content paragraphs
('email_template', 'welcome_email_intro_text', 'Thanks for stepping closer. You didn''t just subscribe - you crossed the threshold.', true, NULL),

-- Seven section content
('email_template', 'welcome_email_seven_intro', 'Seven''s always meant something to us.', true, NULL),
('email_template', 'welcome_email_seven_context', 'Seven days. Seven sins. Seven seas. Lucky number seven.', true, NULL),
('email_template', 'welcome_email_seven_everywhere', 'It''s everywhere.', true, NULL),
('email_template', 'welcome_email_seven_conclusion', 'Now it opens something else, it''s the key.', true, NULL),

-- CTA section
('email_template', 'welcome_email_cta_title', 'To unlock The Common Room:', true, NULL),
('email_template', 'welcome_email_cta_instructions', 'Visit {baseUrl}/common-room', true, NULL),

-- Instructions
('email_template', 'welcome_email_instruction_1', 'Draw a 7.', true, NULL),
('email_template', 'welcome_email_instruction_2', 'Boldly. A single line.', true, NULL),
('email_template', 'welcome_email_instruction_3', 'One gesture.', true, NULL),
('email_template', 'welcome_email_instruction_4', 'You''re in', true, NULL),

-- Visual cue section
('email_template', 'welcome_email_visual_cue_title', 'Visual cue', true, NULL),
('email_template', 'welcome_email_visual_cue_1', 'Look for Lucky No 7.', true, NULL),
('email_template', 'welcome_email_visual_cue_2', 'Top right around the site.', true, NULL),
('email_template', 'welcome_email_visual_cue_3', 'Draw it.', true, NULL),
('email_template', 'welcome_email_visual_cue_4', 'Unlock the good stuff.', true, NULL),

-- Closing content
('email_template', 'welcome_email_closing_1', 'Inside, you''ll find what''s not shouted. The stuff that doesn''t always make it to the flyers, the feed, or the posters.', true, NULL),
('email_template', 'welcome_email_closing_2', 'We''ll still drop into your inbox when it matters, but The Common Room is where the common knowledge lives. Quiet perks. First looks. An early heads-up.', true, NULL),
('email_template', 'welcome_email_closing_3', 'See you on the inside.', true, NULL),

-- Signature
('email_template', 'welcome_email_signature', '— CROFT COMMON', true, NULL),

-- Footer
('email_template', 'welcome_email_unsubscribe_text', 'Don''t want these emails? Unsubscribe here', true, NULL),
('email_template', 'welcome_email_footer_address', 'Croft Common, Stokes Croft, Bristol', true, NULL),

-- Cinema Email Content
('email_template', 'cinema_email_from_address', 'Secret Cinema <secretcinema@thehive-hospitality.com>', true, NULL),
('email_template', 'cinema_email_subject_template', '{title} Ticket{plural}: #{ticketNumbers}', true, NULL),
('email_template', 'cinema_email_header_brand', 'Croft Common • Secret Cinema', true, NULL),
('email_template', 'cinema_email_confirmation_title', 'Your tickets are confirmed', true, NULL),
('email_template', 'cinema_email_ticket_label', 'Ticket #', true, NULL),
('email_template', 'cinema_email_tagline', 'One night. One screen. Fifty tickets. The last Thursday of every month. Cult. Classic. Contemporary. Always uncommonly good.', true, NULL),

-- Event Management Email Content
('email_template', 'event_email_from_address', 'Events <events@thehive-hospitality.com>', true, NULL),
('email_template', 'event_email_subject_new', 'Event Management Link: {eventTitle}', true, NULL),
('email_template', 'event_email_subject_update', 'Updated Management Link: {eventTitle}', true, NULL),
('email_template', 'event_email_header_new', 'Event Created Successfully!', true, NULL),
('email_template', 'event_email_header_update', 'Event Management Access', true, NULL),
('email_template', 'event_email_intro_new', 'Your event has been created! Use the secure link below to manage your event:', true, NULL),
('email_template', 'event_email_intro_update', 'Use this secure link to manage your event:', true, NULL),
('email_template', 'event_email_cta_text', 'Manage Event', true, NULL),
('email_template', 'event_email_features_title', 'What you can do:', true, NULL),
('email_template', 'event_email_feature_1', 'Edit event details (title, description, time, location)', true, NULL),
('email_template', 'event_email_feature_2', 'Mark event as sold out', true, NULL),
('email_template', 'event_email_feature_3', 'Upload or change event images', true, NULL),
('email_template', 'event_email_feature_4', 'Delete the event if needed', true, NULL),
('email_template', 'event_email_security_warning', 'Keep this management link secure. Anyone with this link can edit your event.', true, NULL),
('email_template', 'event_email_support_text', 'If you lose this link, you can request a new one by contacting support with your event details.', true, NULL),
('email_template', 'event_email_disclaimer', 'This is an automated message. If you didn''t create this event, please ignore this email.', true, NULL);