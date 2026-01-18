
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { MessageSchedule } from '@/types/schedules';
import { createSchedule, updateSchedule } from '@/features/schedules/api/schedules';
import { supabase } from '@/lib/customSupabaseClient';
import { validateScheduleForm, WEEKDAY_LABELS, TIMEZONE_OPTIONS, generateDedupeKey } from '@/lib/schedules';
import { MESSAGING_CHANNELS, MESSAGING_TEMPLATES } from '@/lib/messaging';
import { format } from 'date-fns';

interface ScheduleMessageFormProps {
  schedule?: MessageSchedule;
  onSave: (schedule: MessageSchedule) => void;
  onCancel: () => void;
}

const ScheduleMessageForm: React.FC<ScheduleMessageFormProps> = ({ schedule, onSave, onCancel }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  // Data Sources
  const [clients, setClients] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState<Partial<MessageSchedule>>({
    channel: 'sms',
    template: 'lembrete',
    timezone: 'America/Sao_Paulo',
    recurrence: 'once',
    recurrence_interval: 1,
    recurrence_weekdays: [],
    enabled: true,
    ...schedule
  });
  
  // Date/Time local state (HTML inputs need specific format)
  const [runAtLocal, setRunAtLocal] = useState('');
  const [endAtLocal, setEndAtLocal] = useState('');

  useEffect(() => {
    fetchData();
    if (schedule) {
      if (schedule.run_at) setRunAtLocal(format(new Date(schedule.run_at), "yyyy-MM-dd'T'HH:mm"));
      if (schedule.end_at) setEndAtLocal(format(new Date(schedule.end_at), "yyyy-MM-dd'T'HH:mm"));
    }
  }, [schedule]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [resClients, resOrders] = await Promise.all([
        supabase.from('clients').select('id, name'),
        supabase.from('orders').select('id, title, status').order('created_at', { ascending: false }).limit(50)
      ]);
      setClients(resClients.data || []);
      setOrders(resOrders.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  };

  const handleWeekdayChange = (day: number, checked: boolean) => {
    const current = formData.recurrence_weekdays || [];
    if (checked) {
      setFormData({ ...formData, recurrence_weekdays: [...current, day].sort() });
    } else {
      setFormData({ ...formData, recurrence_weekdays: current.filter(d => d !== day) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert local time strings to ISO with timezone consideration (simplified: using local machine time -> ISO)
    // In a robust app, you'd use date-fns-tz to interpret the local string IN the selected timezone.
    const runAtISO = new Date(runAtLocal).toISOString();
    const endAtISO = endAtLocal ? new Date(endAtLocal).toISOString() : null;

    const payload = {
      ...formData,
      run_at: runAtISO,
      end_at: endAtISO,
      // For new schedules, next_run_at is initially run_at
      next_run_at: schedule ? schedule.next_run_at : runAtISO
    };

    const { valid, errors } = validateScheduleForm(payload);
    if (!valid) {
      toast({ title: 'Erro de validação', description: errors[0], variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      
      // Generate dedupe key if creating
      if (!schedule && user) {
         payload.dedupe_key = await generateDedupeKey(
           user.id, 
           payload.cliente_id!, 
           payload.template!, 
           payload.channel!, 
           payload.orcamento_id, 
           payload.run_at!, 
           payload.recurrence!
         );
      }

      let saved;
      if (schedule?.id) {
        saved = await updateSchedule(schedule.id, payload);
        toast({ title: 'Sucesso', description: 'Agendamento atualizado.' });
      } else {
        saved = await createSchedule(payload);
        toast({ title: 'Sucesso', description: 'Agendamento criado.' });
      }
      onSave(saved);
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message || 'Falha ao salvar.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cliente</Label>
          <Select 
            value={formData.cliente_id} 
            onValueChange={(val) => setFormData({...formData, cliente_id: val})}
          >
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
           <Label>Canal</Label>
           <Select 
            value={formData.channel} 
            onValueChange={(val: any) => setFormData({...formData, channel: val})}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Modelo (Template)</Label>
          <Select 
            value={formData.template} 
            onValueChange={(val: any) => setFormData({...formData, template: val})}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={MESSAGING_TEMPLATES.LEMBRETE}>Lembrete</SelectItem>
              <SelectItem value={MESSAGING_TEMPLATES.STATUS_UPDATE}>Atualização de Status</SelectItem>
              <SelectItem value={MESSAGING_TEMPLATES.ORCAMENTO_ENVIADO}>Orçamento Enviado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
           <Label>Orçamento (Opcional)</Label>
           <Select 
            value={formData.orcamento_id || 'none'} 
            onValueChange={(val) => setFormData({...formData, orcamento_id: val === 'none' ? undefined : val})}
          >
            <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {orders.map(o => <SelectItem key={o.id} value={o.id}>#{o.id.substring(0,6)} - {o.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border p-4 rounded-md bg-slate-50 space-y-4">
         <h4 className="text-sm font-semibold flex items-center gap-2">
           <CalendarIcon className="h-4 w-4" /> Configuração de Tempo
         </h4>
         
         <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início/Envio</Label>
              <Input 
                type="datetime-local" 
                value={runAtLocal} 
                onChange={(e) => setRunAtLocal(e.target.value)} 
                required
              />
            </div>
            <div className="space-y-2">
               <Label>Fuso Horário</Label>
               <Select 
                  value={formData.timezone} 
                  onValueChange={(val) => setFormData({...formData, timezone: val})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIMEZONE_OPTIONS.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                  </SelectContent>
                </Select>
            </div>
         </div>

         <div className="space-y-2">
            <Label>Recorrência</Label>
            <Select 
                value={formData.recurrence} 
                onValueChange={(val: any) => setFormData({...formData, recurrence: val})}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Uma vez (Sem repetição)</SelectItem>
                  <SelectItem value="daily">Diária</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                </SelectContent>
            </Select>
         </div>

         {formData.recurrence !== 'once' && (
            <div className="space-y-4 p-3 bg-white rounded border">
                <div className="flex items-center gap-2">
                   <Label>Repetir a cada:</Label>
                   <Input 
                     type="number" 
                     className="w-20" 
                     min={1} 
                     value={formData.recurrence_interval} 
                     onChange={e => setFormData({...formData, recurrence_interval: parseInt(e.target.value)})}
                   />
                   <span className="text-sm text-gray-500">
                     {formData.recurrence === 'daily' ? 'dias' : 'semanas'}
                   </span>
                </div>

                {formData.recurrence === 'weekly' && (
                  <div className="space-y-2">
                     <Label>Dias da Semana:</Label>
                     <div className="flex flex-wrap gap-3">
                        {Object.entries(WEEKDAY_LABELS).map(([key, label]) => {
                           const dayNum = parseInt(key);
                           return (
                             <div key={key} className="flex items-center space-x-1">
                               <Checkbox 
                                 id={`wd-${key}`} 
                                 checked={formData.recurrence_weekdays?.includes(dayNum)}
                                 onCheckedChange={(c) => handleWeekdayChange(dayNum, c as boolean)}
                               />
                               <label htmlFor={`wd-${key}`} className="text-sm cursor-pointer select-none">{label}</label>
                             </div>
                           );
                        })}
                     </div>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t">
                  <Label>Terminar em (Opcional)</Label>
                  <Input 
                    type="datetime-local" 
                    value={endAtLocal} 
                    onChange={(e) => setEndAtLocal(e.target.value)} 
                  />
                  <p className="text-xs text-muted-foreground">Deixe vazio para repetir indefinidamente.</p>
                </div>
            </div>
         )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Agendamento
        </Button>
      </div>
    </form>
  );
};

export default ScheduleMessageForm;
