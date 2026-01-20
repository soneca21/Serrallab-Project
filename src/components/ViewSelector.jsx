import React from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';

const ViewSelector = () => {
  const { user, profile } = useAuth();
  const { viewMode, setViewMode } = useViewMode();
  const navigate = useNavigate();

  const isAdmin = profile?.role === 'admin' || user?.user_metadata?.role === 'admin';
  if (!isAdmin) {
    return null;
  }

  const isAdminView = viewMode === 'admin';

  const handleToggle = () => {
    const nextMode = isAdminView ? 'client' : 'admin';
    setViewMode(nextMode);
    navigate(nextMode === 'admin' ? '/app/admin/visao-geral' : '/app');
  };

  return (
    <div className="flex items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-border mb-4 transition-all duration-200 hover:bg-surface-hover">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-200">{'Vis\u00e3o Admin'}</span>
        <span className="text-xs text-muted-foreground">
          {isAdminView ? 'Painel administrativo ativo.' : 'Alternar para o painel administrativo.'}
        </span>
      </div>
      <Button
        type="button"
        variant={isAdminView ? 'default' : 'secondary'}
        size="sm"
        onClick={handleToggle}
        className="rounded-full"
      >
        <KeyRound className="mr-2 h-4 w-4" />
        {'Vis\u00e3o Admin'}
      </Button>
    </div>
  );
};

export default ViewSelector;
