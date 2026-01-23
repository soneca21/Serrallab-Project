
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { PlusCircle, Trash2, Save, FileText, Send, Bot, Loader2, ArrowLeft, Users, Truck, MessageSquare, Mail } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { v4 as uuidv4 } from 'uuid';
import { createOrcamentoPdf, generatePdf } from '@/features/orcamentos/api/generatePdf';
import MaterialSelectorDialog from '@/components/MaterialSelectorDialog';
import DownloadPdfButton from '@/features/orcamentos/components/DownloadPdfButton';
import { createAuditLog } from '@/features/audit/api/auditLog';

const brazilStates = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

const contactPreferences = [
    { value: 'email', label: 'Email', helper: 'Usamos o email para mensagens e documentos.' },
    { value: 'phone', label: 'Telefone', helper: 'Ligamos durante o horario comercial.' },
    { value: 'whatsapp', label: 'WhatsApp', helper: 'Preferencia para links e respostas rapidas.' },
    { value: 'both', label: 'Email e telefone', helper: 'Entramos por ambos conforme a situacao.' },
];

const validateEmail = (value) => /^\S+@\S+\.\S+$/.test(value);
const validatePhone = (value) => /^\d{8,15}$/.test(value.replace(/\D/g, ''));

const AiSugestionDialog = ({ isOpen, onOpenChange, onApplySuggestion, userMaterials }) => {
    const { toast } = useToast();
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [suggestion, setSuggestion] = useState(null);

    const handleGenerate = async () => {
        if (!prompt) {
            toast({ title: "Prompt necessário", description: "Por favor, descreva o que você precisa orçar.", variant: "destructive" });
            return;
        }
        setIsGenerating(true);
        setSuggestion(null);
        
        const materialsContext = `
            ${userMaterials.map(m => `- ID: ${m.id}, Nome: ${m.name}, Custo: R$${m.cost}, Unidade: ${m.unit}`).join('\n')}
        `;

        try {
            const { data, error } = await supabase.functions.invoke('openai-chat', {
                body: { prompt, materialsContext }
            });

            if (error) throw new Error(error.message || "Erro desconhecido na função Edge.");
            if (data.error) throw new Error(data.error);

            // VALIDAÇÃO: Garante que a IA usou materiais existentes
            const validatedItems = data.items.map(item => {
                const found = userMaterials.find(m => m.id === item.material_id);
                if (found) {
                    return item; // O item é válido
                }
                console.warn(`IA sugeriu um material inexistente (ID: ${item.material_id}). O item será ignorado.`);
                return null;
            }).filter(Boolean); // Remove os itens nulos (inválidos)

            if(validatedItems.length !== data.items.length) {
                 toast({ title: "Aviso de IA", description: "A IA sugeriu alguns materiais que não estão no seu catálogo. Apenas os materiais válidos foram incluídos.", variant: "default" });
            }

            setSuggestion({...data, items: validatedItems});

        } catch(error) {
            toast({ title: "Erro na Sugestão IA", description: error.message, variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleApply = () => {
        if(!suggestion) return;
        onApplySuggestion(suggestion);
        onOpenChange(false);
        setSuggestion(null);
        setPrompt('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Assistente de Orçamento IA</DialogTitle>
                    <DialogDescription>
                        Descreva o projeto que você quer orçar. A IA vai sugerir um título, descrição, materiais e custos, usando seu catálogo de materiais.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Textarea 
                        placeholder="Ex: 'Um portão de garagem basculante de 3m de largura por 2.20m de altura, feito com metalon 20x30, com motor e pintura eletrostática preta.'"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={4}
                    />
                    <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4"/>}
                        Gerar Sugestão
                    </Button>
                </div>
                {isGenerating && (
                    <div className="flex justify-center items-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-metallic-orange"/>
                        <p className="ml-4 text-gray-400">A IA está trabalhando... Isso pode levar um momento.</p>
                    </div>
                )}
                {suggestion && (
                    <div className="border-t pt-4 space-y-4">
                        <h4 className="font-semibold">Sugestão Gerada:</h4>
                        <div className="p-4 bg-steel-gray rounded-lg space-y-2 text-sm">
                            <p><strong>Título:</strong> {suggestion.title}</p>
                            <p><strong>Descrição:</strong> {suggestion.description}</p>
                            <p><strong>Mão de Obra:</strong> R$ {suggestion.labor_cost}</p>
                            <p><strong>Pintura:</strong> R$ {suggestion.painting_cost}</p>
                             <p><strong>Materiais Sugeridos:</strong></p>
                            {suggestion.items.length > 0 ? (
                                <ul className="list-disc pl-5">
                                    {suggestion.items.map((item, index) => <li key={index}>{item.quantity} {item.unit || 'un'} de {item.name}</li>)}
                                </ul>
                            ) : (
                                <p className="text-yellow-400">Nenhum material correspondente encontrado no seu catálogo para esta sugestão.</p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSuggestion(null)}>Descartar</Button>
                            <Button onClick={handleApply}>Aplicar Sugestão</Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};


const OrcamentoFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user, profile } = useAuth();
    
    const [clients, setClients] = useState([]);
    const [userMaterials, setUserMaterials] = useState([]);
    const [globalMaterials, setGlobalMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
    const [isNewClientOpen, setIsNewClientOpen] = useState(false);
    const [currentItemId, setCurrentItemId] = useState(null);
    const [pipelineStages, setPipelineStages] = useState([]);
    const [newClientData, setNewClientData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        position: '',
        city: '',
        state: '',
        contact_preference: 'email',
        notes: '',
    });
    const [newClientErrors, setNewClientErrors] = useState({});

    const [formData, setFormData] = useState({
        title: '',
        client_id: '',
        description: '',
        items: [{ id: uuidv4(), material_id: '', name: 'Selecione um material', quantity: 1, cost: 0, unit: 'un' }],
        total_cost: 0,
        final_price: 0,
        status: 'Rascunho',
        labor_cost: 0,
        painting_cost: 0,
        transport_cost: 0,
        other_costs: 0,
    });
    const [previousStatus, setPreviousStatus] = useState('Rascunho');
    
    const [companyInfo, setCompanyInfo] = useState({ name: 'Sua Empresa', phone: 'Seu Telefone', email: 'seu@email.com' });

    const marginPreference = Number(profile?.preferences?.org_margin);
    const config = useMemo(() => {
        const safeMargin = Number.isFinite(marginPreference) && marginPreference > 0 ? marginPreference : 20;
        return { margin: safeMargin, tax: 5, waste: 5 };
    }, [marginPreference]);

    const currentStage = useMemo(() => {
        if (!pipelineStages.length) return null;
        return pipelineStages.find(stage => stage.id === formData.pipeline_stage_id);
    }, [pipelineStages, formData.pipeline_stage_id]);
    
    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Changed from 'quotes' to 'orders'
            const [clientsRes, userMaterialsRes, globalMaterialsRes, pipelineStagesRes, quoteRes] = await Promise.all([
                supabase.from('clients').select('*').eq('user_id', user.id),
                supabase.from('user_materials').select('*').eq('user_id', user.id).order('category', { ascending: true }).order('name', { ascending: true }),
                supabase.from('global_materials').select('*').order('category', { ascending: true }).order('name', { ascending: true }),
                supabase.from('pipeline_stages').select('*').order('"order"', { ascending: true }),
                id ? supabase.from('orders').select('*, clients(*)').eq('id', id).single() : Promise.resolve({ data: null }),
            ]);

            if (clientsRes.error) throw clientsRes.error;
            if (userMaterialsRes.error) throw userMaterialsRes.error;
            if (globalMaterialsRes.error) throw globalMaterialsRes.error;
            if (quoteRes.error && id && quoteRes.error.code !== 'PGRST116') { throw quoteRes.error; }
            
            setClients(clientsRes.data);
            setUserMaterials(userMaterialsRes.data);
            setGlobalMaterials(globalMaterialsRes.data);
            setPipelineStages(pipelineStagesRes.data || []);
            if(profile) {
                setCompanyInfo(prev => ({
                    ...prev, 
                    name: profile.company_name || 'Sua Empresa',
                    phone: profile.company_phone || 'Seu Telefone',
                    email: user.email,
                }));
            }

            if (id && quoteRes.data) {
                setFormData({
                    ...quoteRes.data,
                    items: quoteRes.data.items && quoteRes.data.items.length > 0 ? quoteRes.data.items : [{ id: uuidv4(), material_id: '', name: 'Selecione um material', quantity: 1, cost: 0, unit: 'un' }]
                });
                setPreviousStatus(quoteRes.data.status || 'Rascunho');
            }

        } catch (error) {
            toast({ title: 'Erro ao carregar dados', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [id, user, toast, profile]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const parseNumber = (value) => {
        if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
        const raw = String(value ?? '').trim();
        if (!raw) return 0;
        const hasComma = raw.includes(',');
        const hasDot = raw.includes('.');
        let normalized = raw;
        if (hasComma && hasDot) {
            normalized = raw.replace(/\./g, '').replace(',', '.');
        } else if (hasComma) {
            normalized = raw.replace(',', '.');
        }
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const calculations = useMemo(() => {
        const materialsSubtotal = formData.items.reduce((total, item) => {
            const itemQty = parseNumber(item.quantity);
            const itemCost = parseNumber(item.cost);
            return total + (itemCost * itemQty);
        }, 0);

        const wasteCost = materialsSubtotal * (config.waste / 100);
        const laborCost = parseNumber(formData.labor_cost);
        const paintingCost = parseNumber(formData.painting_cost);
        const transportCost = parseNumber(formData.transport_cost);
        const otherCosts = parseNumber(formData.other_costs);

        const baseCost = materialsSubtotal + wasteCost + laborCost + paintingCost + transportCost + otherCosts;
        const marginAmount = baseCost * (config.margin / 100);
        const taxAmount = (baseCost + marginAmount) * (config.tax / 100);
        const finalPrice = baseCost + marginAmount + taxAmount;

        return {
            materialsCost: materialsSubtotal,
            wasteCost,
            baseCost,
            finalPrice,
            netProfit: marginAmount,
        };
    }, [formData.items, formData.labor_cost, formData.painting_cost, formData.transport_cost, formData.other_costs, config]);


    // Client-side PDF backup
    const handleGenerateClientPdf = async () => {
        const client = clients.find(c => c.id === formData.client_id);
        const orcamentoData = {
            ...formData,
            created_at: new Date().toISOString(),
            total_cost: calculations.baseCost,
            final_price: calculations.finalPrice,
        };
        const profileData = {
            company_name: companyInfo?.name,
            company_phone: companyInfo?.phone,
            company_email: companyInfo?.email,
        };

        const doc = await createOrcamentoPdf({
            orcamento: orcamentoData,
            client,
            profile: profileData,
        });

        doc.save(`orcamento_${formData.title.replace(/\s/g, '_')}.pdf`);
    };

    const handleViewPdf = async () => {
        if (!id) {
            await handleGenerateClientPdf();
            return;
        }

        try {
            const { pdf_url } = await generatePdf(id);
            if (pdf_url) {
                window.open(pdf_url, '_blank', 'noopener,noreferrer');
            } else {
                toast({ title: 'PDF indisponivel', description: 'Nao foi possivel abrir o PDF.', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Erro ao abrir PDF', description: error.message || 'Tente novamente mais tarde.', variant: 'destructive' });
        }
    };

    const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSelectChange = (name, value) => setFormData(prev => ({ ...prev, [name]: value }));
    const handleClientSelect = (value) => {
        if (value === '__new_client__') {
            setNewClientErrors({});
            setNewClientData({
                name: '',
                email: '',
                phone: '',
                company: '',
                position: '',
                city: '',
                state: '',
                contact_preference: 'email',
                notes: '',
            });
            setIsNewClientOpen(true);
            return;
        }
        handleSelectChange('client_id', value);
    };
    const handleItemChange = (itemId, field, value) => setFormData(prev => ({ ...prev, items: prev.items.map(item => item.id === itemId ? { ...item, [field]: value } : item) }));
    
    const handleMaterialSelect = (material) => {
        if (!currentItemId) return;
        setFormData(prev => ({
            ...prev,
            items: prev.items.map(item => item.id === currentItemId ? {
                ...item,
                material_id: material.id,
                name: material.name,
                cost: parseNumber(material.cost),
                unit: material.unit || 'un'
            } : item)
        }));
        setCurrentItemId(null);
    };

        const handleApplySuggestion = (suggestion) => {
        const newItems = suggestion.items.map(suggItem => {
            const foundMaterial = userMaterials.find(m => m.id === suggItem.material_id);
            if (foundMaterial) {
                return {
                    id: uuidv4(),
                    material_id: foundMaterial.id,
                    name: foundMaterial.name,
                    quantity: parseNumber(suggItem.quantity) || 1,
                    cost: parseNumber(foundMaterial.cost),
                    unit: foundMaterial.unit || 'un',
                };
            }
            return null;
        }).filter(Boolean);

        setFormData(prev => ({
            ...prev,
            title: suggestion.title || prev.title,
            description: suggestion.description || prev.description,
            items: newItems.length > 0 ? newItems : prev.items.filter(i => i.name !== 'Selecione um material'),
            labor_cost: parseNumber(suggestion.labor_cost),
            painting_cost: parseNumber(suggestion.painting_cost),
            transport_cost: parseNumber(suggestion.transport_cost),
        }));
        toast({ title: 'Sugestao aplicada', description: 'O orcamento foi preenchido com os dados da IA.' });
    };

    const openMaterialSelector = (itemId) => { setCurrentItemId(itemId); setIsSelectorOpen(true); };
    const handleSaveNewClient = async (event) => {
        event.preventDefault();
        const errors = {};
        if (!newClientData.name.trim()) errors.name = 'Informe o nome do cliente.';
        if (!validateEmail(newClientData.email)) errors.email = 'Informe um email valido.';
        if (!newClientData.phone || !validatePhone(newClientData.phone)) errors.phone = 'Informe um telefone com 8 a 15 digitos.';
        if (!newClientData.state) errors.state = 'Selecione um estado.';
        if (Object.keys(errors).length) {
            setNewClientErrors(errors);
            toast({ title: 'Erro', description: 'Preencha os campos obrigatorios corretamente.', variant: 'destructive' });
            return;
        }

        const payload = {
            name: newClientData.name.trim(),
            email: newClientData.email.trim(),
            phone: newClientData.phone.trim(),
            company: newClientData.company?.trim() || '',
            position: newClientData.position?.trim() || '',
            city: newClientData.city?.trim() || '',
            state: newClientData.state,
            contact_preference: newClientData.contact_preference,
            notes: newClientData.notes?.trim() || '',
            user_id: user.id,
        };

        const { data, error } = await supabase.from('clients').insert(payload).select().single();
        if (error) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
            return;
        }

        setClients(prev => [data, ...prev]);
        setFormData(prev => ({ ...prev, client_id: data.id }));
        setIsNewClientOpen(false);
        toast({ title: 'Cliente criado', description: 'Cliente adicionado ao orcamento.' });
        createAuditLog('cliente', data.id, 'create', {
            name: data.name,
            email: data.email,
            phone: data.phone,
        });
    };

    const addItem = () => setFormData(prev => ({ ...prev, items: [...prev.items, { id: uuidv4(), material_id: '', name: 'Selecione um material', quantity: 1, cost: 0, unit: 'un' }] }));
    const removeItem = (itemId) => {
      setFormData(prev => {
        const newItems = prev.items.filter(item => item.id !== itemId);
        // Se a lista ficar vazia, adiciona um item em branco para não quebrar a UI
        if (newItems.length === 0) {
          return { ...prev, items: [{ id: uuidv4(), material_id: '', name: 'Selecione um material', quantity: 1, cost: 0, unit: 'un' }] };
        }
        return { ...prev, items: newItems };
      });
    };
    
    const handleSave = async (showToast = true) => {
        if (!formData.title.trim()) {
            toast({ title: 'Titulo obrigatorio', description: 'Informe um titulo para o orcamento.', variant: 'destructive' });
            return { success: false };
        }

        if (!formData.client_id) {
            toast({ title: 'Cliente obrigatorio', description: 'Selecione um cliente para o orcamento.', variant: 'destructive' });
            return { success: false };
        }

        const normalizedItems = formData.items
            .filter(item => item.material_id)
            .map(item => ({
                id: item.id || uuidv4(),
                material_id: item.material_id,
                name: item.name,
                quantity: parseNumber(item.quantity) || 1,
                cost: parseNumber(item.cost),
                unit: item.unit || 'un',
            }))
            .filter(item => item.quantity > 0);

        if (normalizedItems.length === 0) {
            toast({ title: 'Itens obrigatorios', description: 'Adicione ao menos um material.', variant: 'destructive' });
            return { success: false };
        }

        setIsSaving(true);
        const quoteData = {
            ...formData,
            user_id: user.id,
            title: formData.title.trim(),
            description: formData.description?.trim() || '',
            items: normalizedItems,
            labor_cost: parseNumber(formData.labor_cost),
            painting_cost: parseNumber(formData.painting_cost),
            transport_cost: parseNumber(formData.transport_cost),
            other_costs: parseNumber(formData.other_costs),
            total_cost: calculations.baseCost,
            final_price: calculations.finalPrice,
            status: formData.status || 'Rascunho',
        };
        const statusChanged = id && previousStatus && previousStatus !== quoteData.status;
        let result;
        if (id) {
            result = await supabase.from('orders').update(quoteData).eq('id', id);
        } else {
            result = await supabase.from('orders').insert(quoteData).select('id').single();
        }

        setIsSaving(false);

        if (result.error) {
            if(showToast) toast({ title: 'Erro ao salvar', description: result.error.message, variant: 'destructive' });
            return { success: false, error: result.error };
        } else {
            const orcamentoId = id || result.data.id;
            if(showToast) toast({ title: 'Sucesso!', description: 'Orcamento salvo.' });

            const webhookEvent = id ? 'orcamento.updated' : 'orcamento.created';

            supabase.functions.invoke('dispatch-webhook-event', {
                body: {
                    user_id: user.id,
                    event_type: webhookEvent,
                    payload: {
                        orcamento_id: orcamentoId,
                        client_id: quoteData.client_id,
                        total_cost: quoteData.total_cost,
                        final_price: quoteData.final_price,
                        status: quoteData.status
                    }
                }
            }).catch(err => console.error('Webhook dispatch failed', err));

            createAuditLog(
                'orcamento',
                orcamentoId,
                id ? 'update' : 'create',
                {
                    title: quoteData.title,
                    client_id: quoteData.client_id,
                    total_cost: quoteData.total_cost,
                    final_price: quoteData.final_price,
                    status: quoteData.status,
                }
            );

            const notifyEvent = id
                ? (statusChanged ? 'status_changed' : 'updated')
                : 'created';

            supabase.functions.invoke('send-orcamento-notifications', {
                body: {
                    orcamento_id: orcamentoId,
                    event: notifyEvent,
                    old_status: previousStatus,
                    new_status: quoteData.status,
                }
            }).catch(err => console.error('Orcamento notify failed', err));

            setPreviousStatus(quoteData.status || previousStatus);

            if (!id && result.data) {
                navigate('/app/orcamentos/editar/' + result.data.id, { replace: true });
            }
            return { success: true, id: orcamentoId };
        }
    };

    const handleSend = async (method, targetType) => {
        const client = clients.find(c => c.id === formData.client_id);
        let orcamentoId = id;

        if (!orcamentoId) {
            const saveResult = await handleSave(false);
            if (!saveResult.success) {
                toast({ title: 'Falha no Envio', description: 'Primeiro salve o orcamento para poder envia-lo.', variant: 'destructive' });
                return;
            }
            orcamentoId = saveResult.id;
        }

        if (targetType === 'cliente' && !client) {
            toast({ title: 'Atencao', description: 'Selecione um cliente para enviar o orcamento.', variant: 'destructive' });
            return;
        }

        if (targetType === 'fornecedor') {
            toast({ title: 'Em breve', description: 'Envio para fornecedores ainda nao implementado.' });
            return;
        }

        if ((method === 'whatsapp' || method === 'sms') && !client?.phone) {
            toast({ title: 'Erro', description: 'O cliente nao possui um numero de telefone valido.', variant: 'destructive' });
            return;
        }

        if (method === 'email' && !client?.email) {
            toast({ title: 'Erro', description: 'O cliente nao possui um email valido.', variant: 'destructive' });
            return;
        }

        const { error } = await supabase.from('orders').update({ status: 'Enviado' }).eq('id', orcamentoId);
        if (error) {
            toast({ title: 'Erro ao enviar', description: error.message, variant: 'destructive' });
            return;
        }

        setFormData(prev => ({ ...prev, status: 'Enviado' }));
        setPreviousStatus('Enviado');

        supabase.functions.invoke('send-orcamento-notifications', {
            body: {
                orcamento_id: orcamentoId,
                event: 'sent',
                new_status: 'Enviado',
                channels: [method]
            }
        }).catch(err => console.error('Orcamento notify failed', err));

        toast({ title: 'Proposta Enviada!', description: `A proposta foi enviada por ${method}.` });
        createAuditLog(
            'orcamento',
            orcamentoId,
            'update',
            { status: 'Enviado', method }
        );
    };

    if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin text-metallic-orange" /></div>;

    return (
        <HelmetProvider>
            <Helmet><title>{id ? 'Editar' : 'Novo'} Orçamento — Serrallab</title></Helmet>
             <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-grow space-y-6">
                    <Card>
                        <CardHeader><div className="flex justify-between items-center"><CardTitle>{id ? 'Editar Orçamento' : 'Novo Orçamento'}</CardTitle><Button variant="outline" size="sm" onClick={() => navigate('/app/orcamentos')}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button></div></CardHeader>
                        <CardContent className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><Label>Título do Orçamento</Label><Input name="title" value={formData.title} onChange={handleInputChange} placeholder="Ex: Portão Basculante para Garagem" /></div><div><Label>Cliente</Label><Select name="client_id" value={formData.client_id} onValueChange={handleClientSelect}><SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger><SelectContent><SelectItem value="__new_client__">+ Novo cliente</SelectItem>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div></div><div><Label>Descrição / Detalhes</Label><Textarea name="description" value={formData.description || ''} onChange={handleInputChange} placeholder="Detalhes sobre o projeto, medidas, etc." /></div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Itens e Custos</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Label>Materiais</Label>
                            {formData.items.map((item) => (<div key={item.id} className="flex items-end gap-2 flex-wrap"><div className="flex-grow min-w-[200px]"><Label className="text-xs">Material</Label><Button variant="outline" className="w-full justify-start text-left font-normal" onClick={() => openMaterialSelector(item.id)}>{item.name || "Selecione um material"}</Button></div><div><Label className="text-xs">Qtd.</Label><Input className="w-20" type="number" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} /></div><Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div>))}
                            <Button variant="outline" size="sm" onClick={addItem}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Material</Button>
                             <hr className="border-steel-gray" />
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><Label>Custo Mão de Obra (R$)</Label><Input type="number" name="labor_cost" value={formData.labor_cost || ''} onChange={handleInputChange} /></div><div><Label>Custo Pintura (R$)</Label><Input type="number" name="painting_cost" value={formData.painting_cost || ''} onChange={handleInputChange} /></div><div><Label>Custo Transporte (R$)</Label><Input type="number" name="transport_cost" value={formData.transport_cost || ''} onChange={handleInputChange} /></div><div><Label>Outros Custos (R$)</Label><Input type="number" name="other_costs" value={formData.other_costs || ''} onChange={handleInputChange} /></div></div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:w-80 flex-shrink-0 space-y-6">
                     <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle>Ações</CardTitle>
                            <span
                                className="px-3 py-1 text-xs font-semibold rounded-full border"
                                style={{
                                    borderColor: currentStage?.color || '#94a3b8',
                                    backgroundColor: currentStage?.color ? `${currentStage.color}33` : '#0000001a',
                                    color: currentStage?.color || '#94a3b8'
                                }}
                            >
                                {currentStage?.name || 'Rascunho'}
                            </span>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-2">
                            <Button onClick={() => handleSave()} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar</Button>
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="secondary" className="col-span-1"><Send className="mr-2 h-4 w-4" /> Enviar Proposta</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleSend('whatsapp', 'cliente')}><MessageSquare className="mr-2 h-4 w-4" /><span>Via WhatsApp (Cliente)</span></DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSend('sms', 'cliente')}><MessageSquare className="mr-2 h-4 w-4" /><span>Via SMS (Cliente)</span></DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSend('email', 'cliente')}><Mail className="mr-2 h-4 w-4" /><span>Via Email (Cliente)</span></DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSend('whatsapp', 'fornecedor')}><Truck className="mr-2 h-4 w-4" /><span>Via WhatsApp (Fornecedor)</span></DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button variant="secondary" className="col-span-1" onClick={handleViewPdf}><FileText className="mr-2 h-4 w-4" /> Ver PDF</Button>

                            {id ? (
                                <DownloadPdfButton 
                                    orcamento_id={id} 
                                    orcamento_numero={formData.title} 
                                    variant="secondary" 
                                    className="col-span-1"
                                />
                            ) : (
                                <Button variant="secondary" className="col-span-1" onClick={handleGenerateClientPdf}><FileText className="mr-2 h-4 w-4" /> Exportar PDF</Button>
                            )}
                            <Button variant="outline" className="border-metallic-orange text-metallic-orange col-span-2" onClick={() => setIsAiDialogOpen(true)}><Bot className="mr-2 h-4 w-4" /> Sugestão IA</Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Resumo do Cálculo</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>Custo Materiais:</span><span>R$ {calculations.materialsCost.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Custo Base:</span><span>R$ {calculations.baseCost.toFixed(2)}</span></div>
                            <hr className="border-steel-gray" />
                            <div className="flex justify-between text-lg"><span>Preço Final:</span><span className="font-bold text-metallic-orange">R$ {calculations.finalPrice.toFixed(2)}</span></div>
                            <div className="flex justify-between text-green-400"><span>Lucro Estimado:</span><span className="font-bold">R$ {calculations.netProfit.toFixed(2)}</span></div>
                        </CardContent>
                         <CardFooter className="text-xs text-gray-400">Valores baseados na sua configuração de margem ({config.margin}%), impostos ({config.tax}%) e desperdício ({config.waste}%).</CardFooter>
                    </Card>
                </div>
            </div>
            <MaterialSelectorDialog isOpen={isSelectorOpen} onOpenChange={setIsSelectorOpen} userMaterials={userMaterials} globalMaterials={globalMaterials} onSelectMaterial={handleMaterialSelect}/>
            <AiSugestionDialog isOpen={isAiDialogOpen} onOpenChange={setIsAiDialogOpen} onApplySuggestion={handleApplySuggestion} userMaterials={userMaterials} />
            <Dialog open={isNewClientOpen} onOpenChange={setIsNewClientOpen}>
                <DialogContent className="rounded-xl">
                    <DialogHeader>
                        <DialogTitle>Novo Cliente</DialogTitle>
                        <DialogDescription>Cadastre o cliente sem sair do orcamento.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveNewClient} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Nome</Label>
                                <Input
                                    value={newClientData.name}
                                    onChange={(e) => {
                                        setNewClientErrors(prev => ({ ...prev, name: undefined }));
                                        setNewClientData(prev => ({ ...prev, name: e.target.value }));
                                    }}
                                    className="rounded-xl"
                                />
                                {newClientErrors.name && <p className="text-xs text-destructive mt-1">{newClientErrors.name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Empresa</Label>
                                <Input
                                    value={newClientData.company}
                                    onChange={(e) => setNewClientData(prev => ({ ...prev, company: e.target.value }))}
                                    className="rounded-xl"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={newClientData.email}
                                    onChange={(e) => {
                                        setNewClientErrors(prev => ({ ...prev, email: undefined }));
                                        setNewClientData(prev => ({ ...prev, email: e.target.value }));
                                    }}
                                    className="rounded-xl"
                                />
                                {newClientErrors.email && <p className="text-xs text-destructive mt-1">{newClientErrors.email}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Cargo/Funcao</Label>
                                <Input
                                    value={newClientData.position}
                                    onChange={(e) => setNewClientData(prev => ({ ...prev, position: e.target.value }))}
                                    className="rounded-xl"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Telefone</Label>
                                <Input
                                    type="tel"
                                    value={newClientData.phone}
                                    onChange={(e) => {
                                        setNewClientErrors(prev => ({ ...prev, phone: undefined }));
                                        setNewClientData(prev => ({ ...prev, phone: e.target.value }));
                                    }}
                                    className="rounded-xl"
                                />
                                {newClientErrors.phone && <p className="text-xs text-destructive mt-1">{newClientErrors.phone}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Preferencia de contato</Label>
                                <Select
                                    value={newClientData.contact_preference}
                                    onValueChange={(value) => setNewClientData(prev => ({ ...prev, contact_preference: value }))}
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Selecione uma opcao" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {contactPreferences.map(pref => (
                                            <SelectItem key={pref.value} value={pref.value}>
                                                {pref.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {contactPreferences.find(pref => pref.value === newClientData.contact_preference) && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {contactPreferences.find(pref => pref.value === newClientData.contact_preference)?.helper}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Cidade</Label>
                                <Input
                                    value={newClientData.city}
                                    onChange={(e) => setNewClientData(prev => ({ ...prev, city: e.target.value }))}
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Estado</Label>
                                <Select value={newClientData.state} onValueChange={(value) => {
                                    setNewClientErrors(prev => ({ ...prev, state: undefined }));
                                    setNewClientData(prev => ({ ...prev, state: value }));
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
                                {newClientErrors.state && <p className="text-xs text-destructive mt-1">{newClientErrors.state}</p>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Observacoes</Label>
                            <Textarea
                                value={newClientData.notes}
                                onChange={(e) => setNewClientData(prev => ({ ...prev, notes: e.target.value }))}
                                className="rounded-xl"
                                placeholder="Adicione contexto ou historico adicional sobre este cliente."
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="rounded-xl w-full">Salvar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </HelmetProvider>
    );
};

export default OrcamentoFormPage;

