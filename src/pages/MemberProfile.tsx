import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, User, Settings, Heart, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useCMSMode } from '@/contexts/CMSModeContext';
import { useFullProfile } from '@/hooks/useFullProfile';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { ProfileFormSection } from '@/components/profile/ProfileFormSection';
import { InterestsSelector } from '@/components/profile/InterestsSelector';

const MemberProfile: React.FC = () => {
  const { isCMSMode } = useCMSMode();
  const { profile, loading, updateProfile } = useFullProfile();
  const [saving, setSaving] = useState(false);
  const [localProfile, setLocalProfile] = useState(profile);

  // Update local state when profile loads
  React.useEffect(() => {
    if (profile) {
      setLocalProfile(profile);
    }
  }, [profile]);

  const handleInputChange = (field: string, value: any) => {
    if (localProfile) {
      setLocalProfile({ ...localProfile, [field]: value });
    }
  };

  const handleSave = async () => {
    if (!localProfile || !profile) return;

    setSaving(true);
    try {
      // Only send changed fields
      const changes: any = {};
      Object.keys(localProfile).forEach(key => {
        if (localProfile[key as keyof typeof localProfile] !== profile[key as keyof typeof profile]) {
          changes[key] = localProfile[key as keyof typeof localProfile];
        }
      });

      if (Object.keys(changes).length > 0) {
        await updateProfile(changes);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {isCMSMode && <Navigation />}
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your profile...</p>
            </div>
          </div>
        </div>
        {isCMSMode && <Footer />}
      </div>
    );
  }

  const hasExistingData = profile?.interests?.length || profile?.first_name || profile?.phone_number;

  return (
    <div className="min-h-screen bg-background">
      {isCMSMode && <Navigation />}
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link 
            to="/common-room/member" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Member Home
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2 font-brutalist">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your member profile and preferences
            {hasExistingData && (
              <span className="block text-sm text-pink-600 mt-1">
                ✨ We've pre-filled this with your subscription preferences - feel free to update!
              </span>
            )}
          </p>
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 border-2 border-black">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="interests" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Interests
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Communication
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Privacy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            <ProfileFormSection 
              title="Profile Picture" 
              description="Upload a profile picture to personalize your account"
            >
              <AvatarUpload
                currentAvatarUrl={localProfile?.avatar_url}
                displayName={localProfile?.display_name || localProfile?.first_name}
                onAvatarChange={(url) => handleInputChange('avatar_url', url)}
              />
            </ProfileFormSection>

            <ProfileFormSection 
              title="Personal Information" 
              description="Basic information about you"
              isAutopopulated={!!(profile?.first_name || profile?.phone_number)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={localProfile?.display_name || ''}
                    onChange={(e) => handleInputChange('display_name', e.target.value)}
                    placeholder="How you'd like to be known"
                    className="border-2 border-black focus:border-pink-500"
                  />
                </div>
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={localProfile?.first_name || ''}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className="border-2 border-black focus:border-pink-500"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={localProfile?.last_name || ''}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className="border-2 border-black focus:border-pink-500"
                  />
                </div>
                <div>
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={localProfile?.phone_number || ''}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    className="border-2 border-black focus:border-pink-500"
                  />
                </div>
                <div>
                  <Label htmlFor="birthday">Birthday</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={localProfile?.birthday || ''}
                    onChange={(e) => handleInputChange('birthday', e.target.value)}
                    className="border-2 border-black focus:border-pink-500"
                  />
                </div>
                <div>
                  <Label htmlFor="favorite_drink">Favorite Drink</Label>
                  <Input
                    id="favorite_drink"
                    value={localProfile?.favorite_drink || ''}
                    onChange={(e) => handleInputChange('favorite_drink', e.target.value)}
                    placeholder="e.g., IPA, Latte, Old Fashioned"
                    className="border-2 border-black focus:border-pink-500"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="dietary_notes">Dietary Notes</Label>
                <Textarea
                  id="dietary_notes"
                  value={localProfile?.dietary_notes || ''}
                  onChange={(e) => handleInputChange('dietary_notes', e.target.value)}
                  placeholder="Any additional dietary requirements or notes..."
                  className="border-2 border-black focus:border-pink-500"
                  rows={3}
                />
              </div>
            </ProfileFormSection>
          </TabsContent>

          <TabsContent value="interests" className="space-y-6">
            <ProfileFormSection 
              title="Interests & Preferences" 
              description="Tell us what you're interested in to personalize your experience"
              isAutopopulated={!!(profile?.interests?.length)}
            >
              <InterestsSelector
                selectedInterests={localProfile?.interests || []}
                onInterestsChange={(interests) => handleInputChange('interests', interests)}
                favoriteVenue={localProfile?.favorite_venue}
                onFavoriteVenueChange={(venue) => handleInputChange('favorite_venue', venue)}
                visitTimePreference={localProfile?.visit_time_preference}
                onVisitTimeChange={(time) => handleInputChange('visit_time_preference', time)}
                beerStylePreferences={localProfile?.beer_style_preferences}
                onBeerStylesChange={(styles) => handleInputChange('beer_style_preferences', styles)}
              />
            </ProfileFormSection>
          </TabsContent>

          <TabsContent value="communication" className="space-y-6">
            <ProfileFormSection 
              title="Communication Preferences" 
              description="Choose how you'd like to hear from us"
              isAutopopulated={!!(profile?.communication_preferences)}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email_notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive updates and newsletters via email</p>
                  </div>
                  <Switch
                    id="email_notifications"
                    checked={localProfile?.communication_preferences?.email ?? true}
                    onCheckedChange={(checked) => 
                      handleInputChange('communication_preferences', {
                        ...localProfile?.communication_preferences,
                        email: checked
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push_notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive push notifications for events and updates</p>
                  </div>
                  <Switch
                    id="push_notifications"
                    checked={localProfile?.communication_preferences?.push ?? true}
                    onCheckedChange={(checked) => 
                      handleInputChange('communication_preferences', {
                        ...localProfile?.communication_preferences,
                        push: checked
                      })
                    }
                  />
                </div>
              </div>
            </ProfileFormSection>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <ProfileFormSection 
              title="Privacy Settings" 
              description="Control your privacy and visibility settings"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="hide_leaderboards">Hide from Leaderboards</Label>
                    <p className="text-sm text-muted-foreground">Don't show my name on public leaderboards and rankings</p>
                  </div>
                  <Switch
                    id="hide_leaderboards"
                    checked={localProfile?.hide_from_leaderboards ?? false}
                    onCheckedChange={(checked) => handleInputChange('hide_from_leaderboards', checked)}
                  />
                </div>
              </div>
            </ProfileFormSection>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-8">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-pink-500 hover:bg-pink-600 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>

      {isCMSMode && <Footer />}
    </div>
  );
};

export default MemberProfile;