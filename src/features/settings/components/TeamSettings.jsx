import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Check, X, Loader2, Users, UserPlus, Pencil, Trash2, ShieldCheck, Mail, Crown, Lock, AlertTriangle } from 'lucide-react';

const roleMeta = {
    owner: {
        label: 'Proprietario',
        description: 'Controle total da organizacao, faturamento e equipe.',
        badge: 'default'
    },
    admin: {
        label: 'Admin',
        description: 'Administra operacao e configuracoes (sem faturamento).',
        badge: 'secondary'
    },
    editor: {
        label: 'Editor',
        description: 'Cria e edita clientes, orcamentos e agendamentos.',
        badge: 'outline'
    },
    viewer: {
        label: 'Visualizador',
        description: 'Acesso somente leitura aos dados principais.',
        badge: 'outline'
    }
};

const permissionMatrix = [
    { key: 'dashboard', label: 'Ver dashboard', owner: true, admin: true, editor: true, viewer: true },
    { key: 'clients', label: 'Gerenciar clientes', owner: true, admin: true, editor: true, viewer: false },
    { key: 'quotes', label: 'Criar/editar orcamentos', owner: true, admin: true, editor: true, viewer: false },
    { key: 'pipeline', label: 'Atualizar pipeline', owner: true, admin: true, editor: true, viewer: false },
    { key: 'schedules', label: 'Gerenciar agendamentos', owner: true, admin: true, editor: true, viewer: false },
    { key: 'materials', label: 'Gerenciar materiais', owner: true, admin: true, editor: true, viewer: false },
    { key: 'reports', label: 'Ver relatorios', owner: true, admin: true, editor: true, viewer: true },
    { key: 'integrations', label: 'Canais e integracoes', owner: true, admin: true, editor: false, viewer: false },
    { key: 'security', label: 'Seguranca e 2FA', owner: true, admin: true, editor: false, viewer: false },
    { key: 'team', label: 'Gerenciar equipe', owner: true, admin: true, editor: false, viewer: false },
    { key: 'billing', label: 'Planos e faturamento', owner: true, admin: false, editor: false, viewer: false }
];

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
        }
        setTeamMembers(data || []);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchTeamMembers();
    }, [fetchTeamMembers]);

    const handleInvite = async () => {
        if (!inviteEmail) {
            toast({ title: 'Email obrigatorio', description: 'Informe um email para convite.', variant: 'destructive'});
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

            toast({ title: 'Convite enviado', description: `Email enviado para ${inviteEmail}.` });
            setInviteEmail('');
            fetchTeamMembers();
        } catch (error) {
            toast({ title: 'Erro ao convidar', description: error.message || "Falha ao enviar convite.", variant: 'destructive' });
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
            
            toast({ title: 'Permissao atualizada', description: 'Nivel de acesso alterado.' });
            setEditingMember(null);
            fetchTeamMembers();
        } catch (error) {
            toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemove = async (memberId) => {
        if (!window.confirm("Tem certeza que deseja remover este membro?")) return;
        
        try {
            const { error } = await supabase
                .from('secondary_users')
                .delete()
                .eq('id', memberId);

            if (error) throw error;

            toast({ title: 'Membro removido', description: 'O usuario nao tem mais acesso.' });
            fetchTeamMembers();
        } catch (error) {
            toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
        }
    };

    const ownerRow = {
        id: 'owner',
        email: user?.email || 'Conta principal',
        permission_level: 'owner',
        isOwner: true
    };

    const rows = [ownerRow, ...teamMembers.map(member => ({ ...member, isOwner: false }))];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Equipe e Permissoes</CardTitle>
                    <CardDescription>Defina quem pode acessar o que dentro da sua organizacao.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {Object.keys(roleMeta).map((key) => (
                            <div key={key} className="rounded-xl border border-border/40 bg-background/30 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-foreground">{roleMeta[key].label}</p>
                                    {key === 'owner' ? <Crown className="h-4 w-4 text-primary" /> : <ShieldCheck className="h-4 w-4 text-primary" />}
                                </div>
                                <p className="text-xs text-muted-foreground">{roleMeta[key].description}</p>
                                <Badge variant={roleMeta[key].badge}>{roleMeta[key].label}</Badge>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-xl border border-border/40 bg-background/30 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Lock className="h-4 w-4 text-primary" />
                            Como funciona o acesso
                        </div>
                        <div className="grid gap-3 text-xs text-muted-foreground md:grid-cols-3">
                            <div className="space-y-1">
                                <p className="text-foreground font-medium">1. Convite</p>
                                <p>Convide por email e defina o papel inicial.</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-foreground font-medium">2. Ativacao</p>
                                <p>O usuario cria senha e entra com o papel definido.</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-foreground font-medium">3. Ajustes</p>
                                <p>Altere permissao a qualquer momento.</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-200 flex items-start gap-3">
                        <AlertTriangle className="h-4 w-4" />
                        Recomendamos ativar 2FA para administradores e proprietario.
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary" /> Membros da Equipe</CardTitle>
                    <CardDescription>Convide e gerencie membros ativos.</CardDescription>
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
                                <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
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
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Papel</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Acoes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell>
                                    </TableRow>
                                ) : rows.length > 0 ? (
                                    rows.map(member => (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                        <Mail className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{member.email}</p>
                                                        {member.isOwner && <p className="text-xs text-muted-foreground">Conta principal</p>}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={roleMeta[member.permission_level]?.badge || 'outline'}>
                                                    {roleMeta[member.permission_level]?.label || member.permission_level}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-green-500 text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">Ativo</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {member.isOwner ? (
                                                    <span className="text-xs text-muted-foreground">Protegido</span>
                                                ) : (
                                                    <>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => setEditingMember(member)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleRemove(member.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
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
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Matriz de Permissoes</CardTitle>
                    <CardDescription>Resumo rapido do que cada papel pode acessar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-md border border-surface-strong overflow-hidden">
                        <Table>
                            <TableHeader className="bg-surface-strong">
                                <TableRow>
                                    <TableHead>Funcionalidade</TableHead>
                                    <TableHead>Proprietario</TableHead>
                                    <TableHead>Admin</TableHead>
                                    <TableHead>Editor</TableHead>
                                    <TableHead>Visualizador</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {permissionMatrix.map((row) => (
                                    <TableRow key={row.key}>
                                        <TableCell className="text-sm text-foreground">{row.label}</TableCell>
                                        <TableCell className="text-center">{row.owner ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />}</TableCell>
                                        <TableCell className="text-center">{row.admin ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />}</TableCell>
                                        <TableCell className="text-center">{row.editor ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />}</TableCell>
                                        <TableCell className="text-center">{row.viewer ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {editingMember && (
                <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar Permissao</DialogTitle>
                            <DialogDescription>
                                Altere o nivel de acesso para {editingMember.email}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-2">
                            <Label>Nivel de Acesso</Label>
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
                            <p className="text-xs text-muted-foreground">
                                {roleMeta[editingMember.permission_level]?.description || 'Acesso personalizado.'}
                            </p>
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
        </div>
    );
};

export default TeamSettings;
