
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Loader2, Search, Mail, Phone, FileText, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const ClientesPage = () => {
    const { user } = useAuth();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const { toast } = useToast();

    // Form State
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

    const fetchClients = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('clients').select('*, orders(count)').eq('user_id', user.id);
        if(!error) setClients(data);
        setLoading(false);
    };

    useEffect(() => { if(user) fetchClients(); }, [user]);

    const handleSave = async (e) => {
        e.preventDefault();
        const payload = { ...formData, user_id: user.id };
        const { error } = editingClient 
            ? await supabase.from('clients').update(payload).eq('id', editingClient.id)
            : await supabase.from('clients').insert(payload);
        
        if(error) toast({ title: "Erro", description: error.message, variant: "destructive" });
        else {
            toast({ title: "Sucesso!" });
            setIsDialogOpen(false);
            fetchClients();
        }
    };

    const handleDelete = async (id) => {
        if(!confirm('Excluir cliente?')) return;
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if(!error) { toast({ title: "Cliente removido" }); fetchClients(); }
    };

    const openDialog = (client = null) => {
        setEditingClient(client);
        setFormData(client || { name: '', email: '', phone: '' });
        setIsDialogOpen(true);
    };

    const filtered = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <>
            <Helmet><title>Clientes — Serrallab</title></Helmet>
            <div className="w-full space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-heading font-bold">Clientes</h2>
                        <p className="text-muted-foreground">Base de contatos e histórico.</p>
                    </div>
                    <Button onClick={() => openDialog()} className="rounded-xl w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" /> Novo Cliente
                    </Button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar clientes..." 
                        className="pl-9 max-w-sm rounded-xl" 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(client => (
                            <Card key={client.id} className="rounded-xl hover:border-primary/50 transition-colors">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                            {client.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openDialog(client)} className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-lg mb-1 truncate">{client.name}</h3>
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        {client.email && <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> {client.email}</div>}
                                        {client.phone && <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> {client.phone}</div>}
                                        <div className="flex items-center gap-2 pt-2 border-t border-border mt-2">
                                            <FileText className="h-3 w-3 text-primary" /> 
                                            <span className="text-foreground font-medium">{client.orders?.[0]?.count || 0} Orçamentos</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="rounded-xl">
                        <DialogHeader>
                            <DialogTitle>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSave} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nome</Label>
                                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label>Telefone</Label>
                                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="rounded-xl" />
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

export default ClientesPage;
