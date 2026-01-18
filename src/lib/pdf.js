
export const PDF_EXPIRATION_SECONDS = 60;

export function formatPdfDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function getPdfFileName(orcamento_numero) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const safeNum = orcamento_numero ? orcamento_numero.replace(/[^a-z0-9]/gi, '_') : 'orcamento';
    return `Orcamento_${safeNum}_${date}.pdf`;
}

export function formatCurrencyBR(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value || 0);
}
