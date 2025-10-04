import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { isInPreviewIframe } from '@/lib/env';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
interface MessageBubbleProps {
  message: {
    id: string;
    body_text: string;
    created_at: string;
    sender_name?: string;
    sender_role?: string;
    edited_at?: string | null;
    reply_to_message?: {
      sender_name: string;
      body_text: string;
    } | null;
    attachments?: Array<{
      id: string;
      url: string;
      type: string;
      mime: string;
      width?: number;
      height?: number;
    }>;
    read_by?: Array<{
      user_id: string;
      user_name: string;
      read_at: string;
    }>;
  };
  isOwn: boolean;
  isCleo?: boolean;
  isCleoThinking?: boolean;
}

// Normalise and safely parse timestamps to avoid Safari date parsing issues
function normaliseIsoTimestamp(input: string): string {
  let s = input.trim();
  // Replace space between date and time with 'T' for ISO compliance
  if (s.includes(" ")) s = s.replace(" ", "T");
  // Trim microseconds to milliseconds (Safari can choke on >3 digits)
  s = s.replace(/\.(\d{3})\d+/, ".$1");
  return s;
}

function safeParseDate(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  try {
    const s = normaliseIsoTimestamp(String(input));
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function formatTimeSafe(input: string | Date | null | undefined): string {
  const d = safeParseDate(input);
  return d ? format(d, 'HH:mm') : '';
}

// Link helpers to ensure links open reliably even inside builders/iframes
function attemptOpen(href: string) {
  // Try normal window.open
  try {
    const w = window.open(href, '_blank', 'noopener,noreferrer');
    if (w) return true;
  } catch {}

  // Try opening from the top window (some builders sandbox popups in the iframe)
  try {
    if (window.top && window.top !== window) {
      const wTop = (window.top as Window).open(href, '_blank', 'noopener,noreferrer');
      if (wTop) return true;
    }
  } catch {}

  // Last resort: synthesize a click on an anchor element
  try {
    const a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  } catch {}

  // Final fallback: navigate current tab
  try {
    window.location.href = href;
    return true;
  } catch {}

  return false;
}

function openExternal(
  e: React.MouseEvent | React.PointerEvent | React.TouchEvent,
  href?: string
) {
  if (!href) return;
  e.preventDefault();
  e.stopPropagation();
  const ok = attemptOpen(href);
  if (!ok) {
    // eslint-disable-next-line no-console
    console.warn('Failed to open link, navigation may be blocked by the preview sandbox.', href);
  }
}

function handleAuxOpen(e: React.MouseEvent, href?: string) {
  if (!href) return;
  // Middle click
  if (e.button === 1) {
    e.preventDefault();
    e.stopPropagation();
    const ok = attemptOpen(href);
    if (!ok) {
      // eslint-disable-next-line no-console
      console.warn('Failed to open link on middle click.', href);
    }
  }
}

function keyOpenExternal(e: React.KeyboardEvent, href?: string) {
  if (!href) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    e.stopPropagation();
    const ok = attemptOpen(href);
    if (!ok) {
      // eslint-disable-next-line no-console
      console.warn('Failed to open link via keyboard.', href);
    }
  }
}

async function openBeoInNewTab(rawUrl: string) {
  try {
    let fileName: string | undefined;

    // Try to extract from query params (?f= or ?fileName=)
    try {
      const u = new URL(rawUrl);
      const f = u.searchParams.get('f') || u.searchParams.get('fileName');
      if (f) fileName = f;
    } catch {}

    // Try to extract from legacy public path
    if (!fileName) {
      const marker = '/beo-documents/';
      const idx = rawUrl.indexOf(marker);
      if (idx !== -1) {
        fileName = rawUrl.substring(idx + marker.length);
      }
    }

    // Get a signed URL from the Edge Function (accepts fileName or pdfUrl)
    const { data } = await supabase.functions.invoke('get-beo-signed-url', {
      body: fileName ? { fileName } : { pdfUrl: rawUrl }
    });

    const targetUrl: string = data?.signedUrl || rawUrl;

    // Open robustly (top window first to bypass iframe popup blockers)
    try {
      if (window.top && window.top !== window) {
        const wTop = (window.top as Window).open(targetUrl, '_blank', 'noopener,noreferrer');
        if (wTop) return;
      }
    } catch {}

    const w = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    if (!w) {
      const a = document.createElement('a');
      a.href = targetUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('openBeoInNewTab failed, falling back to raw URL:', err);
    try {
      window.open(rawUrl, '_blank', 'noopener,noreferrer');
    } catch {}
  }
}

export const MessageBubble = ({ message, isOwn, isCleo, isCleoThinking }: MessageBubbleProps) => {
  const text = message.body_text ?? (message as any).body ?? '';
  const inPreview = isInPreviewIframe();
  const navigate = useNavigate();
  const goToExt = (u: string) => {
    // eslint-disable-next-line no-console
    console.info('MessageBubble: navigating to /ext for', u);
    navigate(`/ext?u=${encodeURIComponent(u)}`);
  };
  // Track URLs we've already rendered as clickable to avoid duplicates per message
  const seenUrls = useMemo(() => new Set<string>(), [message.id]);

  // Unwrap fenced code blocks that start with a "Sources:" header so links are clickable
  const unwrapSourcesFences = (text: string) => {
    return text.replace(/```([\s\S]*?)```/g, (full, inner) => {
      const lines = String(inner).split('\n');
      const firstNonEmpty = lines.findIndex((l) => l.trim() !== '');
      if (firstNonEmpty === -1) return full;
      if (/^Sources?(?:\s+URLs?)?:\s*$/i.test(lines[firstNonEmpty].trim())) {
        // Unwrap this fenced block
        return lines.slice(firstNonEmpty).join('\n');
      }
      return full;
    });
  };

  // Remove duplicate "Sources:" sections - keep only the first one (bullet/indent aware) and de-duplicate URLs
  const keepFirstSourcesBlock = (text: string) => {
    const lines = text.split('\n');
    const out: string[] = [];
    let sourcesCount = 0;
    let inSources = false;
    const keptUrls = new Set<string>();

    const normalizeUrlLine = (line: string) => {
      // Strip bullets, numbering and extra indentation
      let s = line.replace(/^\s*(?:[-*•]\s*)?(?:\d+\.\s*)?/, '').trim();
      // Remove trailing punctuation that often sticks to URLs
      s = s.replace(/[,.;:)\]]+$/, '');
      // Ensure it's URL-ish
      const urlish = /^(?:https?:\/\/|www\.)\S+|^[A-Za-z0-9][A-Za-z0-9-]*(?:\.[A-Za-z0-9-]+)+\S*$/.test(s);
      return urlish ? s : null;
    };

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const trimmed = raw.trim();
      const isHeader = /^\s*Sources?(?:\s+URLs?)?:\s*$/i.test(trimmed);

      if (isHeader) {
        sourcesCount++;
        if (sourcesCount === 1) {
          out.push('Sources:');
        }
        inSources = true; // enter sources block for both first and subsequent so we can skip their URL lines
        continue;
      }

      if (inSources) {
        const norm = normalizeUrlLine(raw);
        const isBlank = trimmed === '';
        if (sourcesCount === 1) {
          if (norm) {
            const key = norm.toLowerCase();
            if (!keptUrls.has(key)) {
              keptUrls.add(key);
              out.push(norm);
            }
            continue;
          }
          if (isBlank) {
            out.push('');
            continue;
          }
          // Non-URL, non-blank ends first sources block
          inSources = false;
          // fall-through to emit this line
        } else {
          // Subsequent sources blocks: skip URLs and blanks entirely
          if (norm || isBlank) continue;
          // Non-URL, non-blank ends the skipped block and we proceed to handle the line
          inSources = false;
        }
      }

      // Normal line outside sources (or after exiting the first block)
      out.push(raw);
    }

    if (sourcesCount > 1) {
      // eslint-disable-next-line no-console
      console.info('keepFirstSourcesBlock: removed', sourcesCount - 1, 'duplicate Sources sections');
    }
    return out.join('\n');
  };

  // Extract first Sources block into structured data
  const extractSourcesBlock = (
    text: string
  ): { pre: string; urls: string[]; post: string } => {
    const lines = text.split('\n');
    const isHeader = (s: string) => /^\s*Sources?(?:\s+URLs?)?:\s*$/i.test(s.trim());

    // Find first Sources header
    let headerIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (isHeader(lines[i])) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx === -1) return { pre: text, urls: [], post: '' };

    // Collect URL-ish lines after the header until a non-blank, non-URL line
    const urls: string[] = [];
    const seen = new Set<string>();

    const normalizeUrlLine = (line: string) => {
      let s = line.replace(/^\s*(?:[-*•]\s*)?(?:\d+\.\s*)?/, '').trim();
      s = s.replace(/[,.;:)\]]+$/, '');
      const urlish = /^(?:https?:\/\/|www\.)\S+|^[A-Za-z0-9][A-Za-z0-9-]*(?:\.[A-Za-z0-9-]+)+\S*$/.test(s);
      return urlish ? s : null;
    };

    let i = headerIdx + 1;
    for (; i < lines.length; i++) {
      const raw = lines[i];
      const trimmed = raw.trim();
      if (trimmed === '') {
        // keep blank spacing inside block but do not add as URL
        continue;
      }
      const norm = normalizeUrlLine(raw);
      if (norm) {
        const normalised = norm.startsWith('http://') || norm.startsWith('https://') ? norm : `https://${norm}`;
        const key = normalised.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          urls.push(normalised);
        }
      } else {
        // End of URLs block
        break;
      }
    }

    const pre = lines.slice(0, headerIdx).join('\n').trimEnd();
    const post = lines.slice(i).join('\n').trimStart();

    return { pre, urls, post };
  };
  
  // Auto-linkify URLs for Cleo markdown content - matches both http(s):// and bare domains
  // Avoids double-wrapping URLs already in markdown format
  const linkifyContent = (text: string) => {
    // Temporarily protect existing markdown links
    const mdLinks: string[] = [];
    let protectedText = text.replace(/\[[^\]]+\]\([^\)]+\)/g, (m) => {
      const idx = mdLinks.push(m) - 1;
      return `__MDLINK_${idx}__`;
    });

    // Linkify bare URLs and domains without lookbehind (broader browser support)
    protectedText = protectedText.replace(/((?:https?:\/\/|www\.)\S+|[A-Za-z0-9][A-Za-z0-9-]*(?:\.[A-Za-z0-9-]+)+\S*)/g, (match) => {
      // Ignore placeholders
      if (/^__MDLINK_\d+__$/.test(match)) return match;

      // Skip pure numbers/currency like 198.55, £1,191.30, 10%
      const candidate = match.replace(/[),.;:]+$/, '').replace(/^£/, '');
      if (/^\d{1,3}(?:,\d{3})*(?:\.\d+)?%?$/.test(candidate) || /^\d+(?:\.\d+)?%?$/.test(candidate)) {
        return match; // do not linkify
      }

      const url = match.startsWith('http://') || match.startsWith('https://') ? match : `https://${match}`;
      if (url.includes('/beo/view?f=') || (url.includes('beo-documents') && url.includes('.pdf')) || url.includes('proxy-beo-pdf')) {
        return `[📄 View BEO PDF](${url})`;
      }
      return `[${match}](${url})`;
    });

    // Restore markdown links
    return protectedText.replace(/__MDLINK_(\d+)__/g, (_, i) => mdLinks[Number(i)]);
  };

  // Process content for better markdown rendering
  let processedText = text;
  let sourcesUrls: string[] = [];
  if (isCleo) {
    // Unwrap fenced "Sources:" blocks, then extract first Sources block for deterministic rendering
    const unwrapped = unwrapSourcesFences(text);
    const { pre, urls, post } = extractSourcesBlock(unwrapped);
    sourcesUrls = urls;
    processedText = (pre + (post ? `\n\n${post}` : '')).trim();
  }
  const processedContent = linkifyContent(processedText)
    .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with 2
    .replace(/([^\n])\n([^\n])/g, '$1  \n$2'); // Convert single newlines to markdown line breaks
  
  // Parse mentions and URLs, render them as styled components (for non-Cleo messages)
  const renderTextWithMentions = (text: string) => {
    // Match @mentions - single word/username only (no spaces, like @Cleo or @John)
    const mentionRegex = /@([A-Za-z][A-Za-z0-9._-]{0,30})\b/g;
    // Match URLs - both http(s):// and bare domains
    const urlRegex = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9][a-zA-Z0-9-]*(?:\.[a-zA-Z]{2,})+(?:\/[^\s)]*)*/g;
    
    // Split by both URLs and mentions
    const parts = text.split(/(@[A-Za-z][A-Za-z0-9._-]{0,30}\b|(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9][a-zA-Z0-9-]*(?:\.[a-zA-Z]{2,})+(?:\/[^\s)]*)*)/g);
    
    return parts.map((part, i) => {
      // Check if it's a URL (need to re-test since regex has 'g' flag in split)
      const isUrl = /^(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9][a-zA-Z0-9-]*(?:\.[a-zA-Z]{2,})+(?:\/[^\s)]*)*$/.test(part);
      if (isUrl) {
        // Trim trailing punctuation from URLs
        let displayText = part;
        let trailingPunct = '';
        const punctMatch = displayText.match(/([.,!?;:)]*)$/);
        if (punctMatch && punctMatch[1]) {
          trailingPunct = punctMatch[1];
          displayText = displayText.slice(0, -trailingPunct.length);
        }
        
        // Normalize URL: add https:// if missing
        const normalizedUrl = displayText.startsWith('http://') || displayText.startsWith('https://') 
          ? displayText 
          : `https://${displayText}`;
        
        // eslint-disable-next-line no-console
        console.info('renderTextWithMentions: detected URL', displayText, '-> normalized to', normalizedUrl);
        
        // Check if it's a BEO viewer link
        const isBeoLink = normalizedUrl.includes('www.croftcommontest.com') && (normalizedUrl.includes('/beo/') || normalizedUrl.includes('/beo/view?f=') || (normalizedUrl.includes('/beo-documents') && normalizedUrl.toLowerCase().endsWith('.pdf')) || normalizedUrl.includes('proxy-beo-pdf'));
        
        // Deduplicate clickable URLs per message
        const key = normalizedUrl.toLowerCase();
        if (seenUrls.has(key)) {
          return (
            <span key={i}>
              {displayText}
              {trailingPunct}
            </span>
          );
        }
        seenUrls.add(key);
        
        return (
          <span key={i}>
            <a
              href={normalizedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-40 text-[hsl(var(--accent-pink))] hover:underline underline-offset-2 font-semibold break-all inline-block cursor-pointer pointer-events-auto"
              onClick={(e) => {
                if (isBeoLink) {
                  e.preventDefault();
                  e.stopPropagation();
                  openBeoInNewTab(normalizedUrl);
                }
              }}
            >
              {isBeoLink ? 'View BEO' : displayText}
            </a>
            {trailingPunct}
          </span>
        );
      }
      
      // Check if it's a mention (but not inside a URL) and not Cleo message
      if (mentionRegex.test(part) && !isCleo) {
        return (
          <span
            key={i}
            className="bg-[hsl(var(--accent-pink))] text-white px-1.5 py-0.5 rounded font-semibold"
          >
            {part}
          </span>
        );
      }
      
      // Regular text
      return <span key={i}>{part}</span>;
    });
  };
  const content = (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[75%] md:max-w-[70%]", isOwn && "order-2")}>
        {!isOwn && (
          <div className="mb-1 text-xs font-industrial text-muted-foreground">
            <span className="font-bold">{message.sender_name}</span>
            {message.sender_role && (
              <span className="ml-1 capitalize">({message.sender_role})</span>
            )}
          </div>
        )}
        <div
          className={cn(
            "rounded-lg pl-4 pr-10 md:px-4 py-2 break-words min-h-10 min-w-24 w-fit",
            isOwn && "bg-white text-black border border-border",
            !isOwn && !isCleo && "bg-muted text-black",
            isCleo && "bg-card text-foreground border-l-4 border-[hsl(var(--accent-pink))] shadow-sm"
          )}
        >
          {isCleo && (
            <div className="text-xs font-bold uppercase tracking-wide mb-1 text-[hsl(var(--accent-pink))]">Cleo</div>
          )}
          
          {/* Reply context bar */}
          {message.reply_to_message && (
            <div className="mb-2 pb-2 border-l-2 border-[hsl(var(--accent-pink))] pl-2 bg-muted/50 rounded-sm p-1.5 text-xs">
              <div className="font-semibold text-[hsl(var(--accent-pink))]">
                Replying to {message.reply_to_message.sender_name}:
              </div>
              <div className="text-muted-foreground mt-0.5 line-clamp-2">
                {message.reply_to_message.body_text.slice(0, 100)}
                {message.reply_to_message.body_text.length > 100 ? '...' : ''}
              </div>
            </div>
          )}
          
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-2 space-y-2">
              {message.attachments.map((att, idx) => (
                <img
                  key={att.id ?? `${att.url}-${idx}`}
                  src={att.url}
                  alt="Chat attachment image"
                  className="rounded-md max-w-full h-auto max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(att.url, '_blank')}
                />
              ))}
            </div>
          )}
          
          {/* Show thinking indicator for Cleo when message is empty AND actively thinking */}
          {!text && isCleo && isCleoThinking ? (
            <div className="flex items-center gap-2">
              <span className="font-industrial text-sm">Cleo is thinking</span>
              <div className="flex gap-1">
                <span className="animate-bounce text-sm" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-bounce text-sm" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-bounce text-sm" style={{ animationDelay: '300ms' }}>.</span>
              </div>
            </div>
          ) : text && text !== '[Image]' ? (
            isCleo ? (
              <div className="text-sm font-industrial prose prose-sm max-w-none prose-headings:font-brutalist prose-strong:text-foreground prose-em:text-foreground prose-p:my-3 prose-ul:my-2 prose-li:my-1 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="whitespace-pre-wrap leading-relaxed mb-3">{children}</p>,
                    ul: ({ children }) => <ul className="space-y-1.5 ml-4 my-2">{children}</ul>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                    em: ({ children }) => <em className="italic text-foreground">{children}</em>,
                    a: ({ href, children }) => {
                      if (!href) return <span>{children}</span>;
                      // Normalise URL to include scheme if missing
                      const normalizedUrl = href.startsWith('http://') || href.startsWith('https://')
                        ? href
                        : `https://${href}`;
                      // Treat BEO links for display label
                      const isBeoLink = normalizedUrl.includes('www.croftcommontest.com') && (normalizedUrl.includes('/beo/') || normalizedUrl.includes('/beo/view?f=') || (normalizedUrl.includes('/beo-documents') && normalizedUrl.toLowerCase().endsWith('.pdf')) || normalizedUrl.includes('proxy-beo-pdf'));

                      // Track seen URLs but always render them as clickable links in message body
                      const key = normalizedUrl.toLowerCase();
                      seenUrls.add(key);
                      
                      return (
                        <a 
                          href={normalizedUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="relative z-40 text-[hsl(var(--accent-pink))] hover:underline underline-offset-2 font-semibold break-all inline-block max-w-full cursor-pointer pointer-events-auto"
                          onClick={(e) => {
                            if (isBeoLink) {
                              e.preventDefault();
                              e.stopPropagation();
                              openBeoInNewTab(normalizedUrl);
                            }
                          }}
                        >
                          {children}
                        </a>
                      );
                    },
                  }}
                >
                  {processedContent}
                </ReactMarkdown>

                {sourcesUrls.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs font-bold uppercase tracking-wide mb-2 text-[hsl(var(--accent-pink))]">Sources</div>
                    <ul className="space-y-1.5 ml-4">
                      {sourcesUrls.map((u, idx) => {
                        const isBeoLink = u.includes('www.croftcommontest.com') && (u.includes('/beo/') || u.includes('/beo/view?f=') || (u.includes('/beo-documents') && u.toLowerCase().endsWith('.pdf')) || u.includes('proxy-beo-pdf'));
                        return (
                          <li key={`${u}-${idx}`} className="list-disc">
                            <a
                              href={u}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative z-40 text-[hsl(var(--accent-pink))] hover:underline underline-offset-2 font-semibold break-all inline-block max-w-full cursor-pointer pointer-events-auto"
                              onClick={(e) => {
                                if (isBeoLink) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  openBeoInNewTab(u);
                                }
                              }}
                            >
                              {isBeoLink ? 'View BEO' : u}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="font-industrial text-sm whitespace-pre-wrap">
                {renderTextWithMentions(text)}
              </div>
            )
          ) : null}
          
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
            <span>{formatTimeSafe(message.created_at)}</span>
            {message.edited_at && <span className="italic">(edited)</span>}
            
            {isOwn && !isCleo && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">
                      {message.read_by && message.read_by.length > 0 ? (
                        <CheckCheck className="h-3 w-3 text-blue-500" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      {message.read_by && message.read_by.length > 0 ? (
                        <div>
                          <p className="font-bold mb-1">Read by:</p>
                          {message.read_by.map((reader) => (
                            <p key={reader.user_id}>
                              {reader.user_name} at {formatTimeSafe(reader.read_at)}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p>Delivered</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  
  return content;
};
