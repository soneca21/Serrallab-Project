
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, QrCode } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { generateSecret } from '@/services/totpService';
import { use2FA } from '@/hooks/use2FA';
import QRCode from 'qrcode';
import BackupCodesModal from './BackupCodesModal';

interface Enable2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Enable2FAModal: React.FC<Enable2FAModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { enable } = use2FA();
  const { toast } = useToast();

  const [step, setStep] = useState(1); // 1: Generate/Show QR, 2: Verify Code
  const [loading, setLoading] = useState(false);
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackup, setShowBackup] = useState(false);

  useEffect(() => {
    if (isOpen && user?.email) {
      initSetup();
    }
  }, [isOpen, user]);

  const initSetup = async () => {
    setLoading(true);
    try {
      const data = await generateSecret(user!.email!);
      setSecret(data.secret);
      
      // Generate QR data URL for display
      const url = await QRCode.toDataURL(data.otpauth_url);
      setQrCodeUrl(url);
      setStep(1);
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao iniciar configuração 2FA', variant: 'destructive' });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) return;
    setLoading(true);
    try {
      const codes = await enable(secret, verifyCode);
      setBackupCodes(codes);
      setShowBackup(true); // Switch to backup modal
      onClose(); // Close this modal
    } catch (error) {
      toast({ title: 'Código inválido', description: 'Verifique o código e tente novamente.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (showBackup) {
    return <BackupCodesModal isOpen={true} onClose={() => setShowBackup(false)} codes={backupCodes} />;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar Autenticação em Dois Fatores (2FA)</DialogTitle>
          <DialogDescription>
            Escaneie o QR Code abaixo com seu aplicativo autenticador (Google Authenticator, Authy, etc).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-4 space-y-4">
          {loading && !qrCodeUrl ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <>
              {qrCodeUrl && (
                <div className="bg-white p-2 rounded-lg">
                  <img src={qrCodeUrl} alt="QR Code 2FA" className="w-48 h-48" />
                </div>
              )}
              
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Se não conseguir escanear, digite o código manual:</p>
                <code className="bg-muted px-2 py-1 rounded text-xs font-mono select-all block">{secret}</code>
              </div>

              <div className="w-full max-w-xs space-y-2 mt-4">
                <Label htmlFor="code">Digite o código de 6 dígitos gerado</Label>
                <Input 
                  id="code" 
                  placeholder="000000" 
                  className="text-center tracking-widest text-lg" 
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleVerify} disabled={loading || verifyCode.length !== 6}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Verificar e Ativar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Enable2FAModal;
