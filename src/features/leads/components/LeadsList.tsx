
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Lead } from '@/types/leads';
import { formatPhoneNumber } from '@/lib/leads';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, UserPlus, Loader2 } from 'lucide-react';

interface LeadsListProps {
    leads: Lead[];
    isLoading: boolean;
    onViewDetail: (lead: Lead) => void;
    onConvert: (lead: Lead) => void;
}

const LeadsList: React.FC<LeadsListProps> = ({ leads, isLoading, onViewDetail, onConvert }) => {
    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (leads.length === 0) {
        return (
            <div className="text-center p-12 border rounded-lg bg-slate-50">
                <h3 className="text-lg font-medium text-slate-900">Nenhum lead encontrado</h3>
                <p className="text-slate-500 mt-1">Quando receber mensagens no WhatsApp, elas aparecerão aqui.</p>
            </div>
        );
    }

    return (
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Nome Sugerido</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leads.map((lead) => (
                        <TableRow key={lead.id}>
                            <TableCell className="font-medium">
                                {format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>{formatPhoneNumber(lead.phone)}</TableCell>
                            <TableCell>{lead.name || <span className="text-muted-foreground italic">Desconhecido</span>}</TableCell>
                            <TableCell className="capitalize">{lead.source}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => onViewDetail(lead)}>
                                    <Eye className="h-4 w-4 mr-1" /> Ver
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => onConvert(lead)}>
                                    <UserPlus className="h-4 w-4 mr-1" /> Converter
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default LeadsList;
