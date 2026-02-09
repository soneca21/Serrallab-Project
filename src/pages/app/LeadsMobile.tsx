import React, { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import MobileHeader from '@/components/MobileHeader';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { getLeadsOffline } from '@/lib/offline';
import { createLeadWithOfflineSupport } from '@/lib/offlineMutations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Plus, UserPlus } from 'lucide-react';
import ConvertLeadModal from '@/features/leads/components/ConvertLeadModal';
import OperationalStateCard from '@/components/OperationalStateCard';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { SystemStatusChip } from '@/components/SystemStatus';

const LeadsMobile: React.FC = () => {
    const { sync, isSyncing, isOnline } = useOfflineSync();
    const { user } = useAuth();
    const { toast } = useToast();

    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [hasInitialOfflineEmpty, setHasInitialOfflineEmpty] = useState(false);
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [isConvertOpen, setIsConvertOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creatingLead, setCreatingLead] = useState(false);
    const [leadMutationState, setLeadMutationState] = useState<'pending' | 'synced' | 'failed' | null>(null);
    const [newLeadForm, setNewLeadForm] = useState({ name: '', phone: '', source: 'manual' });

    const loadFromCache = useCallback(async () => {
        try {
            const data = await getLeadsOffline();
            setLeads(data || []);
            return data || [];
        } catch {
            setLeads([]);
            setErrorMessage('Não foi possível carregar os leads salvos no dispositivo.');
            return [];
        }
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        setErrorMessage(null);

        const cachedData = await loadFromCache();
        setHasInitialOfflineEmpty(!isOnline && cachedData.length === 0);
        setLoading(false);

        if (isOnline) {
            const result = await sync();
            if (!result?.success && cachedData.length === 0) {
                setErrorMessage('Falha ao buscar leads na rede e não há dados em cache.');
            }
            await loadFromCache();
        } else if (cachedData.length === 0) {
            setErrorMessage(null);
        }
    }, [isOnline, loadFromCache, sync]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    useEffect(() => {
        if (!isSyncing) {
            void loadFromCache();
        }
    }, [isSyncing, loadFromCache]);

    const handleRefresh = async () => {
        await loadData();
    };

    const handleCreateLead = async () => {
        if (!user) return;

        if (!newLeadForm.phone.trim()) {
            toast({ title: 'Telefone obrigatorio', description: 'Informe um telefone para o lead.', variant: 'destructive' });
            return;
        }

        setCreatingLead(true);
        const leadId = uuidv4();
        const result = await createLeadWithOfflineSupport({
            id: leadId,
            user_id: user.id,
            name: newLeadForm.name.trim() || 'Lead sem nome',
            phone: newLeadForm.phone.trim(),
            source: newLeadForm.source || 'manual',
        });
        setCreatingLead(false);

        setLeadMutationState(result.state);
        await loadFromCache();

        if (result.state === 'failed') {
            toast({
                title: 'Falha ao criar lead',
                description: `${result.message}. Tente novamente mais tarde.`,
                variant: 'destructive',
            });
            return;
        }

        toast({
            title: result.state === 'pending' ? 'Lead pendente' : 'Lead criado',
            description: result.state === 'pending'
                ? 'Lead salvo localmente. Será enviado automaticamente quando houver conexão.'
                : 'Lead salvo com sucesso.',
        });

        setIsCreateOpen(false);
        setNewLeadForm({ name: '', phone: '', source: 'manual' });
    };

    return (
        <div className="pb-4">
            <MobileHeader
                title="Leads"
                onMenu={handleRefresh}
            />

            <div className="px-4 pt-4 space-y-4 pwa-section-compact">
                <div className="flex items-center justify-between gap-2">
                    <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-1" /> Novo lead
                    </Button>
                    {leadMutationState && (
                        <div className="pwa-type-meta" role="status" aria-live="polite" aria-atomic="true">
                            {leadMutationState === 'pending' && <SystemStatusChip status="pending" />}
                            {leadMutationState === 'synced' && <SystemStatusChip status="synced" />}
                            {leadMutationState === 'failed' && <SystemStatusChip status="failed" />}
                        </div>
                    )}
                </div>

                {errorMessage && (
                    <OperationalStateCard
                        kind="error"
                        title="Falha ao carregar leads"
                        description={`${errorMessage} Proximo passo: tente novamente.`}
                        onPrimaryAction={() => void handleRefresh()}
                    />
                )}

                {loading ? (
                    <OperationalStateCard kind="loading" loadingRows={4} />
                ) : hasInitialOfflineEmpty ? (
                    <OperationalStateCard
                        kind="offline-empty"
                        title="Sem cache inicial para Leads"
                        description="Conecte-se a internet ao menos uma vez para baixar os dados."
                        onPrimaryAction={() => void handleRefresh()}
                    />
                ) : (
                    leads.map((lead) => (
                        <Card key={lead.id} className="overflow-hidden pwa-surface-card">
                            <CardContent className="pwa-surface-pad">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="pwa-type-subtitle">{lead.name || 'Desconhecido'}</h3>
                                        <p className="pwa-type-meta">{lead.source}</p>
                                    </div>
                                    <span className="pwa-type-meta">
                                        {new Date(lead.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 mb-4 pwa-type-body">
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
                    <OperationalStateCard
                        kind="empty"
                        title="Nenhum lead disponível"
                        description={isOnline
                            ? 'Nenhum lead foi encontrado para os filtros atuais.'
                            : 'Você está offline e não há leads em cache para exibir.'}
                        onPrimaryAction={() => void handleRefresh()}
                    />
                )}
            </div>

            <ConvertLeadModal
                lead={selectedLead}
                open={isConvertOpen}
                onOpenChange={setIsConvertOpen}
                onSuccess={() => {
                    void handleRefresh();
                    setIsConvertOpen(false);
                }}
            />

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Novo lead</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label htmlFor="lead-name">Nome</Label>
                            <Input
                                id="lead-name"
                                value={newLeadForm.name}
                                onChange={(e) => setNewLeadForm((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="Nome do lead"
                            />
                        </div>
                        <div>
                            <Label htmlFor="lead-phone">Telefone</Label>
                            <Input
                                id="lead-phone"
                                value={newLeadForm.phone}
                                onChange={(e) => setNewLeadForm((prev) => ({ ...prev, phone: e.target.value }))}
                                placeholder="Telefone"
                            />
                        </div>
                        <div>
                            <Label htmlFor="lead-source">Origem</Label>
                            <Input
                                id="lead-source"
                                value={newLeadForm.source}
                                onChange={(e) => setNewLeadForm((prev) => ({ ...prev, source: e.target.value }))}
                                placeholder="manual"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateLead} disabled={creatingLead}>
                            {creatingLead ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LeadsMobile;
