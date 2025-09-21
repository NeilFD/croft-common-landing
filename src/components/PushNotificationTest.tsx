import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Send, Smartphone } from 'lucide-react';

export const PushNotificationTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('Test Notification');
  const [body, setBody] = useState('This is a test push notification from your app!');
  const [url, setUrl] = useState('/');

  const sendTestNotification = async () => {
    if (!title.trim() || !body.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter both title and message",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('📱 Sending test push notification...');
      
      const { data, error } = await supabase.functions.invoke('send-push', {
        body: {
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || '/',
          scope: 'self', // Only send to current user
          icon: '/icon-192x192.png'
        }
      });

      if (error) {
        console.error('📱 Push notification error:', error);
        toast({
          title: "Push Error",
          description: error.message || "Failed to send push notification",
          variant: "destructive"
        });
      } else {
        console.log('📱 Push notification sent successfully:', data);
        toast({
          title: "Push Sent!",
          description: `Notification sent successfully${data?.recipients ? ` to ${data.recipients} device(s)` : ''}`,
        });
      }
    } catch (error) {
      console.error('📱 Unexpected error:', error);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred while sending the notification",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Push Notification Test
        </CardTitle>
        <CardDescription>
          Test push notifications on your native app. Make sure you're logged in and have enabled push notifications.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Notification Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter notification title"
            maxLength={50}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="body">Message</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter notification message"
            className="min-h-[80px]"
            maxLength={200}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="url">Target URL (optional)</Label>
          <Input
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/"
          />
        </div>
        
        <Button 
          onClick={sendTestNotification} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Test Notification
            </>
          )}
        </Button>
        
        <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted rounded-md">
          <strong>Note:</strong> This test only sends to your own device. Make sure:
          <ul className="mt-1 ml-4 list-disc">
            <li>You're logged in</li>
            <li>Push notifications are enabled</li>
            <li>You're using the native app (not web browser)</li>
            <li>Required push notification secrets are configured</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};