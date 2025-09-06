import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Target, Users, Send, Settings, Clock, TrendingUp, 
  MessageSquare, Eye, BarChart3, Calendar, Filter
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export interface MemberSegment {
  segment_name: string;
  segment_description: string;
  member_count: number;
  avg_spend: number;
  criteria: any;
}

export interface CampaignTemplate {
  id: string;
  name: string;
  message: string;
  category: 'engagement' | 'retention' | 'upsell' | 'event';
  personalizable: boolean;
}

interface CampaignManagerProps {
  segments: MemberSegment[];
  isLoading?: boolean;
  onSendCampaign?: (campaign: any) => void;
}

const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: 'welcome_new',
    name: 'Welcome New Members',
    message: 'Welcome to our community, {name}! 🎉 Your first drink is on us. Use code WELCOME at the bar.',
    category: 'engagement',
    personalizable: true
  },
  {
    id: 'win_back',
    name: 'Win Back At-Risk',
    message: 'We miss you, {name}! Come back this week and enjoy 20% off your visit. We have some exciting new additions you\'ll love.',
    category: 'retention',
    personalizable: true
  },
  {
    id: 'vip_invite',
    name: 'VIP Event Invitation',
    message: 'Exclusive invitation for you, {name}! Join us for our VIP wine tasting event this Friday at 7PM. Limited spots available.',
    category: 'event',
    personalizable: true
  },
  {
    id: 'birthday_special',
    name: 'Birthday Celebration',
    message: 'Happy Birthday {name}! 🎂 Celebrate with us and receive a complimentary dessert with any main course.',
    category: 'engagement',
    personalizable: true
  },
  {
    id: 'tier_upgrade',
    name: 'Tier Upgrade Reward',
    message: 'Congratulations {name}! You\'ve been upgraded to {tier} tier. Enjoy your new perks and exclusive benefits.',
    category: 'upsell',
    personalizable: true
  },
  {
    id: 'event_reminder',
    name: 'Event Reminder',
    message: 'Don\'t forget! Your event \"{event_name}\" starts in 2 hours. We can\'t wait to see you there!',
    category: 'event',
    personalizable: true
  }
];

export const CampaignManager: React.FC<CampaignManagerProps> = ({
  segments,
  isLoading = false,
  onSendCampaign
}) => {
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [campaignTitle, setCampaignTitle] = useState('');
  const [scheduleTime, setScheduleTime] = useState<string>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTimeValue] = useState('');
  const [testMode, setTestMode] = useState(true);
  const [personalizeMessages, setPersonalizeMessages] = useState(true);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);

  const selectedSegmentData = segments.find(s => s.segment_name === selectedSegment);
  const selectedTemplateData = CAMPAIGN_TEMPLATES.find(t => t.id === selectedTemplate);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = CAMPAIGN_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setCustomMessage(template.message);
      setCampaignTitle(template.name);
    }
  };

  const getEstimatedReach = () => {
    if (!selectedSegmentData) return 0;
    return selectedSegmentData.member_count;
  };

  const getOptimalSendTime = () => {
    const hour = new Date().getHours();
    if (hour >= 17 && hour <= 21) return 'Excellent time (Evening peak)';
    if (hour >= 12 && hour <= 14) return 'Good time (Lunch hour)';
    if (hour >= 9 && hour <= 11) return 'Good time (Morning)';
    return 'Consider scheduling for peak hours (12-2pm or 5-9pm)';
  };

  const handleSendCampaign = async () => {
    if (!selectedSegment || !customMessage || !campaignTitle) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreatingCampaign(true);

    try {
      const campaign = {
        title: campaignTitle,
        message: customMessage,
        segment: selectedSegment,
        template_id: selectedTemplate,
        personalize: personalizeMessages,
        test_mode: testMode,
        schedule_type: scheduleTime,
        scheduled_date: scheduleTime === 'scheduled' ? scheduledDate : null,
        scheduled_time: scheduleTime === 'scheduled' ? scheduledTime : null,
        estimated_reach: getEstimatedReach()
      };

      if (onSendCampaign) {
        await onSendCampaign(campaign);
      }

      toast.success(testMode ? 'Test campaign sent successfully!' : 'Campaign scheduled successfully!');
      
      // Reset form
      setSelectedSegment('');
      setSelectedTemplate('');
      setCustomMessage('');
      setCampaignTitle('');
      setScheduleTime('now');
      setTestMode(true);
    } catch (error) {
      toast.error('Failed to send campaign');
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  return (
    <Card className="border-2 border-black">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Push Notification Campaign Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Segment Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Target Audience</Label>
          <Select value={selectedSegment} onValueChange={setSelectedSegment}>
            <SelectTrigger>
              <SelectValue placeholder="Select member segment" />
            </SelectTrigger>
            <SelectContent>
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
            </SelectContent>
          </Select>
          
          {selectedSegmentData && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <strong>{selectedSegmentData.segment_name}</strong>
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedSegmentData.segment_description}
              </div>
              <div className="text-xs mt-1">
                {selectedSegmentData.member_count} members • Avg spend: £{selectedSegmentData.avg_spend.toFixed(0)}
              </div>
            </div>
          )}
        </div>

        {/* Template Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Message Template</Label>
          <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a template or start from scratch" />
            </SelectTrigger>
            <SelectContent>
              {CAMPAIGN_TEMPLATES.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <div>
                    <span>{template.name}</span>
                    <Badge variant="outline" className="ml-2 capitalize">
                      {template.category}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Campaign Details */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Campaign Title</Label>
            <Input
              placeholder="Enter campaign name"
              value={campaignTitle}
              onChange={(e) => setCampaignTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Message Content</Label>
            <Textarea
              placeholder="Write your notification message..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
            />
            <div className="text-xs text-muted-foreground">
              Character count: {customMessage.length}/500
              {personalizeMessages && (
                <span className="ml-4">Available variables: {'{name}'}, {'{tier}'}, {'{event_name}'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Campaign Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Personalize Messages</Label>
              <div className="text-xs text-muted-foreground">
                Replace placeholders with member-specific data
              </div>
            </div>
            <Switch 
              checked={personalizeMessages} 
              onCheckedChange={setPersonalizeMessages}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Test Mode</Label>
              <div className="text-xs text-muted-foreground">
                Send to admin users only for testing
              </div>
            </div>
            <Switch 
              checked={testMode} 
              onCheckedChange={setTestMode}
            />
          </div>
        </div>

        {/* Scheduling */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Send Schedule</Label>
          <Select value={scheduleTime} onValueChange={setScheduleTime}>
            <SelectTrigger>
              <SelectValue placeholder="When to send" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="now">Send Now</SelectItem>
              <SelectItem value="optimal">Send at Optimal Time</SelectItem>
              <SelectItem value="scheduled">Schedule for Later</SelectItem>
            </SelectContent>
          </Select>
          
          {scheduleTime === 'optimal' && (
            <div className="p-3 bg-blue-50 rounded-lg border">
              <div className="text-sm font-medium text-blue-800">Optimal Send Time</div>
              <div className="text-xs text-blue-600">{getOptimalSendTime()}</div>
            </div>
          )}
          
          {scheduleTime === 'scheduled' && (
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Time</Label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTimeValue(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Campaign Preview */}
        {selectedSegment && customMessage && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Campaign Preview</Label>
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Push Notification</span>
                </div>
                <Badge variant="outline">
                  {getEstimatedReach()} recipients
                </Badge>
              </div>
              <div className="text-sm bg-white p-3 rounded border">
                {personalizeMessages 
                  ? customMessage.replace('{name}', 'John')
                  : customMessage
                }
              </div>
            </div>
          </div>
        )}

        {/* Campaign Metrics Preview */}
        {selectedSegmentData && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">{getEstimatedReach()}</div>
              <div className="text-xs text-muted-foreground">Estimated Reach</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">
                {Math.round(getEstimatedReach() * 0.15)}
              </div>
              <div className="text-xs text-muted-foreground">Expected Opens (15%)</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">
                {Math.round(getEstimatedReach() * 0.03)}
              </div>
              <div className="text-xs text-muted-foreground">Expected Actions (3%)</div>
            </div>
          </div>
        )}

        {/* Send Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {testMode ? 'Test campaign will be sent to admin users only' : 'Campaign will be sent to all selected members'}
          </div>
          <Button 
            onClick={handleSendCampaign}
            disabled={!selectedSegment || !customMessage || !campaignTitle || isCreatingCampaign}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {isCreatingCampaign 
              ? 'Sending...' 
              : testMode 
                ? 'Send Test Campaign' 
                : scheduleTime === 'now' 
                  ? 'Send Campaign' 
                  : 'Schedule Campaign'
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};