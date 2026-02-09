import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Trash2, Loader2, BookCopy, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import CategorySelector from '@/components/CategorySelector';
import { supabase } from '@/lib/customSupabaseClient';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { isSystemAdmin } from '@/lib/roles';

const MaterialForm = ({ material, onSave, onCancel, categories, isLoading }) => {
    const defaultState = { name: '', category: '', unit: 'un', cost: '', length: '' };
    const [formData, setFormData] = useState(material || defaultState);

    useEffect(() => {
        setFormData(material || defaultState);
    }, [material]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            cost: parseFloat(formData.cost) || 0,
            length: formData.length ? parseFloat(formData.length) : null,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <div className="flex-1 space-y-6 overflow-y-auto p-1">
                <div>
                    <Label htmlFor="name">Nome do Material</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div>
                    <Label>Categoria</Label>
                    <CategorySelector
                        value={formData.category}
                        onChange={(value) => handleSelectChange('category', value)}
                        categories={categories}
                        placeholder="Selecione ou crie uma categoria"
                        emptyMessage="Nenhuma categoria encontrada."
                        createMessage="Criar nova categoria:"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label>Unidade</Label>
                        <Select value={formData.unit} onValueChange={(v) => handleSelectChange('unit', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="m">Metro (m)</SelectItem>
                                <SelectItem value="m2">Metro Quadrado (m²)</SelectItem>
                                <SelectItem value="kg">Quilograma (kg)</SelectItem>
                                <SelectItem value="un">Unidade (un)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="cost">Custo (R$)</Label>
                        <Input id="cost" name="cost" type="number" step="0.01" value={formData.cost} onChange={handleChange} required className="text-primary font-bold" />
                    </div>
                    <div>
                        <Label htmlFor="length">Comprimento (m)</Label>
                        <Input id="length" name="length" type="number" step="0.01" value={formData.length} onChange={handleChange} placeholder="Opcional" />
                    </div>
                </div>
            </div>
            <DialogFooter className="mt-6 pt-6 border-t border-surface-strong">
                <DialogClose asChild>
                    <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Material
                </Button>
            </DialogFooter>
        </form>
    );
};

const MaterialCard = ({ material, isAdmin, onEdit, onDelete }) => {
    return (
        <Card hasLeftBorder={false} className="hover:border-primary hover:shadow-[0_0_15px_rgba(218,105,11,0.15)] transition-all duration-200">
            <CardContent className="p-5">
                <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-foreground mb-1 truncate">{material.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{material.unit}{material.length ? ` - ${material.length}m` : ''}</p>
                        <p className="text-lg font-bold text-primary drop-shadow-[0_0_5px_rgba(218,105,11,0.3)]">R$ {Number(material.cost).toFixed(2)}</p>
                    </div>
                    {isAdmin && (
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => onEdit(material)} className="hover:text-primary">
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => onDelete(material.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

const GlobalCatalogPage = () => {
    const { profile, user } = useAuth();
    const { viewMode } = useViewMode();
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formIsLoading, setFormIsLoading] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const { toast } = useToast();
    const isAdmin = isSystemAdmin(profile, user) && viewMode === 'admin';

    const fetchMaterials = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('global_materials')
            .select('*')
            .order('category', { ascending: true })
            .order('name', { ascending: true });

        if (error) {
            toast({ title: 'Erro ao buscar catálogo', description: error.message, variant: 'destructive' });
        } else {
            setMaterials(data);
        }
        setLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchMaterials();
    }, [fetchMaterials]);

    const { categories, filteredMaterials } = useMemo(() => {
        const search = searchTerm.toLowerCase();
        const cats = ['all', ...Array.from(new Set(materials.map(m => m.category || 'Sem Categoria'))).sort()];
        const filtered = materials.filter((material) => {
            const category = material.category || 'Sem Categoria';
            const matchesCategory = selectedCategory === 'all' || category === selectedCategory;
            const matchesSearch = material.name.toLowerCase().includes(search);
            return matchesCategory && matchesSearch;
        });
        return { categories: cats, filteredMaterials: filtered };
    }, [materials, selectedCategory, searchTerm]);

    const handleSaveMaterial = async (materialData) => {
        setFormIsLoading(true);
        const { id, ...payload } = materialData;
        
        let error;
        if (id) {
            ({ error } = await supabase.from('global_materials').update(payload).eq('id', id));
        } else {
            ({ error } = await supabase.from('global_materials').insert(payload));
        }

        if (error) {
            toast({ title: 'Erro ao salvar material', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Sucesso!', description: `Material ${id ? 'atualizado' : 'adicionado'}.` });
            await fetchMaterials();
            setIsDialogOpen(false);
        }
        setFormIsLoading(false);
    };

    const handleOpenDialog = (material = null) => {
        setSelectedMaterial(material);
        setIsDialogOpen(true);
    }

    const handleDelete = async (materialId) => {
        const { error } = await supabase.from('global_materials').delete().eq('id', materialId);
        if (error) {
            toast({ title: 'Erro ao remover material', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Material removido.', variant: 'default' });
            fetchMaterials();
        }
    };

    return (
        <>
            <Helmet><title>{'Catálogo Global - Serrallab'}</title></Helmet>
            <div className="w-full space-y-6">
                <div className="space-y-2"><div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-start gap-3">
                        <BookCopy className="text-primary h-6 w-6 mt-1" />
                        <div>
                            <h2 className="text-3xl font-heading font-bold">{'Catálogo Global de Materiais'}</h2>
                            <p className="text-muted-foreground">{'Base de insumos compartilhada entre todos os usuários.'}</p>
                        </div>
                    </div>
                    {isAdmin && (
                        <Button onClick={() => handleOpenDialog()} className="rounded-xl w-full sm:w-auto">
                            <PlusCircle className="mr-2 h-4 w-4" /> Novo Material
                        </Button>
                    )}
                </div><div className="h-px bg-border mb-4" /></div>

                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar..."
                        className="pl-9 rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <Card className="rounded-xl border-surface-strong">
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                        ) : (
                            <div className="flex flex-col md:flex-row gap-6">
                                <aside className="w-full md:w-1/4 lg:w-1/5 mt-4">
                                    <h3 className="font-semibold mb-2 px-2 text-primary border-b border-primary/20 pb-1">Categorias</h3>
                                    <div className="space-y-1">
                                        {categories.map(cat => (
                                            <Button
                                                key={cat}
                                                variant="ghost"
                                                onClick={() => setSelectedCategory(cat)}
                                                className={cn(
                                                    "w-full justify-start text-left h-auto py-2 px-2 whitespace-normal rounded-r-none border-l-2",
                                                    selectedCategory === cat ? "bg-primary/10 text-primary border-primary" : "text-muted-foreground border-transparent hover:text-primary"
                                                )}
                                            >
                                                {cat === 'all' ? 'Todas as Categorias' : cat}
                                            </Button>
                                        ))}
                                    </div>
                                </aside>
                                <main className="flex-1">
                                    {filteredMaterials.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
                                            {filteredMaterials.map(material => (
                                                <MaterialCard
                                                    key={material.id}
                                                    material={material}
                                                    isAdmin={isAdmin}
                                                    onEdit={handleOpenDialog}
                                                    onDelete={handleDelete}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground p-10 border-2 border-dashed border-surface-strong rounded-xl">
                                            <p>{'Nenhum material neste catálogo.'}</p>
                                        </div>
                                    )}
                                </main>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {isAdmin && (
                 <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selectedMaterial ? 'Editar Material Global' : 'Novo Material Global'}</DialogTitle>
                        </DialogHeader>
                        <MaterialForm
                            material={selectedMaterial}
                            onSave={handleSaveMaterial}
                            onCancel={() => setIsDialogOpen(false)}
                            categories={categories.filter(c => c !== 'all' && c !== 'Sem Categoria')}
                            isLoading={formIsLoading}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};

export default GlobalCatalogPage;



