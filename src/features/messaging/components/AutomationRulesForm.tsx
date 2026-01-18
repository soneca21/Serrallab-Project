
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { MessageRetryRule } from '@/types/automation';
import { createAutomationRule, updateAutomationRule } from '@/features/messaging/api/automationRules';
import { Loader2 } from 'lucide-react';
import { MESSAGING_CHANNELS, MESSAGING_TEMPLATES } from '@/lib/messaging';

interface AutomationRulesFormProps {
  rule?: MessageRetryRule;
  onSave: (rule: MessageRetryRule) => void;
  onCancel: () => void;
}

const AutomationRulesForm: React.FC<AutomationRulesFormProps> = ({ rule, onSave, onCancel }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [name, setName] = useState(rule?.name || '');
  const [triggerEvent, setTriggerEvent] = useState(rule?.trigger_event || 'message_failed');
  const [enabled, setEnabled] = useState(rule?.enabled ?? true);
  
  const [action, setAction] = useState(rule?.action || 'retry_message');
  
  // Condition State
  const [triggerCondition, setTriggerCondition] = useState(rule?.trigger_condition || {});
  
  // Action Config State
  const [actionConfig, setActionConfig] = useState(rule?.action_config || {});

  // Update action based on trigger if needed to prevent invalid states
  useEffect(() => {
    if (triggerEvent === 'orcamento_status_change' && action !== 'send_message') {
      setAction('send_message');
    }
  }, [triggerEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return toast({ title: "Erro", description: "Nome é obrigatório", variant: "destructive" });

    setLoading(true);
    try {
      const payload = {
        name,
        trigger_event: triggerEvent,
        enabled,
        action,
        trigger_condition: triggerCondition,
        action_config: actionConfig
      };

      let savedRule;
      if (rule?.id) {
        savedRule = await updateAutomationRule(rule.id, payload);
      } else {
        savedRule = await createAutomationRule(payload);
      }
      
      onSave(savedRule);
      toast({ title: "Sucesso", description: "Regra salva com sucesso." });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao salvar regra.", variant: "destructive" });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{rule ? 'Editar Regra' : 'Nova Regra de Automação'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="grid gap-2">
            <Label>Nome da Regra</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Tentar reenviar SMS falho" />
          </div>

          <div className="flex items-center space-x-2">
            <Switch checked={enabled} onCheckedChange={setEnabled} id="enabled-mode" />
            <Label htmlFor="enabled-mode">Habilitada</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Gatilho (Evento)</Label>
              <Select value={triggerEvent} onValueChange={(val: any) => setTriggerEvent(val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="message_failed">Falha no Envio</SelectItem>
                  <SelectItem value="message_undelivered">Não Entregue (Undelivered)</SelectItem>
                  <SelectItem value="orcamento_status_change">Mudança de Status</SelectItem>
                  <SelectItem value="time_elapsed">Tempo Decorrido (Lembrete)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Ação</Label>
              <Select value={action} onValueChange={(val: any) => setAction(val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(triggerEvent === 'message_failed' || triggerEvent === 'message_undelivered') && (
                    <>
                      <SelectItem value="retry_message">Tentar Novamente</SelectItem>
                      <SelectItem value="fallback_channel">Tentar Outro Canal</SelectItem>
                    </>
                  )}
                  {(triggerEvent === 'orcamento_status_change' || triggerEvent === 'time_elapsed') && (
                    <SelectItem value="send_message">Enviar Mensagem</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conditional Fields based on Trigger */}
          <div className="border p-4 rounded-md bg-slate-50 space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground">Condições do Gatilho</h4>
            
            {(triggerEvent === 'message_failed' || triggerEvent === 'message_undelivered') && (
               <div className="grid gap-2">
                  <Label>Aplicar para canais:</Label>
                  <div className="flex gap-4">
                     <div className="flex items-center space-x-2">
                       <Checkbox 
                         checked={triggerCondition.channels?.includes('sms')}
                         onCheckedChange={(checked) => {
                            const current = triggerCondition.channels || [];
                            setTriggerCondition({
                              ...triggerCondition,
                              channels: checked ? [...current, 'sms'] : current.filter(c => c !== 'sms')
                            })
                         }}
                       />
                       <span>SMS</span>
                     </div>
                     <div className="flex items-center space-x-2">
                       <Checkbox 
                         checked={triggerCondition.channels?.includes('whatsapp')}
                         onCheckedChange={(checked) => {
                            const current = triggerCondition.channels || [];
                            setTriggerCondition({
                              ...triggerCondition,
                              channels: checked ? [...current, 'whatsapp'] : current.filter(c => c !== 'whatsapp')
                            })
                         }}
                       />
                       <span>WhatsApp</span>
                     </div>
                  </div>
               </div>
            )}

            {triggerEvent === 'orcamento_status_change' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Status Anterior (Opcional)</Label>
                  <Select 
                    value={triggerCondition.from_status || "any"} 
                    onValueChange={(val) => setTriggerCondition({...triggerCondition, from_status: val === 'any' ? undefined : val})}
                  >
                     <SelectTrigger><SelectValue placeholder="Qualquer" /></SelectTrigger>
                     <SelectContent>
                        <SelectItem value="any">Qualquer</SelectItem>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="sent">Enviado</SelectItem>
                        <SelectItem value="approved">Aprovado</SelectItem>
                     </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                   <Label>Novo Status</Label>
                   <Select 
                    value={triggerCondition.to_status} 
                    onValueChange={(val) => setTriggerCondition({...triggerCondition, to_status: val})}
                  >
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                        <SelectItem value="sent">Enviado</SelectItem>
                        <SelectItem value="approved">Aprovado</SelectItem>
                        <SelectItem value="rejected">Rejeitado</SelectItem>
                     </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {triggerEvent === 'time_elapsed' && (
               <div className="grid gap-2">
                  <Label>Dias após criação/atualização</Label>
                  <Input 
                    type="number" 
                    value={triggerCondition.days || ''} 
                    onChange={e => setTriggerCondition({...triggerCondition, days: parseInt(e.target.value)})}
                    placeholder="Ex: 3"
                  />
                  <Label className="mt-2">Se status for:</Label>
                  <Select 
                    value={triggerCondition.status || 'sent'} 
                    onValueChange={(val) => setTriggerCondition({...triggerCondition, status: val})}
                  >
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                        <SelectItem value="sent">Enviado (Aguardando)</SelectItem>
                        <SelectItem value="draft">Rascunho</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
            )}
          </div>

          {/* Conditional Fields based on Action */}
          <div className="border p-4 rounded-md bg-slate-50 space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground">Configuração da Ação</h4>
            
            {action === 'retry_message' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Máximo de Tentativas</Label>
                  <Input 
                    type="number" 
                    value={actionConfig.max_retries || 3} 
                    onChange={e => setActionConfig({...actionConfig, max_retries: parseInt(e.target.value)})} 
                  />
                </div>
                <div className="grid gap-2">
                   <Label>Delay (Minutos)</Label>
                   <Input 
                    type="number" 
                    value={actionConfig.delay_minutes || 5} 
                    onChange={e => setActionConfig({...actionConfig, delay_minutes: parseInt(e.target.value)})} 
                  />
                </div>
              </div>
            )}

            {action === 'fallback_channel' && (
               <div className="grid gap-2">
                 <Label>Canal de Destino (Fallback)</Label>
                 <Select 
                    value={actionConfig.to_channel || 'whatsapp'} 
                    onValueChange={(val) => setActionConfig({...actionConfig, to_channel: val})}
                  >
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
            )}

            {(action === 'send_message') && (
               <div className="grid gap-2">
                 <Label>Template da Mensagem</Label>
                 <Select 
                    value={actionConfig.template} 
                    onValueChange={(val) => setActionConfig({...actionConfig, template: val})}
                  >
                     <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                     <SelectContent>
                        <SelectItem value={MESSAGING_TEMPLATES.ORCAMENTO_ENVIADO}>Orçamento Enviado</SelectItem>
                        <SelectItem value={MESSAGING_TEMPLATES.STATUS_UPDATE}>Atualização de Status</SelectItem>
                        <SelectItem value={MESSAGING_TEMPLATES.LEMBRETE}>Lembrete</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
            )}
          </div>

        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Regra
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default AutomationRulesForm;
