import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { nativePush } from '@/services/nativePush';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export const PushSetup = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [platform, setPlatform] = useState<string>('unknown');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`📱 [${timestamp}] ${message}`);
  };

  useEffect(() => {
    const platformName = Capacitor.getPlatform();
    setPlatform(platformName);
    addLog(`Platform detected: ${platformName}`);

    if (!Capacitor.isNativePlatform()) {
      addLog('⚠️ Not a native platform - push will not work');
      return;
    }

    addLog('Initialising native push service...');
    nativePush.initialize('page:PushSetup').then(() => {
      addLog('✅ Native push service initialised');
    });

    const unsubToken = nativePush.onToken((receivedToken) => {
      addLog(`✅ Token received: ${receivedToken.substring(0, 20)}...`);
      setToken(receivedToken);
      setError(null);
      setIsRegistering(false);
    });

    const unsubError = nativePush.onError((err) => {
      addLog(`❌ Registration error: ${err}`);
      setError(err);
      setIsRegistering(false);
    });

    return () => {
      unsubToken();
      unsubError();
    };
  }, []);

  const handleRegister = async () => {
    if (!Capacitor.isNativePlatform()) {
      addLog('❌ Cannot register - not on native platform');
      return;
    }

    setIsRegistering(true);
    setError(null);
    setToken(null);
    
    addLog('Starting registration...');
    
    const result = await nativePush.register();
    
    if (result.success) {
      addLog('✅ Registration initiated - waiting for token...');
      
      // Watchdog: if no callback in 20s, show warning
      setTimeout(() => {
        if (isRegistering) {
          addLog('⚠️ No callback received after 20s - check device settings and console');
          setIsRegistering(false);
        }
      }, 20000);
    } else {
      addLog(`❌ Registration failed: ${result.error}`);
      setError(result.error || 'Registration failed');
      setIsRegistering(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Push Notification Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Platform: <span className="font-mono">{platform}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Native: {Capacitor.isNativePlatform() ? '✅ Yes' : '❌ No'}
            </p>
          </div>

          <Button 
            onClick={handleRegister} 
            disabled={isRegistering || !Capacitor.isNativePlatform()}
            className="w-full"
          >
            {isRegistering ? 'Registering...' : 'Register for Push'}
          </Button>

          {token && (
            <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm font-semibold text-green-900 dark:text-green-100">Token Received</p>
              <p className="text-xs font-mono break-all text-green-800 dark:text-green-200 mt-1">
                {token}
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm font-semibold text-red-900 dark:text-red-100">Error</p>
              <p className="text-xs text-red-800 dark:text-red-200 mt-1">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-semibold">Live Log</p>
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              <div className="space-y-1 font-mono text-xs">
                {logs.map((log, idx) => (
                  <div key={idx} className="text-muted-foreground">
                    {log}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
            <p><strong>Expected flow:</strong></p>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>Tap "Register for Push"</li>
              <li>iOS will prompt for permission</li>
              <li>Token or error appears within 20 seconds</li>
              <li>If silent after 20s, check device settings or Xcode console</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
