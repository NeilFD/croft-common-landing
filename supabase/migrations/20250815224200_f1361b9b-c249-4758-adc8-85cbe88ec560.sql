-- Create CMS content management tables
CREATE TYPE cms_content_type AS ENUM ('text', 'richtext', 'json');
CREATE TYPE cms_asset_type AS ENUM ('logo', 'icon', 'hero_image', 'carousel_image');

-- CMS Content table for text content
CREATE TABLE public.cms_content (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    page VARCHAR(100) NOT NULL,
    section VARCHAR(100) NOT NULL,
    content_key VARCHAR(100) NOT NULL,
    content_type cms_content_type NOT NULL DEFAULT 'text',
    content_data JSONB NOT NULL,
    published BOOLEAN NOT NULL DEFAULT true,
    version INTEGER NOT NULL DEFAULT 1,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(page, section, content_key)
);

-- CMS Images table for all image assets
CREATE TABLE public.cms_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_type cms_asset_type NOT NULL,
    page VARCHAR(100),
    carousel_name VARCHAR(100),
    title VARCHAR(200),
    description TEXT,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(200),
    sort_order INTEGER DEFAULT 0,
    metadata JSONB,
    published BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CMS Brand Assets table for logos, fonts, colors
CREATE TABLE public.cms_brand_assets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_key VARCHAR(100) NOT NULL UNIQUE,
    asset_type VARCHAR(50) NOT NULL,
    asset_value TEXT NOT NULL,
    description TEXT,
    published BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CMS Design Tokens table for colors, fonts, spacing
CREATE TABLE public.cms_design_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    token_key VARCHAR(100) NOT NULL UNIQUE,
    token_type VARCHAR(50) NOT NULL, -- 'color', 'font', 'spacing', 'animation'
    token_value TEXT NOT NULL,
    css_variable VARCHAR(100),
    description TEXT,
    published BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all CMS tables
ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_design_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for CMS tables (using existing domain restriction function)
CREATE POLICY "CMS content - allowed domain users can view"
    ON public.cms_content FOR SELECT
    USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "CMS content - allowed domain users can insert"
    ON public.cms_content FOR INSERT
    WITH CHECK (is_email_domain_allowed(get_user_email()) AND auth.uid() = created_by);

CREATE POLICY "CMS content - allowed domain users can update"
    ON public.cms_content FOR UPDATE
    USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "CMS content - allowed domain users can delete"
    ON public.cms_content FOR DELETE
    USING (is_email_domain_allowed(get_user_email()));

-- Repeat for cms_images
CREATE POLICY "CMS images - allowed domain users can view"
    ON public.cms_images FOR SELECT
    USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "CMS images - allowed domain users can insert"
    ON public.cms_images FOR INSERT
    WITH CHECK (is_email_domain_allowed(get_user_email()) AND auth.uid() = created_by);

CREATE POLICY "CMS images - allowed domain users can update"
    ON public.cms_images FOR UPDATE
    USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "CMS images - allowed domain users can delete"
    ON public.cms_images FOR DELETE
    USING (is_email_domain_allowed(get_user_email()));

-- Repeat for cms_brand_assets
CREATE POLICY "CMS brand assets - allowed domain users can view"
    ON public.cms_brand_assets FOR SELECT
    USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "CMS brand assets - allowed domain users can insert"
    ON public.cms_brand_assets FOR INSERT
    WITH CHECK (is_email_domain_allowed(get_user_email()) AND auth.uid() = created_by);

CREATE POLICY "CMS brand assets - allowed domain users can update"
    ON public.cms_brand_assets FOR UPDATE
    USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "CMS brand assets - allowed domain users can delete"
    ON public.cms_brand_assets FOR DELETE
    USING (is_email_domain_allowed(get_user_email()));

-- Repeat for cms_design_tokens
CREATE POLICY "CMS design tokens - allowed domain users can view"
    ON public.cms_design_tokens FOR SELECT
    USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "CMS design tokens - allowed domain users can insert"
    ON public.cms_design_tokens FOR INSERT
    WITH CHECK (is_email_domain_allowed(get_user_email()) AND auth.uid() = created_by);

CREATE POLICY "CMS design tokens - allowed domain users can update"
    ON public.cms_design_tokens FOR UPDATE
    USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "CMS design tokens - allowed domain users can delete"
    ON public.cms_design_tokens FOR DELETE
    USING (is_email_domain_allowed(get_user_email()));

-- Add triggers for updated_at
CREATE TRIGGER update_cms_content_updated_at
    BEFORE UPDATE ON public.cms_content
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cms_images_updated_at
    BEFORE UPDATE ON public.cms_images
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cms_brand_assets_updated_at
    BEFORE UPDATE ON public.cms_brand_assets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cms_design_tokens_updated_at
    BEFORE UPDATE ON public.cms_design_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();