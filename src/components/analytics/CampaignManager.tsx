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
import { CalendarIcon, Send, TestTube, Users, Clock, Zap, Eye, MousePointer, Plus, Edit, Target, Trash2, Archive, ArchiveRestore } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { SegmentBuilder } from './SegmentBuilder';
import { PersonalizationHelper } from './PersonalizationHelper';
import { PushNotificationPreview } from './PushNotificationPreview';
import { supabase } from '@/integrations/supabase/client';
import { BRAND_LOGO } from '@/data/brand';

interface CampaignData {
  title: string;
  message: string;
  segment_id?: string;
  segment_filters?: any;
  template_id?: string;
  personalize: boolean;
  test_mode: boolean;
  schedule_type: string;
  scheduled_date?: string;
  scheduled_time?: string;
  estimated_reach: number;
}

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

interface CampaignHistoryItem {
  id: string;
  title: string;
  message: string;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  delivery_rate?: number;
  open_rate?: number;
  click_rate?: number;
  created_at: string;
  sent_at?: string;
  archived?: boolean;
}

const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Message',
    message: 'Welcome to The Common Room! {{first_name}}, we\'re excited to have you join our community.',
    category: 'engagement',
    personalizable: true
  },
  {
    id: 'discount',
    name: 'Exclusive Discount',
    message: 'Enjoy 20% off your next visit, {{first_name}}! Use code WELCOME20 at checkout.',
    category: 'upsell',
    personalizable: true
  },
  {
    id: 'new_menu',
    name: 'New Menu Items',
    message: 'We\'ve updated our menu! Come try our new dishes, {{first_name}}.',
    category: 'engagement',
    personalizable: true
  },
  {
    id: 'event_invite',
    name: 'Upcoming Event Invitation',
    message: 'You\'re invited to our special event, {{first_name}}! Join us for a night of fun.',
    category: 'event',
    personalizable: true
  },
  {
    id: 'loyalty_reward',
    name: 'Loyalty Reward',
    message: 'As a thank you, {{first_name}}, enjoy a free drink on your next visit!',
    category: 'retention',
    personalizable: true
  }
];

interface CampaignManagerProps {
  segments: MemberSegment[];
  onSendCampaign?: (campaignData: any) => void;
  isLoading?: boolean;
}

const CampaignManager: React.FC<CampaignManagerProps> = ({ segments, onSendCampaign, isLoading = false }) => {
  const [savedSegments, setSavedSegments] = useState<SavedSegment[]>([]);
  const [campaignHistory, setCampaignHistory] = useState<CampaignHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [summaryMetrics, setSummaryMetrics] = useState({
    total_campaigns: 0,
    total_sent: 0,
    total_delivered: 0,
    total_opened: 0,
    total_clicked: 0,
    avg_delivery_rate: '0',
    avg_open_rate: '0',
    avg_click_rate: '0'
  });

  const [activeTab, setActiveTab] = useState('create');
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignMessage, setCampaignMessage] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<SavedSegment | null>(null);
  const [segmentFilters, setSegmentFilters] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
  const [personalizeMessage, setPersonalizeMessage] = useState(true);
  const [testMode, setTestMode] = useState(false);
  const [scheduleType, setScheduleType] = useState('now');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState('');
  const [estimatedReach, setEstimatedReach] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadCampaignHistory = async () => {
    try {
      setHistoryLoading(true);
      
      const { data, error } = await supabase.functions.invoke('enhanced-campaign-manager', {
        method: 'GET',
        headers: {
          'x-include-archived': showArchived.toString()
        }
      });

      if (error) {
        console.error('Error loading campaign history:', error);
        return;
      }

      if (data?.campaigns) {
        setCampaignHistory(data.campaigns);
      }
      if (data?.summary) {
        setSummaryMetrics(data.summary);
      }
    } catch (error) {
      console.error('Error loading campaign history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleArchiveCampaign = async (campaignId: string, archived: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('enhanced-campaign-manager', {
        method: 'PUT',
        body: { campaign_id: campaignId, archived }
      });

      if (error) {
        console.error('Error updating campaign archive status:', error);
        return;
      }

      // Refresh campaign history
      await loadCampaignHistory();
    } catch (error) {
      console.error('Error updating campaign archive status:', error);
    }
  };

  // Load campaign history when tab becomes active or archive filter changes
  useEffect(() => {
    if (activeTab === 'history') {
      loadCampaignHistory();
    }
  }, [activeTab, showArchived]);

  const handleSendCampaign = async () => {
    if (!campaignTitle || !campaignMessage) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const campaignData: CampaignData = {
      title: campaignTitle,
      message: campaignMessage,
      segment_id: selectedSegment?.id,
      segment_filters: segmentFilters,
      template_id: selectedTemplate?.id,
      personalize: personalizeMessage,
      test_mode: testMode,
      schedule_type: scheduleType,
      scheduled_date: scheduledDate ? format(scheduledDate, 'yyyy-MM-dd') : undefined,
      scheduled_time: scheduledTime,
      estimated_reach: estimatedReach
    };

    try {
      setIsDialogOpen(true);
      const { data, error } = await supabase.functions.invoke('enhanced-campaign-manager', {
        method: 'POST',
        body: campaignData
      });

      if (error) {
        console.error('Error sending campaign:', error);
        toast.error(`Failed to send campaign: ${error.message}`);
      } else {
        toast.success(data.message || 'Campaign sent successfully!');
        // Reset form fields after successful submission
        setCampaignTitle('');
        setCampaignMessage('');
        setSelectedSegment(null);
        setSegmentFilters(null);
        setSelectedTemplate(null);
        setPersonalizeMessage(true);
        setTestMode(false);
        setScheduleType('now');
        setScheduledDate(null);
        setScheduledTime('');
        setEstimatedReach(0);
        await loadCampaignHistory();
      }
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      toast.error(`Failed to send campaign: ${error.message || error}`);
    } finally {
      setIsDialogOpen(false);
    }
  };

  const handleTemplateSelect = (template: CampaignTemplate) => {
    setSelectedTemplate(template);
    setCampaignMessage(template.message);
    setPersonalizeMessage(template.personalizable);
  };

  return (
    <div className="space-y-6">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Sending Campaign</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-center">
              <div className="text-muted-foreground">Sending campaign...</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="create">
            <Send className="h-4 w-4 mr-2" />
            Create Campaign
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />
            Campaign History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="space-y-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="campaign-title">Title</Label>
                  <Input
                    type="text"
                    id="campaign-title"
                    placeholder="Campaign Title"
                    value={campaignTitle}
                    onChange={(e) => setCampaignTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="campaign-message">Message</Label>
                  <Textarea
                    id="campaign-message"
                    placeholder="Campaign Message"
                    value={campaignMessage}
                    onChange={(e) => setCampaignMessage(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Template <Button variant="link" size="sm" onClick={() => setCampaignMessage('')}>Clear</Button></Label>
                  <div className="flex flex-wrap gap-2">
                    {CAMPAIGN_TEMPLATES.map((template) => (
                      <Badge
                        key={template.id}
                        variant="secondary"
                        className={`cursor-pointer ${selectedTemplate?.id === template.id ? 'bg-primary text-primary-foreground' : ''}`}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        {template.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <Label htmlFor="personalize">
                    <div className="flex items-center justify-between">
                      Personalize Message
                    </div>
                  </Label>
                  <Checkbox
                    id="personalize"
                    checked={personalizeMessage}
                    onCheckedChange={(checked) => setPersonalizeMessage(!!checked)}
                  />
                </div>
                {personalizeMessage && (
                  <PersonalizationHelper 
                    onInsertCode={(code) => {
                      setCampaignMessage(prev => prev + code);
                    }}
                    isVisible={personalizeMessage}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Target Audience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="segment">Target a Saved Segment</Label>
                  <Select onValueChange={(value) => {
                    const segment = savedSegments.find(s => s.id === value);
                    setSelectedSegment(segment || null);
                    setSegmentFilters(null);
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a segment" />
                    </SelectTrigger>
                    <SelectContent>
                      {savedSegments.map((segment) => (
                        <SelectItem key={segment.id} value={segment.id}>{segment.name} ({segment.member_count})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div>
                  <Label>
                    <div className="flex items-center justify-between">
                      Target Dynamic Segment
                    </div>
                  </Label>
                  <SegmentBuilder onSegmentCreate={setSegmentFilters} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scheduling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Schedule Type</Label>
                  <RadioGroup defaultValue={scheduleType} className="flex flex-col space-y-1" onValueChange={setScheduleType}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="now" id="schedule-now" />
                      <Label htmlFor="schedule-now">Send Now</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="scheduled" id="schedule-later" />
                      <Label htmlFor="schedule-later">Schedule for Later</Label>
                    </div>
                  </RadioGroup>
                </div>

                {scheduleType === 'scheduled' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="scheduled-date">Date</Label>
                      <Input
                        type="date"
                        id="scheduled-date"
                        value={scheduledDate ? format(scheduledDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setScheduledDate(new Date(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="scheduled-time">Time</Label>
                      <Input
                        type="time"
                        id="scheduled-time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Testing &amp; Delivery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="test-mode">
                    <div className="flex items-center justify-between">
                      Enable Test Mode
                      <TestTube className="h-4 w-4" />
                    </div>
                  </Label>
                  <Checkbox
                    id="test-mode"
                    checked={testMode}
                    onCheckedChange={(checked) => setTestMode(!!checked)}
                  />
                </div>

                <Separator />

                <div>
                  <Label htmlFor="estimated-reach">Estimated Reach</Label>
                  <Input
                    type="number"
                    id="estimated-reach"
                    placeholder="Estimated Reach"
                    value={estimatedReach}
                    onChange={(e) => setEstimatedReach(parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

          <Card>
            <CardHeader>
              <CardTitle>Push Notification Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <PushNotificationPreview
                title={campaignTitle}
                message={campaignMessage}
                personalize={personalizeMessage}
              />
            </CardContent>
          </Card>

          <Button onClick={handleSendCampaign} disabled={isLoading}>
            {isLoading ? (
              <>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {testMode ? 'Send Test Campaign' : 'Send Campaign'}
              </>
            )}
          </Button>
        </div>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{summaryMetrics.total_campaigns}</div>
                  <p className="text-xs text-muted-foreground">Total Campaigns</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{summaryMetrics.total_sent.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Total Sent</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{summaryMetrics.avg_delivery_rate}%</div>
                  <p className="text-xs text-muted-foreground">Avg Delivery Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{summaryMetrics.avg_click_rate}%</div>
                  <p className="text-xs text-muted-foreground">Avg CTR</p>
                </CardContent>
              </Card>
            </div>
            <div className="ml-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span>Show Archived</span>
              </label>
            </div>
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading campaign history...</div>
            </div>
          ) : campaignHistory.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <div className="text-muted-foreground mb-4">No campaigns sent yet</div>
                  <p className="text-sm text-muted-foreground">
                    Your campaign history will appear here once you start sending campaigns.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {campaignHistory.map((campaign) => (
                <Card key={campaign.id} className={campaign.archived ? 'opacity-60' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{campaign.title}</h3>
                          {campaign.archived && (
                            <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                              Archived
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Sent {format(new Date(campaign.sent_at || campaign.created_at), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {(campaign.sent_count || 0).toLocaleString()} recipients
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleArchiveCampaign(campaign.id, !campaign.archived)}
                        >
                          {campaign.archived ? (
                            <>
                              <ArchiveRestore className="h-4 w-4 mr-1" />
                              Unarchive
                            </>
                          ) : (
                            <>
                              <Archive className="h-4 w-4 mr-1" />
                              Archive
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {(campaign.sent_count || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Sent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(campaign.delivered_count || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Delivered</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {(campaign.opened_count || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Opened</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {(campaign.clicked_count || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Clicked</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                      <div className="flex gap-4 text-sm">
                        <span>
                          Delivery Rate: <span className="font-medium">
                            {campaign.delivery_rate || (campaign.sent_count ? ((campaign.delivered_count || 0) / campaign.sent_count * 100).toFixed(1) : 0)}%
                          </span>
                        </span>
                        <span>
                          Open Rate: <span className="font-medium">
                            {campaign.open_rate || (campaign.delivered_count ? ((campaign.opened_count || 0) / campaign.delivered_count * 100).toFixed(1) : 0)}%
                          </span>
                        </span>
                        <span>
                          CTR: <span className="font-medium">
                            {campaign.click_rate || (campaign.delivered_count ? ((campaign.clicked_count || 0) / campaign.delivered_count * 100).toFixed(1) : 0)}%
                          </span>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CampaignManager;
