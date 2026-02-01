import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Hammer as Anvil, Home, LogIn, DollarSign, Menu, X, Layers, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const navItems = [
    { label: 'Início', path: '/#home', type: 'scroll', icon: Home },
    { label: 'Recursos', path: '/#features', type: 'scroll', icon: Layers },
    { label: 'Preços', path: '/precos', type: 'page', icon: DollarSign },
    { label: 'Contato', path: '/#contact', type: 'scroll', icon: Mail },
];

const Header = ({ isAuthenticated }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('Início');

    // Handle Hash Scroll and Active State Spy
    useEffect(() => {
        // Hash Scrolling
        if (location.hash) {
            const elementId = location.hash.substring(1);
            const element = document.getElementById(elementId);
            if (element) {
                setTimeout(() => {
                   element.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        } else if (location.pathname === '/') {
             // Scroll to top if just '/'
             window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Scroll Spy
        const handleScroll = () => {
            if (location.pathname !== '/') return;

            const scrollPosition = window.scrollY + 150; // Offset
            const homeSection = document.getElementById('home');
            const featuresSection = document.getElementById('features');
            const contactSection = document.getElementById('contact');

            let current = 'Início';

            if (contactSection && scrollPosition >= contactSection.offsetTop) {
                current = 'Contato';
            } else if (featuresSection && scrollPosition >= featuresSection.offsetTop) {
                current = 'Recursos';
            } else {
                current = 'Início';
            }
            setActiveSection(current);
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Initial check

        return () => window.removeEventListener('scroll', handleScroll);
    }, [location]);

    const handleNavClick = (e, item) => {
        e.preventDefault();
        setIsMobileMenuOpen(false);

        if (item.type === 'page') {
            navigate(item.path);
            return;
        }

        if (item.type === 'scroll') {
            const targetId = item.path.replace('/#', '');

            if (location.pathname === '/') {
                const element = document.getElementById(targetId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            } else {
                // Navigate to landing page with hash
                navigate(item.path);
            }
        }
    };

    const isItemActive = (item) => {
        if (item.type === 'page') {
            return location.pathname === item.path;
        }
        // For scroll items
        if (location.pathname === '/') {
            return activeSection === item.label;
        }
        return false;
    };

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-lg"
        >
            <div className="w-full flex h-20 items-center justify-between px-4 md:px-8">
                <NavLink to="/" className="flex items-center gap-2 text-2xl font-heading font-bold hover:opacity-90 transition-opacity" onClick={(e) => handleNavClick(e, { path: '/#home', type: 'scroll'})}>
                    <Anvil className="h-8 w-8 text-primary drop-shadow-[0_0_8px_rgba(218,105,11,0.6)]" />
                    <span className="text-foreground">Serral<span className="text-primary">lab</span></span>
                </NavLink>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {navItems.map((item) => {
                        const isActive = isItemActive(item);
                        return (
                            <a
                                key={item.label}
                                href={item.path}
                                onClick={(e) => handleNavClick(e, item)}
                                className={`relative font-body font-medium text-sm transition-colors duration-300 hover:text-primary flex items-center gap-2 cursor-pointer
                                ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                            >
                                {item.label}
                                {isActive && (
                                    <motion.div
                                        className="absolute -bottom-8 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_0_10px_rgba(218,105,11,0.5)]"
                                        layoutId="underline"
                                    />
                                )}
                            </a>
                        );
                    })}
                    <div className="flex items-center gap-4 ml-4">
                            <NavLink
                            to={isAuthenticated ? '/app' : '/login'}
                            className={({ isActive }) =>
                                `font-medium text-sm transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-muted-foreground'} border-2 border-surface-strong hover:border-primary rounded-xl px-4 py-2 transition-all duration-300`
                            }
                        >
                            {isAuthenticated ? 'Dashboard' : 'Entrar'}
                        </NavLink>
                        {!isAuthenticated && (
                            <NavLink to="/cadastro">
                                <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90 font-bold shadow-[0_0_15px_rgba(218,105,11,0.3)] hover:shadow-[0_0_20px_rgba(218,105,11,0.5)]">
                                    Criar Conta Grátis
                                </Button>
                            </NavLink>
                        )}
                    </div>
                </nav>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Nav */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-background border-b border-border shadow-xl overflow-hidden"
                    >
                        <nav className="flex flex-col p-6 gap-3">
                            {navItems.map((item) => {
                                const isActive = isItemActive(item);
                                return (
                                    <a
                                        key={item.label}
                                        href={item.path}
                                        onClick={(e) => handleNavClick(e, item)}
                                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all
                                        ${isActive
                                          ? 'bg-primary/10 text-primary border border-primary/30 shadow-[0_0_10px_rgba(218,105,11,0.2)]'
                                          : 'text-gray-300 hover:bg-surface hover:text-white border border-transparent'
                                        }`}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.label}
                                    </a>
                                );
                            })}
                            <div className="h-px bg-border my-2" />
                            <NavLink
                                to={isAuthenticated ? '/app' : '/login'}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-gray-300 border-2 border-surface-strong hover:border-primary hover:text-primary transition-all"
                            >
                                <LogIn className="h-5 w-5" />
                                {isAuthenticated ? 'Dashboard' : 'Entrar'}
                            </NavLink>
                            {!isAuthenticated && (
                                <div className="pt-2">
                                    <NavLink to="/cadastro" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold shadow-lg py-3.5">
                                            Criar Conta Grátis
                                        </Button>
                                    </NavLink>
                                </div>
                            )}
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
}

const Footer = ({ isAuthenticated }) => (
    <footer className="bg-surface border-t border-border py-12">
        <div className="w-full px-4 md:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
                <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center gap-2 text-2xl font-heading font-bold mb-4">
                        <Anvil className="h-6 w-6 text-primary" />
                        <span className="text-foreground">Serral<span className="text-primary">lab</span></span>
                    </div>
                    <p className="text-muted-foreground max-w-sm">
                        A plataforma definitiva para serralheiros modernos. Otimize seus processos, conquiste mais clientes e aumente seus lucros.
                    </p>
                    <div className="mt-6 flex gap-4">
                        <a href="mailto:contato@serrallab.com" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                            <Mail className="h-4 w-4" /> contato@serrallab.com
                        </a>
                    </div>
                </div>
                <div>
                    <h4 className="font-bold text-foreground mb-4">Produto</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li><NavLink to="/" className="hover:text-primary transition-colors">Início</NavLink></li>
                        <li><NavLink to="/precos" className="hover:text-primary transition-colors">Preços</NavLink></li>
                        <li><NavLink to="/cadastro" className="hover:text-primary transition-colors">Cadastro</NavLink></li>
                        <li>
                            <NavLink
                                to={isAuthenticated ? '/app' : '/login'}
                                className="hover:text-primary transition-colors"
                            >
                                {isAuthenticated ? 'Dashboard' : 'Entrar'}
                            </NavLink>
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-foreground mb-4">Legal</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Privacidade</a></li>
                    </ul>
                </div>
            </div>
            <div className="pt-8 border-t border-border text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-muted-foreground text-sm">
                    &copy; {new Date().getFullYear()} Serrallab. Todos os direitos reservados.
                </p>
            </div>
        </div>
    </footer>
);


const PublicLayout = () => {
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer isAuthenticated={isAuthenticated} />
    </div>
  );
};

export default PublicLayout;
