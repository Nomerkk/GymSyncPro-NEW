import { Switch, Route, Redirect } from "wouter";
import { queryClient, enableAdminPersistence } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { useEffect, lazy, Suspense } from "react";
import RoutePrefetch from "@/components/route-prefetch";
import { Loader2 } from "lucide-react";

import AdminRoutes from "@/components/admin-routes";

// Lazy load pages to reduce initial bundle size
const Login = lazy(() => import("@/pages/login"));
const LoginAdmin = lazy(() => import("@/pages/login-admin"));
const Register = lazy(() => import("@/pages/register"));
const RegisterAdmin = lazy(() => import("@/pages/register-admin"));
const ForgotPassword = lazy(() => import("@/pages/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const VerifyEmail = lazy(() => import("@/pages/verify-email"));
const MemberDashboard = lazy(() => import("@/pages/member-dashboard"));
const MyBookings = lazy(() => import("@/pages/my-bookings"));
const MyPtSessions = lazy(() => import("@/pages/my-pt-sessions"));
const ClassesPage = lazy(() => import("@/pages/classes"));
const BookPTPage = lazy(() => import("@/pages/book-pt"));
const CheckInVerify = lazy(() => import("@/pages/checkin-verify"));
const CookieSettings = lazy(() => import("@/pages/cookie-settings"));
const MyProfile = lazy(() => import("@/pages/my-profile"));
const Settings = lazy(() => import("@/pages/settings"));
const Terms = lazy(() => import("@/pages/terms"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Landing = lazy(() => import("@/pages/landing"));
const MemberFeedback = lazy(() => import("@/pages/member-feedback"));
const MemberFeedbackDetail = lazy(() => import("@/pages/member-feedback-detail"));

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <Switch>
        {/* Public routes */}
        <Route path="/checkin/verify/:code" component={CheckInVerify} />
        <Route path="/cookie-settings" component={CookieSettings} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/verify-email" component={VerifyEmail} />

        {!isAuthenticated ? (
          <>
            <Route path="/login" component={Login} />
            <Route path="/login-admin" component={LoginAdmin} />
            <Route path="/register" component={Register} />
            <Route path="/register-admin" component={RegisterAdmin} />
            {/* Move marketing landing to /welcome so default / goes to Login */}
            <Route path="/welcome" component={Landing} />
            <Route path="/" component={Login} />
            <Route path="/admin/:rest*">
              <Redirect to="/login-admin" />
            </Route>
          </>
        ) : (
          <>
            {/* Admin Routes - Wrapped in persistent layout */}
            <Route path="/admin/:rest*" component={(user?.role === 'admin' || user?.role === 'super_admin') ? AdminRoutes : () => <Redirect to="/" />} />

            {/* Member Routes */}
            <Route path="/" component={(user?.role === 'admin' || user?.role === 'super_admin') ? () => <Redirect to="/admin/overview" /> : MemberDashboard} />

            {/* Member specific pages */}
            <Route path="/classes" component={ClassesPage} />
            <Route path="/book-pt" component={BookPTPage} />
            <Route path="/my-bookings" component={MyBookings} />
            <Route path="/my-pt-sessions" component={MyPtSessions} />
            <Route path="/my-profile" component={MyProfile} />
            <Route path="/settings" component={Settings} />
            <Route path="/terms" component={Terms} />
            <Route path="/feedback" component={MemberFeedback} />
            <Route path="/feedback/:id" component={MemberFeedbackDetail} />

            {/* Auth Redirects - Only redirect /login and /register for members */}
            <Route path="/login">
              {(user?.role === 'admin' || user?.role === 'super_admin') ? (
                <Redirect to="/admin/overview" />
              ) : (
                <Redirect to="/" />
              )}
            </Route>
            <Route path="/login-admin">
              {(user?.role === 'admin' || user?.role === 'super_admin') ? (
                <Redirect to="/admin/overview" />
              ) : (
                <Redirect to="/" />
              )}
            </Route>
            <Route path="/register">
              <Redirect to="/" />
            </Route>
            <Route path="/register-admin">
              <Redirect to="/" />
            </Route>
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {/* Hydrate & persist admin queries via localStorage */}
        <AdminQueryPersistenceActivator />
        {/* Avoid showing any loading UI during route transitions. */}
        <Router />
        {/* Preload admin routes/data in background for snappy sidebar navigation */}
        <RoutePrefetch />
        <CookieConsentBanner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AdminQueryPersistenceActivator() {
  useEffect(() => {
    // Set up persistence once on app start; allowlist ensures only admin queries/mutations are stored
    enableAdminPersistence();
  }, []);
  return null;
}

export default App;
