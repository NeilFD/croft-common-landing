-- Create enhanced CMS tables for comprehensive content management

-- Menu sections table for organizing menu items
CREATE TABLE public.cms_menu_sections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    page VARCHAR(100) NOT NULL,
    section_name VARCHAR(200) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    published BOOLEAN NOT NULL DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Menu items table for individual menu entries
CREATE TABLE public.cms_menu_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    section_id UUID NOT NULL REFERENCES public.cms_menu_sections(id) ON DELETE CASCADE,
    item_name VARCHAR(200) NOT NULL,
    price VARCHAR(50),
    description TEXT,
    is_email BOOLEAN NOT NULL DEFAULT false,
    is_link BOOLEAN NOT NULL DEFAULT false,
    link_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    published BOOLEAN NOT NULL DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Global content table for footer, navigation, subscription forms
CREATE TABLE public.cms_global_content (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    content_type VARCHAR(100) NOT NULL, -- 'footer', 'subscription_form', 'navigation'
    content_key VARCHAR(200) NOT NULL,
    content_value TEXT NOT NULL,
    content_data JSONB,
    published BOOLEAN NOT NULL DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(content_type, content_key)
);

-- Modal content table for all modal dialogs
CREATE TABLE public.cms_modal_content (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    modal_type VARCHAR(100) NOT NULL, -- 'auth', 'membership', 'booking', 'secret_beer', etc.
    content_section VARCHAR(200) NOT NULL,
    content_key VARCHAR(200) NOT NULL,
    content_value TEXT NOT NULL,
    content_data JSONB,
    published BOOLEAN NOT NULL DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(modal_type, content_section, content_key)
);

-- Enable RLS on all new tables
ALTER TABLE public.cms_menu_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_global_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_modal_content ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for menu sections
CREATE POLICY "CMS menu sections - allowed domain users can view all" 
ON public.cms_menu_sections 
FOR SELECT 
USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "CMS menu sections - allowed domain users can insert" 
ON public.cms_menu_sections 
FOR INSERT 
WITH CHECK (is_email_domain_allowed(get_user_email()) AND auth.uid() = created_by);

CREATE POLICY "CMS menu sections - allowed domain users can update" 
ON public.cms_menu_sections 
FOR UPDATE 
USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "CMS menu sections - allowed domain users can delete" 
ON public.cms_menu_sections 
FOR DELETE 
USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "Public can view published menu sections" 
ON public.cms_menu_sections 
FOR SELECT 
USING (published = true);

-- Create RLS policies for menu items
CREATE POLICY "CMS menu items - allowed domain users can view all" 
ON public.cms_menu_items 
FOR SELECT 
USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "CMS menu items - allowed domain users can insert" 
ON public.cms_menu_items 
FOR INSERT 
WITH CHECK (is_email_domain_allowed(get_user_email()) AND auth.uid() = created_by);

CREATE POLICY "CMS menu items - allowed domain users can update" 
ON public.cms_menu_items 
FOR UPDATE 
USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "CMS menu items - allowed domain users can delete" 
ON public.cms_menu_items 
FOR DELETE 
USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "Public can view published menu items" 
ON public.cms_menu_items 
FOR SELECT 
USING (published = true);

-- Create RLS policies for global content
CREATE POLICY "CMS global content - allowed domain users can view all" 
ON public.cms_global_content 
FOR SELECT 
USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "CMS global content - allowed domain users can insert" 
ON public.cms_global_content 
FOR INSERT 
WITH CHECK (is_email_domain_allowed(get_user_email()) AND auth.uid() = created_by);

CREATE POLICY "CMS global content - allowed domain users can update" 
ON public.cms_global_content 
FOR UPDATE 
USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "CMS global content - allowed domain users can delete" 
ON public.cms_global_content 
FOR DELETE 
USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "Public can view published global content" 
ON public.cms_global_content 
FOR SELECT 
USING (published = true);

-- Create RLS policies for modal content
CREATE POLICY "CMS modal content - allowed domain users can view all" 
ON public.cms_modal_content 
FOR SELECT 
USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "CMS modal content - allowed domain users can insert" 
ON public.cms_modal_content 
FOR INSERT 
WITH CHECK (is_email_domain_allowed(get_user_email()) AND auth.uid() = created_by);

CREATE POLICY "CMS modal content - allowed domain users can update" 
ON public.cms_modal_content 
FOR UPDATE 
USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "CMS modal content - allowed domain users can delete" 
ON public.cms_modal_content 
FOR DELETE 
USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "Public can view published modal content" 
ON public.cms_modal_content 
FOR SELECT 
USING (published = true);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_cms_menu_sections_updated_at
    BEFORE UPDATE ON public.cms_menu_sections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cms_menu_items_updated_at
    BEFORE UPDATE ON public.cms_menu_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cms_global_content_updated_at
    BEFORE UPDATE ON public.cms_global_content
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cms_modal_content_updated_at
    BEFORE UPDATE ON public.cms_modal_content
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_cms_menu_sections_page ON public.cms_menu_sections(page, sort_order);
CREATE INDEX idx_cms_menu_items_section ON public.cms_menu_items(section_id, sort_order);
CREATE INDEX idx_cms_global_content_type ON public.cms_global_content(content_type, content_key);
CREATE INDEX idx_cms_modal_content_type ON public.cms_modal_content(modal_type, content_section);