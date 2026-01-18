
import React, { createContext, useContext, useState, useEffect } from 'react';

const ViewModeContext = createContext({
  viewMode: 'admin',
  setViewMode: () => {},
});

export function ViewModeProvider({ children }) {
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userView') || 'admin';
    }
    return 'admin';
  });

  useEffect(() => {
    localStorage.setItem('userView', viewMode);
  }, [viewMode]);

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export const useViewMode = () => useContext(ViewModeContext);
