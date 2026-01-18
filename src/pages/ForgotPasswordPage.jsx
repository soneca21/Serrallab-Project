import React, { useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2, ArrowLeft } from 'lucide-react';

const ForgotPasswordPage = () => {
    const { toast } = useToast();
    const { sendPasswordResetEmail } = useAuth();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await sendPasswordResetEmail(email);

        if (error) {
            toast({
                title: 'Opa! Algo deu errado.',
                description: "Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.",
                variant: 'destructive',
            });
        } else {
            toast({
                title: 'E-mail enviado!',
                description: 'Verifique sua caixa de entrada (e spam) para encontrar o link de redefinição de senha.',
                duration: 9000,
            });
            setEmail('');
        }
        setLoading(false);
    };

    return (
        <HelmetProvider>
            <div className="min-h-screen flex items-center justify-center bg-matte-black p-4">
                <Helmet>
                    <title>Recuperar Senha — Serrallab</title>
                </Helmet>
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md p-8 space-y-6 bg-steel-gray-dark border border-steel-gray rounded-xl shadow-lg"
                >
                    <div className="text-center">
                        <h1 className="text-3xl font-heading text-white">Recuperar Senha</h1>
                        <p className="mt-2 text-gray-400 font-body">
                            Digite seu e-mail para receber o link de redefinição.
                        </p>
                    </div>
                    
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="text-sm font-bold text-gray-300 block mb-2" htmlFor="email">Email</label>
                            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 bg-steel-gray border border-steel-gray-light rounded-md text-white focus:ring-2 focus:ring-metallic-orange focus:outline-none" placeholder="seu@email.com" />
                        </div>
                        <Button type="submit" size="lg" className="w-full bg-metallic-orange hover:bg-metallic-orange/90 font-bold text-white" disabled={loading}>
                           {loading ? <Loader2 className="animate-spin" /> : 'Enviar Link'}
                        </Button>
                    </form>
                     <p className="text-center text-sm text-gray-400">
                        Lembrou a senha?{' '}
                        <NavLink to="/login" className="font-medium text-metallic-orange hover:underline flex items-center justify-center gap-1">
                            <ArrowLeft className="h-4 w-4" /> Voltar para o Login
                        </NavLink>
                    </p>
                </motion.div>
            </div>
        </HelmetProvider>
    );
};

export default ForgotPasswordPage;