
import { supabase } from '@/lib/customSupabaseClient';

export async function generatePdf(orcamento_id) {
    const { data, error } = await supabase.functions.invoke("generate-orcamento-pdf", { 
        body: { orcamento_id } 
    });

    if (error) {
        // Parse Supabase Edge Function error structure if wrapped
        try {
             // Sometimes the function returns error inside data if status isn't 2xx but invoke doesn't throw
             // But supabase-js invoke throws for non-2xx usually if configured, 
             // otherwise we check data.error if response was 200 with error (unlikely here)
             throw error; 
        } catch (e) {
            throw new Error(error.message || 'Erro ao comunicar com o servidor de PDF.');
        }
    }
    
    // Check for application level errors returned in JSON
    if (data?.error) {
        if (data.code === 'PLAN_LIMIT') {
             const e = new Error(data.message);
             e.status = 409;
             e.code = 'PLAN_LIMIT';
             throw e;
        }
        throw new Error(data.error);
    }

    return { pdf_url: data.pdf_url };
}
