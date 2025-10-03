import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { useEffect, Suspense, lazy, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TransitionProvider } from "@/contexts/TransitionContext";
import { MembershipAuthProvider } from "@/contexts/MembershipAuthContext";
import { NudgeNotificationProvider } from "@/contexts/NudgeNotificationContext";
import { useNudgeNotificationHandler } from "@/hooks/useNudgeNotificationHandler";
import { useTrackNotificationClick } from "@/hooks/useTrackNotificationClick";
import NudgeFloatingButton from './components/NudgeFloatingButton';

// Lazy load pages for better performance
import Index from "./pages/Index";
import Cafe from "./pages/Cafe";
import Cocktails from "./pages/Cocktails";
import Beer from "./pages/Beer";
import Kitchens from "./pages/Kitchens";
const Hall = lazy(() => import("./pages/Hall"));
const Community = lazy(() => import("./pages/Community"));
import CommonRoom from "./pages/CommonRoom";
const CommonRoomMain = lazy(() => import("./pages/CommonRoomMain"));
const MemberHome = lazy(() => import("./pages/MemberHome"));
const LunchRun = lazy(() => import("./pages/LunchRun"));
const MemberLedger = lazy(() => import("./pages/MemberLedger"));
const MemberProfile = lazy(() => import("./pages/MemberProfile"));
const MemberDashboard = lazy(() => import("./pages/MemberDashboard"));
const MemberMoments = lazy(() => import("./pages/MemberMoments"));
const CheckIn = lazy(() => import("./pages/CheckIn"));
const Calendar = lazy(() => import("./pages/Calendar"));
const ManageEvent = lazy(() => import("./pages/ManageEvent"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Branding = lazy(() => import("./pages/Branding"));
const CommonGood = lazy(() => import("./pages/CommonGood"));
const CommonGoodMessage = lazy(() => import("./pages/CommonGoodMessage"));
const ClickRedirect = lazy(() => import("./pages/ClickRedirect"));
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
import RouteImagePreloader from '@/components/RouteImagePreloader';
import ScrollToTop from '@/components/ScrollToTop';
import DomainGuard from '@/components/DomainGuard';
import ReverseDomainGuard from '@/components/ReverseDomainGuard';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useConsolidatedPerformance } from '@/hooks/useConsolidatedPerformance';
import { useCapacitorDeepLinking } from '@/hooks/useCapacitorDeepLinking';
import { useCapacitorPushNotifications } from '@/hooks/useCapacitorPushNotifications';
import { useHiddenDevPanel } from '@/hooks/useHiddenDevPanel';
import { HiddenDevPanel } from '@/components/native/HiddenDevPanel';
import { ProtectedRoute } from '@/components/research/ProtectedRoute';
import InteractionWatchdog from '@/components/InteractionWatchdog';
import { RecoveryGuard } from '@/components/auth/RecoveryGuard';

// Management system components
import ManagementLogin from "./pages/management/ManagementLogin";
const ManagementDashboard = lazy(() => import("./pages/management/ManagementDashboard"));
const ManagementAIAssistant = lazy(() => import("./pages/management/ManagementAIAssistant"));
const FeedbackManagement = lazy(() => import("./pages/management/FeedbackManagement"));
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
const BeoViewer = lazy(() => import("./pages/BeoViewer"));

const queryClient = new QueryClient();


// Single performance and notification handler
const GlobalHandlers = () => {
  // Call hooks at the top level (Rules of Hooks)
  useConsolidatedPerformance(); // Consolidates all performance optimizations
  useAnalytics();
  
  // Handle nudge notifications
  useNudgeNotificationHandler();
  // Track notification clicks via URL tokens
  useTrackNotificationClick();
  
  // Capacitor native functionality
  useCapacitorDeepLinking();
  useCapacitorPushNotifications();
  
  return null;
};

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
     "common-good",
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
      // Also prefetch management chunks when user visits footer-heavy pages
      if (location.pathname === '/' || location.pathname === '/community') {
        try {
          import('./pages/management/ManagementDashboard');
          import('./pages/management/SpacesDashboard');
        } catch {}
      }
    } catch {}
  }, [location.pathname]);
  return null;
};

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
  
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <NudgeNotificationProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ScrollToTop />
                <GlobalHandlers />
                <LowercasePathGuard />
                <ReverseDomainGuard />
                <RecoveryGuard />
                <RouteImagePreloader />
                <InteractionWatchdog />
                <NudgeFloatingButton />
                
                <TransitionProvider>
                  <MembershipAuthProvider>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                      <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/cafe" element={<Cafe />} />
                      <Route path="/cocktails" element={<Cocktails />} />
                      <Route path="/beer" element={<Beer />} />
                      <Route path="/kitchens" element={<Kitchens />} />
                      <Route path="/onekitchen-menu" element={<OneKitchenMenu />} />
                      <Route path="/secretkitchens" element={<DomainGuard><SecretKitchens /></DomainGuard>} />
                      <Route path="/secretkitchenadmin" element={<SecretKitchenAdmin />} />
                      <Route path="/hall" element={<Hall />} />
                      <Route path="/community" element={<Community />} />
                      <Route path="/common-room" element={<CommonRoom />} />
                      <Route path="/common-room/main" element={<CommonRoomMain />} />
                      <Route path="/common-room/member" element={<MemberHome />} />
                      <Route path="/common-room/member/lunch-run" element={<LunchRun />} />
                      <Route path="/common-room/member/ledger" element={<MemberLedger />} />
                      <Route path="/common-room/member/profile" element={<MemberProfile />} />
                      <Route path="/common-room/member/dashboard" element={<MemberDashboard />} />
                      <Route path="/common-room/member/moments" element={<MemberMoments />} />
                      <Route path="/check-in" element={<CheckIn />} />
                      <Route path="/calendar" element={<Calendar />} />
                      <Route path="/manage-event/:token" element={<ManageEvent />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/unsubscribe" element={<Unsubscribe />} />
                      <Route path="/branding" element={<Branding />} />
                      <Route path="/common-good" element={<CommonGood />} />
                      <Route path="/common-good/message" element={<CommonGoodMessage />} />
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
                      <Route path="/profile" element={<MemberProfile />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/uncommon-standards" element={<UncommonStandards />} />
                       
                        {/* Management Routes */}
                        <Route path="/management/login" element={<ManagementLogin />} />
                        <Route path="/management" element={<ManagementDashboard />} />
                        <Route path="/management/ai-assistant" element={<ManagementAIAssistant />} />
                        <Route path="/management/feedback" element={<FeedbackManagement />} />
                        
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
                       
                       <Route path="/c/:token" element={<ClickRedirect />} />
                       <Route path="/from-notification" element={<Index />} />
                       <Route path="/proposal/:code" element={<ProposalRedirect />} />
                       <Route path="*" element={<NotFound />} />
                      </Routes>
                      <RouteHydrationBeacon />
                    </Suspense>
                  </MembershipAuthProvider>
                </TransitionProvider>
              </BrowserRouter>
              
              {/* Hidden Dev Panel */}
              <HiddenDevPanel isOpen={isOpen} onClose={closePanel} />
          </NudgeNotificationProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};
 
export default App;