import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SwipeNavigator from "@/components/SwipeNavigator";
import MyMMR from "./pages/MyMMR";
import Standings from "./pages/Standings";
import Schedule from "./pages/Schedule";
import Videos from "./pages/Videos";
import Games from "./pages/Games";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SwipeNavigator>
          <Routes>
            <Route path="/" element={<MyMMR />} />
            <Route path="/standings" element={<Standings />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/games" element={<Games />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SwipeNavigator>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
