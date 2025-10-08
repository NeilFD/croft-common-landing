import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Smartphone, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const PushDiagnostics = () => {
  const { toast } = useToast();
  const [platform, setPlatform] = useState<string>('unknown');
  const [isNative, setIsNative] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [lastToken, setLastToken] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  };

  useEffect(() => {
    const native = Capacitor.isNativePlatform();
    const plat = Capacitor.getPlatform();
    setIsNative(native);
    setPlatform(plat);
    addLog(`Platform: ${plat}, Native: ${native}`);

    if (native) {
      import('@capacitor/push-notifications').then(({ PushNotifications }) => {
        PushNotifications.checkPermissions().then(result => {
          setPermissionStatus(result.receive);
          addLog(`Permission status: ${result.receive}`);
        });
      });
    }
  }, []);

  const handleRequestPermission = async () => {
    if (!isNative) {
      toast({
        title: "Not Available",
        description: "Push notifications only work on native iOS/Android",
        variant: "destructive"
      });
      return;
    }

    try {
      addLog('Requesting push notification permission...');
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const result = await PushNotifications.requestPermissions();
      setPermissionStatus(result.receive);
      addLog(`Permission result: ${result.receive}`);
      
      if (result.receive === 'granted') {
        toast({
          title: "Permission Granted",
          description: "You can now register for push notifications"
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Push notifications will not work",
          variant: "destructive"
        });
      }
    } catch (error) {
      addLog(`Error requesting permission: ${error}`);
      toast({
        title: "Error",
        description: "Failed to request permission",
        variant: "destructive"
      });
    }
  };

  const handleRegister = async () => {
    if (!isNative) {
      toast({
        title: "Not Available",
        description: "Push notifications only work on native iOS/Android",
        variant: "destructive"
      });
      return;
    }

    if (permissionStatus !== 'granted') {
      toast({
        title: "Permission Required",
        description: "Please request permission first",
        variant: "destructive"
      });
      return;
    }

    setIsRegistering(true);
    addLog('🔄 Calling PushNotifications.register()...');

    const { PushNotifications } = await import('@capacitor/push-notifications');

    // Set up listener for registration
    const registrationListener = await PushNotifications.addListener('registration', (token) => {
      addLog(`✅ Registration successful! Token received`);
      addLog(`Token (first 30 chars): ${token.value.substring(0, 30)}...`);
      setLastToken(token.value);
      setIsRegistering(false);
      
      toast({
        title: "Registration Successful",
        description: "Device token received. You can now save it."
      });
    });

    const errorListener = await PushNotifications.addListener('registrationError', (error) => {
      addLog(`❌ Registration error: ${JSON.stringify(error)}`);
      setIsRegistering(false);
      
      toast({
        title: "Registration Failed",
        description: "Check logs for details",
        variant: "destructive"
      });
    });

    try {
      await PushNotifications.register();
      addLog('📱 Register() called, waiting for token...');
      
      // Timeout after 15 seconds
      setTimeout(() => {
        if (isRegistering) {
          addLog('⚠️ No token received after 15 seconds');
          setIsRegistering(false);
          registrationListener.remove();
          errorListener.remove();
        }
      }, 15000);
    } catch (error) {
      addLog(`❌ Exception calling register(): ${error}`);
      setIsRegistering(false);
      registrationListener.remove();
      errorListener.remove();
    }
  };

  const handleSaveToken = async () => {
    if (!lastToken) {
      toast({
        title: "No Token",
        description: "Register first to get a token",
        variant: "destructive"
      });
      return;
    }

    try {
      addLog(`Saving token to database via edge function...`);
      const tokenPrefix = platform === 'ios' ? 'ios-token:' : 'android-token:';
      
      const { data, error } = await supabase.functions.invoke('save-push-subscription', {
        body: {
          endpoint: `${tokenPrefix}${lastToken}`,
          platform: platform
        }
      });

      if (error) {
        addLog(`❌ Edge function error: ${error.message}`);
        toast({
          title: "Save Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        addLog(`✅ Token saved successfully!`);
        addLog(`Response: ${JSON.stringify(data)}`);
        toast({
          title: "Token Saved",
          description: "Push subscription active"
        });
      }
    } catch (error) {
      addLog(`❌ Exception saving token: ${error}`);
      toast({
        title: "Error",
        description: "Failed to save token",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="border-industrial">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-[hsl(var(--accent-pink))]" />
            <CardTitle className="font-brutalist uppercase tracking-wide">Push Diagnostics</CardTitle>
          </div>
          {isNative && (
            <Badge variant={permissionStatus === 'granted' ? 'default' : 'destructive'}>
              {permissionStatus}
            </Badge>
          )}
        </div>
        <CardDescription className="font-industrial">
          Manual push notification testing & debugging
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Platform Info */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
          <div>
            <div className="text-sm text-muted-foreground font-industrial">Platform</div>
            <div className="flex items-center space-x-2 mt-1">
              <Smartphone className="h-4 w-4" />
              <span className="font-medium capitalize">{platform}</span>
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground font-industrial">Native</div>
            <div className="flex items-center space-x-2 mt-1">
              {isNative ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="font-medium">{isNative ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isNative && (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleRequestPermission}
              variant="outline"
              size="sm"
              disabled={permissionStatus === 'granted'}
              className="font-industrial"
            >
              <Bell className="h-4 w-4 mr-2" />
              Request Permission
            </Button>
            <Button
              onClick={handleRegister}
              variant="outline"
              size="sm"
              disabled={permissionStatus !== 'granted' || isRegistering}
              className="font-industrial"
            >
              {isRegistering ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Smartphone className="h-4 w-4 mr-2" />
              )}
              Register for Push
            </Button>
            <Button
              onClick={handleSaveToken}
              variant="outline"
              size="sm"
              disabled={!lastToken}
              className="font-industrial"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Token
            </Button>
          </div>
        )}

        {/* Token Display */}
        {lastToken && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground font-industrial mb-1">Current Token</div>
            <div className="text-xs font-mono break-all">{lastToken.substring(0, 80)}...</div>
          </div>
        )}

        {/* Live Log */}
        <div>
          <div className="text-sm font-medium font-industrial mb-2 flex items-center justify-between">
            <span>Live Log</span>
            <Button
              onClick={() => setLogs([])}
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
            >
              Clear
            </Button>
          </div>
          <div className="bg-black text-green-400 p-3 rounded-lg font-mono text-xs h-64 overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <div className="text-muted-foreground">No logs yet...</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
