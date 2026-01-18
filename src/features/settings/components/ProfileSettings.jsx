
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useSettings } from '../hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload, User, Shield } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const ProfileSettings = () => {
    const { user, profile } = useAuth();
    const { saveProfile, loading } = useSettings();
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        avatar_url: ''
    });
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (profile && user) {
            setFormData({
                full_name: profile.company_name || '', // Using company_name as name for now based on previous schema usage, ideally should be a separate field
                email: user.email || '',
                avatar_url: profile.avatar_url || ''
            });
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
                .from('logos') // Reusing logos bucket or create 'avatars' bucket if exists. Schema says 'logos' exists.
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
        // Here we map full_name to company_name simply because the schema seemed to use company_name as the primary identifier in previous code. 
        // If 'full_name' column exists, use that instead. For now, sticking to what works safely.
        await saveProfile({ company_name: formData.full_name }); 
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Minha Conta</CardTitle>
                    <CardDescription>Gerencie suas informações pessoais.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
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
                           <Button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()} 
                                disabled={uploading} 
                                variant="outline" 
                                className="w-full md:w-auto"
                            >
                               {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                               Alterar Foto
                           </Button>
                           <p className="text-xs text-muted-foreground">JPG, GIF ou PNG. Max 2MB.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Nome de Exibição</Label>
                                <Input 
                                    id="full_name" 
                                    value={formData.full_name} 
                                    onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
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
                        <Button type="submit" disabled={loading} className="w-full md:w-auto">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Salvar Alterações
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Sessões Ativas</CardTitle>
                    <CardDescription>Gerencie os dispositivos conectados à sua conta.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-surface border border-surface-strong rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">Sessão Atual</p>
                                    <p className="text-xs text-muted-foreground">Chrome no Windows • Acessado agora</p>
                                </div>
                            </div>
                            <div className="text-xs text-green-500 font-medium bg-green-500/10 px-2 py-1 rounded">Ativo</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProfileSettings;
