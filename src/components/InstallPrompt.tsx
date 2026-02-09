import React from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InstallPrompt: React.FC = () => {
    const { isInstallable, isIOS, showIOSInstallInstructions, install } = usePWA();
    const [isVisible, setIsVisible] = React.useState(true);

    const shouldShow = isVisible && (isInstallable || showIOSInstallInstructions);

    if (!shouldShow) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-20 left-4 right-4 z-40 md:hidden"
            >
                <div className="bg-primary text-primary-foreground p-4 rounded-lg shadow-lg">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                            {isInstallable ? <Download className="h-6 w-6 mt-0.5" /> : <Share2 className="h-6 w-6 mt-0.5" />}
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">Instalar App</span>
                                {isInstallable ? (
                                    <span className="text-xs opacity-90">Acesse offline e receba notificacoes</span>
                                ) : (
                                    <span className="text-xs opacity-90">
                                        No iPhone/iPad: toque em <span className="font-semibold">Compartilhar</span> e depois em{' '}
                                        <span className="font-semibold">Adicionar a Tela de Inicio</span>
                                    </span>
                                )}
                            </div>
                        </div>
                        <button onClick={() => setIsVisible(false)} className="p-1">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        {isInstallable && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={install}
                                className="bg-white text-primary hover:bg-gray-100"
                            >
                                Instalar
                            </Button>
                        )}
                        {isIOS && showIOSInstallInstructions && (
                            <div className="text-xs opacity-90 flex items-center gap-1">
                                <PlusSquare className="h-3.5 w-3.5" />
                                Safari &gt; Compartilhar &gt; Adicionar a Tela de Inicio
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default InstallPrompt;
