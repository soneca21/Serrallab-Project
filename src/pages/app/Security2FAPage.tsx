
import React, { useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { use2FA } from '@/hooks/use2FA';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ShieldAlert, CheckCircle2, Loader2, Smartphone } from 'lucide-react';
import Enable2FAModal from '@/features/auth/components/Enable2FAModal';
import { Badge } from '@/components/ui/badge';

const Security2FAPage = () => {
  const { isEnabled, loading, disable } = use2FA();
  const [showEnableModal, setShowEnableModal] = useState(false);
  const [disabling, setDisabling] = useState(false);

  const handleDisable = async () => {
    if (confirm('Tem certeza que deseja desativar a autenticação em dois fatores? Sua conta ficará menos segura.')) {
      setDisabling(true);
      await disable();
      setDisabling(false);
    }
  };

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <HelmetProvider>
      <Helmet><title>Segurança 2FA — Serrallab</title></Helmet>
      <div className="container max-w-3xl py-8 space-y-6">
        <div className="flex items-center gap-3 mb-6">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Autenticação em Dois Fatores</h1>
        </div>

        <Card className={isEnabled ? "border-green-500/20 bg-green-500/5" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Status da Proteção</CardTitle>
              <Badge variant={isEnabled ? "default" : "destructive"} className={isEnabled ? "bg-green-600" : ""}>
                {isEnabled ? "ATIVADO" : "DESATIVADO"}
              </Badge>
            </div>
            <CardDescription>
              A autenticação de dois fatores adiciona uma camada extra de segurança à sua conta, exigindo mais do que apenas uma senha para entrar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEnabled ? (
              <div className="flex items-center gap-4 text-green-700 bg-green-100/50 p-4 rounded-lg">
                <CheckCircle2 className="h-6 w-6" />
                <div>
                  <p className="font-medium">Sua conta está protegida</p>
                  <p className="text-sm opacity-90">O login requer um código do seu aplicativo autenticador.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 text-amber-700 bg-amber-100/50 p-4 rounded-lg">
                <ShieldAlert className="h-6 w-6" />
                <div>
                  <p className="font-medium">Sua conta está vulnerável</p>
                  <p className="text-sm opacity-90">Recomendamos fortemente ativar o 2FA para proteger seus dados.</p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-end gap-3">
            {isEnabled ? (
              <>
                <Button variant="outline">Gerar Novos Códigos de Backup</Button>
                <Button variant="destructive" onClick={handleDisable} disabled={disabling}>
                   {disabling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   Desativar 2FA
                </Button>
              </>
            ) : (
              <Button onClick={() => setShowEnableModal(true)}>
                <Smartphone className="mr-2 h-4 w-4" />
                Configurar 2FA
              </Button>
            )}
          </CardFooter>
        </Card>

        <Enable2FAModal isOpen={showEnableModal} onClose={() => setShowEnableModal(false)} />
      </div>
    </HelmetProvider>
  );
};

export default Security2FAPage;

