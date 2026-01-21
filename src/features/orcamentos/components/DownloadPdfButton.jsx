import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { downloadPdf } from '@/features/orcamentos/api/generatePdf';
import { getPdfFileName } from '@/lib/pdf';
import { useNavigate } from 'react-router-dom';

const DownloadPdfButton = ({ 
    orcamento_id, 
    orcamento_numero, 
    className, 
    variant = "outline",
    size = "default" 
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleDownload = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!orcamento_id) return;

        setIsLoading(true);
        try {
            await downloadPdf(
                orcamento_id,
                getPdfFileName(orcamento_numero || orcamento_id.slice(0, 8))
            );

            toast({
                title: "PDF Gerado",
                description: "O download comecara em instantes."
            });

        } catch (error) {
            console.error(error);
            if (error.code === 'PLAN_LIMIT') {
                toast({
                    title: "Recurso Bloqueado",
                    description: "Upgrade para o Plano Pro para exportar PDFs profissionais.",
                    variant: "destructive",
                    action: <Button variant="secondary" size="sm" onClick={() => navigate('/app/planos')}>Upgrade</Button>
                });
            } else {
                toast({
                    title: "Erro ao gerar PDF",
                    description: error.message || "Tente novamente mais tarde.",
                    variant: "destructive"
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button 
            variant={variant} 
            size={size}
            className={className}
            onClick={handleDownload}
            disabled={isLoading}
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
                <Download className="h-4 w-4 mr-2" />
            )}
            Exportar PDF
        </Button>
    );
};

export default DownloadPdfButton;
