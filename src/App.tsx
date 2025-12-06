import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

import Dashboard from "@/pages/Dashboard";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Onboarding from "@/pages/Onboarding";
import QuizFinanceiro from "@/pages/QuizFinanceiro";
import NotFound from "@/pages/NotFound";
import Transactions from "@/pages/Transactions";
import Accounts from "@/pages/Accounts";
import Reports from "@/pages/Reports";
import Goals from "@/pages/Goals";
import Settings from "@/pages/Settings";
import Support from "@/pages/Support";
import Categories from "@/pages/Categories";
import Budget from "@/pages/Budget";
import NetWorth from "@/pages/NetWorth";
import FamilySettings from "@/pages/FamilySettings";
import RecurringTransactions from "@/pages/RecurringTransactions";
import Planos from "@/pages/Planos";
import CheckoutSuccess from "@/pages/CheckoutSuccess";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, loading, profile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redirect authenticated users who haven't completed onboarding
  const needsOnboarding = user && profile && !profile.onboarding_completed;

  return (
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

      {/* Rotas Protegidas com Layout */}
      <Route
        path="/dashboard"
        element={
          needsOnboarding ? <Navigate to="/onboarding" replace /> :
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
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

      {/* Rota não encontrada */}
      <Route path="*" element={<NotFound />} />
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
