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
import NotFound from "@/pages/NotFound";
import Transactions from "@/pages/Transactions";
import Accounts from "@/pages/Accounts";
import Reports from "@/pages/Reports";
import Goals from "@/pages/Goals";
import Settings from "@/pages/Settings";
import Support from "@/pages/Support";
import License from "@/pages/License";
import TelegramIntegration from "@/pages/TelegramIntegration";
import TelegramBot from "@/pages/TelegramBot";
import Categories from "@/pages/Categories";
import Budget from "@/pages/Budget";
import CheckoutPage from "@/pages/Checkout";
import Investments from "@/pages/Investments";
import NetWorth from "@/pages/NetWorth";
import FamilySettings from "@/pages/FamilySettings";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div></div>; // Pode ser um spinner de tela cheia
  }

  return (
    <Routes>
      <Route path="/landing" element={<Landing />} />
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />

      {/* Rotas Protegidas com Layout */}
      <Route
        path="/"
        element={
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
        path="/license"
        element={
          <ProtectedRoute>
            <AppLayout>
              <License />
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
        path="/telegram"
        element={
          <ProtectedRoute>
            <AppLayout>
              <TelegramIntegration />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/telegram-bot"
        element={
          <ProtectedRoute>
            <AppLayout>
              <TelegramBot />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CheckoutPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/investimentos"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Investments />
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
