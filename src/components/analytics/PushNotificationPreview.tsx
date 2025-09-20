import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BRAND_LOGO } from '@/data/brand';
import CroftLogo from '@/components/CroftLogo';

interface PushNotificationPreviewProps {
  title: string;
  message: string;
  personalize: boolean;
  appName?: string;
}

export const PushNotificationPreview: React.FC<PushNotificationPreviewProps> = ({
  title,
  message,
  personalize,
  appName = "Croft Common"
}) => {
  // Replace personalization codes with sample data for preview
  const previewTitle = personalize && title.includes('{{first_name}}') 
    ? title.replace(/\{\{first_name\}\}/g, 'John')
    : title || 'Preview title';
  
  const previewMessage = personalize && message.includes('{{first_name}}')
    ? message.replace(/\{\{first_name\}\}/g, 'John') 
    : message || 'Your campaign message will appear here';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Push Notification Preview</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mobile notification mockup */}
        <div className="max-w-sm mx-auto bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Notification header */}
          <div className="flex items-start gap-3 p-4">
            {/* App icon */}
            <div className="flex-shrink-0">
              <CroftLogo size="sm" className="w-8 h-8" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <div className="font-medium text-sm text-gray-900 leading-tight">
                {previewTitle}
              </div>
              
              {/* App attribution */}
              <div className="text-xs text-gray-500 mt-0.5">
                from {appName}
              </div>
              
              {/* Message body */}
              <div className="text-sm text-gray-700 mt-1 leading-relaxed">
                {previewMessage}
              </div>
            </div>
            
            {/* Time indicator */}
            <div className="flex-shrink-0 text-xs text-gray-400">
              now
            </div>
          </div>
        </div>
        
        {/* Preview notes */}
        <div className="mt-4 text-xs text-muted-foreground space-y-1">
          <p>• This is how your push notification will appear on mobile devices</p>
          {personalize && (
            <p>• Personalisation preview shows "John" - actual notifications will use real member names</p>
          )}
          <p>• The app icon is automatically included from your brand settings</p>
        </div>
      </CardContent>
    </Card>
  );
};