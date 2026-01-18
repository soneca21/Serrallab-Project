
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PlusCircle, FileText, Copy, Trash2, Loader2, Send, MoreVertical, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate, NavLink } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import DownloadPdfButton from '@/features/orcamentos/components/DownloadPdfButton';

const OrcamentosPage = () => {
    const { user } = useAuth();
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();
    const navigate = useNavigate();

    const fetchQuotes = useCallback(async () => {
        if (!user) return; 
        setLoading(true);
        const { data, error } = await supabase.from('orders').select(`*, clients (*)`).eq('user_id', user.id).order('created_at', { ascending: false });
        if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        else setQuotes(data || []);
        setLoading(false);
    }, [user, toast]);

    useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

    const handleDuplicate = async (quoteId) => {
        const { data: fullQuote, error } = await supabase.from('orders').select('*').eq('id', quoteId).single();
        if (error) { toast({ title: 'Erro ao duplicar', variant: 'destructive' }); return; }
        const { id, created_at, ...newQuoteData } = fullQuote;
        const { data: duplicatedQuote, error: insertError } = await supabase.from('orders').insert({ ...newQuoteData, title: `${fullQuote.title} (Cópia)`, status: 'Rascunho' }).select('id').single();
        if (insertError) toast({ title: 'Erro ao duplicar', variant: 'destructive' });
        else { toast({ title: 'Duplicado com sucesso!' }); navigate(`/app/orcamentos/editar/${duplicatedQuote.id}`); }
    };

    const handleDelete = async (quoteId) => {
        if(!confirm('Tem certeza?')) return;
        const { error } = await supabase.from('orders').delete().eq('id', quoteId);
        if (error) toast({ title: 'Erro ao excluir', variant: 'destructive' });
        else { toast({ title: 'Excluído com sucesso!' }); fetchQuotes(); }
    };

    const filteredQuotes = quotes.filter(q => 
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        q.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch(status) {
            case 'Aprovado': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'Rejeitado': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'Enviado': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
        }
    };

    return (
        <>
            <Helmet><title>Orçamentos — Serrallab</title></Helmet>
            <div className="w-full space-y-6">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-heading font-bold text-foreground">Orçamentos</h2>
                        <p className="text-muted-foreground">Gerencie suas propostas comerciais.</p>
                    </div>
                    <Button asChild className="rounded-xl">
                        <NavLink to="/app/orcamentos/novo"><PlusCircle className="mr-2 h-4 w-4" /> Novo Orçamento</NavLink>
                    </Button>
                </div>

                <Card className="rounded-xl border-surface-strong">
                    <CardHeader className="border-b border-border/50 pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle>Lista de Orçamentos</CardTitle>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Buscar..." 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-9 h-9 rounded-lg"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
                            <Table>
                                <TableHeader className="bg-surface/50">
                                    <TableRow>
                                        <TableHead className="pl-6">Título</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right pr-6">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredQuotes.length > 0 ? filteredQuotes.map(quote => (
                                        <TableRow key={quote.id} className="group hover:bg-surface/50 transition-colors">
                                            <TableCell className="pl-6 font-medium">
                                                <NavLink to={`/app/orcamentos/editar/${quote.id}`} className="hover:text-primary transition-colors">
                                                    {quote.title}
                                                </NavLink>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{quote.clients?.name || '-'}</TableCell>
                                            <TableCell className="font-mono text-foreground">R$ {(quote.final_price || 0).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border", getStatusColor(quote.status))}>
                                                    {quote.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-xl border-surface-strong">
                                                        <DropdownMenuItem onClick={() => navigate(`/app/orcamentos/editar/${quote.id}`)}>
                                                            <FileText className="mr-2 h-4 w-4" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDuplicate(quote.id)}>
                                                            <Copy className="mr-2 h-4 w-4" /> Duplicar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(quote.id)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum orçamento encontrado.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default OrcamentosPage;
