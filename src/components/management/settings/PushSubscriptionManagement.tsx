import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, CheckCircle } from 'lucide-react';

export const PushSubscriptionManagement = () => {
  const [isReactivating, setIsReactivating] = useState(false);
  const { toast } = useToast();

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
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          If you're not receiving push notifications, you can reactivate your most recent subscription here. 
          This will deactivate any old subscriptions and ensure only your current device token is active.
        </p>
        
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

        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
          <p><strong>When to use this:</strong></p>
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
