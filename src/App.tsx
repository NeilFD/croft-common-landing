import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
 import Notifications from "./pages/Notifications";
import RouteImagePreloader from '@/components/RouteImagePreloader';
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
  // Handle notification deep links universally
  useNotificationHandler();
  
  // Handle nudge notifications
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
 
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BannerNotificationProvider>
        <NudgeNotificationProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <NotificationHandlers />
          <LowercasePathGuard />
          <RouteImagePreloader />
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
             <Route path="/notifications" element={<Notifications />} />
             <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </TransitionProvider>
        </BrowserRouter>
        </NudgeNotificationProvider>
      </BannerNotificationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
 
export default App;
