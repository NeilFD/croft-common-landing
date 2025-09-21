import { PushNotificationTest } from '@/components/PushNotificationTest';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const PushTest = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Push Notification Test</h1>
            <p className="text-muted-foreground">
              Test push notifications on your native mobile app. This page is useful for debugging 
              and verifying that push notifications are working correctly.
            </p>
          </div>
          
          <PushNotificationTest />
          
          <div className="mt-8 p-6 bg-muted rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Setup Requirements</h2>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-medium mb-2">For iOS (APNs):</h3>
                <ul className="list-disc ml-4 space-y-1 text-muted-foreground">
                  <li><code>APNS_KEY_ID</code> - Your APNs Key ID</li>
                  <li><code>APNS_TEAM_ID</code> - Your Apple Developer Team ID</li>
                  <li><code>APNS_PRIVATE_KEY</code> - Your APNs Private Key (P8 format)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">For Android (FCM):</h3>
                <ul className="list-disc ml-4 space-y-1 text-muted-foreground">
                  <li><code>FCM_SERVER_KEY</code> - Your Firebase Cloud Messaging Server Key</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">For Web Push:</h3>
                <ul className="list-disc ml-4 space-y-1 text-muted-foreground">
                  <li><code>VAPID_PUBLIC_KEY</code> - Your VAPID Public Key</li>
                  <li><code>VAPID_PRIVATE_KEY</code> - Your VAPID Private Key</li>
                  <li><code>VAPID_SUBJECT</code> - Your app's contact email or URL</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PushTest;