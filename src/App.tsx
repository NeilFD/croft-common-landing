import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { useEffect, Suspense, lazy, useState, type ReactNode } from "react";
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TransitionProvider } from "@/contexts/TransitionContext";
import { NudgeNotificationProvider } from "@/contexts/NudgeNotificationContext";
const NudgeFloatingButton = lazy(() => import('./components/NudgeFloatingButton'));
const CBSpotifyPlayer = lazy(() => import('./components/crazybear/CBSpotifyPlayer'));
const CBFloatingActions = lazy(() => import('./components/crazybear/CBFloatingActions'));

// Lazy load pages for better performance
import Landing from "./pages/Landing";
const Index = lazy(() => import("./pages/Index"));
const HouseRules = lazy(() => import("./pages/HouseRules"));
const ImagePicker = lazy(() => import("./pages/ImagePicker"));
const PropertyLayout = lazy(() => import("./components/property/PropertyLayout"));
const BearsDen = lazy(() => import("./pages/crazybear/BearsDen"));
const SetPassword = lazy(() => import("./pages/crazybear/SetPassword"));
const CountryHome = lazy(() => import("./pages/property").then((m) => ({ default: m.CountryHome })));
const CountryPub = lazy(() => import("./pages/property").then((m) => ({ default: m.CountryPub })));
const CountryPubFood = lazy(() => import("./pages/property").then((m) => ({ default: m.CountryPubFood })));
const CountryPubDrink = lazy(() => import("./pages/property").then((m) => ({ default: m.CountryPubDrink })));
const CountryPubHospitality = lazy(() => import("./pages/property").then((m) => ({ default: m.CountryPubHospitality })));
const CountryRooms = lazy(() => import("./pages/property").then((m) => ({ default: m.CountryRooms })));
const CountryRoomTypes = lazy(() => import("./pages/property").then((m) => ({ default: m.CountryRoomTypes })));
const CountryRoomGallery = lazy(() => import("./pages/property").then((m) => ({ default: m.CountryRoomGallery })));
const CountryParties = lazy(() => import("./pages/property").then((m) => ({ default: m.CountryParties })));
const CountryEvents = lazy(() => import("./pages/property").then((m) => ({ default: m.CountryEvents })));
const CountryWeddings = lazy(() => import("./pages/property").then((m) => ({ default: m.CountryWeddings })));
const CountryBirthdays = lazy(() => import("./pages/property").then((m) => ({ default: m.CountryBirthdays })));
const CountryBusiness = lazy(() => import("./pages/property").then((m) => ({ default: m.CountryBusiness })));
const TownHome = lazy(() => import("./pages/property").then((m) => ({ default: m.TownHome })));
const TownFood = lazy(() => import("./pages/property").then((m) => ({ default: m.TownFood })));
const TownBlackBear = lazy(() => import("./pages/property").then((m) => ({ default: m.TownBlackBear })));
const TownBnB = lazy(() => import("./pages/property").then((m) => ({ default: m.TownBnB })));
const TownHomThai = lazy(() => import("./pages/property").then((m) => ({ default: m.TownHomThai })));
const TownDrink = lazy(() => import("./pages/property").then((m) => ({ default: m.TownDrink })));
const TownCocktails = lazy(() => import("./pages/property").then((m) => ({ default: m.TownCocktails })));
const TownRooms = lazy(() => import("./pages/property").then((m) => ({ default: m.TownRooms })));
const TownRoomTypes = lazy(() => import("./pages/property").then((m) => ({ default: m.TownRoomTypes })));
const TownRoomGallery = lazy(() => import("./pages/property").then((m) => ({ default: m.TownRoomGallery })));
const TownPool = lazy(() => import("./pages/property").then((m) => ({ default: m.TownPool })));
const Cafe = lazy(() => import("./pages/Cafe"));
const Cocktails = lazy(() => import("./pages/Cocktails"));
const Beer = lazy(() => import("./pages/Beer"));
const Kitchens = lazy(() => import("./pages/Kitchens"));
const Hall = lazy(() => import("./pages/Hall"));
const EventEnquiry = lazy(() => import("./pages/EventEnquiry"));
const Community = lazy(() => import("./pages/Community"));
const CommonRoom = lazy(() => import("./pages/CommonRoom"));
const CommonRoomMain = lazy(() => import("./pages/CommonRoomMain"));
const MemberHome = lazy(() => import("./pages/MemberHome"));
const LunchRun = lazy(() => import("./pages/LunchRun"));
const MemberLedger = lazy(() => import("./pages/MemberLedger"));
const MemberProfile = lazy(() => import("./pages/MemberProfile"));
const DenVerify = lazy(() => import("./pages/DenVerify"));
const MemberDashboard = lazy(() => import("./pages/MemberDashboard"));
const MemberMoments = lazy(() => import("./pages/MemberMoments"));
const CheckIn = lazy(() => import("./pages/CheckIn"));
const Calendar = lazy(() => import("./pages/Calendar"));
const ManageEvent = lazy(() => import("./pages/ManageEvent"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Branding = lazy(() => import("./pages/Branding"));
const PushSetup = lazy(() => import("./pages/PushSetup").then(m => ({ default: m.PushSetup })));
const ClickRedirect = lazy(() => import("./pages/ClickRedirect"));
const ExtRedirect = lazy(() => import("./pages/ExtRedirect"));
const CroftCommonDateTime = lazy(() => import("./pages/CroftCommonDateTime"));
const Book = lazy(() => import("./pages/Book"));
const ProposalRedirect = lazy(() => import("./pages/ProposalRedirect"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminMemberAnalytics = lazy(() => import("./pages/AdminMemberAnalytics"));
const EnhancedAdminMemberAnalytics = lazy(() => import("./pages/EnhancedAdminMemberAnalytics"));
const EnquirePage = lazy(() => import("./pages/EnquirePage"));
const CMSFAQPage = lazy(() => import("./pages/CMSFAQPage"));
const CMS = lazy(() => import("./pages/CMS"));
const CMSLogin = lazy(() => import("./pages/CMSLogin"));
const CMSVisual = lazy(() => import("./pages/CMSVisual"));
const CMSKitchens = lazy(() => import("./pages/CMSKitchens"));
const Notifications = lazy(() => import("./pages/Notifications"));
const SecretKitchens = lazy(() => import("./pages/SecretKitchens"));
const SecretKitchenAdmin = lazy(() => import("./pages/SecretKitchenAdmin"));
const OneKitchenMenu = lazy(() => import("./pages/OneKitchenMenu"));
const Research = lazy(() => import("./pages/Research"));
const UncommonStandards = lazy(() => import("./pages/UncommonStandards"));

// Optimized imports that load immediately
const RouteImagePreloader = lazy(() => import('@/components/RouteImagePreloader'));
const NavigationImagePreloader = lazy(() => import('@/components/NavigationImagePreloader'));
import ScrollToTop from '@/components/ScrollToTop';
import DomainGuard from '@/components/DomainGuard';
import ReverseDomainGuard from '@/components/ReverseDomainGuard';
import { useHiddenDevPanel } from '@/hooks/useHiddenDevPanel';
import { HiddenDevPanel } from '@/components/native/HiddenDevPanel';
import { ProtectedRoute } from '@/components/research/ProtectedRoute';
import { RecoveryGuard } from '@/components/auth/RecoveryGuard';
const GlobalHandlers = lazy(() => import('@/components/GlobalHandlers'));
const MembershipAuthProvider = lazy(() => import("@/contexts/MembershipAuthContext").then((m) => ({ default: m.MembershipAuthProvider })));


// Management system components
const ManagementLogin = lazy(() => import("./pages/management/ManagementLogin"));
const ManagementDashboard = lazy(() => import("./pages/management/ManagementDashboard"));
const ManagementAIAssistant = lazy(() => import("./pages/management/ManagementAIAssistant"));
const FeedbackManagement = lazy(() => import("./pages/management/FeedbackManagement"));
const Settings = lazy(() => import("./pages/management/Settings"));
const PasswordChangeRequired = lazy(() => import("./components/management/auth/PasswordChangeRequired"));
const CommonKnowledgeDashboard = lazy(() => import("./pages/management/CommonKnowledgeDashboard"));
const CommonKnowledgeNew = lazy(() => import("./pages/management/CommonKnowledgeNew"));
const CommonKnowledgeUpload = lazy(() => import("./pages/management/CommonKnowledgeUpload"));
const CommonKnowledgeView = lazy(() => import("./pages/management/CommonKnowledgeView"));
const FixDocument = lazy(() => import("./pages/management/FixDocument"));
const SpacesDashboard = lazy(() => import("./pages/management/SpacesDashboard"));
const VenuesList = lazy(() => import("./pages/management/VenuesList"));
const SpaceForm = lazy(() => import("./pages/management/SpaceForm"));
const SpaceDetail = lazy(() => import("./pages/management/SpaceDetail"));
const CalendarView = lazy(() => import("./pages/management/CalendarView"));
const LeadsList = lazy(() => import("./pages/management/LeadsList"));
const LeadDetail = lazy(() => import("./pages/management/LeadDetail"));
const BookingDetail = lazy(() => import("./pages/management/BookingDetail"));
const EventsList = lazy(() => import("./pages/management/EventsList"));
const EventDetail = lazy(() => import("./pages/management/EventDetail"));
const Chat = lazy(() => import("./pages/management/Chat"));
const BeoViewer = lazy(() => import("./pages/BeoViewer"));
const ClientMagicLogin = lazy(() => import("./pages/ClientMagicLogin"));
const ClientPortal = lazy(() => import("./pages/ClientPortal"));

const queryClient = new QueryClient();


const LowercasePathGuard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const allowedRoots = new Set([
     "", // homepage
     "cafe",
     "cocktails",
     "beer",
      "kitchens",
      "secretkitchens",
      "secretkitchenadmin",
      "hall",
     "community",
     "common-room",
     "calendar",
     "manage-event",
     "privacy",
     "unsubscribe",
     "branding",
     
     "book",
     "admin",
     "croft-common-datetime",
     "notifications",
   ]);
  useEffect(() => {
    const path = location.pathname;
    if (!/[A-Z]/.test(path)) return;
    
    // Don't redirect if user is actively typing in input fields
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      return;
    }
    
    const first = path.split("/").filter(Boolean)[0] ?? "";
    const lowerFirst = first.toLowerCase();
    if (allowedRoots.has(lowerFirst)) {
      navigate(path.toLowerCase() + location.search + location.hash, { replace: true });
    }
  }, [location.pathname]);
  return null;
};
 
// Loading fallback component with escape hatch for PWA issues
const PageLoader = () => {
  const [showReloadButton, setShowReloadButton] = useState(false);
  const location = useLocation();
  
  // Dispatch a beacon when Suspense fallback mounts for a route
  useEffect(() => {
    try {
      const ev = new CustomEvent('cc:routes-loading', { detail: { pathname: location.pathname, ts: Date.now() } });
      window.dispatchEvent(ev);
    } catch {}
  }, [location.pathname]);
  
  useEffect(() => {
    // Show reload button after 10 seconds of loading
    const timer = setTimeout(() => {
      setShowReloadButton(true);
    }, 10000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleReload = () => {
    // Force reload to bypass service worker cache
    window.location.href = window.location.href + '?bypass-cache=true';
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mb-4"></div>
      <p className="text-muted-foreground mb-4">Loading...</p>
      {showReloadButton && (
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Taking longer than expected?</p>
          <Button onClick={handleReload} variant="outline">
            Reload App
          </Button>
        </div>
      )}
    </div>
  );
};

// Emits a hydration beacon once route content has mounted (Suspense resolved)
const RouteHydrationBeacon = () => {
  const location = useLocation();
  useEffect(() => {
    try {
      const ev = new CustomEvent('cc:routes-hydrated', { detail: { pathname: location.pathname, ts: Date.now() } });
      window.dispatchEvent(ev);
    } catch {}
  }, [location.pathname]);
  return null;
};

const ManagementLoginRoute = () => {
  const isCrazyBearHost = typeof window !== 'undefined' && window.location.hostname.includes('crazybeartest.com');
  if (isCrazyBearHost) {
    const target = '/set-password' + window.location.search + window.location.hash;
    return <Navigate to={target} replace />;
  }
  return <ManagementLogin />;
};

const MemberRoutes = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<PageLoader />}>
    <MembershipAuthProvider>{children}</MembershipAuthProvider>
  </Suspense>
);

const App = () => {
  const { isOpen, handleLogoTap, closePanel } = useHiddenDevPanel();
  
  // Safety cleanup for any lingering gesture-drawing classes
  useEffect(() => {
    const cleanup = () => {
      document.body.classList.remove('gesture-drawing');
      document.documentElement.classList.remove('gesture-drawing');
      document.body.style.pointerEvents = '';
      document.documentElement.style.pointerEvents = '';
    };
    
    cleanup();
    
    return cleanup;
  }, []);
  
  const Router = ((window as any)?.Capacitor?.isNativePlatform?.() === true) ? HashRouter : BrowserRouter;

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <NudgeNotificationProvider>
              <Toaster />
              <Sonner />
              <Router>
                <ScrollToTop />
                <Suspense fallback={null}>
                  <GlobalHandlers />
                </Suspense>
                <LowercasePathGuard />
                <ReverseDomainGuard />
                
                <RecoveryGuard />
                <Suspense fallback={null}>
                  <RouteImagePreloader />
                  <NavigationImagePreloader />
                </Suspense>
                <Suspense fallback={null}>
                  <NudgeFloatingButton />
                  <CBSpotifyPlayer />
                </Suspense>
                
                <TransitionProvider>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                      <Route path="/" element={<Landing />} />
                      <Route path="/house-rules" element={<HouseRules />} />
                      <Route path="/image-picker" element={<ImagePicker />} />

                      {/* Crazy Bear Country */}
                      <Route path="/country" element={<PropertyLayout property="country" />}>
                        <Route index element={<CountryHome />} />
                        <Route path="pub" element={<CountryPub />} />
                        <Route path="pub/food" element={<CountryPubFood />} />
                        <Route path="pub/drink" element={<CountryPubDrink />} />
                        <Route path="pub/hospitality" element={<CountryPubHospitality />} />
                        <Route path="rooms" element={<CountryRooms />} />
                        <Route path="rooms/types" element={<CountryRoomTypes />} />
                        <Route path="rooms/gallery" element={<CountryRoomGallery />} />
                        <Route path="parties" element={<CountryParties />} />
                        <Route path="events" element={<CountryEvents />} />
                        <Route path="events/weddings" element={<CountryWeddings />} />
                        <Route path="events/birthdays" element={<CountryBirthdays />} />
                        <Route path="events/business" element={<CountryBusiness />} />
                        <Route path="members" element={<Navigate to="/members" replace />} />
                      </Route>

                      {/* Crazy Bear Town */}
                      <Route path="/town" element={<PropertyLayout property="town" />}>
                        <Route index element={<TownHome />} />
                        <Route path="food" element={<TownFood />} />
                        <Route path="food/black-bear" element={<TownBlackBear />} />
                        <Route path="food/bnb" element={<TownBnB />} />
                        <Route path="food/hom-thai" element={<TownHomThai />} />
                        <Route path="drink" element={<TownDrink />} />
                        <Route path="drink/cocktails" element={<TownCocktails />} />
                        <Route path="rooms" element={<TownRooms />} />
                        <Route path="rooms/types" element={<TownRoomTypes />} />
                        <Route path="rooms/gallery" element={<TownRoomGallery />} />
                        <Route path="pool" element={<TownPool />} />
                        <Route path="members" element={<Navigate to="/members" replace />} />
                      </Route>

                      {/* Crazy Bear members entry */}
                      <Route path="/bears-den" element={<BearsDen />} />
                      <Route path="/set-password" element={<SetPassword />} />

                      {/* Members entry - the Den */}
                      <Route path="/members" element={<Navigate to="/den" replace />} />

                      {/* Legacy Croft entry retained for members/secret gestures */}
                      <Route path="/croft" element={<Index />} />
                      <Route path="/cafe" element={<Cafe />} />
                      <Route path="/cocktails" element={<Cocktails />} />
                      <Route path="/beer" element={<Beer />} />
                      <Route path="/kitchens" element={<Kitchens />} />
                      <Route path="/onekitchen-menu" element={<OneKitchenMenu />} />
                      <Route path="/secretkitchens" element={<DomainGuard><SecretKitchens /></DomainGuard>} />
                      <Route path="/secretkitchenadmin" element={<SecretKitchenAdmin />} />
          <Route path="/hall" element={<Hall />} />
          <Route path="/event-enquiry" element={<EventEnquiry />} />
                      <Route path="/community" element={<Community />} />

                      {/* The Den - new routes */}
                      <Route path="/den" element={<MemberRoutes><CommonRoom /></MemberRoutes>} />
                      <Route path="/den/main" element={<MemberRoutes><CommonRoomMain /></MemberRoutes>} />
                      <Route path="/den/member" element={<MemberRoutes><MemberHome /></MemberRoutes>} />
                      <Route path="/den/member/lunch-run" element={<MemberRoutes><LunchRun /></MemberRoutes>} />
                      <Route path="/den/member/ledger" element={<MemberRoutes><MemberLedger /></MemberRoutes>} />
                      <Route path="/den/member/profile" element={<MemberRoutes><MemberProfile /></MemberRoutes>} />
                      <Route path="/den/member/dashboard" element={<MemberRoutes><MemberDashboard /></MemberRoutes>} />
                      <Route path="/den/member/moments" element={<MemberRoutes><MemberMoments /></MemberRoutes>} />
                      <Route path="/den/verify" element={<DenVerify />} />

                      {/* Legacy /common-room redirects */}
                      <Route path="/common-room" element={<Navigate to="/den" replace />} />
                      <Route path="/common-room/main" element={<Navigate to="/den/main" replace />} />
                      <Route path="/common-room/member" element={<Navigate to="/den/member" replace />} />
                      <Route path="/common-room/member/lunch-run" element={<Navigate to="/den/member/lunch-run" replace />} />
                      <Route path="/common-room/member/ledger" element={<Navigate to="/den/member/ledger" replace />} />
                      <Route path="/common-room/member/profile" element={<Navigate to="/den/member/profile" replace />} />
                      <Route path="/common-room/member/dashboard" element={<Navigate to="/den/member/dashboard" replace />} />
                      <Route path="/common-room/member/moments" element={<Navigate to="/den/member/moments" replace />} />
                      <Route path="/check-in" element={<CheckIn />} />
                      <Route path="/calendar" element={<Calendar />} />
                      <Route path="/manage-event/:token" element={<ManageEvent />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/unsubscribe" element={<Unsubscribe />} />
                      <Route path="/branding" element={<Branding />} />
                      <Route path="/push-setup" element={<PushSetup />} />
                      <Route path="/croft-common-datetime" element={<CroftCommonDateTime />} />
                      <Route path="/CroftCommonDate&Time" element={<Navigate to="/croft-common-datetime" replace />} />
                      <Route path="/CroftCommonDateTime" element={<Navigate to="/croft-common-datetime" replace />} />
                      <Route path="/croftcommondatetime" element={<Navigate to="/croft-common-datetime" replace />} />
                      <Route path="/book" element={<Book />} />
                      {/* Old Admin routes - redirect to management */}
                      <Route path="/admin/*" element={<Navigate to="/management/admin" replace />} />
                      <Route path="/admin/member-analytics" element={<Navigate to="/management/admin/member-analytics" replace />} />
                      <Route path="/admin/member-analytics-legacy" element={<Navigate to="/management/admin/member-analytics-legacy" replace />} />
                      
                      {/* Old CMS routes - redirect to management */}
                      <Route path="/cms/login" element={<Navigate to="/management/login" replace />} />
                      <Route path="/cms/kitchens" element={<Navigate to="/management/cms/kitchens" replace />} />
                      <Route path="/cms/faq/:page" element={<Navigate to="/management/cms/faq/:page" replace />} />
                      <Route path="/cms/visual/:page/*" element={<Navigate to="/management/cms/visual/:page" replace />} />
                      <Route path="/cms/*" element={<Navigate to="/management/cms" replace />} />
                      
                      {/* Old Research route - redirect to management */}
                      <Route path="/research" element={<Navigate to="/management/research" replace />} />
                      
                      <Route path="/enquire" element={<EnquirePage />} />
                      <Route path="/profile" element={<MemberRoutes><MemberProfile /></MemberRoutes>} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/uncommon-standards" element={<UncommonStandards />} />
                      <Route path="/ext" element={<ExtRedirect />} />
                       
                        {/* Management Routes */}
                        <Route path="/management/login" element={<ManagementLoginRoute />} />
                        <Route path="/management/password-change" element={<PasswordChangeRequired />} />
                        <Route path="/management" element={<ManagementDashboard />} />
                        <Route path="/management/ai-assistant" element={<ManagementAIAssistant />} />
                        <Route path="/management/feedback" element={<FeedbackManagement />} />
                        <Route path="/management/settings" element={<Settings />} />
                        
                        {/* CMS under Management */}
                        <Route path="/management/cms/kitchens" element={<CMSKitchens />} />
                        <Route path="/management/cms/faq/:page" element={<CMSFAQPage />} />
                        <Route path="/management/cms/visual/:page/*" element={<CMSVisual />} />
                        <Route path="/management/cms/*" element={<CMS />} />
                        
                        {/* Admin under Management */}
                        <Route path="/management/admin/*" element={<Admin />} />
                        
                        {/* Research under Management */}
                        <Route path="/management/research" element={<Research />} />
                        
                        {/* Common Knowledge Routes */}
                        <Route path="/management/common-knowledge" element={<CommonKnowledgeDashboard />} />
                        <Route path="/management/common-knowledge/new" element={<CommonKnowledgeNew />} />
                        <Route path="/management/common-knowledge/upload" element={<CommonKnowledgeUpload />} />
                        <Route path="/management/common-knowledge/d/:slug" element={<CommonKnowledgeView />} />
                        <Route path="/management/fix-doc" element={<FixDocument />} />
                        
                        {/* Chat Route */}
                        <Route path="/management/chat" element={<Chat />} />
                        
                        {/* Spaces Event Management System */}
                        <Route path="/management/spaces" element={<SpacesDashboard />} />
                        
                        {/* Venue Management Sub-routes */}
                        <Route path="/management/spaces/venues" element={<VenuesList />} />
                        <Route path="/management/spaces/venues/new" element={<SpaceForm />} />
                        <Route path="/management/spaces/venues/:id" element={<SpaceDetail />} />
                        <Route path="/management/spaces/venues/:id/edit" element={<SpaceForm />} />
                        
                        {/* Calendar Management Sub-routes */}
                        <Route path="/management/spaces/calendar" element={<CalendarView />} />
                        <Route path="/management/bookings/:id" element={<BookingDetail />} />
                        
                        {/* Events Management Routes */}
                        <Route path="/management/events" element={<EventsList />} />
                        <Route path="/management/events/:id" element={<EventDetail />} />
                        
                         {/* Leads & Sales Sub-routes */}
                         <Route path="/management/spaces/leads" element={<LeadsList />} />
                         <Route path="/management/spaces/leads/new" element={<LeadDetail />} />
                         <Route path="/management/spaces/leads/:id" element={<LeadDetail />} />
                        
                        {/* BEO PDF Viewer */}
                        <Route path="/beo/view" element={<BeoViewer />} />
                        
                        {/* Client Portal Routes */}
                        <Route path="/client-login" element={<ClientMagicLogin />} />
                        <Route path="/p/:eventCode" element={<ClientPortal />} />
                       
                       <Route path="/c/:token" element={<ClickRedirect />} />
                       <Route path="/from-notification" element={<Index />} />
                       <Route path="/proposal/:code" element={<ProposalRedirect />} />
                       <Route path="*" element={<NotFound />} />
                      </Routes>
                      <RouteHydrationBeacon />
                      <CBFloatingActions />
                    </Suspense>
                </TransitionProvider>
              </Router>
              
              {/* Hidden Dev Panel */}
              <HiddenDevPanel isOpen={isOpen} onClose={closePanel} />
          </NudgeNotificationProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};
 
export default App;