
export const AUTO_REPLY_TEXT = "Olá! Recebemos sua mensagem. Um de nossos consultores entrará em contato em breve. Obrigado!";

export function formatPhoneNumber(phone: string): string {
    // Basic formatting for display (e.g., +5511999999999 -> (11) 99999-9999)
    // Assuming E.164 input without + or with +
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
        // Brazil format
        return `(${cleaned.substring(2, 4)}) ${cleaned.substring(4, 9)}-${cleaned.substring(9)}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('55')) {
        return `(${cleaned.substring(2, 4)}) ${cleaned.substring(4, 8)}-${cleaned.substring(8)}`;
    }
    return phone;
}

export function extractNameFromMessage(message: string): string | null {
    // Heuristic: "Nome: Mensagem"
    const parts = message.split(/[:\n-]/);
    if (parts.length > 1) {
        const potentialName = parts[0].trim();
        if (potentialName.length > 2 && potentialName.length < 30 && !/\d/.test(potentialName)) {
            return potentialName;
        }
    }
    return null;
}

export function isValidWhatsAppNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
}
