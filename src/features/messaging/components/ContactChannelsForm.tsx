
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, Loader2, Plus, Phone } from 'lucide-react';
import { getContactChannels, createContactChannel, deleteContactChannel, ContactChannel } from '@/features/messaging/api/channels';
import { MESSAGING_CHANNELS, formatPhoneE164 } from '@/lib/messaging';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Props {
  cliente_id: string;
}

const ContactChannelsForm: React.FC<Props> = ({ cliente_id }) => {
  const { toast } = useToast();
  const [channels, setChannels] = useState<ContactChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [newType, setNewType] = useState<'sms'|'whatsapp'>('sms');
  const [newValue, setNewValue] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (cliente_id) fetchChannels();
  }, [cliente_id]);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const data = await getContactChannels(cliente_id);
      setChannels(data);
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Falha ao carregar contatos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const formatted = formatPhoneE164(newValue);
    if (!formatted) {
      toast({ title: "Formato Inválido", description: "Use (DD) 99999-9999.", variant: "destructive" });
      return;
    }

    try {
      setAdding(true);
      await createContactChannel(cliente_id, newType, formatted);
      setNewValue('');
      fetchChannels();
      toast({ title: "Sucesso", description: "Canal de contato adicionado." });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao adicionar contato.", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContactChannel(id);
      setChannels(prev => prev.filter(c => c.id !== id));
      toast({ title: "Deletado", description: "Contato removido com sucesso." });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao remover contato.", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Canais de Contato</CardTitle>
        <CardDescription>Telefones para envio de notificações.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
            <Loader2 className="animate-spin h-6 w-6 mx-auto" />
        ) : (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Número</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {channels.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground text-sm">
                                Nenhum contato cadastrado.
                            </TableCell>
                        </TableRow>
                    ) : (
                        channels.map((channel) => (
                            <TableRow key={channel.id}>
                                <TableCell className="capitalize">{channel.type}</TableCell>
                                <TableCell>{channel.value_e164}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(channel.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        )}

        <div className="flex gap-2 items-end pt-4 border-t">
            <div className="w-32">
                <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex-1">
                <Input 
                    placeholder="(11) 99999-9999" 
                    value={newValue} 
                    onChange={(e) => setNewValue(e.target.value)}
                />
            </div>
            <Button onClick={handleAdd} disabled={adding || !newValue}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactChannelsForm;
