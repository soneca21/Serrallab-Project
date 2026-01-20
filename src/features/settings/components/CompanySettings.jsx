import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useSettings } from '../hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Building, MapPin, Globe, Phone, Upload, Mail, Link, BadgeCheck, AlertTriangle, Hash, Clock, FileText } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const CompanySettings = () => {
    const { user, profile } = useAuth();
    const { saveCompany, saveProfile, savePreferences, loading } = useSettings();
    const { toast } = useToast();
    const [company, setCompany] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        logo_url: ''
    });
    const [orgPrefs, setOrgPrefs] = useState({
        org_trade_name: '',
        org_tax_id: '',
        org_website: '',
        org_whatsapp: '',
        org_support_email: '',
        org_hours_weekdays: '08:00-18:00',
        org_hours_weekend: '',
        org_invoice_footer: ''
    });
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [fetching, setFetching] = useState(true);
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
            throw new Error('Formato inválido. Use PNG, JPG, GIF ou WEBP.');
        }
        if (file.size > maxImageSizeBytes) {
            throw new Error('O arquivo deve ter no máximo 2MB.');
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
            throw new Error('Não foi possível gerar a URL da imagem.');
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
        const fetchCompany = async () => {
            if (!profile) {
                setFetching(false);
                return;
            }

            if (!profile.company_id) {
                setFormData({
                    name: profile.company_name || '',
                    phone: profile.company_phone || '',
                    email: profile.email || '',
                    address: profile.company_address || '',
                    logo_url: profile.logo_url || ''
                });
                if (profile.preferences) {
                    setOrgPrefs(prev => ({ ...prev, ...profile.preferences }));
                }
                setFetching(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('id', profile.company_id)
                    .single();

                if (error) throw error;
                setCompany(data);
                setFormData({
                    name: data.name || '',
                    phone: data.phone || '',
                    email: data.email || '',
                    address: data.address || '',
                    logo_url: data.logo_url || ''
                });
                if (profile.preferences) {
                    setOrgPrefs(prev => ({ ...prev, ...profile.preferences }));
                }
            } catch (error) {
                console.error("Error fetching company:", error);
                setFormData({
                    name: profile.company_name || '',
                    phone: profile.company_phone || '',
                    email: profile.email || '',
                    address: profile.company_address || '',
                    logo_url: profile.logo_url || ''
                });
                if (profile.preferences) {
                    setOrgPrefs(prev => ({ ...prev, ...profile.preferences }));
                }
            } finally {
                setFetching(false);
            }
        };

        fetchCompany();
    }, [profile]);

    const handleLogoUpload = async (event) => {
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
                bucket: 'logos',
                fallbackBucket: 'avatars',
                pathPrefix: 'logos',
                fileBase: `logo-${profile?.company_id || user.id}-${Date.now()}`
            });

            if (company) {
                await saveCompany(company.id, { logo_url: publicUrl });
            } else {
                await saveProfile({ logo_url: publicUrl });
            }
            setFormData(prev => ({ ...prev, logo_url: publicUrl }));
            toast({ title: 'Logo atualizado', description: 'O logo da empresa foi enviado.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro no upload', description: error.message });
        } finally {
            setUploading(false);
            resetFileInput();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const companyPayload = {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            logo_url: formData.logo_url
        };

        if (company?.id) {
            await saveCompany(company.id, companyPayload);
        } else {
            await saveProfile({
                company_name: formData.name,
                company_phone: formData.phone,
                company_address: formData.address,
                logo_url: formData.logo_url
            });
        }

        const nextPrefs = {
            ...(profile?.preferences || {}),
            ...orgPrefs,
            org_email: formData.email
        };
        await savePreferences(nextPrefs);

        if (!company?.id && !profile?.company_id) {
            toast({
                title: 'Organização atualizada',
                description: 'Alguns dados foram salvos no perfil. Para vincular uma empresa completa, fale com o suporte.'
            });
        }
    };

    if (fetching) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5 text-primary" /> Organização</CardTitle>
                        <CardDescription>Dados que aparecem nos orçamentos, PDFs e páginas públicas.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col gap-6 md:flex-row md:items-center p-4 bg-surface border border-surface-strong rounded-lg">
                            <div className="relative group cursor-pointer w-fit" onClick={() => fileInputRef.current?.click()}>
                                <img 
                                    src={formData.logo_url || `https://ui-avatars.com/api/?name=${formData.name || 'C'}&background=2d3748&color=f7941d&size=128`} 
                                    alt="Logo da Empresa" 
                                    className="w-24 h-24 rounded-lg object-contain bg-white border-2 border-surface-strong p-1" 
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Upload className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="space-y-2 flex-1">
                                <Label>Logo da Empresa</Label>
                                <Input 
                                    ref={fileInputRef}
                                    type="file" 
                                    className="hidden" 
                                    accept="image/png,image/jpeg,image/gif,image/webp"
                                    onChange={handleLogoUpload}
                                />
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <Button 
                                        type="button" 
                                        onClick={() => fileInputRef.current?.click()} 
                                        disabled={uploading} 
                                        variant="outline" 
                                        size="sm"
                                    >
                                        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                                        Carregar Logo
                                    </Button>
                                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF ou WEBP. Máx 2MB.</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="company_name">Nome da Empresa</Label>
                                    <Input 
                                        id="company_name" 
                                        value={formData.name} 
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                                        placeholder="Ex: Serralheria Silva"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="trade_name">Nome Fantasia</Label>
                                    <Input
                                        id="trade_name"
                                        value={orgPrefs.org_trade_name}
                                        onChange={(e) => setOrgPrefs({ ...orgPrefs, org_trade_name: e.target.value })}
                                        placeholder="Ex: Serrallab"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="company_email">Email Comercial</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            id="company_email" 
                                            className="pl-9"
                                            value={formData.email} 
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                                            placeholder="contato@empresa.com"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="company_phone">Telefone Comercial</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            id="company_phone" 
                                            className="pl-9"
                                            value={formData.phone} 
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="company_whatsapp">WhatsApp Comercial</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            id="company_whatsapp" 
                                            className="pl-9"
                                            value={orgPrefs.org_whatsapp}
                                            onChange={(e) => setOrgPrefs({ ...orgPrefs, org_whatsapp: e.target.value })}
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="company_website">Site</Label>
                                    <div className="relative">
                                        <Link className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            id="company_website" 
                                            className="pl-9"
                                            value={orgPrefs.org_website}
                                            onChange={(e) => setOrgPrefs({ ...orgPrefs, org_website: e.target.value })}
                                            placeholder="https://www.suaempresa.com"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="company_address">Endereço Completo</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            id="company_address" 
                                            className="pl-9"
                                            value={formData.address} 
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                                            placeholder="Rua Exemplo, 123, Bairro, Cidade - UF"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 rounded-xl border border-border/40 bg-background/30 p-4">
                                <p className="text-sm font-medium text-foreground">Dados fiscais e assinatura</p>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="company_tax_id">CNPJ ou CPF</Label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="company_tax_id"
                                                className="pl-9"
                                                value={orgPrefs.org_tax_id}
                                                onChange={(e) => setOrgPrefs({ ...orgPrefs, org_tax_id: e.target.value })}
                                                placeholder="00.000.000/0000-00"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="company_support_email">Email de suporte</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="company_support_email"
                                                className="pl-9"
                                                value={orgPrefs.org_support_email}
                                                onChange={(e) => setOrgPrefs({ ...orgPrefs, org_support_email: e.target.value })}
                                                placeholder="suporte@empresa.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="invoice_footer">Assinatura para propostas</Label>
                                    <Textarea
                                        id="invoice_footer"
                                        value={orgPrefs.org_invoice_footer}
                                        onChange={(e) => setOrgPrefs({ ...orgPrefs, org_invoice_footer: e.target.value })}
                                        placeholder="Ex: Atenciosamente, Equipe Serrallab"
                                        className="min-h-[96px]"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 rounded-xl border border-border/40 bg-background/30 p-4">
                                <p className="text-sm font-medium text-foreground">Horario de atendimento</p>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="hours_weekdays">Segunda a sexta</Label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="hours_weekdays"
                                                className="pl-9"
                                                value={orgPrefs.org_hours_weekdays}
                                                onChange={(e) => setOrgPrefs({ ...orgPrefs, org_hours_weekdays: e.target.value })}
                                                placeholder="08:00-18:00"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="hours_weekend">Sabado e domingo</Label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="hours_weekend"
                                                className="pl-9"
                                                value={orgPrefs.org_hours_weekend}
                                                onChange={(e) => setOrgPrefs({ ...orgPrefs, org_hours_weekend: e.target.value })}
                                                placeholder="Fechado ou 09:00-13:00"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <FileText className="h-4 w-4 text-primary" />
                                    Os dados acima alimentam PDFs, mensagens e páginas públicas.
                                </div>
                                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Salvar Organização
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-primary" /> Resumo</CardTitle>
                        <CardDescription>Checklist rápido da organização.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3 rounded-xl border border-border/40 bg-background/30 p-4">
                            <div className="flex items-center gap-2 text-sm text-foreground">
                                <Building className="h-4 w-4 text-primary" />
                                {formData.name || 'Nome da empresa não definido'}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Globe className="h-4 w-4 text-primary" />
                                {orgPrefs.org_website || 'Site não informado'}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-4 w-4 text-primary" />
                                {formData.phone || 'Telefone não informado'}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4 text-primary" />
                                {formData.email || 'Email não informado'}
                            </div>
                        </div>

                        {!profile?.company_id && !company?.id && (
                            <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-200">
                                <AlertTriangle className="h-4 w-4" />
                                Organização sem vínculo de empresa. Salve os dados e, se precisar, solicite ao suporte a vinculação completa.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CompanySettings;
