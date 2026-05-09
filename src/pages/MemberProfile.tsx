import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useFullProfile } from '@/hooks/useFullProfile';
import { DenSection } from '@/components/profile/DenSection';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { InterestsSelector } from '@/components/profile/InterestsSelector';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { MembershipCard } from '@/components/membership/MembershipCard';
import { AddToAppleWalletButton } from '@/components/membership/AddToAppleWalletButton';
import Footer from '@/components/Footer';
import denBg from '@/assets/den-bg.jpg';

const tabTriggerClass =
  'rounded-none border-2 border-black bg-white text-black data-[state=active]:bg-black data-[state=active]:text-white font-mono uppercase tracking-[0.2em] text-[10px] md:text-xs h-10';
const pillBtnClass =
  'border-2 border-black bg-white text-black hover:bg-black hover:text-white font-mono uppercase tracking-[0.3em] text-xs rounded-none h-11 px-6 transition-colors';
const denInputClass =
  'rounded-none border-2 border-black bg-white text-black focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black focus-visible:shadow-[inset_0_0_0_1px_black] font-sans text-sm disabled:opacity-70 disabled:cursor-not-allowed';
const denLabelClass =
  'font-mono text-[10px] tracking-[0.3em] uppercase text-black/70';

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
    avatar_url: null as string | null,
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
        avatar_url: profile.avatar_url,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    await updateProfile({
      ...formData,
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
    });
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>Profile | The Den</title>
        <meta name="description" content="Manage your Crazy Bear member profile and Apple Wallet card." />
      </Helmet>

      <div className="min-h-screen relative bg-[#f5f4f0]">
        <div className="relative z-10">
          <Navigation />

          <div
            className="container mx-auto px-4 py-8 max-w-6xl"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 120px)' }}
          >
            {/* Breadcrumb */}
            <div className="mb-6">
              <Link
                to="/den/member"
                className="inline-flex items-center font-mono uppercase tracking-[0.3em] text-[10px] text-black/60 hover:text-black transition-colors"
              >
                <span aria-hidden className="mr-2">←</span>
                Back to The Den
              </Link>
            </div>

            {/* Header */}
            <div className="mb-8 border-b-2 border-black pb-6">
              <p className="font-mono text-[10px] tracking-[0.5em] uppercase text-black/60 mb-3">Member</p>
              <h1 className="font-display uppercase text-4xl md:text-6xl tracking-tight leading-none mb-3 text-black">
                Profile
              </h1>
              <p className="font-sans text-base text-black/70">Your details. Your card.</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-transparent gap-2 p-0 h-auto">
                <TabsTrigger value="profile" className={tabTriggerClass}>Profile</TabsTrigger>
                <TabsTrigger value="ledger" className={tabTriggerClass}>Ledger</TabsTrigger>
                <TabsTrigger value="settings" className={tabTriggerClass}>Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,360px)_1fr] gap-8">
                  {/* Left column — sticky on desktop */}
                  <aside className="md:sticky md:top-32 self-start space-y-6">
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-black/60 mb-2">The Den</p>
                      <h3 className="font-display uppercase text-2xl tracking-tight text-black mb-4">
                        Member Card
                      </h3>
                      <MembershipCard />
                    </div>

                    <AddToAppleWalletButton />

                    <DenSection eyebrow="///" title="Profile Picture" description="Your avatar across The Den.">
                      <AvatarUpload
                        currentAvatarUrl={formData.avatar_url}
                        displayName={`${formData.first_name} ${formData.last_name}`.trim()}
                        onAvatarChange={(newAvatarUrl) => {
                          setFormData((prev) => ({ ...prev, avatar_url: newAvatarUrl }));
                          if (newAvatarUrl !== formData.avatar_url) {
                            updateProfile({ avatar_url: newAvatarUrl });
                          }
                        }}
                      />
                    </DenSection>
                  </aside>

                  {/* Right column — details */}
                  <div className="space-y-4">
                    <DenSection
                      eyebrow="///"
                      title="Basic Information"
                      description="Your name, phone, birthday."
                      isAutopopulated={!!profile?.first_name || !!profile?.last_name}
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="first_name" className={denLabelClass}>First Name</Label>
                          <Input
                            id="first_name"
                            className={denInputClass}
                            value={formData.first_name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))}
                            placeholder="First name"
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last_name" className={denLabelClass}>Last Name</Label>
                          <Input
                            id="last_name"
                            className={denInputClass}
                            value={formData.last_name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))}
                            placeholder="Last name (e.g. Smith-Jones)"
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone_number" className={denLabelClass}>Phone Number</Label>
                          <Input
                            id="phone_number"
                            className={denInputClass}
                            value={formData.phone_number}
                            onChange={(e) => setFormData((prev) => ({ ...prev, phone_number: e.target.value }))}
                            placeholder="Phone number"
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="birthday" className={denLabelClass}>Birthday</Label>
                          <Input
                            id="birthday"
                            type="date"
                            className={denInputClass}
                            value={formData.birthday}
                            onChange={(e) => setFormData((prev) => ({ ...prev, birthday: e.target.value }))}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                    </DenSection>

                    <DenSection
                      eyebrow="///"
                      title="Display"
                      description="How you'd like to appear."
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="display_name" className={denLabelClass}>Display Name</Label>
                          <Input
                            id="display_name"
                            className={denInputClass}
                            value={formData.display_name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, display_name: e.target.value }))}
                            placeholder="How you'd like to be shown"
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="favorite_drink" className={denLabelClass}>Favourite Drink</Label>
                          <Input
                            id="favorite_drink"
                            className={denInputClass}
                            value={formData.favorite_drink}
                            onChange={(e) => setFormData((prev) => ({ ...prev, favorite_drink: e.target.value }))}
                            placeholder="Your go-to"
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                    </DenSection>

                    <DenSection
                      eyebrow="///"
                      title="Interests & Preferences"
                      description="Help us tailor your visits."
                      isAutopopulated={!!(profile?.interests?.length || profile?.favorite_venue)}
                    >
                      {isEditing ? (
                        <InterestsSelector
                          selectedInterests={formData.interests}
                          onInterestsChange={(interests) => setFormData((prev) => ({ ...prev, interests }))}
                          favoriteVenue={formData.favorite_venue}
                          onFavoriteVenueChange={(venue) => setFormData((prev) => ({ ...prev, favorite_venue: venue }))}
                          visitTimePreference={formData.visit_time_preference}
                          onVisitTimeChange={(time) => setFormData((prev) => ({ ...prev, visit_time_preference: time }))}
                          beerStylePreferences={formData.beer_style_preferences}
                          onBeerStylesChange={(styles) => setFormData((prev) => ({ ...prev, beer_style_preferences: styles }))}
                        />
                      ) : (
                        <div className="space-y-4">
                          {formData.interests.length > 0 && (
                            <div>
                              <p className={denLabelClass}>Interests</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {formData.interests.map((interest) => (
                                  <span
                                    key={interest}
                                    className="border border-black px-3 py-1 font-mono uppercase tracking-[0.2em] text-[10px] text-black"
                                  >
                                    {interest}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {formData.favorite_venue && (
                            <div>
                              <p className={denLabelClass}>Favourite Venue</p>
                              <p className="font-sans text-sm text-black mt-1">{formData.favorite_venue}</p>
                            </div>
                          )}
                          {formData.visit_time_preference && (
                            <div>
                              <p className={denLabelClass}>Visit Time</p>
                              <p className="font-sans text-sm text-black mt-1">{formData.visit_time_preference}</p>
                            </div>
                          )}
                          {formData.beer_style_preferences.length > 0 && (
                            <div>
                              <p className={denLabelClass}>Beer Styles</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {formData.beer_style_preferences.map((style) => (
                                  <span
                                    key={style}
                                    className="border border-black px-3 py-1 font-mono uppercase tracking-[0.2em] text-[10px] text-black"
                                  >
                                    {style}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {!formData.interests.length &&
                            !formData.favorite_venue &&
                            !formData.visit_time_preference &&
                            !formData.beer_style_preferences.length && (
                              <p className="font-sans text-sm text-black/50">
                                Edit your profile to add interests and preferences.
                              </p>
                            )}
                        </div>
                      )}
                    </DenSection>

                    <DenSection
                      eyebrow="///"
                      title="Dietary Notes"
                      description="Allergies, requirements, anything we should know."
                      collapsible
                      defaultOpen={false}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="dietary_notes" className={denLabelClass}>Notes</Label>
                        <Textarea
                          id="dietary_notes"
                          className={denInputClass}
                          value={formData.dietary_notes}
                          onChange={(e) => setFormData((prev) => ({ ...prev, dietary_notes: e.target.value }))}
                          placeholder="Any dietary requirements or preferences..."
                          rows={3}
                          disabled={!isEditing}
                        />
                      </div>
                    </DenSection>

                    <DenSection
                      eyebrow="///"
                      title="Communication"
                      description="How we keep in touch."
                      collapsible
                      defaultOpen={false}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="push_notifications"
                            checked={formData.communication_preferences.push}
                            onCheckedChange={(checked) =>
                              setFormData((prev) => ({
                                ...prev,
                                communication_preferences: { ...prev.communication_preferences, push: !!checked },
                              }))
                            }
                            disabled={!isEditing}
                            className="rounded-none border-2 border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
                          />
                          <Label htmlFor="push_notifications" className={denLabelClass}>
                            Push Notifications
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="email_notifications"
                            checked={formData.communication_preferences.email}
                            onCheckedChange={(checked) =>
                              setFormData((prev) => ({
                                ...prev,
                                communication_preferences: { ...prev.communication_preferences, email: !!checked },
                              }))
                            }
                            disabled={!isEditing}
                            className="rounded-none border-2 border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
                          />
                          <Label htmlFor="email_notifications" className={denLabelClass}>
                            Email Updates
                          </Label>
                        </div>
                      </div>
                    </DenSection>

                    <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-black">
                      {!isEditing ? (
                        <Button onClick={() => setIsEditing(true)} className={pillBtnClass}>
                          Edit Profile
                        </Button>
                      ) : (
                        <>
                          <Button onClick={handleSave} disabled={loading} className={pillBtnClass}>
                            {loading ? 'Saving' : 'Save Changes'}
                          </Button>
                          <Button
                            variant="outline"
                            className={pillBtnClass}
                            onClick={() => {
                              setIsEditing(false);
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
                                  avatar_url: profile.avatar_url,
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
                </div>
              </TabsContent>

              <TabsContent value="ledger">
                <div className="border-2 border-black bg-white p-6 md:p-8">
                  <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-black/60 mb-2">The Den</p>
                  <h3 className="font-display uppercase text-2xl md:text-3xl tracking-tight text-black mb-3">
                    Member Ledger
                  </h3>
                  <p className="font-sans text-sm text-black/70 mb-6">
                    Your transaction history and spending across The Den.
                  </p>
                  <Link to="/den/member/ledger" className={`inline-flex items-center justify-center ${pillBtnClass}`}>
                    Open Full Ledger
                  </Link>
                </div>
              </TabsContent>

              <TabsContent value="settings">
                <div className="border-2 border-black bg-white p-6 md:p-8">
                  <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-black/60 mb-2">The Den</p>
                  <h3 className="font-display uppercase text-2xl md:text-3xl tracking-tight text-black mb-3">
                    Account Settings
                  </h3>
                  <p className="font-sans text-sm text-black/70">
                    Additional settings will be available here soon.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <Footer />
        </div>
      </div>
    </>
  );
};

export default MemberProfile;
