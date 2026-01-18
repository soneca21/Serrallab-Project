
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getSenderChannels, updateSenderChannel, SenderChannel } from '@/features/messaging/api/channels';
import { provisionTenantMessaging } from '@/features/messaging/api/provisionTenantMessaging';
import { MESSAGING_CHANNELS } from '@/lib/messaging';

const SenderChannelsForm = () => {
  const { toast } = useToast();
  const { hasFeature } = useSubscription();
  const [channels, setChannels] = useState<SenderChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState(false);

  const canUseSms = hasFeature('sms');
  // const canUseWhatsapp = hasFeature('whatsapp');

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const data = await getSenderChannels();
      setChannels(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar canais de envio.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProvision = async () => {
    try {
      setProvisioning(true);
      await provisionTenantMessaging();
      await fetchChannels();
      toast({
        title: "Sucesso",
        description: "Canais de mensagem provisionados com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível ativar os canais.",
        variant: "destructive"
      });
    } finally {
      setProvisioning(false);
    }
  };

  const smsChannel = channels.find(c => c.type === MESSAGING_CHANNELS.SMS);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração de Remetente (Messaging)</CardTitle>
        <CardDescription>
          Gerencie os canais utilizados para enviar notificações aos seus clientes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* SMS Section */}
        <div className="border rounded-lg p-4 bg-slate-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              SMS
              {!canUseSms && <Badge variant="outline" className="text-xs">Upgrade Necessário</Badge>}
            </h3>
            {smsChannel && (
              <Badge variant={smsChannel.status === 'active' ? 'default' : 'secondary'}>
                {smsChannel.status.toUpperCase()}
              </Badge>
            )}
          </div>
          
          {canUseSms ? (
            !smsChannel ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-4">Você ainda não ativou o envio de SMS.</p>
                <Button onClick={handleProvision} disabled={provisioning}>
                  {provisioning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ativar Envio de SMS
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="sms-from">Número de Envio (From)</Label>
                  <Input 
                    type="text" 
                    id="sms-from" 
                    value={smsChannel.from_value} 
                    disabled 
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500">Este número é gerenciado automaticamente pela plataforma.</p>
                </div>
              </div>
            )
          ) : (
            <p className="text-sm text-muted-foreground">O envio de SMS está disponível a partir do plano Pro.</p>
          )}
        </div>

        {/* WhatsApp Section (Placeholder) */}
        <div className="border rounded-lg p-4 bg-slate-50 opacity-60">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">WhatsApp</h3>
              <Badge variant="outline">Em Breve</Badge>
            </div>
            <p className="text-sm text-gray-500">Integração com WhatsApp Business API será liberada em breve para planos Enterprise.</p>
        </div>

      </CardContent>
    </Card>
  );
};

export default SenderChannelsForm;
