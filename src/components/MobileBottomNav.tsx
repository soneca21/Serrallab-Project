
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Inbox, Users, FileText, Columns, Settings } from 'lucide-react';

const MobileBottomNav: React.FC = () => {
    const navItems = [
        { path: '/app', label: 'Inicio', icon: LayoutDashboard, end: true },
        { path: '/app/leads', label: 'Leads', icon: Inbox },
        { path: '/app/clientes', label: 'Clientes', icon: Users },
        { path: '/app/orcamentos', label: 'Orçam.', icon: FileText },
        { path: '/app/pipeline', label: 'Pipeline', icon: Columns },
        { path: '/app/config', label: 'Config', icon: Settings },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border h-16 pb-safe z-50 flex items-center justify-around px-2">
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center w-full h-full space-y-1 ${
                            isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                        }`
                    }
                >
                    <item.icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
};

export default MobileBottomNav;
