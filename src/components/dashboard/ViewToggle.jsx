import React from 'react';
import { EyeOff } from 'lucide-react';

const ViewToggle = ({ currentView, onToggle }) => {
  const isAdmin = currentView === 'admin';

  return (
    <button
      onClick={() => onToggle(isAdmin ? 'client' : 'admin')}
      className={`flex items-center justify-between w-44 px-4 py-2 rounded-2xl border transition-all duration-150 ${
        isAdmin
          ? 'border-primary bg-surface shadow-[0_5px_15px_rgba(15,15,15,0.25)]'
          : 'border-border bg-surface-strong hover:border-primary'
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <EyeOff className="h-4 w-4 text-primary" />
        <span>Visão Admin</span>
      </div>
      <div
        className={`h-5 w-5 rounded-full transition-all duration-150 ${
          isAdmin ? 'bg-white shadow-lg translate-x-0' : 'bg-white/80 translate-x-1'
        }`}
      />
    </button>
  );
};

export default ViewToggle;
