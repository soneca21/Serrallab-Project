import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2, Hammer } from 'lucide-react'; 
import { Checkbox } from '@/components/ui/checkbox';

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();
  
  const [isLogin, setIsLogin] = useState(location.pathname === '/login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  // Task 2: rememberMe state
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setIsLogin(location.pathname === '/login');
  }, [location.pathname]);
  
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        // Task 2: Pass rememberMe to signIn
        const { error } = await signIn(email, password, rememberMe);
        
        if (error) {
          toast({
            variant: "destructive",
            title: "Erro no Login",
            description: error.message || "Verifique seu email e senha."
          });
        } else {
          toast({
            title: "Bem-vindo de volta!",
            description: "Login realizado com sucesso."
          });
          navigate('/app');
        }
      } else {
        if (!companyName) {
          toast({
            variant: "destructive",
            title: "Campo obrigatório",
            description: "Por favor, informe o nome da sua empresa."
          });
          setLoading(false);
          return;
        }
        
        const { error } = await signUp(
          email, 
          password, 
          {
            data: { company_name: companyName }
          }
        );

        if (error) {
          toast({
            variant: "destructive",
            title: "Erro no Cadastro",
            description: error.message || "Não foi possível criar sua conta."
          });
        } else {
          toast({
            title: "Cadastro realizado!",
            description: "Verifique seu email para confirmar sua conta."
          });
          navigate('/login');
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Ocorreu um erro ao processar sua solicitação."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{isLogin ? 'Login' : 'Cadastro'} — Serrallab</title>
      </Helmet>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div 
          key={isLogin ? 'login' : 'signup'}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="bg-card border border-border rounded-2xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] p-8 sm:p-10 relative overflow-hidden">
            
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="mb-4 inline-block bg-surface-strong p-6 rounded-full border-2 border-primary shadow-[0_0_30px_rgba(218,105,11,0.2)]">
                    <Hammer className="h-16 w-16 mx-auto text-primary drop-shadow-[0_0_10px_rgba(218,105,11,0.5)]" />
                </div>
              </div>
              <h2 className="text-3xl font-heading font-bold text-white tracking-tight">
                {isLogin ? 'Acessar sua Conta' : 'Criar Nova Conta'}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {isLogin ? 'Bem-vindo de volta!' : 'Comece a otimizar seus orçamentos hoje.'}
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-medium text-gray-300">Nome da Empresa</Label>
                  <Input 
                    id="companyName" 
                    type="text" 
                    value={companyName} 
                    onChange={e => setCompanyName(e.target.value)} 
                    placeholder="Sua Serralheria Inc." 
                    required 
                    className="bg-background border-input focus:ring-primary/50 focus:border-primary transition-all h-11"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-300">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="seu@email.com" 
                  required 
                  className="bg-background border-input focus:ring-primary/50 focus:border-primary transition-all h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-300">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required 
                  minLength="6"
                  className="bg-background border-input focus:ring-primary/50 focus:border-primary transition-all h-11"
                />
              </div>

              {isLogin ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="rememberMe" 
                      checked={rememberMe} 
                      onCheckedChange={setRememberMe}
                      className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-muted-foreground/50" 
                    />
                    <Label htmlFor="rememberMe" className="text-sm text-muted-foreground font-normal cursor-pointer">
                      Manter-me conectado
                    </Label>
                  </div>
                  <div className="text-sm">
                    <NavLink to="/recuperar-senha" className="font-medium text-primary hover:text-primary/80 transition-colors">
                      Esqueceu a senha?
                    </NavLink>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <NavLink to="/recuperar-senha" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                    Esqueceu a senha?
                  </NavLink>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(218,105,11,0.2)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(218,105,11,0.4)]" 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Entrar' : 'Cadastrar'}
                    {!loading && !isLogin && <CheckCircle2 className="ml-2 h-5 w-5" />}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-center text-sm text-muted-foreground">
                {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                <NavLink to={isLogin ? '/cadastro' : '/login'} className="font-medium text-primary hover:text-primary/80 ml-1 transition-colors">
                  {isLogin ? 'Cadastre-se' : 'Faça login'}
                </NavLink>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default AuthPage;