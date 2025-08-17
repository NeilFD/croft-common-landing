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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Mail, Save, Eye, TestTube, Plus, X } from 'lucide-react';

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
  const [dynamicFields, setDynamicFields] = useState<Record<string, string[]>>({});
  const { toast } = useToast();
  const { user } = useAuth();

  const config = templateConfig[templateType];
  const sections = contentSections[templateType];

  useEffect(() => {
    fetchContent();
  }, [templateType]);

  // Get all fields for a section (static + dynamic)
  const getSectionFields = (sectionName: string) => {
    const staticFields = sections[sectionName] || [];
    const dynamicFieldsForSection = dynamicFields[sectionName] || [];
    return [...staticFields, ...dynamicFieldsForSection];
  };

  // Check if a field can be deleted (protect only essential fields)
  const canDeleteField = (sectionName: string, fieldKey: string) => {
    // Protect essential fields that should never be deleted
    const protectedFields = [
      `${templateType}_email_from_address`,
      `${templateType}_email_subject`,
      `${templateType}_email_subject_template`,
      `${templateType}_email_subject_new`,
      `${templateType}_email_subject_update`
    ];
    return !protectedFields.includes(fieldKey);
  };

  // Generate next field key for a section
  const getNextFieldKey = (sectionName: string) => {
    const allFields = getSectionFields(sectionName);
    const numberedFields = allFields.filter(key => /_\d+$/.test(key));
    
    if (numberedFields.length === 0) {
      // No numbered fields exist, start with _1
      const baseKey = `${templateType}_email_${sectionName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      return `${baseKey}_1`;
    }
    
    // Find the highest number and increment
    const numbers = numberedFields.map(key => {
      const match = key.match(/_(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    });
    const maxNumber = Math.max(...numbers);
    
    // Use the base pattern from existing numbered fields
    const basePattern = numberedFields[0].replace(/_\d+$/, '');
    return `${basePattern}_${maxNumber + 1}`;
  };

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

      // Identify dynamic fields (fields that exist in DB but not in static config)
      const dynamicFieldsMap: Record<string, string[]> = {};
      Object.keys(sections).forEach(sectionName => {
        const staticFields = sections[sectionName];
        const sectionDynamicFields = Object.keys(contentMap).filter(key => {
          const belongsToSection = staticFields.some(staticField => {
            const basePattern = staticField.replace(/_\d+$/, '');
            return key.startsWith(basePattern) && key !== staticField;
          });
          return belongsToSection && !staticFields.includes(key);
        });
        if (sectionDynamicFields.length > 0) {
          dynamicFieldsMap[sectionName] = sectionDynamicFields;
        }
      });
      
      setDynamicFields(dynamicFieldsMap);
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

  // Add new field to section
  const addField = async (sectionName: string) => {
    const newFieldKey = getNextFieldKey(sectionName);
    
    try {
      const { error } = await supabase
        .from('cms_global_content')
        .insert({
          content_key: newFieldKey,
          content_value: '',
          content_type: 'email_template',
          created_by: user?.id
        });

      if (error) throw error;

      // Update local state
      setContent(prev => ({
        ...prev,
        [newFieldKey]: {
          id: crypto.randomUUID(),
          content_key: newFieldKey,
          content_value: '',
          published: true
        }
      }));

      setDynamicFields(prev => ({
        ...prev,
        [sectionName]: [...(prev[sectionName] || []), newFieldKey]
      }));

      toast({
        title: "Field Added",
        description: `New field added to ${sectionName}`,
      });
    } catch (error) {
      console.error('Error adding field:', error);
      toast({
        title: "Error",
        description: "Failed to add new field.",
        variant: "destructive",
      });
    }
  };

  // Remove field from section
  const removeField = async (sectionName: string, fieldKey: string) => {
    try {
      const { error } = await supabase
        .from('cms_global_content')
        .delete()
        .eq('content_key', fieldKey);

      if (error) throw error;

      // Update local state
      setContent(prev => {
        const newContent = { ...prev };
        delete newContent[fieldKey];
        return newContent;
      });

      setDynamicFields(prev => ({
        ...prev,
        [sectionName]: (prev[sectionName] || []).filter(key => key !== fieldKey)
      }));

      toast({
        title: "Field Removed",
        description: `Field removed from ${sectionName}`,
      });
    } catch (error) {
      console.error('Error removing field:', error);
      toast({
        title: "Error",
        description: "Failed to remove field.",
        variant: "destructive",
      });
    }
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
    <div className="flex flex-col min-h-full">
      {/* Header Section - Fixed */}
      <div className="flex-shrink-0 p-6 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Mail className="h-6 w-6 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{config.title}</h1>
              <p className="text-muted-foreground text-sm">{config.description}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
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
      </div>

      {/* Content Section - Scrollable */}
      <div className="flex-1 pt-6 min-h-0 px-6">
        <Tabs defaultValue={Object.keys(sections)[0]} className="h-full flex flex-col">
          {/* Responsive Tabs List */}
          <div className="flex-shrink-0 mb-4">
            <div className="overflow-x-auto">
              <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground min-w-max">
                {Object.keys(sections).map((section) => (
                  <TabsTrigger 
                    key={section} 
                    value={section} 
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    {section}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          {/* Tab Content - Scrollable */}
          <div className="flex-1 min-h-0">
            {Object.entries(sections).map(([sectionName, staticKeys]) => {
              const allKeys = getSectionFields(sectionName);
              
              return (
                <TabsContent key={sectionName} value={sectionName} className="h-full mt-0">
                  <div className="h-full overflow-y-auto pr-2">
                    <Card>
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-lg">
                            {sectionName}
                            <Badge variant="secondary" className="text-xs">{allKeys.length} fields</Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addField(sectionName)}
                            className="flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            Add Field
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6 pb-6">
                        {allKeys.map((key, index) => {
                          const item = content[key];
                          if (!item) return null;

                          const isTextarea = item.content_value.length > 100 || 
                                           item.content_value.includes('\n') ||
                                           key.includes('instruction') ||
                                           key.includes('closing') ||
                                           key.includes('tagline') ||
                                           key.includes('feature');

                          const canDelete = canDeleteField(sectionName, key);

                          return (
                            <div key={key} className="space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium block">
                                      {getFieldLabel(key)}
                                    </label>
                                    {canDelete && (
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Field</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to delete "{getFieldLabel(key)}"? This action cannot be undone.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => removeField(sectionName, key)}
                                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                              Delete
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    )}
                                  </div>
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
                                  className="flex-shrink-0 w-full sm:w-auto"
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

                              <div className="w-full">
                                {isTextarea ? (
                                  <Textarea
                                    value={item.content_value}
                                    onChange={(e) => handleInputChange(key, e.target.value)}
                                    className="min-h-[80px] w-full resize-y"
                                    placeholder={`Enter ${getFieldLabel(key).toLowerCase()}...`}
                                  />
                                ) : (
                                  <Input
                                    value={item.content_value}
                                    onChange={(e) => handleInputChange(key, e.target.value)}
                                    className="w-full"
                                    placeholder={`Enter ${getFieldLabel(key).toLowerCase()}...`}
                                  />
                                )}
                              </div>

                              {index < allKeys.length - 1 && <Separator className="mt-6" />}
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              );
            })}
          </div>
        </Tabs>
      </div>
    </div>
  );
};