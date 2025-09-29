import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, User, MapPin } from 'lucide-react';

interface ContactBuilderProps {
  eventId: string;
  eventData: any;
}

export const ContactBuilder: React.FC<ContactBuilderProps> = ({ eventData }) => {
  return (
    <div className="space-y-6">
      {/* Primary Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="font-['Oswald'] text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Primary Contact
          </CardTitle>
          <CardDescription>Main point of contact for this event</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-['Work_Sans'] font-medium">{eventData?.organizer || 'Not specified'}</span>
              <Badge variant="secondary">Primary</Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{eventData?.contact_email || 'Not specified'}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{eventData?.location || 'Not specified'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Management Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="font-['Oswald'] text-lg">Management Contact</CardTitle>
          <CardDescription>Internal management contact for operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{eventData?.management_email || 'Not specified'}</span>
              <Badge variant="outline">Internal</Badge>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                This is the internal email used for management communications and BEO coordination.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="font-['Oswald'] text-lg">Emergency Contacts</CardTitle>
          <CardDescription>Key contacts for day-of-event emergencies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-['Work_Sans'] font-medium">Venue Manager</span>
                <Badge variant="secondary">Emergency</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Contact venue management for immediate operational issues
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-['Work_Sans'] font-medium">Security</span>
                <Badge variant="outline">24/7</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                On-site security for incidents and crowd control
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-['Work_Sans'] font-medium">Maintenance</span>
                <Badge variant="outline">Technical</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Technical support for equipment and facility issues
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="font-['Oswald'] text-lg">Vendor Contacts</CardTitle>
          <CardDescription>External suppliers and service providers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-['Work_Sans'] font-medium">Catering Supplier</span>
                <Badge variant="outline">External</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Contact for menu delivery and service coordination
              </p>
              <div className="text-xs text-muted-foreground">
                Contact details will be populated from equipment/supplier records
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-['Work_Sans'] font-medium">AV Supplier</span>
                <Badge variant="outline">External</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Technical equipment setup and support
              </p>
              <div className="text-xs text-muted-foreground">
                Contact details will be populated from equipment/supplier records
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};