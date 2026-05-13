import { CHANNEL_META } from './channelMeta';

interface PreviewProps {
  body: string;
  hashtags?: string[];
  imageUrl?: string;
  ctaUrl?: string;
}

const Frame = ({ children, label, color }: { children: React.ReactNode; label: string; color: string }) => (
  <div className="border border-foreground bg-background">
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-foreground/10">
      <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-[11px] font-display uppercase tracking-wider">{label}</span>
    </div>
    <div className="p-3">{children}</div>
  </div>
);

const FAKE_HANDLE = '@crazybear';
const FAKE_NAME = 'The Crazy Bear';
const placeholder = (
  <div className="aspect-square bg-foreground/5 border border-foreground/10 flex items-center justify-center text-xs text-muted-foreground">
    No image
  </div>
);

export const InstagramPreview = ({ body, hashtags = [], imageUrl }: PreviewProps) => (
  <Frame label="Instagram" color={CHANNEL_META.instagram.color}>
    <div className="max-w-[360px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-foreground" />
        <div className="text-sm font-medium">{FAKE_HANDLE}</div>
      </div>
      {imageUrl ? <img src={imageUrl} alt="" className="aspect-square w-full object-cover" /> : placeholder}
      <div className="text-sm mt-2 whitespace-pre-wrap">
        <span className="font-medium">{FAKE_HANDLE}</span> {body}
      </div>
      {hashtags.length > 0 && <div className="text-sm text-blue-700 mt-1">{hashtags.map((h) => `#${h}`).join(' ')}</div>}
    </div>
  </Frame>
);

export const TikTokPreview = ({ body, imageUrl }: PreviewProps) => (
  <Frame label="TikTok" color={CHANNEL_META.tiktok.color}>
    <div className="max-w-[260px] mx-auto">
      <div className="aspect-[9/16] bg-foreground relative overflow-hidden">
        {imageUrl && <img src={imageUrl} alt="" className="w-full h-full object-cover opacity-80" />}
        <div className="absolute bottom-2 left-2 right-2 text-background text-xs">
          <div className="font-medium">{FAKE_HANDLE}</div>
          <div className="line-clamp-3">{body}</div>
        </div>
      </div>
    </div>
  </Frame>
);

export const FacebookPreview = ({ body, imageUrl }: PreviewProps) => (
  <Frame label="Facebook" color={CHANNEL_META.facebook.color}>
    <div className="max-w-[420px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-10 h-10 rounded-full bg-foreground" />
        <div>
          <div className="text-sm font-medium">{FAKE_NAME}</div>
          <div className="text-[11px] text-muted-foreground">Sponsored · Now</div>
        </div>
      </div>
      <div className="text-sm mb-2 whitespace-pre-wrap">{body}</div>
      {imageUrl ? <img src={imageUrl} alt="" className="w-full" /> : placeholder}
    </div>
  </Frame>
);

export const XPreview = ({ body, hashtags = [] }: PreviewProps) => {
  const text = `${body}${hashtags.length ? ' ' + hashtags.map((h) => `#${h}`).join(' ') : ''}`;
  const over = text.length > 280;
  return (
    <Frame label="X" color={CHANNEL_META.x.color}>
      <div className="max-w-[420px]">
        <div className="flex gap-2">
          <div className="w-10 h-10 rounded-full bg-foreground shrink-0" />
          <div className="flex-1">
            <div className="flex gap-1 text-sm">
              <span className="font-medium">{FAKE_NAME}</span>
              <span className="text-muted-foreground">{FAKE_HANDLE} · now</span>
            </div>
            <div className="text-sm whitespace-pre-wrap">{text}</div>
            <div className={`text-[11px] mt-1 ${over ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
              {text.length}/280
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
};

export const LinkedInPreview = ({ body, imageUrl }: PreviewProps) => (
  <Frame label="LinkedIn" color={CHANNEL_META.linkedin.color}>
    <div className="max-w-[420px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-10 h-10 bg-foreground" />
        <div>
          <div className="text-sm font-medium">{FAKE_NAME}</div>
          <div className="text-[11px] text-muted-foreground">Hospitality · Now</div>
        </div>
      </div>
      <div className="text-sm whitespace-pre-wrap mb-2">{body}</div>
      {imageUrl ? <img src={imageUrl} alt="" className="w-full" /> : placeholder}
    </div>
  </Frame>
);

export const EmailPreview = ({ body, ctaUrl }: PreviewProps) => (
  <Frame label="Email" color={CHANNEL_META.email.color}>
    <div className="max-w-[480px] border border-foreground/10">
      <div className="bg-foreground text-background px-4 py-3">
        <div className="text-[10px] uppercase tracking-wider">Bears Den</div>
        <div className="font-display text-lg">notify.crazybear.dev</div>
      </div>
      <div className="p-4 text-sm whitespace-pre-wrap">{body}</div>
      {ctaUrl && (
        <div className="px-4 pb-4">
          <span className="inline-block bg-foreground text-background px-4 py-2 text-xs font-display uppercase">
            Read more
          </span>
        </div>
      )}
    </div>
  </Frame>
);

export const WebsitePreview = ({ body, imageUrl }: PreviewProps) => (
  <Frame label="Website" color={CHANNEL_META.website.color}>
    <div className="max-w-[480px] border border-foreground">
      {imageUrl ? <img src={imageUrl} alt="" className="aspect-[16/9] w-full object-cover" /> : (
        <div className="aspect-[16/9] bg-foreground/5 flex items-center justify-center text-xs text-muted-foreground">No hero</div>
      )}
      <div className="p-3">
        <div className="font-display text-base mb-1">{body.split('\n')[0] || 'Headline'}</div>
        <div className="text-sm text-muted-foreground line-clamp-2">{body}</div>
      </div>
    </div>
  </Frame>
);

export const ChannelPreview = ({ channel, ...props }: PreviewProps & { channel: string }) => {
  switch (channel) {
    case 'instagram': return <InstagramPreview {...props} />;
    case 'tiktok': return <TikTokPreview {...props} />;
    case 'facebook': return <FacebookPreview {...props} />;
    case 'x': return <XPreview {...props} />;
    case 'linkedin': return <LinkedInPreview {...props} />;
    case 'email': return <EmailPreview {...props} />;
    case 'website': return <WebsitePreview {...props} />;
    default: return null;
  }
};
