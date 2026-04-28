import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import StateDashboard from "./pages/StateDashboard";
import DistrictDashboard from "./pages/DistrictDashboard";
import CHCDashboard from "./pages/CHCDashboard";
import PHCDashboard from "./pages/PHCDashboard";
import FieldDashboard from "./pages/FieldDashboard";
import CitizenPortal from "./pages/CitizenPortal";
import NotFound from "./pages/NotFound";
import { LanguageProvider } from "./lib/LanguageContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Login />} />
          <Route path="/state-dashboard" element={<StateDashboard />} />
          <Route path="/district-dashboard" element={<DistrictDashboard />} />
          <Route path="/chc-dashboard" element={<CHCDashboard />} />
          <Route path="/phc-dashboard" element={<PHCDashboard />} />
          <Route path="/field-dashboard" element={<FieldDashboard />} />
          <Route path="/citizen-portal" element={<CitizenPortal />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
