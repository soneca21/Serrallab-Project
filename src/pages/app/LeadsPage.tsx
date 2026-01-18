
import React, { useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Percent } from 'lucide-react';
import LeadsList from '@/features/leads/components/LeadsList';
import LeadDetail from '@/features/leads/components/LeadDetail';
import ConvertLeadModal from '@/features/leads/components/ConvertLeadModal';
import { useLeads } from '@/features/leads/hooks/useLeads';
import { Lead } from '@/types/leads';

const LeadsPage = () => {
    const { leads, isLoading, refetch, removeLead, resetReply } = useLeads();
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [convertOpen, setConvertOpen] = useState(false);
    const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);

    const handleViewDetail = (lead: Lead) => {
        setSelectedLead(lead);
        setDetailOpen(true);
    };

    const handleConvertClick = (lead: Lead) => {
        setLeadToConvert(lead);
        setConvertOpen(true);
    };

    const handleConversionSuccess = () => {
        refetch(); // Refresh list to show removed lead
        setDetailOpen(false); // Close detail if open (conversion can happen from detail too)
    };

    // Simple stats calculation from loaded leads (in real app, use dedicated stats endpoint)
    // Note: This only counts current leads, not historical conversions unless we track that separately.
    // For now, simple count is good.
    const totalLeads = leads.length;
    const leadsThisMonth = leads.filter(l => new Date(l.created_at).getMonth() === new Date().getMonth()).length;

    return (
        <HelmetProvider>
            <Helmet><title>Leads (WhatsApp) — Serrallab</title></Helmet>
            <div className="container mx-auto max-w-7xl space-y-6">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                           <MessageSquare className="h-8 w-8 text-primary" />
                           Leads
                        </h1>
                        <p className="text-muted-foreground">Gerencie contatos recebidos via WhatsApp.</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalLeads}</div>
                            <p className="text-xs text-muted-foreground">Aguardando atendimento</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Novos este Mês</CardTitle>
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{leadsThisMonth}</div>
                             <p className="text-xs text-muted-foreground">Desde o dia 1º</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Origem Principal</CardTitle>
                            <Percent className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">WhatsApp</div>
                            <p className="text-xs text-muted-foreground">100% dos leads</p>
                        </CardContent>
                    </Card>
                </div>

                <LeadsList 
                    leads={leads} 
                    isLoading={isLoading} 
                    onViewDetail={handleViewDetail} 
                    onConvert={handleConvertClick} 
                />

                <LeadDetail 
                    lead={selectedLead} 
                    open={detailOpen} 
                    onOpenChange={setDetailOpen}
                    onConvert={handleConvertClick}
                    onDelete={removeLead}
                    onResetReply={resetReply}
                />

                <ConvertLeadModal 
                    lead={leadToConvert} 
                    open={convertOpen} 
                    onOpenChange={setConvertOpen}
                    onSuccess={handleConversionSuccess}
                />

            </div>
        </HelmetProvider>
    );
};

export default LeadsPage;
