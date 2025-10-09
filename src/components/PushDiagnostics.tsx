import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle } from 'lucide-react';
import { nativePush } from '@/services/nativePush';

export const PushDiagnostics = () => {
  const [platform, setPlatform] = useState<string>('unknown');
  const [isNative, setIsNative] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [logs, setLogs] = useState<string[]>([]);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [registrationStatus, setRegistrationStatus] = useState<string>('Not registered');

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
        
        // Check initial permission
        const perms = await nativePush.checkPermissions();
        setPermissionStatus(perms.receive);
        addLog(`Initial permission: ${perms.receive}`);
      }
    };

    initPlatform();
  }, []);

  const handleRegister = async () => {
    if (!isNative) {
      addLog('❌ Not a native platform');
      return;
    }

    setIsRegistering(true);
    setRegistrationStatus('Registering...');
    addLog('🔄 Starting registration via centralized service...');

    const result = await nativePush.register();

    if (result.success) {
      addLog('✅ Registration initiated - waiting for token...');
      setRegistrationStatus('Waiting for token...');
      
      // Check after 20 seconds
      setTimeout(() => {
        addLog('⏱️ 20 seconds elapsed');
        addLog('If no token appeared, check:');
        addLog('1. aps-environment entitlement (must be "production")');
        addLog('2. Network connectivity (APNs requires internet)');
        addLog('3. Device restrictions or MDM policies');
        addLog('4. Use Console.app on Mac to view device logs');
        setRegistrationStatus('Check logs for details');
        setIsRegistering(false);
      }, 20000);
    } else {
      addLog(`❌ Registration failed: ${result.error}`);
      setRegistrationStatus(`Failed: ${result.error}`);
      setIsRegistering(false);
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
                <Badge variant="outline">
                  {registrationStatus}
                </Badge>
              </div>
            </>
          )}
        </div>

        {isNative && (
          <div className="space-y-2">
            <Button 
              onClick={handleRegister} 
              className="w-full"
              disabled={isRegistering}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isRegistering ? 'Registering...' : 'Register for Push Notifications'}
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
