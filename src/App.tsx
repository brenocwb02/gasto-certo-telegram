import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

// Eager load Landing for better LCP
import Landing from "@/pages/Landing";

// Lazy load internal pages
// Dashboard moved to DashboardNew
const DashboardNew = lazy(() => import("@/pages/Dashboard"));
const DashboardBento = lazy(() => import("@/pages/DashboardBento"));
const Auth = lazy(() => import("@/pages/Auth"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const QuizFinanceiro = lazy(() => import("@/pages/QuizFinanceiro"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Transactions = lazy(() => import("@/pages/Transactions"));
const Accounts = lazy(() => import("@/pages/Accounts"));
const Reports = lazy(() => import("@/pages/Reports"));
const Goals = lazy(() => import("@/pages/Goals"));
const Settings = lazy(() => import("@/pages/Settings"));
const Support = lazy(() => import("@/pages/Support"));
const Categories = lazy(() => import("@/pages/Categories"));
const Budget = lazy(() => import("@/pages/Budget"));
const NetWorth = lazy(() => import("@/pages/NetWorth"));
const FamilySettings = lazy(() => import("@/pages/FamilySettings"));
const RecurringTransactions = lazy(() => import("@/pages/RecurringTransactions"));
const Planos = lazy(() => import("@/pages/Planos"));
const CheckoutSuccess = lazy(() => import("@/pages/CheckoutSuccess"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const UpdatePassword = lazy(() => import("@/pages/UpdatePassword"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

const AppRoutes = () => {
  const { user, loading, profile } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  // Redirect authenticated users who haven't completed onboarding
  const needsOnboarding = user && profile && !profile.onboarding_completed;

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Rota principal - Landing para não logados, Dashboard para logados */}
        <Route
          path="/"
          element={
            !user ? <Landing /> :
              needsOnboarding ? <Navigate to="/onboarding" replace /> :
                <Navigate to="/dashboard" replace />
          }
        />
        <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <Auth />} />

        {/* Política de Privacidade - Pública */}
        <Route path="/privacidade" element={<PrivacyPolicy />} />

        <Route
          path="/onboarding"
          element={
            !user ? <Navigate to="/auth" replace /> :
              profile?.onboarding_completed ? <Navigate to="/dashboard" replace /> :
                <Onboarding />
          }
        />
        <Route path="/quiz-financeiro" element={<QuizFinanceiro />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/update-password" element={<UpdatePassword />} />

        {/* Rotas Protegidas com Layout */}
        <Route
          path="/dashboard"
          element={
            needsOnboarding ? <Navigate to="/onboarding" replace /> :
              <ProtectedRoute>
                <AppLayout>
                  <DashboardNew />
                </AppLayout>
              </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-bento"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DashboardBento />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Transactions />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Accounts />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Reports />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/goals"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Goals />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orcamento"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Budget />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Settings />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/support"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Support />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Categories />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/patrimonio"
          element={
            <ProtectedRoute>
              <AppLayout>
                <NetWorth />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/familia"
          element={
            <ProtectedRoute>
              <AppLayout>
                <FamilySettings />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/recorrentes"
          element={
            <ProtectedRoute>
              <AppLayout>
                <RecurringTransactions />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/planos"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Planos />
              </AppLayout>
            </ProtectedRoute>
          }
        />


        {/* Redirects para rotas antigas */}
        <Route path="/license" element={<Navigate to="/planos" replace />} />
        <Route path="/checkout" element={<Navigate to="/planos" replace />} />

        {/* Rota não encontrada */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
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
