
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PlusCircle, FileText, Copy, Trash2, Loader2, MoreVertical, Search, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate, NavLink } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { createAuditLog } from '@/features/audit/api/auditLog';
import { generatePdf } from '@/features/orcamentos/api/generatePdf';
import AppSectionHeader from '@/components/AppSectionHeader';

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
        const duplicatedTitle = `${fullQuote.title} (Cópia)`;
        const { data: duplicatedQuote, error: insertError } = await supabase.from('orders').insert({ ...newQuoteData, title: duplicatedTitle, status: 'Rascunho' }).select('id').single();
        if (insertError) toast({ title: 'Erro ao duplicar', variant: 'destructive' });
        else {
            toast({ title: 'Duplicado com sucesso!' });
            createAuditLog(
                'orcamento',
                duplicatedQuote.id,
                'create',
                { title: duplicatedTitle, source_id: quoteId, status: 'Rascunho' }
            );
            navigate(`/app/orcamentos/editar/${duplicatedQuote.id}`);
        }
    };
    const handleDelete = async (quoteId) => {
        if(!confirm('Tem certeza?')) return;
        const { error } = await supabase.from('orders').delete().eq('id', quoteId);
        if (error) toast({ title: 'Erro ao excluir', variant: 'destructive' });
        else {
            const removed = quotes.find((quote) => quote.id === quoteId);
            toast({ title: 'Excluído com sucesso!' });
            fetchQuotes();
            createAuditLog(
                'orcamento',
                quoteId,
                'delete',
                { title: removed?.title || 'Orçamento' }
            );
        }
    };

    const handleViewPdf = async (quote) => {
        if (!quote?.id) return;
        try {
            const { pdf_url } = await generatePdf(quote.id);
            if (pdf_url) {
                window.open(pdf_url, '_blank', 'noopener,noreferrer');
                toast({ title: 'PDF aberto', description: 'O PDF foi aberto em uma nova aba.' });
            } else {
                toast({ title: 'PDF indisponível', description: 'Não foi possível abrir o PDF.' });
            }
        } catch (error) {
            if (error.code === 'PLAN_LIMIT') {
                toast({
                    title: 'Recurso bloqueado',
                    description: 'Faça upgrade para exportar PDFs profissionais.',
                    variant: 'destructive',
                    action: <Button variant="secondary" size="sm" onClick={() => navigate('/app/planos')}>Upgrade</Button>
                });
                return;
            }
            toast({
                title: 'Erro ao abrir PDF',
                description: error.message || 'Tente novamente mais tarde.',
                variant: 'destructive'
            });
        }
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
            <Helmet><title>{'Orçamentos - Serrallab'}</title></Helmet>
            <div className="w-full space-y-6">
                <AppSectionHeader
                    title="Orçamentos"
                    description="Gerencie suas propostas comerciais e acompanhe o status de cada negociação."
                    actions={
                        <Button asChild className="rounded-xl">
                            <NavLink to="/app/orcamentos/novo"><PlusCircle className="mr-2 h-4 w-4" /> Novo Orçamento</NavLink>
                        </Button>
                    }
                />

                <Card className="rounded-xl border-surface-strong">
                    <CardHeader className="border-b border-border/50 pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle>{'Lista de Orçamentos'}</CardTitle>
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
                                        <TableHead className="!text-center">{'Título'}</TableHead>
                                        <TableHead className="!text-center">Cliente</TableHead>
                                        <TableHead className="!text-center">Valor</TableHead>
                                        <TableHead className="!text-center">Status</TableHead>
                                        <TableHead className="!text-center">{'Ações'}</TableHead>
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
                                            <TableCell className="text-center font-mono text-foreground">R$ {(quote.final_price || 0).toFixed(2)}</TableCell>
                                            <TableCell className="text-center">
                                                <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border", getStatusColor(quote.status))}>
                                                    {quote.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-xl border-surface-strong">
                                                        <DropdownMenuItem onClick={() => handleViewPdf(quote)}>
                                                            <Eye className="mr-2 h-4 w-4" /> Ver PDF
                                                        </DropdownMenuItem>
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
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{'Nenhum orçamento encontrado.'}</TableCell>
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







