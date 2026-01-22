import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingPage = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-3 text-center">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

export default LoadingPage;
