import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { TransitionProvider } from "@/contexts/TransitionContext";
import { useNotificationHandler } from "@/hooks/useNotificationHandler";
import { NudgeNotificationProvider } from "@/contexts/NudgeNotificationContext";
import { useNudgeNotificationHandler } from "@/hooks/useNudgeNotificationHandler";
import NudgeFloatingButton from './components/NudgeFloatingButton';

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Cafe = lazy(() => import("./pages/Cafe"));
const Cocktails = lazy(() => import("./pages/Cocktails"));
const Beer = lazy(() => import("./pages/Beer"));
const Kitchens = lazy(() => import("./pages/Kitchens"));
const Hall = lazy(() => import("./pages/Hall"));
const Community = lazy(() => import("./pages/Community"));
const CommonRoom = lazy(() => import("./pages/CommonRoom"));
const CommonRoomMain = lazy(() => import("./pages/CommonRoomMain"));
const MemberHome = lazy(() => import("./pages/MemberHome"));
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
const CroftCommonDateTime = lazy(() => import("./pages/CroftCommonDateTime"));
const Book = lazy(() => import("./pages/Book"));
const Admin = lazy(() => import("./pages/Admin"));
const CMSFAQPage = lazy(() => import("./pages/CMSFAQPage"));
const CMS = lazy(() => import("./pages/CMS"));
const CMSLogin = lazy(() => import("./pages/CMSLogin"));
const CMSVisual = lazy(() => import("./pages/CMSVisual"));
const Notifications = lazy(() => import("./pages/Notifications"));

// Optimized imports that load immediately
import RouteImagePreloader from '@/components/RouteImagePreloader';
import ScrollToTop from '@/components/ScrollToTop';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useOptimizedPerformance } from '@/hooks/useOptimizedPerformance';
import { useWebVitals } from '@/hooks/useWebVitals';
import { BannerNotificationProvider } from "@/contexts/BannerNotificationContext";
import { BannerNotification } from "@/components/BannerNotification";
import { useBannerNotification } from "@/contexts/BannerNotificationContext";

const queryClient = new QueryClient();

const BannerOverlay = () => {
  const { currentBanner, dismissBanner } = useBannerNotification();

  if (!currentBanner) return null;

  return (
    <BannerNotification
      data={currentBanner}
      onDismiss={dismissBanner}
    />
  );
};

// Single performance and notification handler
const GlobalHandlers = () => {
  // Call hooks at the top level (Rules of Hooks)
  useOptimizedPerformance();
  useWebVitals();
  useAnalytics();
  
  // Handle notifications immediately as they're critical
  useNotificationHandler();
  useNudgeNotificationHandler();
  
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
    const first = path.split("/").filter(Boolean)[0] ?? "";
    const lowerFirst = first.toLowerCase();
    if (allowedRoots.has(lowerFirst)) {
      navigate(path.toLowerCase() + location.search + location.hash, { replace: true });
    }
  }, [location.pathname]);
  return null;
};
 
// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BannerNotificationProvider>
          <NudgeNotificationProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <GlobalHandlers />
              <LowercasePathGuard />
              <RouteImagePreloader />
              <BannerOverlay />
              <NudgeFloatingButton />
              
              <TransitionProvider>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/cafe" element={<Cafe />} />
                    <Route path="/cocktails" element={<Cocktails />} />
                    <Route path="/beer" element={<Beer />} />
                    <Route path="/kitchens" element={<Kitchens />} />
                    <Route path="/hall" element={<Hall />} />
                    <Route path="/community" element={<Community />} />
                    <Route path="/common-room" element={<CommonRoom />} />
                    <Route path="/common-room/main" element={<CommonRoomMain />} />
                    <Route path="/common-room/member" element={<MemberHome />} />
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
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/cms/login" element={<CMSLogin />} />
                    <Route path="/cms/faq/:page" element={<CMSFAQPage />} />
                    <Route path="/cms/visual/:page/*" element={<CMSVisual />} />
                    <Route path="/cms/*" element={<CMS />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </TransitionProvider>
            </BrowserRouter>
          </NudgeNotificationProvider>
        </BannerNotificationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);
 
export default App;
