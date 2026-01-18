import React, { useState, useEffect } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

const ResetPasswordPage = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { updateUserPassword, session } = useAuth();
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        // This effect runs when the component mounts and the session changes.
        // It's triggered after the user clicks the link in the email.
        if (session) {
            toast({
                title: "Sessão de recuperação iniciada!",
                description: "Agora você pode definir uma nova senha.",
            });
        }
    }, [session, toast]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            toast({
                title: 'As senhas não coincidem!',
                variant: 'destructive',
            });
            return;
        }

        if (password.length < 6) {
            toast({
                title: 'Senha muito curta!',
                description: 'A senha deve ter no mínimo 6 caracteres.',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        const { error } = await updateUserPassword(password);

        if (error) {
            toast({
                title: 'Opa! Algo deu errado.',
                description: "Não foi possível redefinir a senha. O link pode ter expirado. Tente novamente.",
                variant: 'destructive',
            });
        } else {
            toast({
                title: 'Senha redefinida com sucesso!',
                description: 'Você já pode fazer o login com sua nova senha.',
                duration: 9000,
            });
            navigate('/login');
        }
        setLoading(false);
    };

    return (
        <HelmetProvider>
            <div className="min-h-screen flex items-center justify-center bg-matte-black p-4">
                <Helmet>
                    <title>Redefinir Senha — Serrallab</title>
                </Helmet>
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md p-8 space-y-6 bg-steel-gray-dark border border-steel-gray rounded-xl shadow-lg"
                >
                    <div className="text-center">
                        <h1 className="text-3xl font-heading text-white">Crie sua Nova Senha</h1>
                        <p className="mt-2 text-gray-400 font-body">
                            Escolha uma senha forte e segura.
                        </p>
                    </div>
                    
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="text-sm font-bold text-gray-300 block mb-2" htmlFor="password">Nova Senha</label>
                            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-3 bg-steel-gray border border-steel-gray-light rounded-md text-white focus:ring-2 focus:ring-metallic-orange focus:outline-none" placeholder="********" />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-300 block mb-2" htmlFor="confirmPassword">Confirmar Nova Senha</label>
                            <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full p-3 bg-steel-gray border border-steel-gray-light rounded-md text-white focus:ring-2 focus:ring-metallic-orange focus:outline-none" placeholder="********" />
                        </div>
                        <Button type="submit" size="lg" className="w-full bg-metallic-orange hover:bg-metallic-orange/90 font-bold text-white" disabled={loading}>
                           {loading ? <Loader2 className="animate-spin" /> : 'Redefinir Senha'}
                        </Button>
                    </form>
                </motion.div>
            </div>
        </HelmetProvider>
    );
};

export default ResetPasswordPage;