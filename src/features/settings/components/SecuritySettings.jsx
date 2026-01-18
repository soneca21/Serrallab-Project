
import React, { useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { ShieldAlert, KeyRound, AlertTriangle, Loader2, Smartphone, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SecuritySettings = () => {
    const { updateUserPassword } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if(newPassword.length < 6) {
            toast({ title: 'Senha muito curta', description: 'A senha deve ter no mínimo 6 caracteres.', variant: 'destructive' });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({ title: 'Senhas não conferem', description: 'Por favor, digite a mesma senha nos dois campos.', variant: 'destructive' });
            return;
        }
        
        setIsChangingPassword(true);
        const { error } = await updateUserPassword(newPassword);
        setIsChangingPassword(false);
        
        if (error) {
            toast({ title: 'Erro ao alterar senha', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Sucesso', description: 'Sua senha foi atualizada com segurança.' });
            setNewPassword('');
            setConfirmPassword('');
        }
    };

    const handleDeleteAccount = () => {
        toast({ title: "Funcionalidade Restrita", description: "Entre em contato com o suporte para encerrar sua conta permanentemente.", variant: "default" });
        setIsDeleteDialogOpen(false);
    };

    return (
        <div className="space-y-6">
            {/* 2FA Section - New */}
            <Card className="border-blue-500/20 bg-blue-500/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Autenticação em Dois Fatores (2FA)</CardTitle>
                    <CardDescription>Adicione uma camada extra de segurança à sua conta.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg border">
                        <div>
                            <p className="font-medium">Proteja seu acesso</p>
                            <p className="text-xs text-muted-foreground mt-1">Configure o Google Authenticator ou Authy para gerar códigos de acesso.</p>
                        </div>
                        <Button onClick={() => navigate('/app/config/security-2fa')}>
                           Configurar 2FA
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Alterar Senha</CardTitle>
                    <CardDescription>Atualize sua senha periodicamente para manter sua conta segura.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                        <div className="space-y-2">
                            <Label htmlFor="new_password">Nova Senha</Label>
                            <Input 
                                id="new_password" 
                                type="password" 
                                value={newPassword} 
                                onChange={(e) => setNewPassword(e.target.value)} 
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
                            <Input 
                                id="confirm_password" 
                                type="password" 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                placeholder="••••••••"
                            />
                        </div>
                        <Button type="submit" disabled={isChangingPassword}>
                            {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Atualizar Senha
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-red-900/50 bg-red-950/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-500"><AlertTriangle className="h-5 w-5" /> Zona de Perigo</CardTitle>
                    <CardDescription className="text-red-300/70">Ações irreversíveis que afetam sua conta.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-red-400">Excluir Conta</h4>
                            <p className="text-sm text-red-300/50">Todos os seus dados, orçamentos e clientes serão apagados permanentemente.</p>
                        </div>
                        <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>Excluir Conta</Button>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-500">Excluir Conta Permanentemente?</DialogTitle>
                        <DialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta e removerá seus dados de nossos servidores.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDeleteAccount}>Confirmar Exclusão</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SecuritySettings;
