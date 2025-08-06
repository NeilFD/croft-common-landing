import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Event } from '@/types/event';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, Save, ArrowLeft } from 'lucide-react';
import { eventCategoryColors, EventCategory } from '@/types/event';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import PageLayout from '@/components/PageLayout';

export default function ManageEvent() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Event>>({});

  useEffect(() => {
    const loadEvent = async () => {
      if (!token) {
        toast({
          title: "Invalid Link",
          description: "Management token is missing",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        console.log('Loading event with token:', token);
        
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('management_token', token)
          .single();

        if (error) {
          console.error('Error loading event:', error);
          toast({
            title: "Event Not Found",
            description: "Invalid or expired management link",
            variant: "destructive"
          });
          navigate('/');
          return;
        }

        console.log('Event loaded:', data);
        const eventData: Event = {
          id: data.id,
          title: data.title,
          description: data.description,
          date: data.date,
          time: data.time,
          organizer: data.organizer,
          location: data.location,
          price: data.price,
          category: data.category as EventCategory,
          imageUrl: data.image_url,
          contactEmail: data.contact_email,
          isSoldOut: data.is_sold_out,
          managementToken: data.management_token,
          managementEmail: data.management_email
        };

        setEvent(eventData);
        setFormData(eventData);
      } catch (error) {
        console.error('Error in loadEvent:', error);
        toast({
          title: "Error",
          description: "Failed to load event",
          variant: "destructive"
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [token, navigate]);

  const handleInputChange = (field: keyof Event, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!event || !token) return;

    try {
      setSaving(true);
      console.log('Updating event with data:', formData);

      const updateData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        organizer: formData.organizer,
        location: formData.location,
        price: formData.price,
        category: formData.category,
        image_url: formData.imageUrl,
        contact_email: formData.contactEmail,
        is_sold_out: formData.isSoldOut || false,
        management_email: formData.managementEmail || formData.contactEmail
      };

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('management_token', token);

      if (error) {
        console.error('Error updating event:', error);
        toast({
          title: "Error",
          description: "Failed to update event",
          variant: "destructive"
        });
        return;
      }

      setEvent({ ...event, ...formData });
      toast({
        title: "Success",
        description: "Event updated successfully"
      });
    } catch (error) {
      console.error('Error in handleSave:', error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !token) return;

    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('management_token', token);

      if (error) {
        console.error('Error deleting event:', error);
        toast({
          title: "Error",
          description: "Failed to delete event",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Event deleted successfully"
      });
      navigate('/');
    } catch (error) {
      console.error('Error in handleDelete:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading event...</div>
        </div>
        <Footer />
      </PageLayout>
    );
  }

  if (!event) {
    return (
      <PageLayout>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Event not found</div>
        </div>
        <Footer />
      </PageLayout>
    );
  }

  const categoryConfig = eventCategoryColors[formData.category as EventCategory] || eventCategoryColors.house;

  return (
    <PageLayout>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calendar
          </Button>
          
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold">Manage Event</h1>
            {formData.category && (
              <Badge className={`${categoryConfig.bg} ${categoryConfig.border} ${categoryConfig.text}`}>
                {formData.category}
              </Badge>
            )}
            {formData.isSoldOut && (
              <Badge variant="destructive">SOLD OUT</Badge>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="organizer">Organizer</Label>
                <Input
                  id="organizer"
                  value={formData.organizer || ''}
                  onChange={(e) => handleInputChange('organizer', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time || ''}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="price">Price (£)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price || ''}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || null)}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category || ''}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gigs">Gigs</SelectItem>
                    <SelectItem value="tastings">Tastings</SelectItem>
                    <SelectItem value="talks">Talks</SelectItem>
                    <SelectItem value="takeovers">Takeovers</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail || ''}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="imageUrl">Image URL (optional)</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={formData.imageUrl || ''}
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="soldOut" className="text-base font-medium">
                    Sold Out
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Mark this event as sold out
                  </p>
                </div>
                <Switch
                  id="soldOut"
                  checked={formData.isSoldOut || false}
                  onCheckedChange={(checked) => handleInputChange('isSoldOut', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>

              <Button 
                variant="destructive" 
                onClick={handleDelete}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Event
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </PageLayout>
  );
}