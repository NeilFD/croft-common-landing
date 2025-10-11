import { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { nativePush } from '@/services/nativePush';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const PushDiagnostics = () => {
  const [platform, setPlatform] = useState<string>('unknown');
  const [isNative, setIsNative] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [logs, setLogs] = useState<string[]>([]);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'registering' | 'success' | 'error'>('idle');
  const [receivedToken, setReceivedToken] = useState<string | null>(null);
  const [receivedError, setReceivedError] = useState<string | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);
  const watchdogRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log('📱 DIAG:', logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  useEffect(() => {
    const initPlatform = async () => {
      const platformName = Capacitor.getPlatform();
      const native = Capacitor.isNativePlatform();
      setPlatform(platformName);
      setIsNative(native);
      addLog(`Platform: ${platformName}, Native: ${native}`);

      if (native) {
        // Defensive: ensure listeners are initialized even if app boot missed it
        addLog('🔧 Ensuring native push listeners are initialized...');
        await nativePush.initialize();
        addLog('✅ Native push listeners attached');
        
        // Check initial permission
        const perms = await nativePush.checkPermissions();
        setPermissionStatus(perms.receive);
        addLog(`Initial permission: ${perms.receive}`);
      }
    };

    initPlatform();

    // Subscribe to token/error events
    const unsubToken = nativePush.onToken((token) => {
      addLog(`🎉 TOKEN RECEIVED: ${token.substring(0, 20)}...`);
      setReceivedToken(token);
      setRegistrationStatus('success');
      setIsRegistering(false);
      
      // Clear watchdog
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
    });

    const unsubError = nativePush.onError((error) => {
      addLog(`❌ REGISTRATION ERROR: ${error}`);
      setReceivedError(error);
      setRegistrationStatus('error');
      setIsRegistering(false);
      
      // Clear watchdog
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
    });

    return () => {
      unsubToken();
      unsubError();
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
      }
    };
  }, []);

  const handleRegister = async () => {
    if (!isNative) {
      addLog('❌ Not a native platform');
      return;
    }

    // Clear any previous state
    setReceivedToken(null);
    setReceivedError(null);
    nativePush.clearCache();

    setIsRegistering(true);
    setRegistrationStatus('registering');
    addLog('🚀 Starting registration...');
    addLog('📡 Calling PushNotifications.register()...');

    const result = await nativePush.register();
    
    if (result.success) {
      addLog('✅ Registration initiated - waiting for native response...');
      
      // Set watchdog to provide feedback if no response after 20s
      watchdogRef.current = setTimeout(() => {
        if (registrationStatus === 'registering') {
          addLog('⚠️ No response after 20s. Troubleshooting:');
          addLog('  1. Check Apple Developer Console: Certificates & Profiles');
          addLog('  2. Xcode: Signing & Capabilities → Push Notifications enabled');
          addLog('  3. Xcode Console: Look for APNs/registration errors');
          addLog('  4. Verify provisioning profile has Push capability');
          setIsRegistering(false);
        }
      }, 20000);
    } else {
      addLog(`❌ Registration failed: ${result.error}`);
      setRegistrationStatus('error');
      setIsRegistering(false);
    }
  };

  const handleReactivate = async () => {
    setIsReactivating(true);
    addLog('🔄 Reactivating latest push subscription...');
    
    try {
      const { data, error } = await supabase.functions.invoke('reactivate-push-subscription');
      
      if (error) throw error;
      
      if (data?.ok) {
        addLog(`✅ Reactivated subscription: ${data.subscription?.id || 'unknown'}`);
        toast({
          title: "Success",
          description: "Push subscription reactivated successfully",
          variant: "default",
        });
      } else {
        throw new Error(data?.error || "Failed to reactivate subscription");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to reactivate";
      addLog(`❌ Reactivation error: ${errorMsg}`);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsReactivating(false);
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
          Clean single-flow push notification testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Platform:</span>
            <Badge variant="outline">{platform}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Native:</span>
            <Badge variant={isNative ? "default" : "secondary"}>
              {isNative ? 'Yes' : 'No'}
            </Badge>
          </div>
          {isNative && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Permission:</span>
                <Badge variant={
                  permissionStatus === 'granted' ? 'default' : 
                  permissionStatus === 'denied' ? 'destructive' : 
                  'secondary'
                }>
                  {permissionStatus}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={
                  registrationStatus === 'success' ? 'default' :
                  registrationStatus === 'error' ? 'destructive' :
                  registrationStatus === 'registering' ? 'secondary' :
                  'outline'
                }>
                  {registrationStatus === 'idle' ? 'Not registered' :
                   registrationStatus === 'registering' ? 'Registering...' :
                   registrationStatus === 'success' ? 'Token received' :
                   'Error'}
                </Badge>
              </div>
            </>
          )}
        </div>

        {isNative && (
          <div className="space-y-4">
            <Button 
              onClick={handleRegister} 
              className="w-full"
              disabled={isRegistering}
            >
              {isRegistering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {registrationStatus === 'success' || registrationStatus === 'error' 
                    ? 'Re-register' 
                    : 'Register for Push Notifications'}
                </>
              )}
            </Button>

            <Button 
              onClick={handleReactivate} 
              className="w-full"
              variant="outline"
              disabled={isReactivating}
            >
              {isReactivating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reactivating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reactivate latest subscription
                </>
              )}
            </Button>

            {receivedToken && (
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">✅ Token Received</p>
                <p className="text-xs text-green-700 dark:text-green-300 font-mono break-all">
                  {receivedToken.substring(0, 40)}...
                </p>
              </div>
            )}

            {receivedError && (
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">❌ Registration Error</p>
                <p className="text-xs text-red-700 dark:text-red-300 break-words">
                  {receivedError}
                </p>
              </div>
            )}
          </div>
        )}

        {!isNative && (
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground font-industrial">
              Push notifications are only available on native iOS/Android builds
            </p>
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
          <div className="bg-black text-green-400 p-3 rounded-lg font-mono text-xs h-96 overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <div className="text-muted-foreground">No logs yet. Click "Register" to start.</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">{log}</div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1">
          <div className="font-medium font-industrial mb-1">📋 Clean Flow:</div>
          <div>1. Click "Register" button once</div>
          <div>2. Grant permission when prompted</div>
          <div>3. Token automatically saves to database</div>
          <div>4. Wait up to 20 seconds for result</div>
          <div className="mt-2 text-muted-foreground">
            💡 One button, one flow, no complexity
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
