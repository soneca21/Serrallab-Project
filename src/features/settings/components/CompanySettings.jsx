
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useSettings } from '../hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Building, MapPin, Globe, Phone, Upload } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const CompanySettings = () => {
    const { user, profile } = useAuth();
    const { saveCompany, loading } = useSettings();
    const { toast } = useToast();
    const [company, setCompany] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        logo_url: ''
    });
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        const fetchCompany = async () => {
            if (!profile?.company_id) {
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
            } catch (error) {
                console.error("Error fetching company:", error);
                // Fallback to profile data if company table fetch fails or is empty (migration scenario)
                setFormData({
                    name: profile.company_name || '',
                    phone: profile.company_phone || '',
                    email: profile.email || '',
                    address: profile.company_address || '',
                    logo_url: profile.logo_url || ''
                });
            } finally {
                setFetching(false);
            }
        };

        if (profile) fetchCompany();
    }, [profile]);

    const handleLogoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `company-${profile.company_id || user.id}-${Date.now()}.${fileExt}`;
            const filePath = `logos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('logos')
                .getPublicUrl(filePath);

            if (company) {
                await saveCompany(company.id, { logo_url: publicUrl });
            }
            setFormData(prev => ({ ...prev, logo_url: publicUrl }));
            
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro no upload', description: error.message });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (company) {
            await saveCompany(company.id, formData);
        } else {
            toast({ variant: 'destructive', title: 'Erro', description: 'ID da empresa não encontrado. Contate o suporte.' });
        }
    };

    if (fetching) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5 text-primary" /> Organização</CardTitle>
                <CardDescription>Informações da sua empresa exibidas nos orçamentos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-6 p-4 bg-surface border border-surface-strong rounded-lg">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
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
                            accept="image/*" 
                            onChange={handleLogoUpload}
                        />
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
                        <p className="text-xs text-muted-foreground">Isso aparecerá no topo dos seus orçamentos PDF.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 col-span-2 md:col-span-1">
                        <Label htmlFor="company_name">Nome da Empresa</Label>
                        <Input 
                            id="company_name" 
                            value={formData.name} 
                            onChange={(e) => setFormData({...formData, name: e.target.value})} 
                            placeholder="Ex: Serralheria Silva"
                        />
                    </div>
                    <div className="space-y-2 col-span-2 md:col-span-1">
                        <Label htmlFor="company_phone">Telefone Comercial</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                id="company_phone" 
                                className="pl-9"
                                value={formData.phone} 
                                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                    </div>
                    <div className="space-y-2 col-span-2 md:col-span-1">
                        <Label htmlFor="company_email">Email Comercial</Label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                id="company_email" 
                                className="pl-9"
                                value={formData.email} 
                                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                                placeholder="contato@empresa.com"
                            />
                        </div>
                    </div>
                    <div className="space-y-2 col-span-2">
                        <Label htmlFor="company_address">Endereço Completo</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                id="company_address" 
                                className="pl-9"
                                value={formData.address} 
                                onChange={(e) => setFormData({...formData, address: e.target.value})} 
                                placeholder="Rua Exemplo, 123, Bairro, Cidade - UF"
                            />
                        </div>
                    </div>
                    <div className="col-span-2 pt-4">
                        <Button type="submit" disabled={loading} className="w-full md:w-auto">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Salvar Dados da Empresa
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default CompanySettings;
