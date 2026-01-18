
export const WEBHOOK_EVENTS = [
    { value: 'lead.received', label: 'Lead Recebido' },
    { value: 'lead.converted', label: 'Lead Convertido' },
    { value: 'orcamento.created', label: 'Orçamento Criado' },
    { value: 'orcamento.updated', label: 'Orçamento Atualizado' },
    { value: 'orcamento.won', label: 'Orçamento Aprovado' },
    { value: 'orcamento.lost', label: 'Orçamento Perdido' },
];

export function generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomValues = new Uint32Array(32);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < 32; i++) {
        result += chars[randomValues[i] % chars.length];
    }
    return result;
}

export function formatEventType(event: string): string {
    const found = WEBHOOK_EVENTS.find(e => e.value === event);
    return found ? found.label : event;
}

// Client-side validation helper (mostly for reference or testing tools)
export async function validateSignature(body: string, signature: string, secret: string): Promise<boolean> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const msgData = encoder.encode(body);

    const key = await crypto.subtle.importKey(
        'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, msgData);
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return `sha256=${signatureHex}` === signature;
}
