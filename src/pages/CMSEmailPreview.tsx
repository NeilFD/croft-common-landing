import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface EmailContent {
  content_key: string;
  content_value: string;
}

export default function CMSEmailPreview() {
  const { template } = useParams<{ template: string }>();
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchContent();
  }, [template]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cms_global_content')
        .select('content_key, content_value')
        .eq('content_type', 'email_template')
        .like('content_key', `${template}_email_%`)
        .eq('published', true);

      if (error) throw error;

      const contentMap = data.reduce((acc, item) => {
        acc[item.content_key] = item.content_value;
        return acc;
      }, {} as Record<string, string>);

      setContent(contentMap);
    } catch (error) {
      console.error('Error fetching email content:', error);
      toast({
        title: "Error",
        description: "Failed to load email preview.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateEmailHtml = () => {
    if (template === 'welcome') {
      return generateWelcomeEmailHtml();
    } else if (template === 'cinema') {
      return generateCinemaEmailHtml();
    } else if (template === 'event') {
      return generateEventEmailHtml();
    }
    return '<p>Preview not available for this template</p>';
  };

  // Helper function to dynamically render numbered fields
  const renderDynamicFields = (pattern: string, wrapperFn?: (content: string, index: number, array: string[]) => string) => {
    const fields = Object.keys(content)
      .filter(key => key.match(new RegExp(pattern.replace('*', '\\d+'))))
      .sort((a, b) => {
        const aNum = parseInt(a.match(/_(\d+)$/)?.[1] || '0');
        const bNum = parseInt(b.match(/_(\d+)$/)?.[1] || '0');
        return aNum - bNum;
      });
    
    const values = fields.map(key => content[key] || '').filter(val => val.trim());
    
    return values.map((value, index) => {
      return wrapperFn ? wrapperFn(value, index, values) : value;
    }).join('');
  };

  const generateWelcomeEmailHtml = () => {
    const displayName = 'John';
    const baseUrl = 'http://croftcommontest.com';
    const logoUrl = `${baseUrl}/brand/logo.png`;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=Work+Sans:wght@400;600&display=swap" rel="stylesheet">
        <title>${content.welcome_email_subject || 'Welcome Email'}</title>
      </head>
      <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); font-family: 'Work Sans', Arial, sans-serif;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Unlock The Common Room with Lucky No 7 — look for the ⑦ in the top-right, draw it to reveal secret pages.</div>
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
          
          <!-- Header with Logo -->
          <div style="background: #ffffff; padding: 40px 20px; text-align: center; border-bottom: 4px solid #ff1b6b;">
            <img src="${logoUrl}"
                 alt="Croft Common Logo" 
                 style="width: 90px; height: 90px; margin: 0 auto 20px; display: block; object-fit: contain;" />
            <h1 style="color: #000000; font-family: 'Oswald', Arial Black, sans-serif; font-size: 32px; font-weight: 700; letter-spacing: 0.2em; margin: 0; text-transform: uppercase;">${content.welcome_email_header_title || 'CROFT COMMON'}</h1>
            <div style="width: 40px; height: 3px; background: #ff1b6b; margin: 15px auto 0;"></div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: #000000; font-family: 'Oswald', Arial Black, sans-serif; font-size: 24px; font-weight: 400; letter-spacing: 0.05em; margin: 0 0 30px 0; text-transform: uppercase;">
              ${(content.welcome_email_greeting_template || 'Hi {displayName},').replace('{displayName}', displayName)}
            </h2>
            
            <p style="color: #333333; font-family: 'Work Sans', Arial, sans-serif; font-size: 18px; line-height: 1.7; margin: 0 0 25px 0; font-weight: 400;">
              ${content.welcome_email_intro_text || ''}
            </p>
            
            <div style="padding: 30px 0; border-top: 1px solid #e5e5e5; border-bottom: 1px solid #e5e5e5; margin: 30px 0;">
              <p style="color: #1a1a1a; font-family: 'Work Sans', Arial, sans-serif; font-size: 16px; line-height: 1.8; margin: 0 0 15px 0;">${content.welcome_email_seven_intro || ''}</p>
              <p style="color: #1a1a1a; font-family: 'Work Sans', Arial, sans-serif; font-size: 16px; line-height: 1.8; margin: 0 0 15px 0;">${content.welcome_email_seven_context || ''}</p>
              <p style="color: #1a1a1a; font-family: 'Work Sans', Arial, sans-serif; font-size: 16px; line-height: 1.8; margin: 0 0 15px 0;">${content.welcome_email_seven_everywhere || ''}</p>
              <p style="color: #ff1b6b; font-family: 'Work Sans', Arial, sans-serif; font-size: 16px; line-height: 1.8; margin: 0; font-weight: 600;">${content.welcome_email_seven_conclusion || ''}</p>
            </div>
            
            <!-- Call to Action Box -->
            <div style="background: #ffffff; padding: 35px; margin: 35px 0; border: 2px solid #ff1b6b;">
              <h3 style="color: #000000; font-family: 'Oswald', Arial Black, sans-serif; font-size: 20px; font-weight: 700; letter-spacing: 0.1em; margin: 0 0 20px 0; text-transform: uppercase; text-align: center;">
                ${content.welcome_email_cta_title || ''}
              </h3>
              <p style="color: #333333; font-family: 'Work Sans', Arial, sans-serif; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0; text-align: center;">
                ${(content.welcome_email_cta_instructions || '').replace('{baseUrl}', baseUrl)}
              </p>
              <div style="background: #f8f8f8; border: 1px solid #ff1b6b; padding: 20px; margin: 20px 0; text-align: left;">
                ${renderDynamicFields('welcome_email_instruction_*', (instruction, index, array) => `
                  <p style="color: #000000; font-family: 'Work Sans', Arial, sans-serif; font-size: 18px; font-weight: 400; margin: 0 0 ${index === array.length - 1 ? '0' : '8px'} 0; letter-spacing: 0.05em;">${instruction}</p>
                `)}
              </div>
            </div>
            
            <div style="padding: 24px; border: 1px solid #eaeaea; background: #f9fafb; margin: 24px 0;">
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                <span style="display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:999px; background:#111; color:#ffffff; font-weight:700; font-family:'Oswald', Arial, sans-serif;">⑦</span>
                <span style="font-family: 'Oswald', Arial Black, sans-serif; letter-spacing: 0.08em; text-transform: uppercase; font-weight:700;">${content.welcome_email_visual_cue_title || ''}</span>
              </div>
              ${renderDynamicFields('welcome_email_visual_cue_*', (cue, index, array) => `
                <p style="color:#1a1a1a; font-family:'Work Sans', Arial, sans-serif; font-size:16px; line-height:1.6; margin:0 ${index === array.length - 1 ? '0' : '0 6px 0'};">${cue}</p>
              `)}
            </div>
            
            ${renderDynamicFields('welcome_email_closing_*', (closing, index, array) => `
              <p style="color: #333333; font-family: 'Work Sans', Arial, sans-serif; font-size: 16px; line-height: 1.7; margin: 0 0 ${index === array.length - 1 ? '40px' : '25px'} 0;">${closing}</p>
            `)}
            
            <div style="text-align: right; border-top: 1px solid #e5e5e5; padding-top: 25px;">
              <p style="color: #1a1a1a; font-family: 'Oswald', Arial, sans-serif; font-size: 16px; font-weight: 400; margin: 0; letter-spacing: 0.1em;">${content.welcome_email_signature || ''}</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #ffffff; padding: 30px; text-align: center; border-top: 2px solid #ff1b6b;">
            <div style="margin-bottom: 20px;">
              <img src="${logoUrl}" 
                   alt="Croft Common Logo" 
                   style="width: 45px; height: 45px; margin: 0 auto; display: block; object-fit: contain;" />
            </div>
            <p style="color: #333333; font-family: 'Work Sans', Arial, sans-serif; font-size: 13px; line-height: 1.5; margin: 0 0 10px 0;">${content.welcome_email_unsubscribe_text || ''}</p>
            <p style="color: #666666; font-family: 'Work Sans', Arial, sans-serif; font-size: 12px; line-height: 1.4; margin: 0;">${content.welcome_email_footer_address || ''}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const generateCinemaEmailHtml = () => {
    const sampleData = {
      primaryName: 'John Doe',
      guestName: 'Jane Smith',
      quantity: 2,
      ticketNumbers: [12, 13],
      title: 'Blade Runner 2049',
      screeningDate: '2024-02-29',
      doorsTime: '19:00',
      screeningTime: '19:30'
    };

    const logoPath = "/lovable-uploads/63419cda-09bf-4b7a-a6d0-d276c42efc8f.png";
    const logoUrl = `http://croftcommontest.com${logoPath}`;
    const dateStr = new Date(sampleData.screeningDate).toLocaleDateString(undefined, { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    const namesLine = sampleData.quantity === 2 && sampleData.guestName
      ? `${sampleData.primaryName} + ${sampleData.guestName}`
      : sampleData.primaryName;

    const ticketBadge = (num: number) => `
      <span style="display:inline-block; border:2px dashed #cfcfd4; padding:8px 12px; border-radius:999px; background:#f2f3f7; margin-right:16px; margin-bottom:12px;">
        <img src="${logoUrl}" alt="Croft Common cinema ticket" width="28" height="28" style="display:inline-block; vertical-align:middle; border-radius:6px; margin-right:8px;" />
        <span style="display:inline-block; vertical-align:middle; font-size:14px; font-weight:700; color:#111;">${content.cinema_email_ticket_label || 'Ticket #'}${num}</span>
      </span>`;

    const badges = sampleData.ticketNumbers.map(ticketBadge).join('');

    return `
      <div style="font-family: Arial, Helvetica, sans-serif; background:#f7f7f9; padding:24px; color:#111; line-height:1.55;">
        <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; border:1px solid #eee; overflow:hidden;">
          <div style="padding:14px 18px; border-bottom:1px solid #f0f0f0; background:#0b0b0c; color:#ffffff;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td style="vertical-align:middle; width:40px;">
                  <img src="${logoUrl}" alt="Croft Common" width="32" height="32" style="display:block; background:#ffffff; border-radius:6px;" />
                </td>
                <td style="vertical-align:middle; padding-left:18px;">
                  <div style="font-weight:700; font-size:16px; color:#ffffff;">${content.cinema_email_header_brand || 'Croft Common • Secret Cinema'}</div>
                </td>
              </tr>
            </table>
          </div>
          <div style="padding:22px;">
            <h2 style="margin:0 0 10px 0; font-size:22px; color:#111;">${content.cinema_email_confirmation_title || 'Your tickets are confirmed'}</h2>
            <div style="margin:6px 0 14px 0;">${badges}</div>
            <p style="margin:0 0 8px 0; font-weight:700; font-size:16px;">${sampleData.title}</p>
            <p style="margin:0 0 8px 0;">
              <strong>When:</strong> ${dateStr}<br/>
              <strong>Doors:</strong> ${sampleData.doorsTime} · <strong>Screening:</strong> ${sampleData.screeningTime}
            </p>
            <p style="margin:0 0 8px 0;">
              <strong>Name${sampleData.quantity === 2 ? 's' : ''}:</strong> ${namesLine}
            </p>
            <p style="margin:16px 0 0 0; color:#555;">${content.cinema_email_tagline || ''}</p>
          </div>
        </div>
      </div>
    `;
  };

  const generateEventEmailHtml = () => {
    const sampleData = {
      eventTitle: 'Summer Music Festival',
      eventDate: '2024-08-15',
      eventTime: '18:00',
      eventLocation: 'Croft Common Main Hall',
      isNewEvent: true
    };

    const isNewEvent = sampleData.isNewEvent;
    const managementUrl = 'https://example.com/manage-event/sample-token';

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; margin-bottom: 24px;">
          ${isNewEvent ? (content.event_email_header_new || 'Event Created Successfully!') : (content.event_email_header_update || 'Event Management Access')}
        </h1>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <h2 style="color: #333; margin: 0 0 16px 0; font-size: 18px;">${sampleData.eventTitle}</h2>
          <p style="margin: 8px 0; color: #666;"><strong>Date:</strong> ${sampleData.eventDate}</p>
          <p style="margin: 8px 0; color: #666;"><strong>Time:</strong> ${sampleData.eventTime}</p>
          <p style="margin: 8px 0; color: #666;"><strong>Location:</strong> ${sampleData.eventLocation}</p>
        </div>

        <div style="margin-bottom: 24px;">
          <p style="color: #333; margin-bottom: 16px;">
            ${isNewEvent 
              ? (content.event_email_intro_new || 'Your event has been created! Use the secure link below to manage your event:')
              : (content.event_email_intro_update || 'Use this secure link to manage your event:')
            }
          </p>
          
          <a href="${managementUrl}" 
             style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            ${content.event_email_cta_text || 'Manage Event'}
          </a>
        </div>

        <div style="background: #e3f2fd; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
          <h3 style="color: #1976d2; margin: 0 0 12px 0; font-size: 16px;">${content.event_email_features_title || 'What you can do:'}</h3>
          <ul style="color: #333; margin: 0; padding-left: 20px;">
            ${renderDynamicFields('event_email_feature_*', (feature) => `<li>${feature}</li>`)}
          </ul>
        </div>

        <div style="border-top: 1px solid #eee; padding-top: 16px; color: #666; font-size: 14px;">
          <p><strong>Important:</strong> ${content.event_email_security_warning || 'Keep this management link secure.'}</p>
          <p>${content.event_email_support_text || 'If you lose this link, contact support.'}</p>
        </div>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p>${content.event_email_disclaimer || 'This is an automated message.'}</p>
        </div>
      </div>
    `;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-pulse bg-muted h-8 w-48 mx-auto mb-4 rounded"></div>
              <div className="text-muted-foreground">Loading email preview...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold capitalize">{template} Email Preview</h1>
              <p className="text-muted-foreground">Live preview of email template with current content</p>
            </div>
          </div>
          <Button variant="outline" onClick={fetchContent}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Email Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="border rounded-lg p-4 bg-white"
              style={{ maxHeight: '80vh', overflow: 'auto' }}
              dangerouslySetInnerHTML={{ __html: generateEmailHtml() }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}