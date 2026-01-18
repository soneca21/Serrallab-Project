
import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';

const ViewSelector = () => {
  const { user, profile } = useAuth(); // profile usually contains role
  const { viewMode, setViewMode } = useViewMode();

  // Guard: Only render for admins
  const isAdmin = profile?.role === 'admin' || user?.user_metadata?.role === 'admin';
  
  if (!isAdmin) {
    return null;
  }

  const handleToggle = (checked) => {
    setViewMode(checked ? 'admin' : 'client');
  };

  return (
    <div className="flex items-center justify-between space-x-2 bg-surface p-3 rounded-lg border border-border mb-4 transition-all duration-200 hover:bg-surface-hover">
      <Label htmlFor="view-mode-toggle" className="flex items-center gap-2 text-sm font-medium text-gray-300 cursor-pointer select-none">
        {viewMode === 'admin' ? (
          <Eye className="h-4 w-4 text-primary" />
        ) : (
          <EyeOff className="h-4 w-4 text-gray-400" />
        )}
        <span>{viewMode === 'admin' ? 'Visão Admin' : 'Visão Cliente'}</span>
      </Label>
      <Switch
        id="view-mode-toggle"
        checked={viewMode === 'admin'}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
};

export default ViewSelector;
