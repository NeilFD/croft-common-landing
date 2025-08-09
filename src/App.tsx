import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TransitionProvider } from "@/contexts/TransitionContext";
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
 
const queryClient = new QueryClient();
 
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
            <Route path="/CroftCommonDate&Time" element={<CroftCommonDateTime />} />
            <Route path="/book" element={<Book />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TransitionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
 
export default App;
