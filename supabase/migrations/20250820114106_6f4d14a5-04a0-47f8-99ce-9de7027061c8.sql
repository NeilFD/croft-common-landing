-- Create analytics tables for tracking user behavior
-- All tables have admin-only access via RLS policies

-- User sessions table
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  user_agent TEXT,
  referrer TEXT,
  ip_address INET,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  is_authenticated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Page views table
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID,
  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  time_spent_seconds INTEGER DEFAULT 0,
  scroll_depth_percent INTEGER DEFAULT 0,
  is_bounce BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User interactions table
CREATE TABLE public.user_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID,
  page_path TEXT NOT NULL,
  interaction_type TEXT NOT NULL, -- 'click', 'hover', 'scroll', 'form_submit', 'gesture', etc.
  element_id TEXT,
  element_class TEXT,
  element_text TEXT,
  coordinates JSONB, -- {x: number, y: number}
  additional_data JSONB,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User journeys table
CREATE TABLE public.user_journeys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID,
  from_page TEXT,
  to_page TEXT NOT NULL,
  transition_type TEXT, -- 'navigation', 'back', 'forward', 'refresh', 'external'
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all analytics tables
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_journeys ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - Admin-only access for all analytics tables
CREATE POLICY "Admin-only access to user sessions" 
ON public.user_sessions 
FOR ALL 
USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "Admin-only access to page views" 
ON public.page_views 
FOR ALL 
USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "Admin-only access to user interactions" 
ON public.user_interactions 
FOR ALL 
USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "Admin-only access to user journeys" 
ON public.user_journeys 
FOR ALL 
USING (is_email_domain_allowed(get_user_email()));

-- Create indexes for better query performance
CREATE INDEX idx_user_sessions_session_id ON public.user_sessions(session_id);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_started_at ON public.user_sessions(started_at);

CREATE INDEX idx_page_views_session_id ON public.page_views(session_id);
CREATE INDEX idx_page_views_user_id ON public.page_views(user_id);
CREATE INDEX idx_page_views_page_path ON public.page_views(page_path);
CREATE INDEX idx_page_views_viewed_at ON public.page_views(viewed_at);

CREATE INDEX idx_user_interactions_session_id ON public.user_interactions(session_id);
CREATE INDEX idx_user_interactions_user_id ON public.user_interactions(user_id);
CREATE INDEX idx_user_interactions_page_path ON public.user_interactions(page_path);
CREATE INDEX idx_user_interactions_type ON public.user_interactions(interaction_type);
CREATE INDEX idx_user_interactions_occurred_at ON public.user_interactions(occurred_at);

CREATE INDEX idx_user_journeys_session_id ON public.user_journeys(session_id);
CREATE INDEX idx_user_journeys_user_id ON public.user_journeys(user_id);
CREATE INDEX idx_user_journeys_from_page ON public.user_journeys(from_page);
CREATE INDEX idx_user_journeys_to_page ON public.user_journeys(to_page);
CREATE INDEX idx_user_journeys_occurred_at ON public.user_journeys(occurred_at);