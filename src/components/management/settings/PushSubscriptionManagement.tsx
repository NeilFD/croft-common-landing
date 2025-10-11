import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, CheckCircle, Send, Smartphone } from 'lucide-react';

type PushSubscription = {
  id: string;
  platform: string;
  endpoint: string;
  is_active: boolean;
  last_seen: string | null;
  created_at: string;
};

export const PushSubscriptionManagement = () => {
  const [isReactivating, setIsReactivating] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [subscriptions, setSubscriptions] = useState<PushSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('id, platform, endpoint, is_active, last_seen, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    setIsReactivating(true);
    try {
      const { data, error } = await supabase.functions.invoke('reactivate-push-subscription');
      
      if (error) throw error;
      
      if (data?.ok) {
        toast({
          title: "Success",
          description: "Push subscription reactivated successfully",
          variant: "default",
        });
        await loadSubscriptions();
      } else {
        throw new Error(data?.error || "Failed to reactivate subscription");
      }
    } catch (error) {
      console.error('Reactivate error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reactivate push subscription",
        variant: "destructive",
      });
    } finally {
      setIsReactivating(false);
    }
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-push', {
        body: {
          scope: 'self',
          title: 'Test Push Notification',
          body: 'If you see this, your push setup is working! 🎉'
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Test sent",
        description: "Check your device for the notification",
        variant: "default",
      });
    } catch (error) {
      console.error('Send test error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send test notification",
        variant: "destructive",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const getTokenPreview = (endpoint: string) => {
    if (endpoint.startsWith('ios-token:')) {
      return endpoint.substring('ios-token:'.length, 'ios-token:'.length + 12) + '...';
    }
    if (endpoint.startsWith('android-token:')) {
      return endpoint.substring('android-token:'.length, 'android-token:'.length + 12) + '...';
    }
    return endpoint.substring(0, 20) + '...';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Push Subscription Management
        </CardTitle>
        <CardDescription>
          Manage your push notification subscription status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Server Configuration */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Server Configuration</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-muted rounded">
              <div className="text-muted-foreground">APNs Environment</div>
              <div className="font-mono">sandbox</div>
            </div>
            <div className="p-2 bg-muted rounded">
              <div className="text-muted-foreground">APNs Topic</div>
              <div className="font-mono">com.croftcommon.beacon</div>
            </div>
          </div>
        </div>

        {/* Your Subscriptions */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Your Active Subscriptions
          </h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : subscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subscriptions found</p>
          ) : (
            <div className="space-y-2">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={sub.platform === 'ios' ? 'default' : 'secondary'}>
                        {sub.platform.toUpperCase()}
                      </Badge>
                      <Badge variant={sub.is_active ? 'default' : 'outline'}>
                        {sub.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {sub.last_seen ? `Last seen: ${new Date(sub.last_seen).toLocaleDateString()}` : 'Never seen'}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">
                    Token: {getTokenPreview(sub.endpoint)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button 
            onClick={handleReactivate}
            disabled={isReactivating}
            className="w-full"
          >
            {isReactivating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Reactivating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reactivate Push Subscription
              </>
            )}
          </Button>

          <Button 
            onClick={handleSendTest}
            disabled={isSendingTest || subscriptions.filter(s => s.is_active).length === 0}
            variant="outline"
            className="w-full"
          >
            {isSendingTest ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send device test push
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
          <p><strong>When to reactivate:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>After re-registering for push notifications</li>
            <li>If campaigns are sent but you're not receiving them</li>
            <li>To fix race conditions from duplicate registrations</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
