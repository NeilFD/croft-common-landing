import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export const ServiceWorkerDebug: React.FC = () => {
  const [swStatus, setSwStatus] = useState<string>('checking...');
  const [clientCount, setClientCount] = useState<number | null>(null);

  useEffect(() => {
    const checkServiceWorker = async () => {
      if (!('serviceWorker' in navigator)) {
        setSwStatus('Not supported');
        toast({
          title: '🔔 SW Debug',
          description: 'Service Worker not supported'
        });
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const state = registration.active?.state || 'unknown';
        setSwStatus(`Active: ${state}`);
        
        toast({
          title: '🔔 SW Registration',
          description: `State: ${state}, Version: ${registration.active?.scriptURL?.split('?')[1] || 'unknown'}`
        });

        // Check for stored zero clients debug message
        const storedMessage = localStorage.getItem('sw-debug-zero-clients');
        if (storedMessage) {
          const data = JSON.parse(storedMessage);
          toast({
            title: '🔔 SW: Zero Clients Found!',
            description: `When clicked: ${data.notificationTitle} (${new Date(data.timestamp).toLocaleTimeString()})`
          });
          localStorage.removeItem('sw-debug-zero-clients');
        }
      } catch (error) {
        setSwStatus('Error');
        toast({
          title: '🔔 SW Error',
          description: `Failed to check: ${error}`
        });
      }
    };

    checkServiceWorker();
  }, []);

  const pingServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      toast({
        title: '🔔 Ping Failed',
        description: 'Service Worker not supported'
      });
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      if (!registration.active) {
        toast({
          title: '🔔 Ping Failed',
          description: 'No active service worker'
        });
        return;
      }

      // Send ping message
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        setClientCount(event.data.clientCount);
        toast({
          title: '🔔 SW Ping Response',
          description: `Found ${event.data.clientCount} clients`
        });
      };

      registration.active.postMessage({
        type: 'PING_REQUEST',
        timestamp: Date.now()
      }, [messageChannel.port2]);

      toast({
        title: '🔔 Pinging SW',
        description: 'Requesting client count...'
      });
    } catch (error) {
      toast({
        title: '🔔 Ping Error',
        description: `Failed: ${error}`
      });
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Service Worker Debug</CardTitle>
        <CardDescription>Test SW communication and client detection</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p><strong>Status:</strong> {swStatus}</p>
          {clientCount !== null && (
            <p><strong>Client Count:</strong> {clientCount}</p>
          )}
        </div>
        <Button onClick={pingServiceWorker} className="w-full">
          Ping Service Worker
        </Button>
      </CardContent>
    </Card>
  );
};