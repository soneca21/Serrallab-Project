import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import SenderChannelsForm from '@/features/messaging/components/SenderChannelsForm.tsx';
import MessageOutboxList from '@/features/messaging/components/MessageOutboxList.tsx';
import AutomationRulesList from '@/features/messaging/components/AutomationRulesList.tsx';
import AutomationRulesForm from '@/features/messaging/components/AutomationRulesForm.tsx';
import AutomationLogList from '@/features/messaging/components/AutomationLogList.tsx';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getAutomationRules, getAutomationLog, deleteAutomationRule } from '@/features/messaging/api/automationRules';
import { MessageRetryRule, MessageAutomationLog } from '@/types/automation';
import { useToast } from '@/components/ui/use-toast';
import AppSectionHeader from '@/components/AppSectionHeader';

const ConfigCanaisPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [rules, setRules] = useState<MessageRetryRule[]>([]);
    const [logs, setLogs] = useState<MessageAutomationLog[]>([]);
    const [loadingRules, setLoadingRules] = useState(false);
    const [isEditingRule, setIsEditingRule] = useState(false);
    const [editingRule, setEditingRule] = useState<MessageRetryRule | undefined>(undefined);

    useEffect(() => {
        if (user) {
            fetchHistory();
            fetchAutomation();
        }
    }, [user]);

    const fetchHistory = async () => {
        try {
            setLoadingMessages(true);
            const { data, error } = await supabase
                .from('message_outbox')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingMessages(false);
        }
    };

    const fetchAutomation = async () => {
        try {
            setLoadingRules(true);
            const [rulesData, logsData] = await Promise.all([
                getAutomationRules(),
                getAutomationLog()
            ]);
            setRules(rulesData);
            setLogs(logsData);
        } catch (error) {
            console.error(error);
            toast({ title: "Erro", description: "Falha ao carregar automações.", variant: "destructive" });
        } finally {
            setLoadingRules(false);
        }
    };

    const handleDeleteRule = async (id: string) => {
        try {
            await deleteAutomationRule(id);
            setRules(rules.filter(r => r.id !== id));
            toast({ title: "Sucesso", description: "Regra excluída." });
        } catch (error) {
            toast({ title: "Erro", description: "Erro ao excluir regra.", variant: "destructive" });
        }
    };

    return (
        <HelmetProvider>
            <Helmet>
                <title>Configuração de Canais — Serrallab</title>
            </Helmet>
            <div className="w-full space-y-6">
                <AppSectionHeader
                    title="Canais de mensagem"
                    description="Gerencie WhatsApp, SMS e automações em um único lugar."
                />
                <div className="space-y-6 max-w-5xl">
                    <Tabs defaultValue="config" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="config">Configuração</TabsTrigger>
                            <TabsTrigger value="history">Histórico</TabsTrigger>
                            <TabsTrigger value="automation">Automações</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="config">
                            <div className="grid grid-cols-1 gap-6">
                                <SenderChannelsForm />
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="history">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Histórico de envios</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <MessageOutboxList 
                                        messages={messages} 
                                        isLoading={loadingMessages} 
                                        onUpdate={fetchHistory}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="automation">
                            <div className="space-y-6">
                               {isEditingRule ? (
                                   <AutomationRulesForm 
                                     rule={editingRule} 
                                     onSave={() => {
                                         setIsEditingRule(false);
                                         setEditingRule(undefined);
                                         fetchAutomation();
                                     }} 
                                     onCancel={() => {
                                         setIsEditingRule(false);
                                         setEditingRule(undefined);
                                     }}
                                   />
                               ) : (
                                   <AutomationRulesList 
                                     rules={rules} 
                                     isLoading={loadingRules}
                                     onEdit={(rule) => {
                                         setEditingRule(rule);
                                         setIsEditingRule(true);
                                     }}
                                     onDelete={handleDeleteRule}
                                     onCreate={() => {
                                         setEditingRule(undefined);
                                         setIsEditingRule(true);
                                     }}
                                   />
                               )}

                               <div className="mt-8">
                                   <h3 className="text-lg font-medium mb-4">Log de execuções</h3>
                                   <AutomationLogList logs={logs} isLoading={loadingRules} />
                               </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </HelmetProvider>
    );
};

export default ConfigCanaisPage;
