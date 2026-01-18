import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useSettings } from '../hooks/useSettings';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Mail, MessageSquare, Moon, Clock, CheckCircle, ShieldAlert } from 'lucide-react';

const NotificationSettings = () => {
    const { profile } = useAuth();
    const { savePreferences, loading } = useSettings();
    const [prefs, setPrefs] = useState({
        email_new_lead: true,
        email_weekly_digest: false,
        email_digest_day: 'monday',
        email_digest_time: '08:00',
        push_new_message: true,
        push_status_change: true,
        push_pipeline_updates: true,
        push_schedule_reminders: true,
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '07:00',
        priority_channel: 'push',
        notify_errors: true,
        notify_success: true,
        notify_warning: true,
        notify_info: false
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

    const handleChange = async (key, value) => {
        const newPrefs = { ...prefs, [key]: value };
        setPrefs(newPrefs);
        await savePreferences(newPrefs);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Notificacoes por Email</CardTitle>
                    <CardDescription>Defina o que voce quer receber por email.</CardDescription>
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
                            <p className="text-sm text-muted-foreground">Resumo da sua performance no dia e horario escolhidos.</p>
                        </div>
                         <Switch 
                            checked={prefs.email_weekly_digest}
                            onCheckedChange={() => handleToggle('email_weekly_digest')}
                            disabled={loading}
                        />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Dia do resumo</Label>
                            <Select value={prefs.email_digest_day} onValueChange={(value) => handleChange('email_digest_day', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monday">Segunda</SelectItem>
                                    <SelectItem value="tuesday">Terca</SelectItem>
                                    <SelectItem value="wednesday">Quarta</SelectItem>
                                    <SelectItem value="thursday">Quinta</SelectItem>
                                    <SelectItem value="friday">Sexta</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Horario</Label>
                            <Input
                                type="time"
                                value={prefs.email_digest_time}
                                onChange={(e) => handleChange('email_digest_time', e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Notificacoes Push (App)</CardTitle>
                    <CardDescription>Alertas em tempo real no navegador ou celular.</CardDescription>
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
                            <Label className="text-base">Mudanca de Status</Label>
                            <p className="text-sm text-muted-foreground">Quando um orcamento for aprovado ou rejeitado.</p>
                        </div>
                        <Switch 
                            checked={prefs.push_status_change}
                            onCheckedChange={() => handleToggle('push_status_change')}
                            disabled={loading}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Pipeline</Label>
                            <p className="text-sm text-muted-foreground">Atualizacoes de etapa no funil.</p>
                        </div>
                        <Switch 
                            checked={prefs.push_pipeline_updates}
                            onCheckedChange={() => handleToggle('push_pipeline_updates')}
                            disabled={loading}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Agendamentos</Label>
                            <p className="text-sm text-muted-foreground">Lembretes e falhas de envio.</p>
                        </div>
                        <Switch 
                            checked={prefs.push_schedule_reminders}
                            onCheckedChange={() => handleToggle('push_schedule_reminders')}
                            disabled={loading}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Moon className="h-5 w-5 text-primary" /> Horario Silencioso</CardTitle>
                    <CardDescription>Evite alertas fora do horario de trabalho.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Ativar horario silencioso</Label>
                            <p className="text-sm text-muted-foreground">Pausar push durante o periodo configurado.</p>
                        </div>
                        <Switch 
                            checked={prefs.quiet_hours_enabled}
                            onCheckedChange={() => handleToggle('quiet_hours_enabled')}
                            disabled={loading}
                        />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Inicio</Label>
                            <Input
                                type="time"
                                value={prefs.quiet_hours_start}
                                onChange={(e) => handleChange('quiet_hours_start', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Fim</Label>
                            <Input
                                type="time"
                                value={prefs.quiet_hours_end}
                                onChange={(e) => handleChange('quiet_hours_end', e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> Preferencias de Canal</CardTitle>
                    <CardDescription>Defina o canal principal para alertas criticos.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Canal prioritario</Label>
                        <Select value={prefs.priority_channel} onValueChange={(value) => handleChange('priority_channel', value)}>
                            <SelectTrigger className="max-w-xs">
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="push">Push (app)</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-primary" /> Tipos de Alertas</CardTitle>
                    <CardDescription>Escolha quais tipos voce deseja receber.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Erros</Label>
                            <p className="text-sm text-muted-foreground">Falhas em envios, integracoes e automacoes.</p>
                        </div>
                        <Switch 
                            checked={prefs.notify_errors}
                            onCheckedChange={() => handleToggle('notify_errors')}
                            disabled={loading}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Alertas</Label>
                            <p className="text-sm text-muted-foreground">Prazos, vencimentos e limites de uso.</p>
                        </div>
                        <Switch 
                            checked={prefs.notify_warning}
                            onCheckedChange={() => handleToggle('notify_warning')}
                            disabled={loading}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Sucesso</Label>
                            <p className="text-sm text-muted-foreground">Aprovacoes, pagamentos e metas atingidas.</p>
                        </div>
                        <Switch 
                            checked={prefs.notify_success}
                            onCheckedChange={() => handleToggle('notify_success')}
                            disabled={loading}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Informativos</Label>
                            <p className="text-sm text-muted-foreground">Dicas, novidades e atualizacoes do app.</p>
                        </div>
                        <Switch 
                            checked={prefs.notify_info}
                            onCheckedChange={() => handleToggle('notify_info')}
                            disabled={loading}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default NotificationSettings;
