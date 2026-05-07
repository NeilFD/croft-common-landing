import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useFullProfile } from '@/hooks/useFullProfile';
import { ProfileFormSection } from '@/components/profile/ProfileFormSection';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { InterestsSelector } from '@/components/profile/InterestsSelector';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { SecureLedgerWrapper } from '@/components/ledger/SecureLedgerWrapper';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { MembershipCard } from '@/components/membership/MembershipCard';
import Footer from '@/components/Footer';
import denBg from '@/assets/den-bg.jpg';

const tabTriggerClass = "rounded-none border-2 border-black bg-white text-black data-[state=active]:bg-black data-[state=active]:text-white font-mono uppercase tracking-[0.2em] text-[10px] md:text-xs h-10";
const pillBtnClass = "border-2 border-black bg-white text-black hover:bg-black hover:text-white font-mono uppercase tracking-[0.3em] text-xs rounded-none h-11 px-6";

const MemberProfile: React.FC = () => {
  const { user } = useAuth();
  const { profile, loading, updateProfile } = useFullProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    birthday: '',
    display_name: '',
    favorite_drink: '',
    favorite_venue: '',
    visit_time_preference: '',
    dietary_notes: '',
    interests: [] as string[],
    dietary_preferences: [] as string[],
    beer_style_preferences: [] as string[],
    communication_preferences: { push: true, email: true },
    avatar_url: null as string | null
  });

  React.useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone_number: profile.phone_number || '',
        birthday: profile.birthday || '',
        display_name: profile.display_name || '',
        favorite_drink: profile.favorite_drink || '',
        favorite_venue: profile.favorite_venue || '',
        visit_time_preference: profile.visit_time_preference || '',
        dietary_notes: profile.dietary_notes || '',
        interests: profile.interests || [],
        dietary_preferences: profile.dietary_preferences || [],
        beer_style_preferences: profile.beer_style_preferences || [],
        communication_preferences: profile.communication_preferences || { push: true, email: true },
        avatar_url: profile.avatar_url
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
        <title>Profile | The Den</title>
        <meta name="description" content="Manage your member profile and view your member card." />
      </Helmet>

      <div className="min-h-screen relative">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{ backgroundImage: `url(${denBg})`, filter: 'grayscale(1) contrast(1.05)' }}
        />
        <div className="fixed inset-0 bg-white/85 z-0" />

        <div className="relative z-10">
          <Navigation />

          <div className="container mx-auto px-4 py-8" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 140px)' }}>
            {/* Breadcrumb */}
            <div className="mb-6">
              <Link
                to="/den/member"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-[0.2em] text-[10px]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to the Den
              </Link>
            </div>

            {/* Header */}
            <div className="mb-8">
              <p className="font-mono text-[10px] tracking-[0.5em] uppercase text-muted-foreground mb-3">Member</p>
              <h1 className="font-display uppercase text-5xl md:text-7xl tracking-tight leading-none mb-3">Profile</h1>
              <p className="font-sans text-base md:text-lg text-muted-foreground">Your details. Your card.</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-transparent gap-2 p-0 h-auto">
                <TabsTrigger value="profile" className={tabTriggerClass}>Profile</TabsTrigger>
                <TabsTrigger value="ledger" className={tabTriggerClass}>Ledger</TabsTrigger>
                <TabsTrigger value="settings" className={tabTriggerClass}>Settings</TabsTrigger>
              </TabsList>

            <TabsContent value="profile">
              <div className="space-y-6">
                {/* Membership Card Section */}
                <div>
                  <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-2">The Den</p>
                  <h3 className="font-display uppercase text-2xl md:text-3xl tracking-tight mb-4">Member Card</h3>
                  <MembershipCard />
                </div>

                {/* Avatar Section */}
                <ProfileFormSection
                  title="Profile Picture"
                  description="Upload or change your profile picture"
                >
                  <AvatarUpload
                    currentAvatarUrl={formData.avatar_url}
                    displayName={`${formData.first_name} ${formData.last_name}`.trim()}
                    onAvatarChange={(newAvatarUrl) => {
                      setFormData(prev => ({ ...prev, avatar_url: newAvatarUrl }));
                      if (newAvatarUrl !== formData.avatar_url) {
                        updateProfile({ avatar_url: newAvatarUrl });
                      }
                    }}
                  />
                </ProfileFormSection>

                {/* Basic Information */}
                <ProfileFormSection
                  title="Basic Information"
                  description="Your personal details from signup"
                  isAutopopulated={!!profile?.first_name || !!profile?.last_name}
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                        placeholder="First name"
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                        placeholder="Last name"
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input
                        id="phone_number"
                        value={formData.phone_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                        placeholder="Phone number"
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthday">Birthday</Label>
                      <Input
                        id="birthday"
                        type="date"
                        value={formData.birthday}
                        onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </ProfileFormSection>

                {/* Display Information */}
                <ProfileFormSection
                  title="Display Information"
                  description="How you'd like to appear to others"
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

                {/* Interests and Preferences */}
                <ProfileFormSection
                  title="Interests & Preferences"
                  description="Help us personalize your experience"
                  isAutopopulated={!!(profile?.interests?.length || profile?.favorite_venue)}
                >
                  {isEditing ? (
                    <InterestsSelector
                      selectedInterests={formData.interests}
                      onInterestsChange={(interests) => setFormData(prev => ({ ...prev, interests }))}
                      favoriteVenue={formData.favorite_venue}
                      onFavoriteVenueChange={(venue) => setFormData(prev => ({ ...prev, favorite_venue: venue }))}
                      visitTimePreference={formData.visit_time_preference}
                      onVisitTimeChange={(time) => setFormData(prev => ({ ...prev, visit_time_preference: time }))}
                      beerStylePreferences={formData.beer_style_preferences}
                      onBeerStylesChange={(styles) => setFormData(prev => ({ ...prev, beer_style_preferences: styles }))}
                    />
                  ) : (
                    <div className="space-y-4">
                      {formData.interests.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Interests</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData.interests.map(interest => (
                              <span key={interest} className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {formData.favorite_venue && (
                        <div>
                          <Label className="text-sm font-medium">Favorite Venue</Label>
                          <p className="text-sm text-muted-foreground mt-1">{formData.favorite_venue}</p>
                        </div>
                      )}
                      {formData.visit_time_preference && (
                        <div>
                          <Label className="text-sm font-medium">Visit Time Preference</Label>
                          <p className="text-sm text-muted-foreground mt-1">{formData.visit_time_preference}</p>
                        </div>
                      )}
                      {formData.beer_style_preferences.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Beer Style Preferences</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData.beer_style_preferences.map(style => (
                              <span key={style} className="bg-secondary/10 text-secondary px-2 py-1 rounded-md text-sm">
                                {style}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ProfileFormSection>

                {/* Dietary & Additional */}
                <ProfileFormSection
                  title="Dietary & Additional Notes"
                  description="Any special requirements or notes"
                >
                  <div className="space-y-4">
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

                {/* Communication Preferences */}
                <ProfileFormSection
                  title="Communication Preferences"
                  description="How would you like us to contact you?"
                >
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="push_notifications"
                        checked={formData.communication_preferences.push}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ 
                            ...prev, 
                            communication_preferences: { 
                              ...prev.communication_preferences, 
                              push: !!checked 
                            }
                          }))
                        }
                        disabled={!isEditing}
                      />
                      <Label htmlFor="push_notifications">Push Notifications</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="email_notifications"
                        checked={formData.communication_preferences.email}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ 
                            ...prev, 
                            communication_preferences: { 
                              ...prev.communication_preferences, 
                              email: !!checked 
                            }
                          }))
                        }
                        disabled={!isEditing}
                      />
                      <Label htmlFor="email_notifications">Email Updates</Label>
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
                              first_name: profile.first_name || '',
                              last_name: profile.last_name || '',
                              phone_number: profile.phone_number || '',
                              birthday: profile.birthday || '',
                              display_name: profile.display_name || '',
                              favorite_drink: profile.favorite_drink || '',
                              favorite_venue: profile.favorite_venue || '',
                              visit_time_preference: profile.visit_time_preference || '',
                              dietary_notes: profile.dietary_notes || '',
                              interests: profile.interests || [],
                              dietary_preferences: profile.dietary_preferences || [],
                              beer_style_preferences: profile.beer_style_preferences || [],
                              communication_preferences: profile.communication_preferences || { push: true, email: true },
                              avatar_url: profile.avatar_url
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
              <Card className="border-2 border-black shadow-md">
                <CardHeader>
                  <CardTitle>Member Ledger</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    View your transaction history and account activity.
                  </p>
                  <Link 
                    to="/den/member/ledger" 
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  >
                    Open Full Ledger
                  </Link>
                </CardContent>
              </Card>
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