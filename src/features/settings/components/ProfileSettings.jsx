import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useSettings } from '../hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, User, Shield, Copy, Mail, Clock, Globe, Calendar, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { use2FA } from '@/hooks/use2FA';
import { formatDateBR } from '@/lib/date';

const ProfileSettings = () => {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const { saveProfile, savePreferences, loading } = useSettings();
    const { toast } = useToast();
    const { isEnabled: is2FAEnabled, method: twoFAMethod } = use2FA();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        avatar_url: ''
    });
    const [prefs, setPrefs] = useState({
        timezone: 'America/Sao_Paulo',
        locale: 'pt-BR',
        date_format: 'dd/MM/yyyy',
        week_start: 'monday',
        currency: 'BRL'
    });
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [savingPrefs, setSavingPrefs] = useState(false);

    useEffect(() => {
        if (profile && user) {
            setFormData({
                full_name: profile.company_name || '',
                email: user.email || '',
                avatar_url: profile.avatar_url || ''
            });
            if (profile.preferences) {
                setPrefs(prev => ({ ...prev, ...profile.preferences }));
            }
        }
    }, [profile, user]);

    const handleAvatarUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('logos')
                .getPublicUrl(filePath);

            await saveProfile({ avatar_url: publicUrl });
            setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro no upload', description: error.message });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await saveProfile({ company_name: formData.full_name });
    };

    const handleSavePreferences = async () => {
        setSavingPrefs(true);
        const nextPrefs = { ...(profile?.preferences || {}), ...prefs };
        await savePreferences(nextPrefs);
        setSavingPrefs(false);
    };

    const handleCopyUserId = async () => {
        if (!user?.id) return;
        try {
            await navigator.clipboard?.writeText(user.id);
            toast({ title: 'Copiado', description: 'ID do usuario copiado.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Nao foi possivel copiar o ID.' });
        }
    };

    const createdAt = user?.created_at ? formatDateBR(user.created_at) : '-';
    const lastSignIn = user?.last_sign_in_at ? formatDateBR(user.last_sign_in_at) : '-';
    const emailVerified = Boolean(user?.email_confirmed_at);

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Minha Conta</CardTitle>
                        <CardDescription>Identidade e informacoes basicas do usuario.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col gap-6 md:flex-row md:items-center">
                            <div className="relative group cursor-pointer w-fit" onClick={() => fileInputRef.current?.click()}>
                                <img 
                                    src={formData.avatar_url || `https://ui-avatars.com/api/?name=${formData.full_name || 'U'}&background=2d3748&color=f7941d&size=128`} 
                                    alt="Avatar" 
                                    className="w-24 h-24 rounded-full object-cover border-4 border-surface-strong group-hover:border-primary transition-all shadow-lg" 
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Upload className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="space-y-2 flex-1">
                               <Label>Foto de Perfil</Label>
                               <Input 
                                    ref={fileInputRef}
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleAvatarUpload}
                                />
                               <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <Button 
                                        type="button" 
                                        onClick={() => fileInputRef.current?.click()} 
                                        disabled={uploading} 
                                        variant="outline" 
                                        className="w-full sm:w-auto"
                                    >
                                       {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                                       Alterar Foto
                                   </Button>
                                   <p className="text-xs text-muted-foreground">JPG, GIF ou PNG. Max 2MB.</p>
                               </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Nome de Exibicao</Label>
                                    <Input 
                                        id="full_name" 
                                        value={formData.full_name} 
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input 
                                        id="email" 
                                        value={formData.email} 
                                        disabled 
                                        className="bg-muted text-muted-foreground"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <Mail className="h-4 w-4 text-primary" />
                                    {emailVerified ? 'Email verificado' : 'Email nao verificado'}
                                </div>
                                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Salvar Alteracoes
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Conta e Seguranca</CardTitle>
                        <CardDescription>Status da conta e acesso rapido.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3 rounded-xl border border-border/40 bg-background/30 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-foreground">2FA</p>
                                    <p className="text-xs text-muted-foreground">
                                        {is2FAEnabled ? `Ativo (${twoFAMethod || 'totp'})` : 'Desativado'}
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => navigate('/app/config/security-2fa')}>
                                    <KeyRound className="mr-2 h-4 w-4" />
                                    Gerenciar
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-3 rounded-xl border border-border/40 bg-background/30 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-foreground">ID do usuario</p>
                                    <p className="text-xs text-muted-foreground break-all">{user?.id || '-'}</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={handleCopyUserId}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="grid gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    Criado em: {createdAt}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-primary" />
                                    Ultimo login: {lastSignIn}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Preferencias de Uso</CardTitle>
                    <CardDescription>Personalize idioma, moeda e calendario.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Fuso horario</Label>
                            <Select value={prefs.timezone} onValueChange={(value) => setPrefs(prev => ({ ...prev, timezone: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="America/Sao_Paulo">America/Sao_Paulo</SelectItem>
                                    <SelectItem value="America/Fortaleza">America/Fortaleza</SelectItem>
                                    <SelectItem value="America/Recife">America/Recife</SelectItem>
                                    <SelectItem value="America/Manaus">America/Manaus</SelectItem>
                                    <SelectItem value="America/Cuiaba">America/Cuiaba</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Idioma</Label>
                            <Select value={prefs.locale} onValueChange={(value) => setPrefs(prev => ({ ...prev, locale: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pt-BR">pt-BR</SelectItem>
                                    <SelectItem value="en-US">en-US</SelectItem>
                                    <SelectItem value="es-ES">es-ES</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Moeda</Label>
                            <Select value={prefs.currency} onValueChange={(value) => setPrefs(prev => ({ ...prev, currency: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BRL">BRL</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Formato de data</Label>
                            <Select value={prefs.date_format} onValueChange={(value) => setPrefs(prev => ({ ...prev, date_format: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dd/MM/yyyy">dd/MM/yyyy</SelectItem>
                                    <SelectItem value="MM/dd/yyyy">MM/dd/yyyy</SelectItem>
                                    <SelectItem value="yyyy-MM-dd">yyyy-MM-dd</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Inicio da semana</Label>
                            <Select value={prefs.week_start} onValueChange={(value) => setPrefs(prev => ({ ...prev, week_start: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monday">Monday</SelectItem>
                                    <SelectItem value="sunday">Sunday</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button type="button" onClick={handleSavePreferences} disabled={loading || savingPrefs}>
                            {(loading || savingPrefs) && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Salvar Preferencias
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Sessoes Ativas</CardTitle>
                    <CardDescription>Dispositivos conectados a sua conta.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-background/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium text-foreground">Sessao atual</p>
                                <p className="text-xs text-muted-foreground">Acesso recente</p>
                            </div>
                        </div>
                        <div className="text-xs text-green-500 font-medium bg-green-500/10 px-2 py-1 rounded w-fit">Ativo</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProfileSettings;
