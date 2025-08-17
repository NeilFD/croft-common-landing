import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Save, Eye, TestTube } from 'lucide-react';

interface EmailContent {
  id: string;
  content_key: string;
  content_value: string;
  published: boolean;
}

interface EmailTemplateManagerProps {
  templateType: 'welcome' | 'cinema' | 'event';
}

const templateConfig = {
  welcome: {
    title: 'Welcome Email Template',
    description: 'Email sent to new subscribers when they join the mailing list',
    previewUrl: '/cms/email-templates/welcome/preview'
  },
  cinema: {
    title: 'Cinema Ticket Email Template', 
    description: 'Email sent to users when they book cinema tickets',
    previewUrl: '/cms/email-templates/cinema/preview'
  },
  event: {
    title: 'Event Management Email Template',
    description: 'Email sent to event organizers with management links',
    previewUrl: '/cms/email-templates/event/preview'
  }
};

const contentSections = {
  welcome: {
    'Email Settings': [
      'welcome_email_from_address',
      'welcome_email_subject'
    ],
    'Header & Greeting': [
      'welcome_email_header_title',
      'welcome_email_greeting_template'
    ],
    'Main Content': [
      'welcome_email_intro_text',
      'welcome_email_seven_intro',
      'welcome_email_seven_context', 
      'welcome_email_seven_everywhere',
      'welcome_email_seven_conclusion'
    ],
    'Call to Action': [
      'welcome_email_cta_title',
      'welcome_email_cta_instructions'
    ],
    'Instructions': [
      'welcome_email_instruction_1',
      'welcome_email_instruction_2',
      'welcome_email_instruction_3',
      'welcome_email_instruction_4'
    ],
    'Visual Cue Section': [
      'welcome_email_visual_cue_title',
      'welcome_email_visual_cue_1',
      'welcome_email_visual_cue_2',
      'welcome_email_visual_cue_3',
      'welcome_email_visual_cue_4'
    ],
    'Closing Content': [
      'welcome_email_closing_1',
      'welcome_email_closing_2',
      'welcome_email_closing_3'
    ],
    'Signature & Footer': [
      'welcome_email_signature',
      'welcome_email_unsubscribe_text',
      'welcome_email_footer_address'
    ]
  },
  cinema: {
    'Email Settings': [
      'cinema_email_from_address',
      'cinema_email_subject_template'
    ],
    'Content': [
      'cinema_email_header_brand',
      'cinema_email_confirmation_title',
      'cinema_email_ticket_label',
      'cinema_email_tagline'
    ]
  },
  event: {
    'Email Settings': [
      'event_email_from_address',
      'event_email_subject_new',
      'event_email_subject_update'
    ],
    'Headers': [
      'event_email_header_new',
      'event_email_header_update'
    ],
    'Content': [
      'event_email_intro_new',
      'event_email_intro_update',
      'event_email_cta_text'
    ],
    'Features Section': [
      'event_email_features_title',
      'event_email_feature_1',
      'event_email_feature_2',
      'event_email_feature_3',
      'event_email_feature_4'
    ],
    'Footer Content': [
      'event_email_security_warning',
      'event_email_support_text',
      'event_email_disclaimer'
    ]
  }
};

export const EmailTemplateManager = ({ templateType }: EmailTemplateManagerProps) => {
  const [content, setContent] = useState<Record<string, EmailContent>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const config = templateConfig[templateType];
  const sections = contentSections[templateType];

  useEffect(() => {
    fetchContent();
  }, [templateType]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cms_global_content')
        .select('*')
        .eq('content_type', 'email_template')
        .like('content_key', `${templateType}_email_%`);

      if (error) throw error;

      const contentMap = data.reduce((acc, item) => {
        acc[item.content_key] = item;
        return acc;
      }, {} as Record<string, EmailContent>);

      setContent(contentMap);
    } catch (error) {
      console.error('Error fetching email content:', error);
      toast({
        title: "Error",
        description: "Failed to load email content.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateContent = async (key: string, value: string) => {
    setSaving(key);
    try {
      const { error } = await supabase
        .from('cms_global_content')
        .update({ 
          content_value: value,
          created_by: user?.id
        })
        .eq('content_key', key);

      if (error) throw error;

      setContent(prev => ({
        ...prev,
        [key]: { ...prev[key], content_value: value }
      }));

      toast({
        title: "Content Updated",
        description: `Successfully updated ${key.replace(/_/g, ' ')}`,
      });
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Error",
        description: "Failed to update content.",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setContent(prev => ({
      ...prev,
      [key]: { ...prev[key], content_value: value }
    }));
  };

  const getFieldLabel = (key: string) => {
    return key
      .replace(`${templateType}_email_`, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const getFieldDescription = (key: string) => {
    const descriptions: Record<string, string> = {
      'from_address': 'Email address and name that appears in the From field',
      'subject': 'Subject line of the email',
      'greeting_template': 'Use {displayName} for dynamic name insertion',
      'cta_instructions': 'Use {baseUrl} for dynamic URL insertion',
      'subject_template': 'Use {title}, {plural}, {ticketNumbers} for dynamic content',
      'subject_new': 'Use {eventTitle} for dynamic event title',
      'subject_update': 'Use {eventTitle} for dynamic event title'
    };

    const suffix = key.split('_').pop() || '';
    return descriptions[suffix] || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-pulse bg-muted h-8 w-48 mx-auto mb-4 rounded"></div>
          <div className="text-muted-foreground">Loading email template...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{config.title}</h1>
            <p className="text-muted-foreground">{config.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={config.previewUrl} target="_blank" rel="noopener noreferrer">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </a>
          </Button>
          <Button variant="outline" size="sm">
            <TestTube className="h-4 w-4 mr-2" />
            Send Test
          </Button>
        </div>
      </div>

      <Tabs defaultValue={Object.keys(sections)[0]} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4">
          {Object.keys(sections).map((section) => (
            <TabsTrigger key={section} value={section} className="text-xs">
              {section}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(sections).map(([sectionName, keys]) => (
          <TabsContent key={sectionName} value={sectionName}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {sectionName}
                  <Badge variant="secondary">{keys.length} fields</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {keys.map((key, index) => {
                  const item = content[key];
                  if (!item) return null;

                  const isTextarea = item.content_value.length > 100 || 
                                   item.content_value.includes('\n') ||
                                   key.includes('instruction') ||
                                   key.includes('closing') ||
                                   key.includes('tagline');

                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">
                            {getFieldLabel(key)}
                          </label>
                          {getFieldDescription(key) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {getFieldDescription(key)}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateContent(key, item.content_value)}
                          disabled={saving === key}
                        >
                          {saving === key ? (
                            <>Saving...</>
                          ) : (
                            <>
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </>
                          )}
                        </Button>
                      </div>

                      {isTextarea ? (
                        <Textarea
                          value={item.content_value}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          className="min-h-[80px]"
                          placeholder={`Enter ${getFieldLabel(key).toLowerCase()}...`}
                        />
                      ) : (
                        <Input
                          value={item.content_value}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          placeholder={`Enter ${getFieldLabel(key).toLowerCase()}...`}
                        />
                      )}

                      {index < keys.length - 1 && <Separator className="mt-4" />}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};