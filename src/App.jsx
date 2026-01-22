import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { useAuth, AuthProvider } from '@/contexts/SupabaseAuthContext';
import { isSystemAdmin } from '@/lib/roles';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { RealtimeProvider } from '@/contexts/RealtimeContext';
import { UsageProvider } from '@/contexts/UsageContext.tsx';
import PublicLayout from '@/layouts/PublicLayout';
import AppLayout from '@/layouts/AppLayout';
import LandingPage from '@/pages/LandingPage';
import PricingPage from '@/pages/PricingPage';
import AuthPage from '@/pages/AuthPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import DashboardPage from '@/pages/app/DashboardPage';
import ClientesPage from '@/pages/app/ClientesPage';
import ClienteProfilePage from '@/pages/app/ClienteProfilePage';
import OrcamentosPage from '@/pages/app/OrcamentosPage';
import OrcamentoFormPage from '@/pages/app/OrcamentoFormPage';
import PipelinePage from '@/pages/app/PipelinePage';
import ConfigPage from '@/pages/app/ConfigPage';
import ConfigCanaisPage from '@/pages/app/ConfigCanaisPage.tsx';
import IntegracoesPage from '@/pages/app/IntegracoesPage.jsx';
import MateriaisPage from '@/pages/app/MateriaisPage';
import GlobalCatalogPage from '@/pages/app/GlobalCatalogPage';
import FornecedoresPage from '@/pages/app/FornecedoresPage';
import PlanosPage from '@/pages/app/PlanosPage';
import SiteManagementPage from '@/pages/admin/SiteManagementPage';
import NotificacoesPage from '@/pages/app/NotificacoesPage';
import SchedulesPage from '@/pages/app/SchedulesPage.tsx';
import LeadsPage from '@/pages/app/LeadsPage.tsx';
import WebhooksPage from '@/pages/app/WebhooksPage.tsx';
import Security2FAPage from '@/pages/app/Security2FAPage.tsx'; 
import { Toaster } from '@/components/ui/toaster';
import { Loader2 } from 'lucide-react';
import ScrollToTop from '@/components/ScrollToTop';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && !isSystemAdmin(profile, user)) {
        return <Navigate to="/app" replace />;
    }

    return children;
};

const AdminSectionRoute = ({ tab }) => (
  <ProtectedRoute adminOnly={true}>
    <SiteManagementPage initialTab={tab} hideTabs />
  </ProtectedRoute>
);

// Routes Definition
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="precos" element={<PricingPage />} />
        <Route path="login" element={<AuthPage />} />
        <Route path="cadastro" element={<AuthPage />} />
        <Route path="recuperar-senha" element={<ForgotPasswordPage />} />
        <Route path="redefinir-senha" element={<ResetPasswordPage />} />
      </Route>
      
        <Route 
          path="/app" 
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
        <Route path="orcamentos" element={<OrcamentosPage />} />
        <Route path="orcamentos/novo" element={<OrcamentoFormPage />} />
        <Route path="orcamentos/editar/:id" element={<OrcamentoFormPage />} />
        <Route path="pipeline" element={<PipelinePage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="clientes/:id" element={<ClienteProfilePage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="agendamentos" element={<SchedulesPage />} />
        <Route path="materiais" element={<MateriaisPage />} />
        <Route path="fornecedores" element={<FornecedoresPage />} />
        <Route path="catalogo-global" element={<GlobalCatalogPage />} />
        
        {/* Config Routes */}
        <Route path="config" element={<ConfigPage />} />
        <Route path="config/canais" element={<ConfigCanaisPage />} />
        <Route path="config/integracoes" element={<IntegracoesPage />} />
        <Route path="config/security-2fa" element={<Security2FAPage />} />

        <Route path="planos" element={<PlanosPage />} />
        <Route path="notificacoes" element={<NotificacoesPage />} />
        <Route path="webhooks" element={<WebhooksPage />} />
        
        <Route path="admin/site" element={<Navigate to="/app/admin/visao-geral" replace />} />
        <Route path="admin/visao-geral" element={<AdminSectionRoute tab="overview" />} />
        <Route path="admin/contas" element={<AdminSectionRoute tab="users" />} />
        <Route path="admin/clientes" element={<AdminSectionRoute tab="clients" />} />
        <Route path="admin/planos" element={<AdminSectionRoute tab="plans" />} />
        <Route path="admin/financeiro" element={<AdminSectionRoute tab="billing" />} />
        <Route path="admin/auditoria" element={<AdminSectionRoute tab="audit" />} />
      </Route>

      {/* Fallback for 404 - Redirect to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Main App Component
function App() {
    return (
        <HelmetProvider>
            <BrowserRouter>
                <ScrollToTop />
                <AuthProvider>
                    <NotificationProvider>
                        <SubscriptionProvider>
                            <UsageProvider>
                                <RealtimeProvider>
                                    <AppRoutes />
                                    <Toaster />
                                </RealtimeProvider>
                            </UsageProvider>
                        </SubscriptionProvider>
                    </NotificationProvider>
                </AuthProvider>
            </BrowserRouter>
        </HelmetProvider>
    );
}

export default App;
