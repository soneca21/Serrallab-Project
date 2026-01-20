import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useSettings } from '../hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, User, Shield, Copy, Mail, Clock, Globe, Calendar, KeyRound, CheckCircle2 } from 'lucide-react';
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
    const maxImageSizeBytes = 2 * 1024 * 1024;
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    const resetFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const resolveImageType = (file) => {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
        const normalizedExt = fileExt === 'jpg' ? 'jpeg' : fileExt;
        const contentType = file.type || `image/${normalizedExt}`;
        return { contentType, extension: normalizedExt };
    };

    const validateImageFile = (file) => {
        const { contentType } = resolveImageType(file);
        const normalizedType = contentType === 'image/jpg' ? 'image/jpeg' : contentType;
        if (!allowedImageTypes.includes(normalizedType)) {
            throw new Error('Formato inv\u00e1lido. Use PNG, JPG, GIF ou WEBP.');
        }
        if (file.size > maxImageSizeBytes) {
            throw new Error('O arquivo deve ter no m\u00e1ximo 2MB.');
        }
        return contentType;
    };

    const uploadImageToBucket = async (bucket, filePath, file, contentType) => {
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                upsert: true,
                cacheControl: '3600',
                contentType
            });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        if (!data?.publicUrl) {
            throw new Error('N\u00e3o foi poss\u00edvel gerar a URL da imagem.');
        }

        return data.publicUrl;
    };

    const uploadImage = async ({ file, bucket, fallbackBucket, pathPrefix, fileBase }) => {
        const { contentType, extension } = resolveImageType(file);
        const filePath = `${pathPrefix}/${fileBase}.${extension}`;

        try {
            return await uploadImageToBucket(bucket, filePath, file, contentType);
        } catch (error) {
            const message = (error?.message || '').toLowerCase();
            const shouldTryFallback = fallbackBucket && (message.includes('bucket') || error?.statusCode === 404);
            if (shouldTryFallback) {
                return await uploadImageToBucket(fallbackBucket, filePath, file, contentType);
            }
            throw error;
        }
    };

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
        const file = event.target.files?.[0];
        if (!file || !user?.id) {
            resetFileInput();
            return;
        }

        setUploading(true);
        try {
            validateImageFile(file);
            const publicUrl = await uploadImage({
                file,
                bucket: 'avatars',
                fallbackBucket: 'logos',
                pathPrefix: 'avatars',
                fileBase: `avatar-${user.id}-${Date.now()}`
            });

            await saveProfile({ avatar_url: publicUrl });
            setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
            toast({ title: 'Foto atualizada', description: 'Sua foto de perfil foi enviada.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro no upload', description: error.message });
        } finally {
            setUploading(false);
            resetFileInput();
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
            toast({ title: 'Copiado', description: 'ID do usu\u00e1rio copiado.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'N\u00e3o foi poss\u00edvel copiar o ID.' });
        }
    };

    const handleCopyEmail = async () => {
        if (!formData.email) return;
        try {
            await navigator.clipboard?.writeText(formData.email);
            toast({ title: 'Copiado', description: 'Email copiado.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'N\u00e3o foi poss\u00edvel copiar o email.' });
        }
    };

    const createdAt = user?.created_at ? formatDateBR(user.created_at) : '-';
    const lastSignIn = user?.last_sign_in_at ? formatDateBR(user.last_sign_in_at) : '-';
    const emailVerified = Boolean(user?.email_confirmed_at);
    const companyName = profile?.company_name || 'Sem empresa';

    return (
        <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Minha Conta</CardTitle>
                        <CardDescription>{'Identidade e informa\u00e7\u00f5es principais do usu\u00e1rio.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
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
                                    accept="image/png,image/jpeg,image/gif,image/webp"
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
                                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF ou WEBP. M\u00e1x 2MB.</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Nome de Exibi\u00e7\u00e3o</Label>
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

                            <div className="flex flex-wrap gap-2">
                                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${emailVerified ? 'border-emerald-500/40 text-emerald-400' : 'border-amber-500/40 text-amber-400'}`}>
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {emailVerified ? 'Email verificado' : 'Email pendente'}
                                </span>
                                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${is2FAEnabled ? 'border-emerald-500/40 text-emerald-400' : 'border-muted-foreground/40 text-muted-foreground'}`}>
                                    <Shield className="h-3.5 w-3.5" />
                                    {is2FAEnabled ? `2FA ativo (${twoFAMethod || 'totp'})` : '2FA desativado'}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-border/50 px-3 py-1 text-xs text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {'Membro desde '}{createdAt}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-border/50 px-3 py-1 text-xs text-muted-foreground">
                                    <Clock className="h-3.5 w-3.5" />
                                    {'\u00daltimo login '}{lastSignIn}
                                </span>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <Mail className="h-4 w-4 text-primary" />
                                    {formData.email}
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <Button type="button" variant="outline" onClick={handleCopyEmail} className="w-full sm:w-auto">
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copiar email
                                    </Button>
                                    <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                        Salvar altera\u00e7\u00f5es
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Resumo da Conta</CardTitle>
                        <CardDescription>{'Seguran\u00e7a, acessos e dados do usu\u00e1rio.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3 rounded-xl border border-border/40 bg-background/30 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-xs text-muted-foreground">Empresa</span>
                                <span className="text-sm font-medium text-foreground truncate">{companyName}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-xs text-muted-foreground">Email</span>
                                <span className="text-sm font-medium text-foreground truncate">{formData.email || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-xs text-muted-foreground">ID do usu\u00e1rio</span>
                                <Button variant="ghost" size="icon" onClick={handleCopyUserId}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="text-xs text-muted-foreground break-all">{user?.id || '-'}</div>
                        </div>

                        <div className="grid gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                {'Criado em: '}{createdAt}
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                {'\u00daltimo login: '}{lastSignIn}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Button variant="outline" onClick={() => navigate('/app/config?tab=security')}>
                                <Shield className="mr-2 h-4 w-4" />
                                Central de Seguran\u00e7a
                            </Button>
                            <Button variant="outline" onClick={() => navigate('/app/config/security-2fa')}>
                                <KeyRound className="mr-2 h-4 w-4" />
                                Gerenciar 2FA
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Prefer\u00eancias de Uso</CardTitle>
                    <CardDescription>{'Personalize idioma, moeda e calend\u00e1rio.'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Fuso hor\u00e1rio</Label>
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
                            <Label>In\u00edcio da semana</Label>
                            <Select value={prefs.week_start} onValueChange={(value) => setPrefs(prev => ({ ...prev, week_start: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monday">Segunda-feira</SelectItem>
                                    <SelectItem value="sunday">Domingo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button type="button" onClick={handleSavePreferences} disabled={loading || savingPrefs}>
                            {(loading || savingPrefs) && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Salvar prefer\u00eancias
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Sess\u00f5es Ativas</CardTitle>
                    <CardDescription>{'Dispositivos conectados \u00e0 sua conta.'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-background/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium text-foreground">Sess\u00e3o atual</p>
                                <p className="text-xs text-muted-foreground">Acesso recente</p>
                            </div>
                        </div>
                        <div className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded w-fit">Ativo</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProfileSettings;
