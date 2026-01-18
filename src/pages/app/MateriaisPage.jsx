
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Wrench, Trash2, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const MateriaisPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', cost: '', unit: 'un', category: 'Geral' });
    const [editingId, setEditingId] = useState(null);

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
        
        if(error) toast({ title: "Erro", variant: "destructive" });
        else {
            setIsDialogOpen(false);
            fetchMaterials();
            toast({ title: "Material salvo!" });
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

    const filtered = materials.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <>
            <Helmet><title>Materiais — Serrallab</title></Helmet>
            <div className="w-full space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-heading font-bold">Materiais</h2>
                        <p className="text-muted-foreground">Catálogo de insumos e preços.</p>
                    </div>
                    <Button onClick={() => openDialog()} className="rounded-xl w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" /> Novo Material
                    </Button>
                </div>

                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar..." className="pl-9 rounded-xl" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filtered.map(item => (
                        <Card key={item.id} className="rounded-xl hover:shadow-lg transition-all border-surface-strong">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary mb-3">
                                        <Wrench className="h-5 w-5" />
                                    </div>
                                    <div className="flex">
                                        <Button variant="ghost" size="icon" onClick={() => openDialog(item)} className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                                <h4 className="font-bold text-foreground mb-1">{item.name}</h4>
                                <div className="flex justify-between items-end mt-4">
                                    <span className="text-sm text-muted-foreground px-2 py-1 rounded-md bg-surface">{item.category}</span>
                                    <div className="text-right">
                                        <span className="text-xs text-muted-foreground">por {item.unit}</span>
                                        <p className="text-lg font-bold text-primary">R$ {Number(item.cost).toFixed(2)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

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
