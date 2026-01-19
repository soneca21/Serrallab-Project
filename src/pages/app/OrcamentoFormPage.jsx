
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
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import MaterialSelectorDialog from '@/components/MaterialSelectorDialog';
import DownloadPdfButton from '@/features/orcamentos/components/DownloadPdfButton';
import { createAuditLog } from '@/features/audit/api/auditLog';

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
    const [currentItemId, setCurrentItemId] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        client_id: null,
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
    
    const [companyInfo, setCompanyInfo] = useState({ name: 'Sua Empresa', phone: 'Seu Telefone', email: 'seu@email.com' });

    const config = useMemo(() => ({ margin: 20, tax: 5, waste: 5 }), []);
    
    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Changed from 'quotes' to 'orders'
            const [clientsRes, userMaterialsRes, globalMaterialsRes, quoteRes] = await Promise.all([
                supabase.from('clients').select('*').eq('user_id', user.id),
                supabase.from('user_materials').select('*').eq('user_id', user.id).order('category', { ascending: true }).order('name', { ascending: true }),
                supabase.from('global_materials').select('*').order('category', { ascending: true }).order('name', { ascending: true }),
                id ? supabase.from('orders').select('*, clients(*)').eq('id', id).single() : Promise.resolve({ data: null }),
            ]);

            if (clientsRes.error) throw clientsRes.error;
            if (userMaterialsRes.error) throw userMaterialsRes.error;
            if (globalMaterialsRes.error) throw globalMaterialsRes.error;
            if (quoteRes.error && id && quoteRes.error.code !== 'PGRST116') { throw quoteRes.error; }
            
            setClients(clientsRes.data);
            setUserMaterials(userMaterialsRes.data);
            setGlobalMaterials(globalMaterialsRes.data);
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

    const calculations = useMemo(() => {
        const materialsCost = formData.items.reduce((total, item) => {
            const itemQty = parseFloat(item.quantity) || 0;
            const itemCost = (parseFloat(item.cost) || 0) * itemQty; // Garantir que item.cost seja um número
            const wasteCost = itemCost * (config.waste / 100);
            return total + itemCost + wasteCost;
        }, 0);

        const laborCost = parseFloat(formData.labor_cost || 0);
        const paintingCost = parseFloat(formData.painting_cost || 0);
        const transportCost = parseFloat(formData.transport_cost || 0);
        const otherCosts = parseFloat(formData.other_costs || 0);
        
        const baseCost = materialsCost + laborCost + paintingCost + transportCost + otherCosts;
        const profitMargin = baseCost * (config.margin / 100);
        const taxAmount = (baseCost + profitMargin) * (config.tax / 100);
        const finalPrice = baseCost + profitMargin + taxAmount;
        const netProfit = finalPrice - baseCost - taxAmount;

        return { materialsCost, baseCost, finalPrice, netProfit };
    }, [formData.items, formData.labor_cost, formData.painting_cost, formData.transport_cost, formData.other_costs, config]);


    useEffect(() => {
        setFormData(prev => {
            if (prev.total_cost !== calculations.baseCost || prev.final_price !== calculations.finalPrice) {
                return {
                    ...prev,
                    total_cost: calculations.baseCost,
                    final_price: calculations.finalPrice
                };
            }
            return prev;
        });
    }, [calculations.baseCost, calculations.finalPrice]);

    // Client-side PDF backup
    const handleGenerateClientPdf = () => {
        const doc = new jsPDF();
        const client = clients.find(c => c.id === formData.client_id);
        
        doc.setFontSize(20);
        doc.text("Proposta de Orçamento", 14, 22);
        doc.setFontSize(12);
        doc.text(formData.title, 14, 30);
        
        doc.setFontSize(10);
        doc.text(`Data: ${new Date().toLocaleDateString()}`, 14, 40);
        doc.line(14, 45, 196, 45);
        doc.setFontSize(12);
        doc.text("Empresa:", 14, 55);
        doc.setFontSize(10);
        doc.text(companyInfo.name, 14, 61);
        doc.setFontSize(12);
        doc.text("Cliente:", 110, 55);
        doc.setFontSize(10);
        doc.text(client?.name || 'Não especificado', 110, 61);
        doc.text(client?.email || '', 110, 66);
        doc.text(client?.phone || '', 110, 71);
        doc.autoTable({ startY: 85, head: [['Item', 'Unidade', 'Qtd', 'Custo Unit.', 'Custo Total']], body: formData.items.map(item => [item.name, item.unit, item.quantity, `R$ ${parseFloat(item.cost || 0).toFixed(2)}`, `R$ ${(parseFloat(item.cost || 0) * parseFloat(item.quantity || 0)).toFixed(2)}`]), theme: 'striped', headStyles: { fillColor: [41, 128, 185] }, });
        let finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.text(`Custo Mão de Obra: R$ ${parseFloat(formData.labor_cost || 0).toFixed(2)}`, 14, finalY);
        doc.text(`Custo Pintura: R$ ${parseFloat(formData.painting_cost || 0).toFixed(2)}`, 14, finalY + 5);
        doc.text(`Custo Transporte: R$ ${parseFloat(formData.transport_cost || 0).toFixed(2)}`, 14, finalY + 10);
        doc.text(`Outros Custos: R$ ${parseFloat(formData.other_costs || 0).toFixed(2)}`, 14, finalY + 15);
        doc.text(`Subtotal (Custo Base): R$ ${calculations.baseCost.toFixed(2)}`, 14, finalY + 20);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`Preço Final: R$ ${calculations.finalPrice.toFixed(2)}`, 130, finalY + 25);
        doc.setFont(undefined, 'normal');
        finalY = doc.lastAutoTable.finalY + 55;
        doc.setFontSize(10);
        doc.text("Descrição do Projeto:", 14, finalY);
        const splitDescription = doc.splitTextToSize(formData.description || 'Nenhuma descrição fornecida.', 180);
        doc.text(splitDescription, 14, finalY + 5);
        doc.save(`orcamento_${formData.title.replace(/\s/g, '_')}.pdf`);
    };

    const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSelectChange = (name, value) => setFormData(prev => ({ ...prev, [name]: value }));
    const handleItemChange = (itemId, field, value) => setFormData(prev => ({ ...prev, items: prev.items.map(item => item.id === itemId ? { ...item, [field]: value } : item) }));
    
    const handleMaterialSelect = (material) => {
        if (!currentItemId) return;
        setFormData(prev => ({...prev, items: prev.items.map(item => item.id === currentItemId ? {...item, material_id: material.id, name: material.name, cost: material.cost, unit: material.unit} : item)}));
        setCurrentItemId(null);
    };

    const handleApplySuggestion = (suggestion) => {
        const newItems = suggestion.items.map(suggItem => {
            const foundMaterial = userMaterials.find(m => m.id === suggItem.material_id);
            // Este IF é uma dupla garantia, mas a validação já acontece no AiSuggestionDialog.
            if (foundMaterial) {
                return {
                    id: uuidv4(),
                    material_id: foundMaterial.id,
                    name: foundMaterial.name,
                    quantity: suggItem.quantity || 1,
                    cost: foundMaterial.cost,
                    unit: foundMaterial.unit,
                };
            }
            return null;
        }).filter(Boolean);

        setFormData(prev => ({
            ...prev,
            title: suggestion.title,
            description: suggestion.description,
            items: newItems.length > 0 ? newItems : prev.items.filter(i => i.name !== 'Selecione um material'),
            labor_cost: suggestion.labor_cost || 0,
            painting_cost: suggestion.painting_cost || 0,
            transport_cost: suggestion.transport_cost || 0,
        }));
        toast({ title: "Sugestão Aplicada!", description: "O orçamento foi preenchido com os dados da IA." });
    };

    const openMaterialSelector = (itemId) => { setCurrentItemId(itemId); setIsSelectorOpen(true); };
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
        setIsSaving(true);
        // Filtra itens vazios antes de salvar
        const validItems = formData.items.filter(item => item.material_id);
        const quoteData = { ...formData, user_id: user.id, items: validItems };
        let result;
        // Changed from 'quotes' to 'orders'
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
            if(showToast) toast({ title: 'Sucesso!', description: 'Orçamento salvo.' }); 
            
            // --- WEBHOOK TRIGGER: orcamento.created / orcamento.updated ---
            const webhookEvent = id ? 'orcamento.updated' : 'orcamento.created';
            const orcamentoId = id || result.data.id;
            
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
            // -------------------------------------------------------------

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

            if (!id && result.data) { navigate(`/app/orcamentos/editar/${result.data.id}`, { replace: true }); } 
            return { success: true }; 
        }
    };
    
    const handleSend = async (method, targetType) => {
        const client = clients.find(c => c.id === formData.client_id);
        if (!id) { const saveResult = await handleSave(false); if (!saveResult.success) { toast({ title: 'Falha no Envio', description: 'Primeiro salve o orçamento para poder enviá-lo.', variant: 'destructive' }); return; }}
        if (targetType === 'cliente' && !client) { toast({ title: 'Atenção', description: 'Selecione um cliente para enviar o orçamento.', variant: 'destructive' }); return; }
        if (targetType === 'fornecedor') { toast({ title: 'Em breve', description: 'Envio para fornecedores ainda não implementado.' }); return; }
        const messageBody = `Olá, ${client.name}!\n\nSegue a proposta de orçamento para o projeto "${formData.title}".\n\n*Resumo:*\n${formData.description || ''}\n\n*Valor Total: R$ ${calculations.finalPrice.toFixed(2)}*\n\nQualquer dúvida, estou à disposição!\n\nAtenciosamente,\n${companyInfo.name}`;
        if (method === 'whatsapp') { const whatsappNumber = client.phone?.replace(/\D/g, ''); if (!whatsappNumber) { toast({ title: 'Erro', description: 'O cliente não possui um número de telefone válido.', variant: 'destructive' }); return; } window.open(`https://wa.me/55${whatsappNumber}?text=${encodeURIComponent(messageBody)}`, '_blank'); } 
        else if (method === 'email') { if (!client.email) { toast({ title: 'Erro', description: 'O cliente não possui um email válido.', variant: 'destructive' }); return; } window.open(`mailto:${client.email}?subject=${encodeURIComponent(`Proposta de Orçamento: ${formData.title}`)}&body=${encodeURIComponent(messageBody)}`, '_blank'); }
        // Changed from 'quotes' to 'orders'
        const { error } = await supabase.from('orders').update({ status: 'Enviado' }).eq('id', id);
        if (!error) {
            setFormData(prev => ({ ...prev, status: 'Enviado' }));
            toast({ title: 'Proposta Enviada!', description: `A proposta foi aberta no ${method} para envio.` });
            createAuditLog(
                'orcamento',
                id,
                'update',
                { status: 'Enviado', method }
            );
        }
    };
    
    if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin text-metallic-orange" /></div>;

    return (
        <HelmetProvider>
            <Helmet><title>{id ? 'Editar' : 'Novo'} Orçamento — Serrallab</title></Helmet>
             <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-grow space-y-6">
                    <Card>
                        <CardHeader><div className="flex justify-between items-center"><CardTitle>{id ? 'Editar Orçamento' : 'Novo Orçamento'}</CardTitle><Button variant="outline" size="sm" onClick={() => navigate('/app/orcamentos')}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button></div></CardHeader>
                        <CardContent className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><Label>Título do Orçamento</Label><Input name="title" value={formData.title} onChange={handleInputChange} placeholder="Ex: Portão Basculante para Garagem" /></div><div><Label>Cliente</Label><Select name="client_id" value={formData.client_id} onValueChange={(v) => handleSelectChange('client_id', v)}><SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div></div><div><Label>Descrição / Detalhes</Label><Textarea name="description" value={formData.description || ''} onChange={handleInputChange} placeholder="Detalhes sobre o projeto, medidas, etc." /></div></CardContent>
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
                        <CardHeader className="flex-row items-center justify-between"><CardTitle>Ações</CardTitle><span className={`px-2 py-1 text-xs font-semibold rounded-full border ${formData.status === 'Rascunho' ? 'border-gray-500/30 bg-gray-500/20 text-gray-400' : 'border-green-500/30 bg-green-500/20 text-green-400'}`}>{formData.status}</span></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-2">
                            <Button onClick={() => handleSave()} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar</Button>
                            
                            {/* Download PDF Button */}
                            {id ? (
                                <DownloadPdfButton 
                                    orcamento_id={id} 
                                    orcamento_numero={formData.title} 
                                    variant="secondary" 
                                    className="col-span-1"
                                />
                            ) : (
                                <Button variant="secondary" onClick={handleGenerateClientPdf}><FileText className="mr-2 h-4 w-4" /> PDF</Button>
                            )}

                            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="secondary" className="col-span-2"><Send className="mr-2 h-4 w-4" /> Enviar Proposta</Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onClick={() => handleSend('whatsapp', 'cliente')}><MessageSquare className="mr-2 h-4 w-4" /><span>Via WhatsApp (Cliente)</span></DropdownMenuItem><DropdownMenuItem onClick={() => handleSend('email', 'cliente')}><Mail className="mr-2 h-4 w-4" /><span>Via Email (Cliente)</span></DropdownMenuItem><DropdownMenuItem onClick={() => handleSend('whatsapp', 'fornecedor')}><Truck className="mr-2 h-4 w-4" /><span>Via WhatsApp (Fornecedor)</span></DropdownMenuItem></DropdownMenuContent></DropdownMenu>
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
        </HelmetProvider>
    );
};

export default OrcamentoFormPage;
