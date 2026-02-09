import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Wrench, Trash2, Edit, Download, Loader2, Disc, Ruler, Layers, Box, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import AppSectionHeader from '@/components/AppSectionHeader';

const materialIconMatchers = [
    { keywords: ['disco', 'abrasivo'], icon: Disc },
    { keywords: ['barra', 'vergalhao'], icon: Ruler },
    { keywords: ['chapa', 'telha', 'perfil', 'trelica'], icon: Layers },
    { keywords: ['tubo', 'metalon', 'cantoneira'], icon: Box },
    { keywords: ['eletrodo', 'solda'], icon: Zap },
];

const getMaterialIcon = (material) => {
    const base = `${material?.name || ''} ${material?.category || ''}`;
    const normalized = base.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const match = materialIconMatchers.find(({ keywords }) =>
        keywords.some((keyword) => normalized.includes(keyword))
    );
    return match?.icon || Wrench;
};

const MateriaisPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [formData, setFormData] = useState({ name: '', cost: '', unit: 'un', category: 'Geral' });
    const [editingId, setEditingId] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');

    const fetchMaterials = async () => {
        setLoading(true);
        const { data } = await supabase.from('user_materials').select('*').eq('user_id', user.id);
        setMaterials(data || []);
        setLoading(false);
    };

    useEffect(() => { if(user) fetchMaterials(); }, [user]);

    const handleSave = async (e) => {
        e.preventDefault();
        const payload = { ...formData, user_id: user.id };
        const { error } = editingId 
            ? await supabase.from('user_materials').update(payload).eq('id', editingId)
            : await supabase.from('user_materials').insert(payload);
        
        if(error) toast({ title: 'Erro', variant: 'destructive' });
        else {
            setIsDialogOpen(false);
            fetchMaterials();
            toast({ title: 'Material salvo!' });
        }
    };

    const handleDelete = async (id) => {
        if(!confirm('Excluir?')) return;
        await supabase.from('user_materials').delete().eq('id', id);
        fetchMaterials();
    };

    const openDialog = (m = null) => {
        setEditingId(m?.id || null);
        setFormData(m || { name: '', cost: '', unit: 'un', category: 'Geral' });
        setIsDialogOpen(true);
    };

    const handleImportGlobalCatalog = async () => {
        if (!user) return;
        setIsImporting(true);
        try {
            const [globalResult, userResult] = await Promise.all([
                supabase.from('global_materials').select('name, category, unit, cost, length'),
                supabase.from('user_materials').select('name, category, unit').eq('user_id', user.id),
            ]);

            if (globalResult.error || userResult.error) {
                throw new Error(globalResult.error?.message || userResult.error?.message || 'Erro ao buscar materiais.');
            }

            const existing = new Set(
                (userResult.data || []).map((item) => `${item.name}||${item.category || ''}||${item.unit || ''}`)
            );

            const payload = (globalResult.data || [])
                .filter((item) => !existing.has(`${item.name}||${item.category || ''}||${item.unit || ''}`))
                .map((item) => ({
                    user_id: user.id,
                    name: item.name,
                    category: item.category || 'Geral',
                    unit: item.unit || 'un',
                    cost: item.cost,
                    length: item.length ?? null,
                }));

            if (!payload.length) {
                toast({ title: 'Nenhum material novo', description: 'Seu catálogo já está atualizado.' });
                return;
            }

            const { error: insertError } = await supabase.from('user_materials').insert(payload);
            if (insertError) throw insertError;

            toast({ title: 'Catálogo importado', description: `${payload.length} materiais adicionados.` });
            fetchMaterials();
        } catch (error) {
            toast({ title: 'Erro ao importar', description: error.message, variant: 'destructive' });
        } finally {
            setIsImporting(false);
        }
    };

    const { categories, filtered } = useMemo(() => {
        const search = searchTerm.toLowerCase();
        const categoryList = ['all', ...Array.from(new Set(materials.map((m) => m.category || 'Sem Categoria'))).sort()];
        const filteredList = materials.filter((m) => {
            const category = m.category || 'Sem Categoria';
            const matchesSearch = m.name.toLowerCase().includes(search);
            const matchesCategory = selectedCategory === 'all' || category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
        return { categories: categoryList, filtered: filteredList };
    }, [materials, searchTerm, selectedCategory]);

    return (
        <>
            <Helmet><title>{'Materiais - Serrallab'}</title></Helmet>
            <div className="w-full space-y-6">
                <AppSectionHeader
                    title="Materiais"
                    description="Catálogo de insumos e preços para usar nos orçamentos."
                    actions={
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            <Button
                                variant="secondary"
                                onClick={handleImportGlobalCatalog}
                                className="rounded-xl w-full sm:w-auto"
                                disabled={isImporting}
                            >
                                {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                Importar Catálogo Global
                            </Button>
                            <Button onClick={() => openDialog()} className="rounded-xl w-full sm:w-auto">
                                <PlusCircle className="mr-2 h-4 w-4" /> Novo Material
                            </Button>
                        </div>
                    }
                />

                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar..." className="pl-9 rounded-xl" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>

                <Card className="rounded-xl border-surface-strong">
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="flex flex-col md:flex-row gap-6">
                                <aside className="w-full md:w-1/4 lg:w-1/5 mt-4">
                                    <h3 className="font-semibold mb-2 px-2 text-primary border-b border-primary/20 pb-1">Categorias</h3>
                                    <div className="space-y-1">
                                        {categories.map((cat) => (
                                            <Button
                                                key={cat}
                                                variant="ghost"
                                                onClick={() => setSelectedCategory(cat)}
                                                className={cn(
                                                    "w-full justify-start text-left h-auto py-2 px-2 whitespace-normal rounded-r-none border-l-2",
                                                    selectedCategory === cat
                                                        ? "bg-primary/10 text-primary border-primary"
                                                        : "text-muted-foreground border-transparent hover:text-primary"
                                                )}
                                            >
                                                {cat === 'all' ? 'Todas as Categorias' : cat}
                                            </Button>
                                        ))}
                                    </div>
                                </aside>
                                <main className="flex-1">
                                    {filtered.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
                                            {filtered.map(item => {
                                                const Icon = getMaterialIcon(item);
                                                return (
                                                    <Card key={item.id} className="rounded-xl hover:shadow-lg transition-all border-surface-strong">
                                                        <CardContent className="p-5">
                                                            <div className="flex justify-between items-start">
                                                                <div className="p-2 bg-primary/10 rounded-lg text-primary mb-3">
                                                                    <Icon className="h-5 w-5" />
                                                                </div>
                                                                <div className="flex">
                                                                    <Button variant="ghost" size="icon" onClick={() => openDialog(item)} className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                                                </div>
                                                            </div>
                                                            <h4 className="font-bold text-foreground mb-1">{item.name}</h4>
                                                            <div className="flex justify-between items-end mt-4">
                                                                <span className="text-sm text-muted-foreground px-2 py-1 rounded-md bg-surface">{item.category || 'Sem Categoria'}</span>
                                                                <div className="text-right">
                                                                    <span className="text-xs text-muted-foreground">{'por '}{item.unit}</span>
                                                                    <p className="text-lg font-bold text-primary">R$ {Number(item.cost).toFixed(2)}</p>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground p-10 border-2 border-dashed border-surface-strong rounded-xl">
                                            <p>{'Nenhum material encontrado.'}</p>
                                        </div>
                                    )}
                                </main>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="rounded-xl">
                        <DialogHeader><DialogTitle>{editingId ? 'Editar' : 'Novo'} Material</DialogTitle></DialogHeader>
                        <form onSubmit={handleSave} className="space-y-4 py-4">
                            <div><Label>Nome</Label><Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="rounded-xl" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>Custo (R$)</Label><Input type="number" step="0.01" required value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} className="rounded-xl" /></div>
                                <div><Label>Unidade</Label><Input value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="rounded-xl" /></div>
                            </div>
                            <div><Label>Categoria</Label><Input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="rounded-xl" /></div>
                            <DialogFooter><Button type="submit" className="rounded-xl w-full">Salvar</Button></DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
};

export default MateriaisPage;
