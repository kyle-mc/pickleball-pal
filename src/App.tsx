import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import SwipeNavigator from "@/components/SwipeNavigator";
import { Loader2 } from "lucide-react";

// Pages
import Landing from "./pages/Landing";
import ProfileSetup from "./pages/ProfileSetup";
import GroupOnboarding from "./pages/GroupOnboarding";
import Profile from "./pages/Profile";
import MyMMR from "./pages/MyMMR";
import Standings from "./pages/Standings";
import Schedule from "./pages/Schedule";
import Videos from "./pages/Videos";
import Games from "./pages/Games";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

// Protected route wrapper that handles onboarding flow
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { loading: onboardingLoading, needsProfileSetup, needsGroupOnboarding } = useOnboardingStatus();
  const location = useLocation();

  if (authLoading || onboardingLoading) {
    return <LoadingScreen />;
  }

  // Not authenticated - redirect to landing
  if (!user) {
    return <Navigate to="/landing" state={{ from: location }} replace />;
  }

  // Needs profile setup
  if (needsProfileSetup && location.pathname !== '/onboarding/profile') {
    return <Navigate to="/onboarding/profile" replace />;
  }

  // Needs group onboarding (but profile is complete)
  if (needsGroupOnboarding && !needsProfileSetup && location.pathname !== '/onboarding/group') {
    return <Navigate to="/onboarding/group" replace />;
  }

  return <>{children}</>;
};

// Onboarding route - requires auth but allows incomplete profile/group
const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/landing" replace />;
  }

  return <>{children}</>;
};

// Public route - redirects to app if already authenticated and onboarded
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { loading: onboardingLoading, needsProfileSetup, needsGroupOnboarding } = useOnboardingStatus();

  if (authLoading || onboardingLoading) {
    return <LoadingScreen />;
  }

  // If user is authenticated and fully onboarded, redirect to main app
  if (user && !needsProfileSetup && !needsGroupOnboarding) {
    return <Navigate to="/" replace />;
  }

  // If user is authenticated but needs onboarding
  if (user && needsProfileSetup) {
    return <Navigate to="/onboarding/profile" replace />;
  }

  if (user && needsGroupOnboarding) {
    return <Navigate to="/onboarding/group" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/landing" element={
        <PublicRoute>
          <Landing />
        </PublicRoute>
      } />

      {/* Onboarding routes */}
      <Route path="/onboarding/profile" element={
        <OnboardingRoute>
          <ProfileSetup />
        </OnboardingRoute>
      } />
      <Route path="/onboarding/group" element={
        <OnboardingRoute>
          <GroupOnboarding />
        </OnboardingRoute>
      } />

      {/* Protected app routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <SwipeNavigator>
            <MyMMR />
          </SwipeNavigator>
        </ProtectedRoute>
      } />
      <Route path="/standings" element={
        <ProtectedRoute>
          <SwipeNavigator>
            <Standings />
          </SwipeNavigator>
        </ProtectedRoute>
      } />
      <Route path="/schedule" element={
        <ProtectedRoute>
          <SwipeNavigator>
            <Schedule />
          </SwipeNavigator>
        </ProtectedRoute>
      } />
      <Route path="/videos" element={
        <ProtectedRoute>
          <SwipeNavigator>
            <Videos />
          </SwipeNavigator>
        </ProtectedRoute>
      } />
      <Route path="/games" element={
        <ProtectedRoute>
          <SwipeNavigator>
            <Games />
          </SwipeNavigator>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />

      {/* Catch-all: redirect to landing for unknown routes */}
      <Route path="*" element={<Navigate to="/landing" replace />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
