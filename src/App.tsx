import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { TransitionProvider } from "@/contexts/TransitionContext";
import { useNotificationHandler } from "@/hooks/useNotificationHandler";
import { NudgeNotificationProvider } from "@/contexts/NudgeNotificationContext";
import { useNudgeNotificationHandler } from "@/hooks/useNudgeNotificationHandler";
import NudgeFloatingButton from './components/NudgeFloatingButton';


import Index from "./pages/Index";
import Cafe from "./pages/Cafe";
import Cocktails from "./pages/Cocktails";
import Beer from "./pages/Beer";
import Kitchens from "./pages/Kitchens";
import Hall from "./pages/Hall";
import Community from "./pages/Community";
import CommonRoom from "./pages/CommonRoom";
import CommonRoomMain from "./pages/CommonRoomMain";
import MemberHome from "./pages/MemberHome";
import MemberLedger from "./pages/MemberLedger";
import MemberProfile from "./pages/MemberProfile";
import MemberDashboard from "./pages/MemberDashboard";
import MemberMoments from "./pages/MemberMoments";
import CheckIn from "./pages/CheckIn";
import Calendar from "./pages/Calendar";
import ManageEvent from "./pages/ManageEvent";
import Privacy from "./pages/Privacy";
import Unsubscribe from "./pages/Unsubscribe";
import NotFound from "./pages/NotFound";
import Branding from "./pages/Branding";
import CommonGood from "./pages/CommonGood";
 import CommonGoodMessage from "./pages/CommonGoodMessage";
 import CroftCommonDateTime from "./pages/CroftCommonDateTime";
 import Book from "./pages/Book";
import Admin from "./pages/Admin";
import CMSFAQPage from "./pages/CMSFAQPage";
import CMS from "./pages/CMS";
import CMSLogin from "./pages/CMSLogin";
import CMSVisual from "./pages/CMSVisual";
import Notifications from "./pages/Notifications";
import RouteImagePreloader from '@/components/RouteImagePreloader';
import BrandAssetPreloader from '@/components/BrandAssetPreloader';
import ScrollToTop from '@/components/ScrollToTop';
import { useAnalytics } from '@/hooks/useAnalytics';
import { usePerformanceOptimizer } from '@/hooks/usePerformanceOptimizer';
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

// Notification handlers component that always runs
const NotificationHandlers = () => {
  // Always handle notification deep links
  useNotificationHandler();
  
  // Defer analytics until page is loaded
  const { isPageLoaded } = usePerformanceOptimizer();
  useWebVitals(); // Track performance metrics
  
  if (isPageLoaded) {
    useAnalytics();
  }
  
  return null;
};

// Nudge handler component that runs inside NudgeNotificationProvider  
const NudgeHandlers = () => {
  // Defer nudge handler initialization
  const { isPageLoaded } = usePerformanceOptimizer();
  if (isPageLoaded) {
    useNudgeNotificationHandler();
  }
  
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
           <NotificationHandlers />
           <NudgeHandlers />
           <LowercasePathGuard />
           <RouteImagePreloader />
           <BrandAssetPreloader />
           <BannerOverlay />
           <NudgeFloatingButton />
          
          <TransitionProvider>
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
             {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </TransitionProvider>
        </BrowserRouter>
          </NudgeNotificationProvider>
        </BannerNotificationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);
 
export default App;
