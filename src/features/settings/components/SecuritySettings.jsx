import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { use2FA } from '@/hooks/use2FA';
import { formatDateBR } from '@/lib/date';
import { AlertTriangle, CheckCircle2, Copy, Calendar, Clock, KeyRound, Loader2, Mail, ShieldCheck, Smartphone } from 'lucide-react';

const SecuritySettings = () => {
    const navigate = useNavigate();
    const { updateUserPassword, user } = useAuth();
    const { toast } = useToast();
    const { isEnabled: is2FAEnabled, method: twoFAMethod } = use2FA();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const emailVerified = Boolean(user?.email_confirmed_at);
    const createdAt = user?.created_at ? formatDateBR(user.created_at) : '-';
    const lastSignIn = user?.last_sign_in_at ? formatDateBR(user.last_sign_in_at) : '-';

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast({
                title: 'Senha muito curta',
                description: 'A senha deve ter no m\u00ednimo 6 caracteres.',
                variant: 'destructive'
            });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({
                title: 'Senhas n\u00e3o conferem',
                description: 'Digite a mesma senha nos dois campos.',
                variant: 'destructive'
            });
            return;
        }

        setIsChangingPassword(true);
        const { error } = await updateUserPassword(newPassword);
        setIsChangingPassword(false);

        if (error) {
            toast({ title: 'Erro ao alterar senha', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Senha atualizada', description: 'Sua senha foi atualizada com seguran\u00e7a.' });
            setNewPassword('');
            setConfirmPassword('');
        }
    };

    const handleCopyEmail = async () => {
        if (!user?.email) return;
        try {
            await navigator.clipboard?.writeText(user.email);
            toast({ title: 'Copiado', description: 'Email copiado.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'N\u00e3o foi poss\u00edvel copiar o email.' });
        }
    };

    const handleDeleteAccount = () => {
        toast({
            title: 'Funcionalidade restrita',
            description: 'Entre em contato com o suporte para encerrar sua conta permanentemente.',
            variant: 'default'
        });
        setIsDeleteDialogOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            {'Central de Seguran\u00e7a'}
                        </CardTitle>
                        <CardDescription>{'Status, autentica\u00e7\u00e3o e prote\u00e7\u00e3o do acesso.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-xl border border-border/40 bg-background/30 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-xs text-muted-foreground">Email principal</span>
                                    <Button variant="ghost" size="icon" onClick={handleCopyEmail}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
                                    <Mail className="h-4 w-4 text-primary" />
                                    {user?.email || '-'}
                                </div>
                            </div>
                            <div className="rounded-xl border border-border/40 bg-background/30 p-4">
                                <div className="text-xs text-muted-foreground">Verifica\u00e7\u00e3o do email</div>
                                <div className={`mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${emailVerified ? 'border-emerald-500/40 text-emerald-400' : 'border-amber-500/40 text-amber-400'}`}>
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {emailVerified ? 'Email verificado' : 'Email pendente'}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${is2FAEnabled ? 'border-emerald-500/40 text-emerald-400' : 'border-muted-foreground/40 text-muted-foreground'}`}>
                                <ShieldCheck className="h-3.5 w-3.5" />
                                {is2FAEnabled ? `2FA ativo (${twoFAMethod || 'totp'})` : '2FA desativado'}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-border/50 px-3 py-1 text-xs text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                {'Membro desde '}{createdAt}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-border/50 px-3 py-1 text-xs text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                {'\u00daltimo login '}{lastSignIn}
                            </span>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Button variant="outline" onClick={() => navigate('/app/config/security-2fa')}>
                                <KeyRound className="mr-2 h-4 w-4" />
                                Gerenciar 2FA
                            </Button>
                            <Button variant="outline" onClick={() => navigate('/app/config?tab=profile')}>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Ajustar perfil
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <KeyRound className="h-5 w-5 text-primary" />
                            Autentica\u00e7\u00e3o em Dois Fatores
                        </CardTitle>
                        <CardDescription>{'Camada extra para proteger sua conta.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-xl border border-border/40 bg-background/30 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-foreground">Status atual</p>
                                    <p className="text-xs text-muted-foreground">
                                        {is2FAEnabled ? `Ativo (${twoFAMethod || 'totp'})` : 'Desativado'}
                                    </p>
                                </div>
                                <div className={`text-xs font-medium px-2 py-1 rounded ${is2FAEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted/30 text-muted-foreground'}`}>
                                    {is2FAEnabled ? 'Protegido' : 'Recomendado'}
                                </div>
                            </div>
                            <p className="mt-3 text-xs text-muted-foreground">Use Google Authenticator ou Authy para gerar c\u00f3digos tempor\u00e1rios.</p>
                        </div>
                        <Button onClick={() => navigate('/app/config/security-2fa')} className="w-full">
                            Configurar 2FA
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Alterar Senha</CardTitle>
                        <CardDescription>Atualize sua senha periodicamente para manter sua conta segura.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new_password">Nova senha</Label>
                                <Input
                                    id="new_password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="********"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm_password">Confirmar nova senha</Label>
                                <Input
                                    id="confirm_password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="********"
                                />
                            </div>
                            <div className="rounded-xl border border-border/40 bg-background/30 p-4 text-xs text-muted-foreground">
                                <p className="font-medium text-foreground mb-2">Boas pr\u00e1ticas</p>
                                <ul className="space-y-1">
                                    <li>Use pelo menos 8 caracteres e um s\u00edmbolo.</li>
                                    <li>Evite reutilizar senhas de outros servi\u00e7os.</li>
                                    <li>Ative o 2FA para maior seguran\u00e7a.</li>
                                </ul>
                            </div>
                            <Button type="submit" disabled={isChangingPassword}>
                                {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Atualizar senha
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5 text-primary" /> Sess\u00f5es Ativas</CardTitle>
                        <CardDescription>{'Dispositivos conectados \u00e0 sua conta.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-background/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                    <Smartphone className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">Sess\u00e3o atual</p>
                                    <p className="text-xs text-muted-foreground">{`Acesso em ${lastSignIn}`}</p>
                                </div>
                            </div>
                            <div className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded w-fit">Ativo</div>
                        </div>
                        <div className="rounded-xl border border-border/40 bg-background/30 p-4 text-xs text-muted-foreground">
                            Para encerrar outras sess\u00f5es, altere sua senha ou entre em contato com o suporte.
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-red-900/50 bg-red-950/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-500"><AlertTriangle className="h-5 w-5" /> Zona de Perigo</CardTitle>
                    <CardDescription className="text-red-300/70">A\u00e7\u00f5es irrevers\u00edveis que afetam sua conta.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h4 className="font-medium text-red-400">Excluir conta</h4>
                            <p className="text-sm text-red-300/50">Todos os seus dados, or\u00e7amentos e clientes ser\u00e3o apagados permanentemente.</p>
                        </div>
                        <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>Excluir conta</Button>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-500">Excluir conta permanentemente?</DialogTitle>
                        <DialogDescription>
                            Esta a\u00e7\u00e3o n\u00e3o pode ser desfeita. Isso excluir\u00e1 permanentemente sua conta e remover\u00e1 seus dados de nossos servidores.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDeleteAccount}>Confirmar exclus\u00e3o</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SecuritySettings;
