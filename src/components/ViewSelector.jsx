import React from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { isSystemAdmin } from '@/lib/roles';

const ViewSelector = () => {
  const { user, profile } = useAuth();
  const { viewMode, setViewMode } = useViewMode();
  const navigate = useNavigate();

  const canSeeSystemAdmin = isSystemAdmin(profile, user);
  if (!canSeeSystemAdmin) return null;

  const isAdminView = viewMode === 'admin';

  const handleToggle = () => {
    const nextMode = isAdminView ? 'client' : 'admin';
    setViewMode(nextMode);
    navigate(nextMode === 'admin' ? '/app/admin/visao-geral' : '/app');
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`flex items-center justify-between gap-3 px-3 py-2 rounded-[14px] border bg-[#050505] transition-all duration-200 ${
        isAdminView ? 'border-[#f97316] shadow-[0_0_0_1px_#f97316]' : 'border-[#2a2a2a]'
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-white whitespace-nowrap">
        <KeyRound className="h-4 w-4 text-primary" />
        <span>Painel Admin</span>
      </div>
      <div
        className={`relative h-6 w-11 rounded-full border ${
          isAdminView ? 'border-[#f97316] bg-[#f97316]' : 'border-[#2a2a2a] bg-[#111111]'
        }`}
      >
        <div
          className={`absolute inset-0 flex items-center ${
            isAdminView ? 'justify-end' : 'justify-start'
          } px-[2px] transition-all duration-200`}
        >
          <span
            className={`h-4 w-4 rounded-full shadow-sm ${
              isAdminView ? 'bg-black' : 'bg-white'
            }`}
          />
        </div>
      </div>
    </button>
  );
};

export default ViewSelector;
