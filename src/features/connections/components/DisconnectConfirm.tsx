
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from 'lucide-react';

interface DisconnectConfirmProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    label: string;
    loading: boolean;
}

const DisconnectConfirm = ({ isOpen, onClose, onConfirm, label, loading }: DisconnectConfirmProps) => {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Desconectar {label}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação irá interromper todas as automações e sincronizações vinculadas a este canal. Você precisará reconectar manualmente depois.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={(e) => { e.preventDefault(); onConfirm(); }} disabled={loading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Sim, desconectar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DisconnectConfirm;
