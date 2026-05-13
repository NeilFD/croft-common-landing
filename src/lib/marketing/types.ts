export type MarketingStatus = 'draft' | 'in_review' | 'changes_requested' | 'rejected' | 'approved' | 'scheduled' | 'published' | 'archived';

export type PropertyTag = 'town' | 'country' | 'group';

export interface MarketingChannel {
  id: string;
  key: string;
  label: string;
  type: string;
  accent_color: string | null;
  character_limit: number | null;
  image_aspects: string[] | null;
  active: boolean;
  sort_order: number;
}

export interface MarketingPost {
  id: string;
  campaign_id: string | null;
  title: string | null;
  body: string | null;
  cta_text: string | null;
  cta_url: string | null;
  hashtags: string[] | null;
  scheduled_at: string | null;
  timezone: string;
  status: MarketingStatus;
  owner_id: string | null;
  property_tag: PropertyTag | null;
  content_pillar: string | null;
  locale: string;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  channels?: string[];
  asset_urls?: string[];
}

export interface MarketingCampaign {
  id: string;
  name: string;
  slug: string | null;
  goal: string | null;
  kpi: string | null;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  hero_asset_id: string | null;
  owner_id: string | null;
  status: string;
  colour: string | null;
  created_at: string;
  updated_at: string;
}

export const STATUS_LABELS: Record<MarketingStatus, string> = {
  draft: 'Draft',
  in_review: 'In review',
  changes_requested: 'Changes requested',
  rejected: 'Rejected',
  approved: 'Approved',
  scheduled: 'Scheduled',
  published: 'Published',
  archived: 'Archived',
};

export const STATUS_ORDER: MarketingStatus[] = [
  'draft',
  'in_review',
  'changes_requested',
  'approved',
  'scheduled',
  'published',
];

export const PROPERTY_LABELS: Record<PropertyTag, string> = {
  town: 'Town',
  country: 'Country',
  group: 'Group',
};
