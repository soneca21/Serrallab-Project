
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck } from 'lucide-react';

interface Verify2FAModalProps {
  isOpen: boolean;
  onVerify: (code: string) => Promise<boolean>;
  onCancel: () => void;
  isLoading: boolean;
}

const Verify2FAModal: React.FC<Verify2FAModalProps> = ({ isOpen, onVerify, onCancel, isLoading }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await onVerify(code);
    if (!success) {
      setError('Código inválido ou expirado.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Verificação de Segurança
          </DialogTitle>
          <DialogDescription>
            Sua conta está protegida com 2FA. Digite o código do seu app autenticador.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="2fa-code">Código de Autenticação</Label>
            <Input 
              id="2fa-code" 
              placeholder="000000" 
              className="text-center tracking-widest text-xl h-12"
              maxLength={8} // Allow backup codes too
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              autoFocus
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Também aceita códigos de backup de 8 dígitos.
          </p>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar Login</Button>
            <Button type="submit" disabled={isLoading || code.length < 6}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verificar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default Verify2FAModal;
