
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { 
    Hammer, LayoutDashboard, FileText, Users, Settings, LogOut, Wrench, 
    BookCopy, Menu, Truck, MessageSquare, CalendarClock, Home, Columns,
    ChevronDown, ChevronRight, User, Building, CreditCard, Bell, Shield, ClipboardList, Database, Link,
    BarChart2, Activity, DollarSign, Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import ViewSelector from '@/components/ViewSelector';
import MobileLayout from '@/layouts/MobileLayout.tsx';
import DashboardMobile from '@/pages/app/DashboardMobile.tsx';
import LeadsMobile from '@/pages/app/LeadsMobile.tsx';
import OrcamentosMobile from '@/pages/app/OrcamentosMobile.tsx';
import PipelineMobile from '@/pages/app/PipelineMobile.tsx';
import { cn } from '@/lib/utils';
import { isSystemAdmin } from '@/lib/roles';
import { hasPermission } from '@/lib/permissions';

// Main Navigation Items
const mainNavItems = [
    { path: '/app', label: 'Dashboard', icon: LayoutDashboard, roles: ['client', 'admin'], permissionKey: 'dashboard' },
    { path: '/app/orcamentos', label: 'Or\u00e7amentos', icon: FileText, roles: ['client', 'admin'], permissionKey: 'quotes' },
    { path: '/app/pipeline', label: 'Pipeline', icon: Columns, roles: ['client', 'admin'], permissionKey: 'pipeline' },
    { path: '/app/clientes', label: 'Clientes', icon: Users, roles: ['client', 'admin'], permissionKey: 'clients' },
    { path: '/app/agendamentos', label: 'Agendamentos', icon: CalendarClock, roles: ['client', 'admin'], permissionKey: 'schedules' },
    { path: '/app/materiais', label: 'Meus Materiais', icon: Wrench, roles: ['client', 'admin'], permissionKey: 'materials' },
    { path: '/app/fornecedores', label: 'Fornecedores', icon: Truck, roles: ['client', 'admin'], permissionKey: 'materials' },
    { path: '/app/catalogo-global', label: 'Cat\u00e1logo Global', icon: BookCopy, roles: ['client', 'admin'], permissionKey: 'materials' },
];

const adminNavItems = [
    { path: '/app/admin/visao-geral', label: 'Vis\u00e3o Geral', icon: BarChart2, roles: ['admin'] },
    { path: '/app/admin/contas', label: 'Contas', icon: Users, roles: ['admin'] },
    { path: '/app/admin/clientes', label: 'Clientes', icon: Users, roles: ['admin'] },
    { path: '/app/admin/planos', label: 'Planos & Pacotes', icon: Settings, roles: ['admin'] },
    { path: '/app/admin/financeiro', label: 'Financeiro', icon: DollarSign, roles: ['admin'] },
    { path: '/app/admin/agente-ia', label: 'Agente IA', icon: Bot, roles: ['admin'] },
    { path: '/app/admin/auditoria', label: 'Auditoria', icon: Activity, roles: ['admin'] },
];

// Settings Sub-items
const configItems = [
    { path: '/app/config?tab=profile', label: 'Minha Conta', icon: User },
    { path: '/app/config?tab=company', label: 'Organiza\u00e7\u00e3o', icon: Building },
    { path: '/app/config/canais', label: 'Canais', icon: MessageSquare, permissionKey: 'integrations' },
    { path: '/app/config/integracoes', label: 'Integra\u00e7\u00f5es', icon: Database, permissionKey: 'integrations' },
    { path: '/app/config?tab=team', label: 'Equipe', icon: Users, permissionKey: 'team' },
    { path: '/app/config?tab=billing', label: 'Planos', icon: CreditCard, permissionKey: 'billing' },
    { path: '/app/config?tab=notifications', label: 'Notifica\u00e7\u00f5es', icon: Bell },
    { path: '/app/config?tab=security', label: 'Seguran\u00e7a', icon: Shield, permissionKey: 'security' },
];

const SidebarContent = ({ onLinkClick }) => {
    const { toast } = useToast();
    const { signOut, profile, user, teamRole } = useAuth();
    const { viewMode } = useViewMode();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    
    // Config Expansion State
    const [isConfigExpanded, setIsConfigExpanded] = useState(() => {
        return localStorage.getItem('sidebar_config_expanded') === 'true';
    });

    const toggleConfig = () => {
        const newState = !isConfigExpanded;
        setIsConfigExpanded(newState);
        localStorage.setItem('sidebar_config_expanded', newState);
    };

    const currentRole = isSystemAdmin(profile, user) ? viewMode : 'client';
    const currentTab = searchParams.get('tab');
    const navItems = currentRole === 'admin' ? adminNavItems : mainNavItems;
    const canAccessItem = (item) => (currentRole === 'admin' ? true : hasPermission(teamRole, item.permissionKey));

    const handleLogout = async () => {
        await signOut();
        toast({
            title: "At\u00e9 logo!",
            description: "Voc\u00ea foi desconectado com sucesso.",
        });
        navigate('/');
    };

    return (
         <div className="w-full h-full bg-background p-4 flex flex-col justify-between border-r border-border overflow-y-auto">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-2xl font-heading font-bold px-2">
                    <Hammer className="h-7 w-7 text-primary" />
                    <span className="text-white">Serral<span className="text-primary">lab</span></span>
                </div>
                
                {/* View Selector Component for Admins */}
                <ViewSelector />

                <nav className="flex flex-col gap-1">
                    {navItems.filter(item => item.roles.includes(currentRole) && canAccessItem(item)).map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onLinkClick}
                            end={item.path === '/app'}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                                    isActive
                                        ? 'bg-primary/10 text-primary border-l-4 border-transparent hover:border-primary hover:shadow-[0_0_10px_rgba(218,105,11,0.1)]'
                                        : 'text-muted-foreground hover:bg-surface hover:text-white border-l-4 border-transparent hover:border-primary'
                                )
                            }
                        >
                            <item.icon className="h-5 w-5 transition-colors duration-200 group-hover:text-primary" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}

                    {currentRole === 'client' && (
                        <div className="pt-2">
                            <button
                                onClick={toggleConfig}
                                className={cn(
                                    "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group hover:bg-surface hover:text-white border-l-4 border-transparent hover:border-primary",
                                    location.pathname.includes('/app/config') ? "text-white" : "text-muted-foreground"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <Settings className="h-5 w-5 transition-colors duration-200 group-hover:text-primary" />
                                    <span>{'Configura\u00e7\u00f5es'}</span>
                                </div>
                                {isConfigExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                            
                            <AnimatePresence initial={false}>
                                {isConfigExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden ml-4 pl-4 border-l border-border mt-1 space-y-1"
                                        >
                                            {configItems.filter((item) => canAccessItem(item)).map((item) => {
                                                const isTabMatch = item.path.includes('?tab') && location.pathname === '/app/config' && item.path.includes(`tab=${currentTab}`);
                                                const isPathMatch = !item.path.includes('?tab') && location.pathname === item.path;
                                                const isActive = isTabMatch || isPathMatch;

                                                return (
                                                    <NavLink
                                                        key={item.label}
                                                        to={item.path}
                                                        onClick={onLinkClick}
                                                        className={cn(
                                                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 border-l-2 border-transparent hover:border-l-primary group hover:bg-surface hover:text-white",
                                                            isActive
                                                                ? 'text-primary font-medium bg-primary/5'
                                                                : 'text-muted-foreground'
                                                        )}
                                                   >
                                                    <item.icon
                                                        className={cn(
                                                            "h-4 w-4 transition-colors",
                                                            isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                                                        )}
                                                    />
                                                    <span>{item.label}</span>
                                                </NavLink>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </nav>
            </div>
            {/* Grouped "Voltar ao Site" and "Sair" buttons */}
            <div className="pt-4 mt-4 border-t border-border flex flex-col gap-2"> {/* Changed from flex-col sm:flex-row to flex-col */}
                <NavLink
                    to="/"
                    onClick={onLinkClick}
                    className="w-full"
                >
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-surface hover:text-white">
                        <Home className="h-5 w-5 mr-3" />
                        Voltar ao Site
                    </Button>
                </NavLink>
                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-surface hover:text-white hover:border-destructive/50" onClick={handleLogout}>
                    <LogOut className="h-5 w-5 mr-3 text-destructive" />
                    Sair
                </Button>
            </div>
        </div>
    );
}

const Header = () => {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    
    let pageTitle = "Painel";
    const currentTab = searchParams.get('tab');

    if (location.pathname.includes('orcamentos/novo')) pageTitle = 'Novo Or\u00e7amento';
    else if (location.pathname.includes('orcamentos/editar')) pageTitle = 'Editar Or\u00e7amento';
    else if (location.pathname.startsWith('/app/admin')) {
        const adminItem = adminNavItems.find((item) => location.pathname === item.path);
        pageTitle = adminItem?.label || 'Painel Admin';
    }
    else if (location.pathname.includes('config')) {
        if (location.pathname.includes('canais')) pageTitle = 'Configura\u00e7\u00f5es > Canais';
        else if (location.pathname.includes('integracoes')) pageTitle = 'Configura\u00e7\u00f5es > Integra\u00e7\u00f5es';
        else if (location.pathname.includes('security-2fa')) pageTitle = 'Configura\u00e7\u00f5es > Seguran\u00e7a 2FA'; // Added for 2FA page
        else {
            const configItem = configItems.find(c => c.path.includes(`tab=${currentTab}`));
            pageTitle = configItem ? `Configura\u00e7\u00f5es > ${configItem.label}` : 'Configura\u00e7\u00f5es';
        }
    }
    else if (location.pathname.includes('agendamentos')) pageTitle = 'Agendamentos';
    else if (location.pathname.includes('leads')) pageTitle = 'Leads'; 
    else if (location.pathname.includes('webhooks')) pageTitle = 'Webhooks';
    else {
        const exactMatchNavItem = mainNavItems.find(item => location.pathname === item.path);
        if (exactMatchNavItem) {
            pageTitle = exactMatchNavItem.label;
        } else {
            const currentNavItem = mainNavItems.find(item => location.pathname.startsWith(item.path) && (item.path !== '/app' || location.pathname === '/app'));
            if (currentNavItem) pageTitle = currentNavItem.label;
        }
    }

    return (
        <header className="bg-background/80 backdrop-blur-lg p-4 border-b border-border flex items-center gap-4 sticky top-0 z-30">
            <h1 className="text-xl sm:text-2xl font-heading text-white flex items-center gap-2">
                <span className="bg-primary/20 w-2 h-6 rounded-full mb-1"></span>
                {pageTitle}
            </h1>
        </header>
    );
}

const AppLayout = () => {
    const [isMobile, setIsMobile] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { profile, user, teamRole } = useAuth();
    const { viewMode } = useViewMode();
    const currentRole = isSystemAdmin(profile, user) ? viewMode : 'client';

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!isSystemAdmin(profile, user)) return;

        const isAdminRoute = location.pathname.startsWith('/app/admin');
        if (viewMode === 'admin' && !isAdminRoute) {
            navigate('/app/admin/visao-geral', { replace: true });
        }
        if (viewMode === 'client' && isAdminRoute) {
            navigate('/app', { replace: true });
        }
    }, [profile, user, viewMode, location.pathname, navigate]);

    useEffect(() => {
        if (currentRole !== 'client') return;

        const permissionByTab = {
            team: 'team',
            billing: 'billing',
            security: 'security',
        };

        let permissionKey = null;

        if (location.pathname.startsWith('/app/config')) {
            const tab = new URLSearchParams(location.search).get('tab');
            if (tab && permissionByTab[tab]) {
                permissionKey = permissionByTab[tab];
            } else if (location.pathname === '/app/config/canais' || location.pathname === '/app/config/integracoes') {
                permissionKey = 'integrations';
            }
        } else {
            const match = mainNavItems.find((item) => {
                if (item.path === '/app') return location.pathname === '/app';
                return location.pathname.startsWith(item.path);
            });
            permissionKey = match?.permissionKey || null;
        }

        if (permissionKey && !hasPermission(teamRole, permissionKey)) {
            navigate('/app', { replace: true });
        }
    }, [currentRole, location.pathname, location.search, teamRole, navigate]);

    if (isMobile) {
        let MobileContent = <Outlet />;
        if (location.pathname === '/app') MobileContent = <DashboardMobile />;
        else if (location.pathname === '/app/leads') MobileContent = <LeadsMobile />;
        else if (location.pathname === '/app/orcamentos') MobileContent = <OrcamentosMobile />;
        else if (location.pathname === '/app/pipeline') MobileContent = <PipelineMobile />;
        
        return (
            <MobileLayout>
                {MobileContent}
            </MobileLayout>
        );
    }

    return (
        <div className="flex min-h-screen bg-background text-white">
            <aside className="hidden md:block w-56 flex-shrink-0 fixed h-full z-40">
                <SidebarContent />
            </aside>
            <div className="hidden md:block w-56 flex-shrink-0" />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 p-6 overflow-y-auto overflow-x-auto scrollbar-visible bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
                    <motion.div
                        key={location.pathname + location.search}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="w-full"
                    >
                        <Outlet />
                    </motion.div>
                </main>
            </div>
            <Toaster />
        </div>
    );
};

export default AppLayout;












