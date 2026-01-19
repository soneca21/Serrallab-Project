
import React, { useEffect, useState } from 'react';
import MobileHeader from '@/components/MobileHeader';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { getLeadsOffline } from '@/lib/offline';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, UserPlus, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ConvertLeadModal from '@/features/leads/components/ConvertLeadModal';

const LeadsMobile: React.FC = () => {
    const { sync, isSyncing } = useOfflineSync();
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [isConvertOpen, setIsConvertOpen] = useState(false);

    const loadLeads = async () => {
        const data = await getLeadsOffline();
        setLeads(data || []);
        setLoading(false);
    };

    useEffect(() => {
        loadLeads();
    }, [isSyncing]);

    const handleRefresh = async () => {
        await sync();
        await loadLeads();
    };

    return (
        <div className="pb-4">
            <MobileHeader 
                title="Leads" 
                onMenu={handleRefresh} // Using menu icon spot for refresh on this page logic
            />
            
            <div className="px-4 pt-4 space-y-4">
                {loading ? (
                    Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
                ) : (
                    leads.map(lead => (
                        <Card key={lead.id} className="overflow-hidden rounded-2xl border border-border/40">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-lg">{lead.name || 'Desconhecido'}</h3>
                                        <p className="text-sm text-muted-foreground">{lead.source}</p>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {new Date(lead.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                
                                <div className="flex items-center gap-2 mb-4 text-sm">
                                    <Phone className="h-4 w-4 text-primary" />
                                    <span>{lead.phone}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" size="sm" onClick={() => window.open(`tel:${lead.phone}`)}>
                                        Ligar
                                    </Button>
                                    <Button size="sm" onClick={() => { setSelectedLead(lead); setIsConvertOpen(true); }}>
                                        <UserPlus className="h-4 w-4 mr-2" /> Converter
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
                {!loading && leads.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                        Nenhum lead encontrado.
                    </div>
                )}
            </div>

            <ConvertLeadModal 
                lead={selectedLead} 
                open={isConvertOpen} 
                onOpenChange={setIsConvertOpen} 
                onSuccess={() => {
                    handleRefresh();
                    setIsConvertOpen(false);
                }}
            />
        </div>
    );
};

export default LeadsMobile;
