
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Search, Truck, Mail, Phone, MoreVertical, Trash2, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const FornecedoresPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [suppliers, setSuppliers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        const fetch = async () => {
            if(!user) return;
            const { data } = await supabase.from('user_suppliers').select('*').eq('user_id', user.id);
            setSuppliers(data || []);
        };
        fetch();
    }, [user]);

    const handleSave = async (e) => {
        e.preventDefault();
        const payload = { ...formData, user_id: user.id };
        const { error } = formData.id 
            ? await supabase.from('user_suppliers').update(payload).eq('id', formData.id)
            : await supabase.from('user_suppliers').insert(payload);
        
        if(!error) {
            toast({ title: "Salvo com sucesso" });
            setIsDialogOpen(false);
            // Re-fetch simplified
            const { data } = await supabase.from('user_suppliers').select('*').eq('user_id', user.id);
            setSuppliers(data || []);
        }
    };

    const handleDelete = async (id) => {
        if(!confirm('Excluir?')) return;
        await supabase.from('user_suppliers').delete().eq('id', id);
        setSuppliers(prev => prev.filter(s => s.id !== id));
    };

    const filtered = suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <>
            <Helmet><title>Fornecedores — Serrallab</title></Helmet>
            <div className="w-full space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-heading font-bold">Fornecedores</h2>
                        <p className="text-muted-foreground">Gerencie seus parceiros de negócio.</p>
                    </div>
                    <Button onClick={() => { setFormData({}); setIsDialogOpen(true); }} className="rounded-xl w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" /> Novo Fornecedor
                    </Button>
                </div>

                <Card className="rounded-xl border-surface-strong">
                    <CardContent className="p-0">
                        <div className="p-4 border-b border-border/50">
                             <div className="relative max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Buscar..." 
                                    className="pl-9 rounded-xl" 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-6">Empresa</TableHead>
                                    <TableHead>Contato</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Telefone</TableHead>
                                    <TableHead className="text-right pr-6">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map(s => (
                                    <TableRow key={s.id} className="hover:bg-surface/50">
                                        <TableCell className="pl-6 font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-primary/10 text-primary"><Truck className="h-4 w-4" /></div>
                                                {s.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{s.contact_name || '-'}</TableCell>
                                        <TableCell>{s.email || '-'}</TableCell>
                                        <TableCell>{s.phone || '-'}</TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl">
                                                    <DropdownMenuItem onClick={() => { setFormData(s); setIsDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(s.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="rounded-xl">
                        <DialogHeader><DialogTitle>Fornecedor</DialogTitle></DialogHeader>
                        <form onSubmit={handleSave} className="space-y-4 py-4">
                            <div><Label>Nome da Empresa</Label><Input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="rounded-xl" /></div>
                            <div><Label>Nome Contato</Label><Input value={formData.contact_name || ''} onChange={e => setFormData({...formData, contact_name: e.target.value})} className="rounded-xl" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>Email</Label><Input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="rounded-xl" /></div>
                                <div><Label>Telefone</Label><Input value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="rounded-xl" /></div>
                            </div>
                            <DialogFooter><Button type="submit" className="rounded-xl w-full">Salvar</Button></DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
};

export default FornecedoresPage;
