import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useFullProfile } from '@/hooks/useFullProfile';
import { ProfileFormSection } from '@/components/profile/ProfileFormSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SecureLedgerWrapper } from '@/components/ledger/SecureLedgerWrapper';
import { Helmet } from 'react-helmet-async';
import MemberLedger from './MemberLedger';
import { User, Receipt, Settings, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const MemberProfile: React.FC = () => {
  const { user } = useAuth();
  const { profile, loading, updateProfile } = useFullProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    favorite_drink: '',
    favorite_venue: '',
    visit_time_preference: '',
    dietary_notes: '',
    beer_style_preferences: [] as string[]
  });

  React.useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        favorite_drink: profile.favorite_drink || '',
        favorite_venue: profile.favorite_venue || '',
        visit_time_preference: profile.visit_time_preference || '',
        dietary_notes: profile.dietary_notes || '',
        beer_style_preferences: profile.beer_style_preferences || []
      });
    }
  }, [profile]);

  const handleSave = async () => {
    await updateProfile(formData);
    setIsEditing(false);
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>My Profile | The Tavern</title>
        <meta name="description" content="Manage your member profile, view transaction history, and update preferences." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8 mt-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link 
              to="/common-room/member" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Member Home
            </Link>
          </div>

          <Card className="border-2 border-black shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="text-3xl font-brutalist flex items-center gap-3">
                <User className="h-8 w-8" />
                Member Profile
              </CardTitle>
            </CardHeader>
          </Card>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="ledger" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Ledger
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <div className="space-y-6">
                <ProfileFormSection
                  title="Personal Information"
                  description="Your basic profile information"
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="display_name">Display Name</Label>
                      <Input
                        id="display_name"
                        value={formData.display_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                        placeholder="How you'd like to be shown"
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="favorite_drink">Favorite Drink</Label>
                      <Input
                        id="favorite_drink"
                        value={formData.favorite_drink}
                        onChange={(e) => setFormData(prev => ({ ...prev, favorite_drink: e.target.value }))}
                        placeholder="Your go-to beverage"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </ProfileFormSection>

                <ProfileFormSection
                  title="Preferences"
                  description="Help us personalize your experience"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="visit_time_preference">Preferred Visit Time</Label>
                      <Select 
                        value={formData.visit_time_preference} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, visit_time_preference: value }))}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="When do you usually visit?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Morning (9am-12pm)</SelectItem>
                          <SelectItem value="afternoon">Afternoon (12pm-5pm)</SelectItem>
                          <SelectItem value="evening">Evening (5pm-9pm)</SelectItem>
                          <SelectItem value="late">Late Night (9pm+)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dietary_notes">Dietary Notes</Label>
                      <Textarea
                        id="dietary_notes"
                        value={formData.dietary_notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, dietary_notes: e.target.value }))}
                        placeholder="Any dietary requirements or preferences..."
                        rows={3}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </ProfileFormSection>

                <div className="flex gap-4">
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsEditing(false);
                          // Reset form data
                          if (profile) {
                            setFormData({
                              display_name: profile.display_name || '',
                              favorite_drink: profile.favorite_drink || '',
                              favorite_venue: profile.favorite_venue || '',
                              visit_time_preference: profile.visit_time_preference || '',
                              dietary_notes: profile.dietary_notes || '',
                              beer_style_preferences: profile.beer_style_preferences || []
                            });
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ledger">
              <SecureLedgerWrapper>
                <MemberLedger />
              </SecureLedgerWrapper>
            </TabsContent>

            <TabsContent value="settings">
              <Card className="border-2 border-black shadow-md">
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Additional settings will be available here soon.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <Footer />
      </div>
    </>
  );
};

export default MemberProfile;