import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useOrgSettings, useUpdateOrgSetting } from "@/hooks/useOrgSettings";
import { Loader2 } from "lucide-react";

export default function LeadsSettings() {
  const { data: settings, isLoading } = useOrgSettings();
  const updateSetting = useUpdateOrgSetting();
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const settingsMap = settings?.reduce((acc, setting) => {
    acc[setting.setting_key] = setting.setting_value;
    return acc;
  }, {} as Record<string, string>) || {};

  const handleUpdateSetting = async (key: string, value: string) => {
    await updateSetting.mutateAsync({ settingKey: key, settingValue: value });
  };

  const getValue = (key: string) => {
    return localSettings[key] ?? settingsMap[key] ?? '';
  };

  const setValue = (key: string, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leads Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure how lead notifications are handled
        </p>
      </div>

      <Separator />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Email Notifications</CardTitle>
            <CardDescription>
              Configure who receives notifications when new leads are submitted
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipients">Notification Recipients</Label>
              <Input
                id="recipients"
                placeholder="email1@example.com, email2@example.com"
                value={getValue('leads_notify_recipients')}
                onChange={(e) => setValue('leads_notify_recipients', e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Enter email addresses separated by commas
              </p>
              <Button 
                onClick={() => handleUpdateSetting('leads_notify_recipients', getValue('leads_notify_recipients'))}
                disabled={updateSetting.isPending}
              >
                {updateSetting.isPending ? 'Saving...' : 'Save Recipients'}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Send Client Confirmation</Label>
                <p className="text-sm text-muted-foreground">
                  Send confirmation emails to lead submitters
                </p>
              </div>
              <Switch
                checked={getValue('leads_send_client_confirmation') === 'true'}
                onCheckedChange={(checked) => {
                  const value = checked ? 'true' : 'false';
                  setValue('leads_send_client_confirmation', value);
                  handleUpdateSetting('leads_send_client_confirmation', value);
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form Protection</CardTitle>
            <CardDescription>
              Security settings for the public enquiry form
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rate Limit</Label>
                <p className="text-sm text-muted-foreground">10 submissions per hour per IP</p>
              </div>
              <div>
                <Label>Spam Protection</Label>
                <p className="text-sm text-muted-foreground">Honeypot field enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>GDPR Compliance</CardTitle>
            <CardDescription>
              Privacy and consent management for lead data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Privacy Policy</Label>
                <p className="text-sm text-muted-foreground">Required consent checkbox</p>
              </div>
              <div>
                <Label>Marketing Consent</Label>
                <p className="text-sm text-muted-foreground">Optional consent checkbox</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}