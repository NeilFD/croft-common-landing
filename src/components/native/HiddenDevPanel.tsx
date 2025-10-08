import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Smartphone, Globe, Wifi, WifiOff, User } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

interface DevPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HiddenDevPanel: React.FC<DevPanelProps> = ({ isOpen, onClose }) => {
  const [appInfo, setAppInfo] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentUrl, setCurrentUrl] = useState(window.location.href);

  useEffect(() => {
    if (isOpen && Capacitor.isNativePlatform()) {
      // Get app info if running in Capacitor (dynamic import)
      import('@capacitor/app').then(({ App: CapacitorApp }) => {
        CapacitorApp.getInfo().then(info => {
          setAppInfo(info);
        }).catch(console.error);
      }).catch(console.error);
    }

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleUrlChange = () => setCurrentUrl(window.location.href);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('popstate', handleUrlChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const platform = Capacitor.getPlatform();
  const isNative = Capacitor.isNativePlatform();
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-background border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Dev Panel
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* App Version */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Smartphone className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-medium">App Version</div>
              <div className="text-xs text-muted-foreground">
                {isNative && appInfo ? 
                  `${appInfo.version} (${appInfo.build})` : 
                  'Web Version - 1.0.0'
                }
              </div>
            </div>
          </div>

          {/* Platform */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-medium">Platform</div>
              <div className="text-xs text-muted-foreground">
                {platform} {isNative ? '(Native)' : '(Web)'}
              </div>
            </div>
          </div>

          {/* Current URL */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-medium">Current URL</div>
              <div className="text-xs text-muted-foreground break-all">
                {currentUrl}
              </div>
            </div>
          </div>

          {/* Connectivity Status */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <div className="flex-1">
              <div className="text-sm font-medium">Network Status</div>
              <div className={`text-xs ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
                {isOnline ? 'Connected' : 'Offline'}
              </div>
            </div>
          </div>

          {/* User Agent */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <User className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-medium">User Agent</div>
              <div className="text-xs text-muted-foreground break-all">
                {navigator.userAgent}
              </div>
            </div>
          </div>

          {/* Close Button */}
          <Button onClick={onClose} className="w-full">
            Close Dev Panel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};