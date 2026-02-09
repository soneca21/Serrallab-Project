import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

function getRegistration() {
    if (!('serviceWorker' in navigator)) return Promise.resolve(null);
    return navigator.serviceWorker.getRegistration('/service-worker.js')
        .then((registration) => registration || navigator.serviceWorker.getRegistration());
}

export default function ServiceWorkerUpdatePrompt() {
    const { toast } = useToast();
    const waitingWorkerRef = useRef(null);
    const shownForScriptRef = useRef('');
    const toastHandleRef = useRef(null);
    const refreshingRef = useRef(false);

    const dismissToast = () => {
        if (toastHandleRef.current) {
            toastHandleRef.current.dismiss();
            toastHandleRef.current = null;
        }
    };

    const requestRefresh = () => {
        const waitingWorker = waitingWorkerRef.current;
        if (!waitingWorker) return;
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
        dismissToast();
    };

    const showUpdateToast = (worker) => {
        if (!worker) return;
        const scriptKey = worker.scriptURL || 'unknown-sw-script';
        if (shownForScriptRef.current === scriptKey) return;
        shownForScriptRef.current = scriptKey;
        waitingWorkerRef.current = worker;

        dismissToast();
        toastHandleRef.current = toast({
            duration: 600000,
            title: 'Nova versao do app disponivel',
            description: 'Atualize para aplicar melhorias e correcoes.',
            action: (
                <div className="flex items-center gap-2">
                    <Button size="sm" onClick={requestRefresh}>
                        Atualizar agora
                    </Button>
                    <Button size="sm" variant="outline" onClick={dismissToast}>
                        Depois
                    </Button>
                </div>
            ),
        });
    };

    useEffect(() => {
        if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
            return undefined;
        }

        const handleControllerChange = () => {
            if (refreshingRef.current) return;
            refreshingRef.current = true;
            window.location.reload();
        };

        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

        let registrationRef = null;
        let installingRef = null;
        let detached = false;

        const onInstallingStateChange = () => {
            if (!installingRef) return;
            if (installingRef.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateToast(registrationRef?.waiting || installingRef);
            }
        };

        const onUpdateFound = () => {
            installingRef = registrationRef?.installing || null;
            if (!installingRef) return;
            installingRef.addEventListener('statechange', onInstallingStateChange);
        };

        void getRegistration().then((registration) => {
            if (detached || !registration) return;
            registrationRef = registration;

            if (registration.waiting) {
                showUpdateToast(registration.waiting);
            }

            registration.addEventListener('updatefound', onUpdateFound);
        });

        return () => {
            detached = true;
            if (registrationRef) {
                registrationRef.removeEventListener('updatefound', onUpdateFound);
            }
            if (installingRef) {
                installingRef.removeEventListener('statechange', onInstallingStateChange);
            }
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        };
    }, []);

    return null;
}
