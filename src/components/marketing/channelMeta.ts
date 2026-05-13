export const CHANNEL_META: Record<string, { label: string; color: string; charLimit?: number }> = {
  instagram: { label: 'Instagram', color: '#E1306C', charLimit: 2200 },
  tiktok: { label: 'TikTok', color: '#000000', charLimit: 2200 },
  facebook: { label: 'Facebook', color: '#1877F2', charLimit: 63206 },
  x: { label: 'X', color: '#000000', charLimit: 280 },
  linkedin: { label: 'LinkedIn', color: '#0A66C2', charLimit: 3000 },
  email: { label: 'Email', color: '#FF1F8F' },
  website: { label: 'Website', color: '#000000' },
};

export const ALL_CHANNELS = ['instagram', 'tiktok', 'facebook', 'x', 'linkedin', 'email', 'website'];
