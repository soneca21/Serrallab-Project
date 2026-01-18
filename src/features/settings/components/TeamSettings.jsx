
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Users, UserPlus, Pencil, Trash2, ShieldCheck, Mail } from 'lucide-react';

const TeamSettings = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [permissionLevel, setPermissionLevel] = useState('editor');
    const [editingMember, setEditingMember] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchTeamMembers = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('secondary_users')
            .select('*')
            .eq('primary_user_id', user.id);
        
        if (error) {
            console.error("Error fetching team:", error);
            // Don't show toast on 404/empty, just set empty array
        }
        setTeamMembers(data || []);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchTeamMembers();
    }, [fetchTeamMembers]);

    const handleInvite = async () => {
        if (!inviteEmail) {
            toast({ title: 'Email obrigatório', description: 'Por favor, insira um email para convidar.', variant: 'destructive'});
            return;
        }
        setIsSubmitting(true);
        try {
            const { error } = await supabase.functions.invoke('invite-secondary-user', {
                body: {
                    primaryUserId: user.id,
                    secondaryUserEmail: inviteEmail,
                    permissionLevel: permissionLevel,
                }
            });

            if (error) throw error;

            toast({ title: 'Convite enviado', description: `Um email foi enviado para ${inviteEmail}.` });
            setInviteEmail('');
            fetchTeamMembers();
        } catch (error) {
            toast({ title: 'Erro ao convidar', description: error.message || "Falha na comunicação com o servidor.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdatePermission = async () => {
        if (!editingMember) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('secondary_users')
                .update({ permission_level: editingMember.permission_level })
                .eq('id', editingMember.id);
            
            if (error) throw error;
            
            toast({ title: 'Permissão atualizada', description: 'O nível de acesso do usuário foi alterado.' });
            setEditingMember(null);
            fetchTeamMembers();
        } catch (error) {
            toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemove = async (memberId) => {
        if (!window.confirm("Tem certeza que deseja remover este membro da equipe?")) return;
        
        try {
            const { error } = await supabase
                .from('secondary_users')
                .delete()
                .eq('id', memberId);

            if (error) throw error;

            toast({ title: 'Membro removido', description: 'O usuário não tem mais acesso à organização.' });
            fetchTeamMembers();
        } catch (error) {
            toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Membros da Equipe</CardTitle>
                <CardDescription>Gerencie quem tem acesso à sua organização e seus níveis de permissão.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 rounded-lg bg-surface border border-surface-strong space-y-4">
                    <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-primary" /> Convidar Novo Membro
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-grow">
                            <Input 
                                type="email" 
                                placeholder="email@exemplo.com" 
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                            />
                        </div>
                         <Select value={permissionLevel} onValueChange={setPermissionLevel}>
                            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="viewer">Visualizador</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleInvite} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Enviar Convite"}
                        </Button>
                    </div>
                </div>

                <div className="rounded-md border border-surface-strong overflow-hidden">
                    <Table>
                        <TableHeader className="bg-surface-strong">
                            <TableRow>
                                <TableHead>Usuário</TableHead>
                                <TableHead>Permissão</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell>
                                </TableRow>
                            ) : teamMembers.length > 0 ? (
                                teamMembers.map(member => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <Mail className="h-4 w-4" />
                                                </div>
                                                <span className="font-medium">{member.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm bg-surface-strong/50 px-2 py-1 rounded w-fit">
                                                <ShieldCheck className="h-3 w-3 text-muted-foreground" />
                                                <span className="capitalize">{member.permission_level}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-green-500 text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">Ativo</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => setEditingMember(member)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleRemove(member.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                        Nenhum membro convidado ainda.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            {editingMember && (
                <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar Permissão</DialogTitle>
                            <DialogDescription>
                                Altere o nível de acesso para {editingMember.email}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-2">
                            <Label>Nível de Acesso</Label>
                            <Select 
                                value={editingMember.permission_level} 
                                onValueChange={(value) => setEditingMember(prev => ({...prev, permission_level: value}))}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="editor">Editor</SelectItem>
                                    <SelectItem value="viewer">Visualizador</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingMember(null)}>Cancelar</Button>
                            <Button onClick={handleUpdatePermission} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Salvar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </Card>
    );
};

export default TeamSettings;
