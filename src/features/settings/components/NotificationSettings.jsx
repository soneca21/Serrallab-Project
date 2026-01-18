
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useSettings } from '../hooks/useSettings';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Mail, MessageSquare } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const NotificationSettings = () => {
    const { profile } = useAuth();
    const { savePreferences, loading } = useSettings();
    const [prefs, setPrefs] = useState({
        email_new_lead: true,
        email_weekly_digest: false,
        push_new_message: true,
        push_status_change: true
    });

    useEffect(() => {
        if (profile?.preferences) {
            setPrefs(prev => ({ ...prev, ...profile.preferences }));
        }
    }, [profile]);

    const handleToggle = async (key) => {
        const newPrefs = { ...prefs, [key]: !prefs[key] };
        setPrefs(newPrefs);
        await savePreferences(newPrefs);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Notificações por Email</CardTitle>
                    <CardDescription>Escolha quais emails você deseja receber.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Novos Leads</Label>
                            <p className="text-sm text-muted-foreground">Receba um email quando um novo lead for cadastrado.</p>
                        </div>
                        <Switch 
                            checked={prefs.email_new_lead}
                            onCheckedChange={() => handleToggle('email_new_lead')}
                            disabled={loading}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Resumo Semanal</Label>
                            <p className="text-sm text-muted-foreground">Um resumo da sua performance toda segunda-feira.</p>
                        </div>
                         <Switch 
                            checked={prefs.email_weekly_digest}
                            onCheckedChange={() => handleToggle('email_weekly_digest')}
                            disabled={loading}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Notificações Push (App)</CardTitle>
                    <CardDescription>Alertas no navegador ou celular.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Novas Mensagens</Label>
                            <p className="text-sm text-muted-foreground">Quando um cliente responder no WhatsApp.</p>
                        </div>
                        <Switch 
                            checked={prefs.push_new_message}
                            onCheckedChange={() => handleToggle('push_new_message')}
                            disabled={loading}
                        />
                    </div>
                     <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Mudança de Status</Label>
                            <p className="text-sm text-muted-foreground">Quando um orçamento for aprovado ou rejeitado.</p>
                        </div>
                        <Switch 
                            checked={prefs.push_status_change}
                            onCheckedChange={() => handleToggle('push_status_change')}
                            disabled={loading}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default NotificationSettings;
