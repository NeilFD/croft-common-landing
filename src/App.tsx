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
import NotFound from "./pages/NotFound";

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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TransitionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
