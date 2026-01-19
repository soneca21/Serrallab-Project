
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Search, Truck, Mail, Phone, MoreVertical, Trash2, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { createAuditLog } from '@/features/audit/api/auditLog';

const FornecedoresPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [suppliers, setSuppliers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({});

    const openEditDialog = (supplier) => {
        setFormData(supplier);
        setIsDialogOpen(false);
        setTimeout(() => setIsDialogOpen(true), 0);
    };

    const handleDialogChange = (open) => {
        setIsDialogOpen(open);
        if (!open) {
            requestAnimationFrame(() => {
                document.body.style.pointerEvents = '';
                document.body.style.overflow = '';
            });
        }
    };

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
        const { data, error } = formData.id 
            ? await supabase.from('user_suppliers').update(payload).eq('id', formData.id).select().single()
            : await supabase.from('user_suppliers').insert(payload).select().single();
        
        if(!error) {
            toast({ title: "Salvo com sucesso" });
            setIsDialogOpen(false);
            // Re-fetch simplified
            const { data: refreshed } = await supabase.from('user_suppliers').select('*').eq('user_id', user.id);
            setSuppliers(refreshed || []);
            createAuditLog(
                'fornecedor',
                data?.id,
                formData.id ? 'update' : 'create',
                { name: data?.name, email: data?.email, phone: data?.phone }
            );
        }
    };

    const handleDelete = async (id) => {
        if(!confirm('Excluir?')) return;
        await supabase.from('user_suppliers').delete().eq('id', id);
        const removed = suppliers.find((supplier) => supplier.id === id);
        setSuppliers(prev => prev.filter(s => s.id !== id));
        createAuditLog(
            'fornecedor',
            id,
            'delete',
            { name: removed?.name || 'Fornecedor' }
        );
    };

    const filtered = suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <>
            <Helmet><title>Fornecedores - Serrallab</title></Helmet>
            <div className="w-full space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-heading font-bold">Fornecedores</h2>
                        <p className="text-muted-foreground">{'Gerencie seus parceiros de neg\u00f3cio.'}</p>
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
                                    <TableHead className="text-center">Empresa</TableHead>
                                    <TableHead className="text-center">Contato</TableHead>
                                    <TableHead className="text-center">Email</TableHead>
                                    <TableHead className="text-center">Telefone</TableHead>
                                    <TableHead className="text-center">{'A\u00e7\u00f5es'}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map(s => (
                                    <TableRow key={s.id} className="hover:bg-surface/50">
                                        <TableCell className="font-medium text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="p-2 rounded-lg bg-primary/10 text-primary"><Truck className="h-4 w-4" /></div>
                                                {s.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">{s.contact_name || '-'}</TableCell>
                                        <TableCell className="text-center">{s.email || '-'}</TableCell>
                                        <TableCell className="text-center">{s.phone || '-'}</TableCell>
                                        <TableCell className="text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl">
                                                    <DropdownMenuItem onSelect={() => openEditDialog(s)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleDelete(s.id)} className="text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                    <DialogContent className="rounded-xl">
                        <DialogHeader><DialogTitle>Fornecedor</DialogTitle></DialogHeader>
                        <form onSubmit={handleSave} className="space-y-4 py-4">
                            <div>
                                <Label>Nome da Empresa</Label>
                                <Input
                                    required
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Nome do Contato</Label>
                                    <Input
                                        value={formData.contact_name || ''}
                                        onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                                        className="rounded-xl"
                                    />
                                </div>
                                <div>
                                    <Label>CNPJ</Label>
                                    <Input
                                        value={formData.cnpj || ''}
                                        onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                                        className="rounded-xl"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="rounded-xl"
                                    />
                                </div>
                                <div>
                                    <Label>Telefone</Label>
                                    <Input
                                        value={formData.phone || ''}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="rounded-xl"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Site</Label>
                                    <Input
                                        value={formData.website || ''}
                                        onChange={e => setFormData({ ...formData, website: e.target.value })}
                                        className="rounded-xl"
                                    />
                                </div>
                                <div>
                                    <Label>{'Endere\u00e7o'}</Label>
                                    <Input
                                        value={formData.address || ''}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        className="rounded-xl"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>{'Observa\u00e7\u00f5es'}</Label>
                                <Textarea
                                    value={formData.notes || ''}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="rounded-xl min-h-[96px]"
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="rounded-xl w-full">Salvar</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
};

export default FornecedoresPage;

