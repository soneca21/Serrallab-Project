
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, AlertTriangle, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface BackupCodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  codes: string[];
}

const BackupCodesModal: React.FC<BackupCodesModalProps> = ({ isOpen, onClose, codes }) => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codes.join('\n'));
    setCopied(true);
    toast({ title: 'Códigos copiados!', description: 'Guarde-os em um local seguro.' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
             <AlertTriangle className="h-5 w-5 text-yellow-500" />
             Códigos de Backup
          </DialogTitle>
          <DialogDescription>
            Salve estes códigos em um local seguro. Eles são a única forma de recuperar o acesso à sua conta caso você perca seu dispositivo 2FA.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-md font-mono text-sm text-center my-4">
          {codes.map((code, i) => (
            <div key={i} className="p-1 bg-background rounded border">{code}</div>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleCopy} className="w-full sm:w-auto">
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? 'Copiado' : 'Copiar Códigos'}
          </Button>
          <Button onClick={onClose} className="w-full sm:w-auto">Confirmar que Salvei</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BackupCodesModal;
