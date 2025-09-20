import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CalendarIcon, Send, TestTube, Users, Clock, Zap, Eye, MousePointer, Plus, Edit, Target, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { SegmentBuilder } from './SegmentBuilder';
import { PersonalizationHelper } from './PersonalizationHelper';
import { PushNotificationPreview } from './PushNotificationPreview';
import { supabase } from '@/integrations/supabase/client';
import { BRAND_LOGO } from '@/data/brand';

interface MemberSegment {
  segment_name: string;
  segment_description: string;
  member_count: number;
  avg_spend: number;
  criteria?: any;
}

interface SavedSegment {
  id: string;
  name: string;
  description?: string;
  member_count: number;
  avg_spend: number;
  filters: any;
  created_at: string;
}

interface CampaignTemplate {
  id: string;
  name: string;
  message: string;
  category: 'engagement' | 'retention' | 'upsell' | 'event';
  personalizable: boolean;
}

const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: 'welcome_new',
    name: 'Welcome New Members',
    message: 'Welcome to our community, {{first_name}}! 🎉 Your first drink is on us. Use code WELCOME at the bar.',
    category: 'engagement',
    personalizable: true
  },
  {
    id: 'win_back',
    name: 'Win Back At-Risk',
    message: 'We miss you, {{first_name}}! Come back this week and enjoy 20% off your visit. We have some exciting new additions you\'ll love.',
    category: 'retention',
    personalizable: true
  },
  {
    id: 'vip_invite',
    name: 'VIP Event Invitation',
    message: 'Exclusive invitation for you, {{first_name}}! Join us for our VIP wine tasting event this Friday at 7PM. Limited spots available.',
    category: 'event',
    personalizable: true
  },
  {
    id: 'birthday_special',
    name: 'Birthday Celebration',
    message: 'Happy Birthday {{first_name}}! 🎂 Celebrate with us and receive a complimentary dessert with any main course.',
    category: 'engagement',
    personalizable: true
  },
  {
    id: 'tier_upgrade',
    name: 'Tier Upgrade Reward',
    message: 'Congratulations {{first_name}}! You\'ve been upgraded to {{tier}} tier. Enjoy your new perks and exclusive benefits.',
    category: 'upsell',
    personalizable: true
  },
  {
    id: 'event_reminder',
    name: 'Event Reminder',
    message: 'Don\'t forget! Your event starts in 2 hours. We can\'t wait to see you there!',
    category: 'event',
    personalizable: false
  }
];

interface CampaignManagerProps {
  segments: MemberSegment[];
  onSendCampaign: (campaignData: any) => Promise<void>;
  isLoading?: boolean;
}

export const CampaignManager: React.FC<CampaignManagerProps> = ({ segments, onSendCampaign, isLoading: externalLoading }) => {
  const [savedSegments, setSavedSegments] = useState<SavedSegment[]>([]);
  const [isLoadingSegments, setIsLoadingSegments] = useState(true);
  const [showSegmentBuilder, setShowSegmentBuilder] = useState(false);
  const [editingSegment, setEditingSegment] = useState<SavedSegment | null>(null);
  const [activeTab, setActiveTab] = useState('create');

  const [selectedSegment, setSelectedSegment] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignMessage, setCampaignMessage] = useState('');
  const [personalize, setPersonalize] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [scheduleType, setScheduleType] = useState('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customFilters, setCustomFilters] = useState<any>(null);
  const [messageTextareaRef, setMessageTextareaRef] = useState<HTMLTextAreaElement | null>(null);

  // Load saved segments on mount
  useEffect(() => {
    loadSavedSegments();
  }, []);

  const loadSavedSegments = async () => {
    setIsLoadingSegments(true);
    try {
      const { data, error } = await supabase.functions.invoke('campaign-segments', {
        method: 'GET'
      });
      
      if (error) throw error;
      
      setSavedSegments(data.segments || []);
    } catch (error) {
      console.error('Error loading segments:', error);
      toast.error('Failed to load segments');
    }
    setIsLoadingSegments(false);
  };

  const handleDeleteSegment = async (segmentId: string, segmentName: string) => {
    try {
      // Get the auth token to make the request
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`https://xccidvoxhpgcnwinnyin.supabase.co/functions/v1/campaign-segments?id=${segmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete segment' }));
        throw new Error(errorData.error || 'Failed to delete segment');
      }
      
      toast.success(`Segment "${segmentName}" deleted successfully`);
      loadSavedSegments(); // Reload segments after deletion
    } catch (error) {
      console.error('Error deleting segment:', error);
      toast.error('Failed to delete segment');
    }
  };

  // Calculate estimated reach based on selected segment or custom filters
  const getEstimatedReach = () => {
    if (testMode) return 1;
    
    if (customFilters?.memberCount) {
      return customFilters.memberCount;
    }
    
    const selectedSegmentData = savedSegments.find(s => s.id === selectedSegment) ||
      segments.find(s => s.segment_name === selectedSegment);
    
    return selectedSegmentData?.member_count || 0;
  };

  const estimatedReach = getEstimatedReach();

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = CAMPAIGN_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setCampaignMessage(template.message);
      setCampaignTitle(template.name);
      // Auto-enable personalization for personalizable templates
      if (template.personalizable) {
        setPersonalize(true);
      }
    }
  };

  const insertPersonalizationCode = (code: string) => {
    if (!messageTextareaRef) return;
    
    const textarea = messageTextareaRef;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const currentMessage = campaignMessage;
    const newMessage = currentMessage.slice(0, start) + code + currentMessage.slice(end);
    
    setCampaignMessage(newMessage);
    
    // Set cursor position after the inserted code
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + code.length, start + code.length);
    }, 0);
  };

  const handleSegmentCreate = (segmentData: any) => {
    if (segmentData.filters) {
      setCustomFilters(segmentData);
      setSelectedSegment('custom');
    } else {
      // Segment was saved, reload the list
      loadSavedSegments();
    }
    setShowSegmentBuilder(false);
  };

  const handleSendCampaign = async () => {
    if (!campaignTitle || !campaignMessage) {
      toast.error('Please fill in campaign title and message');
      return;
    }

    if (!selectedSegment && !customFilters) {
      toast.error('Please select a target segment or create custom filters');
      return;
    }

    setIsLoading(true);

    try {
      // Find the selected segment
      const segmentData = savedSegments.find(s => s.id === selectedSegment) ||
        segments.find(s => s.segment_name === selectedSegment);

      const campaignData = {
        title: campaignTitle,
        message: campaignMessage,
        segment_id: (segmentData as SavedSegment)?.id || null,
        segment_filters: selectedSegment === 'custom' ? customFilters?.filters : null,
        template_id: selectedTemplate,
        personalize,
        test_mode: testMode,
        schedule_type: scheduleType,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        estimated_reach: estimatedReach,
        icon: BRAND_LOGO, // Always include brand logo
      };

      // Use enhanced campaign manager
      const { data, error } = await supabase.functions.invoke('enhanced-campaign-manager', {
        body: campaignData
      });

      if (error) throw error;

      // Reset form after successful send
      setCampaignTitle('');
      setCampaignMessage('');
      setSelectedSegment('');
      setSelectedTemplate('');
      setPersonalize(false);
      setTestMode(false);
      setScheduleType('now');
      setScheduledDate('');
      setScheduledTime('');
      setCustomFilters(null);

      toast.success(data.message || 'Campaign sent successfully!');
    } catch (error) {
      console.error('Campaign send error:', error);
      toast.error('Failed to send campaign');
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enhanced Campaign Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="create">Create Campaign</TabsTrigger>
              <TabsTrigger value="segments">Manage Segments</TabsTrigger>
              <TabsTrigger value="history">Campaign History</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-6 mt-6">
              {/* Target Audience */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="segment">Target Audience</Label>
                  <div className="flex gap-2">
                    <Dialog open={showSegmentBuilder} onOpenChange={setShowSegmentBuilder}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Create Segment
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Create Audience Segment</DialogTitle>
                        </DialogHeader>
                        <SegmentBuilder onSegmentCreate={handleSegmentCreate} />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience segment or create new" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Legacy segments */}
                    {segments.map((segment) => (
                      <SelectItem key={segment.segment_name} value={segment.segment_name}>
                        <div className="flex items-center justify-between w-full">
                          <span>{segment.segment_name}</span>
                          <Badge variant="secondary" className="ml-2">
                            {segment.member_count} members
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                    
                    {/* Saved segments */}
                    {savedSegments.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{segment.name}</span>
                          <Badge variant="secondary" className="ml-2">
                            {segment.member_count} members
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                    
                    {/* Custom filters option */}
                    {customFilters && (
                      <SelectItem value="custom">
                        <div className="flex items-center justify-between w-full">
                          <span>Custom Audience</span>
                          <Badge variant="secondary" className="ml-2">
                            {customFilters.memberCount} members
                          </Badge>
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                
                {(selectedSegment === 'custom' && customFilters) && (
                  <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                    Using custom audience filters with {customFilters.memberCount} members
                  </div>
                )}
              </div>

              {/* Message Template */}
              <div className="space-y-2">
                <Label htmlFor="template">Message Template (Optional)</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template or create custom message" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_TEMPLATES.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-xs">
                            {template.message}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Campaign Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Campaign Title</Label>
                <Input
                  id="title"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  placeholder="Enter campaign title"
                />
              </div>

              {/* Campaign Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Campaign Message</Label>
                <Textarea
                  ref={setMessageTextareaRef}
                  id="message"
                  value={campaignMessage}
                  onChange={(e) => setCampaignMessage(e.target.value)}
                  placeholder="Enter your campaign message. Use {{first_name}} for personalization."
                  rows={4}
                  className={personalize && campaignMessage.includes('{{') ? 'border-blue-200 bg-blue-50/30' : ''}
                />
                {personalize && campaignMessage.includes('{{') && (
                  <div className="text-xs text-blue-600 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 bg-blue-400 rounded-full"></span>
                    Personalization codes detected
                  </div>
                )}
              </div>
              
              {/* Personalization Helper */}
              <PersonalizationHelper 
                isVisible={personalize}
                onInsertCode={insertPersonalizationCode}
              />

              <Separator />

              {/* Campaign Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Campaign Options</h3>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="personalize"
                    checked={personalize}
                    onCheckedChange={(checked) => setPersonalize(checked === true)}
                  />
                  <Label htmlFor="personalize">Personalize messages with member names</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="testMode"
                    checked={testMode}
                    onCheckedChange={(checked) => setTestMode(checked === true)}
                  />
                  <Label htmlFor="testMode">Test mode (send to admin users only)</Label>
                </div>
              </div>

              <Separator />

              {/* Scheduling Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Scheduling</h3>
                
                <RadioGroup value={scheduleType} onValueChange={setScheduleType}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="now" id="now" />
                    <Label htmlFor="now">Send immediately</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="scheduled" id="scheduled" />
                    <Label htmlFor="scheduled">Schedule for later</Label>
                  </div>
                </RadioGroup>

                {scheduleType === 'scheduled' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Campaign Preview */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Campaign Preview</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{estimatedReach.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Estimated Reach</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Eye className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{Math.round(estimatedReach * 0.15)}</div>
                    <div className="text-sm text-muted-foreground">Expected Opens</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <MousePointer className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{Math.round(estimatedReach * 0.03)}</div>
                    <div className="text-sm text-muted-foreground">Expected Actions</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Zap className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">
                      £{customFilters?.avgSpend ? customFilters.avgSpend.toFixed(0) : 
                        (savedSegments.find(s => s.id === selectedSegment) ||
                         segments.find(s => s.segment_name === selectedSegment))?.avg_spend.toFixed(0) || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg. Member Value</div>
                  </div>
                </div>
              </div>

              {/* Push Notification Preview */}
              {campaignTitle && campaignMessage && (
                <PushNotificationPreview
                  title={campaignTitle}
                  message={campaignMessage}
                  personalize={personalize}
                />
              )}

              {/* Send Button */}
              <Button 
                onClick={handleSendCampaign}
                disabled={isLoading || !campaignTitle || !campaignMessage || (!selectedSegment && !customFilters)}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  'Sending...'
                ) : testMode ? (
                  <>
                    <TestTube className="mr-2 h-4 w-4" />
                    Send Test Campaign
                  </>
                ) : scheduleType === 'scheduled' ? (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Schedule Campaign
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Campaign Now
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="segments" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Saved Audience Segments</h3>
                <Button onClick={() => setShowSegmentBuilder(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  New Segment
                </Button>
              </div>
              
              {isLoadingSegments ? (
                <div className="text-center py-8">Loading segments...</div>
              ) : savedSegments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No saved segments yet. Create your first audience segment to get started.
                </div>
              ) : (
                <div className="grid gap-4">
                  {savedSegments.map((segment) => (
                    <Card key={segment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{segment.name}</h4>
                            {segment.description && (
                              <p className="text-sm text-muted-foreground">{segment.description}</p>
                            )}
                            <div className="flex gap-4 mt-2">
                              <Badge variant="secondary">
                                <Users className="h-3 w-3 mr-1" />
                                {segment.member_count} members
                              </Badge>
                              <Badge variant="outline">
                                £{segment.avg_spend.toFixed(0)} avg spend
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Dialog open={editingSegment?.id === segment.id} onOpenChange={(open) => setEditingSegment(open ? segment : null)}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Edit Segment: {segment.name}</DialogTitle>
                                </DialogHeader>
                                <SegmentBuilder 
                                  editingSegment={segment}
                                  initialFilters={segment.filters}
                                  onSegmentCreate={(data) => {
                                    loadSavedSegments();
                                    setEditingSegment(null);
                                  }}
                                />
                              </DialogContent>
                            </Dialog>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedSegment(segment.id);
                                setActiveTab('create');
                              }}
                            >
                              <Target className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Segment</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{segment.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteSegment(segment.id, segment.name)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold">Campaign History</h3>
              <div className="text-center py-8 text-muted-foreground">
                Campaign history will be displayed here once campaigns are sent.
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};