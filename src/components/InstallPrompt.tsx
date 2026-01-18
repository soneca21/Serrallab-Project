
import React from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InstallPrompt: React.FC = () => {
    const { isInstallable, install } = usePWA();
    const [isVisible, setIsVisible] = React.useState(true);

    if (!isInstallable || !isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-20 left-4 right-4 z-40 md:hidden"
            >
                <div className="bg-primary text-primary-foreground p-4 rounded-lg shadow-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Download className="h-6 w-6" />
                        <div className="flex flex-col">
                            <span className="font-bold text-sm">Instalar App</span>
                            <span className="text-xs opacity-90">Acesse offline e receba notificações</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={install}
                            className="bg-white text-primary hover:bg-gray-100"
                        >
                            Instalar
                        </Button>
                        <button onClick={() => setIsVisible(false)} className="p-1">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default InstallPrompt;
