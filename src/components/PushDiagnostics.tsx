import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Smartphone, CheckCircle, XCircle, RefreshCw, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const PushDiagnostics = () => {
  const { toast } = useToast();
  const [platform, setPlatform] = useState<string>('unknown');
  const [isNative, setIsNative] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [lastToken, setLastToken] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAppActive, setIsAppActive] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].substring(0, 12); // HH:MM:SS.mmm
    const logEntry = `[${timestamp}] ${message}`;
    console.log(`📱 DIAGNOSTICS: ${logEntry}`);
    setLogs(prev => [logEntry, ...prev].slice(0, 100));
  };

  useEffect(() => {
    const native = Capacitor.isNativePlatform();
    const plat = Capacitor.getPlatform();
    setIsNative(native);
    setPlatform(plat);
    addLog(`🔍 Platform: ${plat}, Native: ${native}`);

    if (!native) return;

    // Listen for app state changes
    let appStateListener: any = null;
    import(/* @vite-ignore */ '@capacitor/app').then(({ App }) => {
      App.getState().then(state => {
        setIsAppActive(state.isActive);
        addLog(`📱 Initial app state: ${state.isActive ? 'ACTIVE' : 'INACTIVE'}`);
      });

      App.addListener('appStateChange', (state) => {
        setIsAppActive(state.isActive);
        addLog(`📱 App state changed: ${state.isActive ? 'ACTIVE ✅' : 'INACTIVE ❌'}`);
      }).then(listener => {
        appStateListener = listener;
      });
    });

    // Listen for route hydration
    const handleHydration = () => {
      setIsHydrated(true);
      addLog(`🎯 Route hydrated`);
    };
    window.addEventListener('cc:routes-hydrated', handleHydration);

    // Check initial permission status
    import(/* @vite-ignore */ '@capacitor/push-notifications').then(({ PushNotifications }) => {
      PushNotifications.checkPermissions().then(result => {
        setPermissionStatus(result.receive);
        addLog(`🔐 Initial permission: ${result.receive}`);
      });
    });

    return () => {
      window.removeEventListener('cc:routes-hydrated', handleHydration);
      appStateListener?.remove();
    };
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
      addLog('🔐 Requesting push notification permission...');
      const { PushNotifications } = await import(/* @vite-ignore */ '@capacitor/push-notifications');
      const result = await PushNotifications.requestPermissions();
      setPermissionStatus(result.receive);
      addLog(`🔐 Permission result: ${result.receive} ${result.receive === 'granted' ? '✅' : '❌'}`);
      
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
      addLog(`❌ Error requesting permission: ${error}`);
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

    // Check app state before registering
    if (!isAppActive) {
      addLog(`⚠️ App is NOT active - waiting for app to become active...`);
      toast({
        title: "Waiting for App",
        description: "App must be active to register. Please keep app in foreground.",
        variant: "default"
      });
      return;
    }

    if (!isHydrated) {
      addLog(`⚠️ Route not yet hydrated - waiting...`);
    }

    setIsRegistering(true);
    setRetryCount(0);
    addLog(`🔄 Starting registration (app active: ${isAppActive}, hydrated: ${isHydrated})`);
    addLog(`📱 Calling PushNotifications.register()...`);

    const { PushNotifications } = await import(/* @vite-ignore */ '@capacitor/push-notifications');

    let registrationReceived = false;
    let registrationListener: any = null;
    let errorListener: any = null;

    // Set up listener for registration SUCCESS
    registrationListener = await PushNotifications.addListener('registration', async (token) => {
      registrationReceived = true;
      addLog(`✅ REGISTRATION EVENT FIRED!`);
      addLog(`✅ Token received: ${token.value.substring(0, 30)}...${token.value.substring(token.value.length - 20)}`);
      addLog(`📏 Token length: ${token.value.length} chars`);
      setLastToken(token.value);
      setIsRegistering(false);
      
      // Clean up listeners
      registrationListener?.remove();
      errorListener?.remove();
      
      toast({
        title: "Registration Successful",
        description: "Device token received. You can now save it."
      });
    });

    // Set up listener for registration ERROR
    errorListener = await PushNotifications.addListener('registrationError', (error) => {
      addLog(`❌ REGISTRATION ERROR EVENT: ${JSON.stringify(error)}`);
      addLog(`❌ Check: 1) aps-environment entitlement, 2) Provisioning profile, 3) Network connectivity`);
      setIsRegistering(false);
      
      // Clean up listeners
      registrationListener?.remove();
      errorListener?.remove();
      
      toast({
        title: "Registration Failed",
        description: "Check logs for details",
        variant: "destructive"
      });
    });

    addLog(`✅ Listeners attached (registration, registrationError)`);

    try {
      // Call register
      await PushNotifications.register();
      addLog(`✅ register() called successfully, waiting for token event...`);
      
      // Retry mechanism - if no event after 8 seconds and app is active, retry ONCE
      setTimeout(async () => {
        if (!registrationReceived && isAppActive && retryCount === 0) {
          addLog(`⚠️ No registration event after 8s, attempting retry (app active: ${isAppActive})...`);
          setRetryCount(1);
          try {
            await PushNotifications.register();
            addLog(`🔄 Retry register() called`);
          } catch (err) {
            addLog(`❌ Retry register() failed: ${err}`);
          }
        }
      }, 8000);

      // Final check at 20 seconds
      setTimeout(() => {
        if (!registrationReceived) {
          addLog(`❌ Registration event did NOT fire within 20 seconds`);
          addLog(`❌ This indicates an iOS/Capacitor issue or entitlement problem`);
          addLog(`⚠️ Possible causes:`);
          addLog(`   1. Missing aps-environment entitlement`);
          addLog(`   2. Provisioning profile not configured for push`);
          addLog(`   3. Network issue preventing APNs connection`);
          addLog(`   4. iOS sandbox/production APNs mismatch`);
          addLog(`💡 Try: 1) Check Xcode signing, 2) Verify entitlements, 3) Test on different network`);
          setIsRegistering(false);
          registrationListener?.remove();
          errorListener?.remove();
          
          toast({
            title: "Registration Timeout",
            description: "No token received after 20s. Check logs.",
            variant: "destructive"
          });
        } else {
          addLog(`✅ Registration completed successfully`);
        }
      }, 20000);
    } catch (error) {
      addLog(`❌ Exception calling register(): ${error}`);
      addLog(`❌ Error type: ${typeof error}`);
      addLog(`❌ Error details: ${JSON.stringify(error, null, 2)}`);
      setIsRegistering(false);
      registrationListener?.remove();
      errorListener?.remove();
      
      toast({
        title: "Registration Exception",
        description: "Failed to call register()",
        variant: "destructive"
      });
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
      addLog(`💾 Saving token to database via edge function...`);
      const tokenPrefix = platform === 'ios' ? 'ios-token:' : 'android-token:';
      
      // Check auth state
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      addLog(`🔐 Auth state: ${user ? `User: ${user.email}` : 'Not authenticated'}`);
      if (authError) {
        addLog(`❌ Auth error: ${authError.message}`);
      }
      
      const { data, error } = await supabase.functions.invoke('save-push-subscription', {
        body: {
          endpoint: `${tokenPrefix}${lastToken}`,
          platform: platform
        }
      });

      if (error) {
        addLog(`❌ Edge function error: ${error.message}`);
        addLog(`❌ Status: ${(error as any).status}, Context: ${JSON.stringify((error as any).context)}`);
        toast({
          title: "Save Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        addLog(`✅ Token saved successfully!`);
        addLog(`✅ Response: ${JSON.stringify(data)}`);
        toast({
          title: "Token Saved",
          description: "Push subscription active"
        });
      }
    } catch (error) {
      addLog(`❌ Exception saving token: ${error}`);
      addLog(`❌ Error details: ${JSON.stringify(error, null, 2)}`);
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
            <div className="flex gap-2">
              <Badge variant={isAppActive ? 'default' : 'outline'}>
                <Activity className="h-3 w-3 mr-1" />
                {isAppActive ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant={permissionStatus === 'granted' ? 'default' : 'destructive'}>
                {permissionStatus}
              </Badge>
            </div>
          )}
        </div>
        <CardDescription className="font-industrial">
          Manual push notification testing with app state awareness
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

        {/* App State Info (Native only) */}
        {isNative && (
          <div className="p-3 bg-muted/50 rounded-lg border-l-4 border-l-primary">
            <div className="text-sm font-medium font-industrial mb-1">App State</div>
            <div className="flex items-center space-x-2">
              <Activity className={`h-4 w-4 ${isAppActive ? 'text-green-500' : 'text-orange-500'}`} />
              <span className="text-sm">
                {isAppActive ? '✅ App is ACTIVE - ready to register' : '⚠️ App is INACTIVE - keep in foreground'}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Registration works best when app is active and in foreground
            </div>
          </div>
        )}

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

        {!isNative && (
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground font-industrial">
              Push notifications are only available on native iOS/Android builds
            </p>
          </div>
        )}

        {/* Token Display */}
        {lastToken && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground font-industrial mb-1">Current Token</div>
            <div className="text-xs font-mono break-all">{lastToken}</div>
          </div>
        )}

        {/* Live Log */}
        <div>
          <div className="text-sm font-medium font-industrial mb-2 flex items-center justify-between">
            <span>Live Log (with timestamps)</span>
            <Button
              onClick={() => setLogs([])}
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
            >
              Clear
            </Button>
          </div>
          <div className="bg-black text-green-400 p-3 rounded-lg font-mono text-xs h-96 overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <div className="text-muted-foreground">No logs yet. Click "Request Permission" to start.</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">{log}</div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1">
          <div className="font-medium font-industrial mb-1">📋 Test Flow:</div>
          <div>1. Request Permission → Grant when prompted</div>
          <div>2. Ensure app shows "ACTIVE" status above</div>
          <div>3. Register for Push → Wait for token (up to 20s)</div>
          <div>4. Save Token → Stores in database</div>
          <div className="mt-2 text-muted-foreground">
            💡 If registration times out, check entitlements in Xcode and try on different network
          </div>
        </div>
      </CardContent>
    </Card>
  );
};