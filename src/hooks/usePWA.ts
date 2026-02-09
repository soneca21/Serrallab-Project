
import { useState, useEffect } from 'react';
import { trackPwaTelemetry } from '@/lib/pwaTelemetry';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWA() {
    const [isInstalled, setIsInstalled] = useState(false);
    const [isInstallable, setIsInstallable] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSInstallInstructions, setShowIOSInstallInstructions] = useState(false);

    useEffect(() => {
        const ua = window.navigator.userAgent;
        const iosDevice = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
        setIsIOS(iosDevice);

        // Check if installed
        const checkInstalled = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                               (window.navigator as any).standalone || 
                               document.referrer.includes('android-app://');
            setIsInstalled(isStandalone);
            if (isStandalone) {
                void trackPwaTelemetry('app_installed', {
                    platform: iosDevice ? 'ios' : 'web',
                }, {
                    dedupeSessionKey: 'app_installed',
                });
            }
            if (iosDevice && isSafari) {
                setShowIOSInstallInstructions(!isStandalone);
            } else {
                setShowIOSInstallInstructions(false);
            }
        };
        
        checkInstalled();
        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        mediaQuery.addEventListener('change', checkInstalled);

        // Install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
            void trackPwaTelemetry('install_prompt_shown', {
                platform: 'android',
                source: 'beforeinstallprompt',
            }, {
                dedupeSessionKey: 'install_prompt_shown_android',
            });
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Online/Offline status
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        const handleAppInstalled = () => {
            void trackPwaTelemetry('app_installed', {
                platform: iosDevice ? 'ios' : 'web',
                source: 'appinstalled_event',
            }, {
                dedupeSessionKey: 'app_installed',
            });
            setIsInstallable(false);
            setDeferredPrompt(null);
        };
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            mediaQuery.removeEventListener('change', checkInstalled);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    useEffect(() => {
        if (!showIOSInstallInstructions) return;
        void trackPwaTelemetry('install_prompt_shown', {
            platform: 'ios',
            source: 'fallback_instruction',
        }, {
            dedupeSessionKey: 'install_prompt_shown_ios',
        });
    }, [showIOSInstallInstructions]);

    const install = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsInstallable(false);
            setDeferredPrompt(null);
        }
    };

    return {
        isInstalled,
        isInstallable,
        isIOS,
        showIOSInstallInstructions,
        install,
        isOnline,
    };
}
