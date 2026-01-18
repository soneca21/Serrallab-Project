
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { convertLeadToClient } from '@/features/leads/api/leads';
import { Lead } from '@/types/leads';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface ConvertLeadModalProps {
    lead: Lead | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const ConvertLeadModal: React.FC<ConvertLeadModalProps> = ({ lead, open, onOpenChange, onSuccess }) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        contact_person: '',
        notes: ''
    });

    React.useEffect(() => {
        if (lead) {
            setFormData(prev => ({
                ...prev,
                name: lead.name || '',
                phone: lead.phone || '',
                notes: `Convertido de Lead WhatsApp (ID: ${lead.id})`
            }));
        }
    }, [lead]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lead || !user) return;

        setIsLoading(true);
        try {
            const newClient = await convertLeadToClient(lead.id, formData);
            
            // --- WEBHOOK TRIGGER: lead.converted ---
            if (newClient) {
                supabase.functions.invoke('dispatch-webhook-event', {
                    body: {
                        user_id: user.id,
                        event_type: 'lead.converted',
                        payload: {
                            lead_id: lead.id,
                            client_id: newClient.id,
                            name: newClient.name,
                            phone: newClient.phone
                        }
                    }
                }).catch(err => console.error('Webhook dispatch failed', err));
            }
            // ----------------------------------------

            toast({
                title: 'Sucesso',
                description: 'Lead convertido em cliente!',
            });
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro na conversão',
                description: error.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Converter Lead em Cliente</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nome do Cliente *</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Telefone *</Label>
                        <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="contact_person">Pessoa de Contato</Label>
                        <Input id="contact_person" name="contact_person" value={formData.contact_person} onChange={handleChange} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="address">Endereço</Label>
                        <Input id="address" name="address" value={formData.address} onChange={handleChange} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Converter
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ConvertLeadModal;
