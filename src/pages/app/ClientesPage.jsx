
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Loader2, Search, Mail, Phone, FileText, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import AppSectionHeader from '@/components/AppSectionHeader';
import { createAuditLog } from '@/features/audit/api/auditLog';

const brazilStates = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

const defaultClientFormState = {
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    city: '',
    state: '',
    contact_preference: 'email',
    notes: '',
};

const contactPreferences = [
    { value: 'email', label: 'Email', helper: 'Usamos o email para mensagens e documentos.' },
    { value: 'phone', label: 'Telefone', helper: 'Ligamos durante o horário comercial.' },
    { value: 'whatsapp', label: 'WhatsApp', helper: 'Preferência para links e respostas rápidas.' },
    { value: 'both', label: 'Email e telefone', helper: 'Entramos por ambos conforme a situação.' },
];

const validateEmail = (value) => /^\S+@\S+\.\S+$/.test(value);
const validatePhone = (value) => /^\d{8,15}$/.test(value.replace(/\D/g, ''));

const ClientesPage = () => {
    const { user } = useAuth();
    const [clients, setClients] = useState([]);
    const [clientOrderCounts, setClientOrderCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const { toast } = useToast();

    // Form State
    const [formData, setFormData] = useState(() => ({ ...defaultClientFormState }));
    const [formErrors, setFormErrors] = useState({});

    const fetchClients = async () => {
        setLoading(true);
        try {
            const { data: clientData, error } = await supabase
                .from('clients')
                .select('*')
                .eq('user_id', user.id);

            if (!error) {
                setClients(clientData || []);
            } else {
                toast({ title: 'Erro', description: error.message, variant: 'destructive' });
            }

            const { data: ordersData } = await supabase
                .from('orders')
                .select('client_id')
                .eq('user_id', user.id);

            if (ordersData) {
                setClientOrderCounts(
                    ordersData.reduce((acc, entry) => {
                        acc[entry.client_id] = (acc[entry.client_id] || 0) + 1;
                        return acc;
                    }, {})
                );
            }
        } catch (catchError) {
            toast({ title: 'Erro', description: catchError.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if(user) fetchClients(); }, [user]);

    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = 'Informe o nome do cliente.';
        if (!validateEmail(formData.email)) errors.email = 'Informe um email válido.';
        if (!formData.phone || !validatePhone(formData.phone)) errors.phone = 'Informe um celular ou telefone com 8 a 15 dígitos.';
        if (!formData.state) errors.state = 'Selecione um estado.';
        return errors;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        if (Object.keys(errors).length) {
            setFormErrors(errors);
            toast({ title: 'Erro', description: 'Preencha os campos obrigatórios corretamente.', variant: 'destructive' });
            return;
        }

        setFormErrors({});
        const payload = { ...formData, user_id: user.id };
        const { data, error } = editingClient
            ? await supabase.from('clients').update(payload).eq('id', editingClient.id).select().single()
            : await supabase.from('clients').insert(payload).select().single();

        if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
        else {
            toast({ title: "Sucesso!" });
            setIsDialogOpen(false);
            fetchClients();
            createAuditLog(
                'cliente',
                data?.id,
                editingClient ? 'update' : 'create',
                {
                    name: data?.name,
                    email: data?.email,
                    phone: data?.phone,
                }
            );
        }
    };

    const handleDelete = async (id) => {
        if(!confirm('Excluir cliente?')) return;
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if(!error) {
            const clientToRemove = clients.find((client) => client.id === id);
            toast({ title: "Cliente removido" });
            fetchClients();
            createAuditLog(
                'cliente',
                id,
                'delete',
                { name: clientToRemove?.name || 'Cliente' }
            );
        }
    };

    const openDialog = (client = null) => {
        setEditingClient(client);
        const payload = client ? { ...defaultClientFormState, ...client } : { ...defaultClientFormState };
        setFormData(payload);
        setFormErrors({});
        setIsDialogOpen(true);
    };

    const filtered = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const selectedContactPreference = contactPreferences.find(pref => pref.value === formData.contact_preference);

    return (
        <>
            <Helmet><title>Clientes — Serrallab</title></Helmet>
            <div className="w-full space-y-6">
                <div className="space-y-6 px-0 max-w-full">
                    <AppSectionHeader
                        title="Clientes"
                        description="Guarde nomes, contatos e histórico em um espaço organizado."
                        actions={
                            <Button onClick={() => openDialog()} className="rounded-xl w-full sm:w-auto">
                                <PlusCircle className="mr-2 h-4 w-4" /> Novo Cliente
                            </Button>
                        }
                    />

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar clientes..."
                            className="pl-9 max-w-sm rounded-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                            {filtered.map((client) => (
                                <Card key={client.id} className="rounded-xl hover:border-primary/50 transition-colors">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base">
                                                {client.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openDialog(client)} className="h-8 w-8">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)} className="h-8 w-8 text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-base mb-1 truncate">{client.name}</h3>
                                        <div className="space-y-1.5 text-sm text-muted-foreground">
                                            {client.email && (
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-3 w-3" /> {client.email}
                                                </div>
                                            )}
                                            {client.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-3 w-3" /> {client.phone}
                                                </div>
                                            )}
                                        <div className="flex items-center gap-2 pt-2 border-t border-border mt-2">
                                            <FileText className="h-3 w-3 text-primary" />
                                                <span className="text-foreground font-medium">
                                                    {clientOrderCounts[client.id] || 0} Orçamentos
                                                </span>
                                        </div>
                                        <Link to={`/app/clientes/${client.id}`} className="text-sm text-primary underline mt-3 inline-flex items-center gap-1">
                                            Ver perfil
                                        </Link>
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
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                <Label>Nome</Label>
                                <Input
                                    required
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormErrors({ ...formErrors, name: undefined });
                                        setFormData({ ...formData, name: e.target.value });
                                    }}
                                    className="rounded-xl"
                                />
                                {formErrors.name && <p className="text-xs text-destructive mt-1">{formErrors.name}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Empresa</Label>
                                        <Input
                                            value={formData.company}
                                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                            className="rounded-xl"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormErrors({ ...formErrors, email: undefined });
                                        setFormData({ ...formData, email: e.target.value });
                                    }}
                                    className="rounded-xl"
                                />
                                {formErrors.email && <p className="text-xs text-destructive mt-1">{formErrors.email}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Cargo/Função</Label>
                                        <Input
                                            value={formData.position}
                                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                            className="rounded-xl"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Telefone</Label>
                                        <Input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => {
                                                setFormErrors({ ...formErrors, phone: undefined });
                                                setFormData({ ...formData, phone: e.target.value });
                                            }}
                                            className="rounded-xl"
                                        />
                                        {formErrors.phone && <p className="text-xs text-destructive mt-1">{formErrors.phone}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Preferência de contato</Label>
                                        <Select
                                            value={formData.contact_preference}
                                            onValueChange={(value) => setFormData({ ...formData, contact_preference: value })}
                                        >
                                            <SelectTrigger className="rounded-xl">
                                                <SelectValue placeholder="Selecione uma opção" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {contactPreferences.map(pref => (
                                                    <SelectItem key={pref.value} value={pref.value}>
                                                        {pref.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {selectedContactPreference && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {selectedContactPreference.helper}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Cidade</Label>
                                <Input
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="rounded-xl"
                                />
                                    </div>
                                    <div className="space-y-2">
                                <Label>Estado</Label>
                                <Select value={formData.state} onValueChange={(value) => {
                                    setFormErrors({ ...formErrors, state: undefined });
                                    setFormData({ ...formData, state: value });
                                }}>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {brazilStates.map((uf) => (
                                            <SelectItem key={uf} value={uf}>
                                                {uf}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formErrors.state && <p className="text-xs text-destructive mt-1">{formErrors.state}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Observações</Label>
                                    <Textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="rounded-xl"
                                        placeholder="Adicione contexto ou histórico adicional sobre este cliente."
                                    />
                                </div>

                                <DialogFooter>
                                    <Button type="submit" className="rounded-xl w-full">
                                        Salvar
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </>
    );
};

export default ClientesPage;
