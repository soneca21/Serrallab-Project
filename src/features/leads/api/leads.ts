
import { supabase } from '@/lib/customSupabaseClient';
import { Lead, LeadMessage } from '@/types/leads';

export const getLeads = async (limit = 50, offset = 0): Promise<{ data: Lead[], count: number }> => {
    const { data, error, count } = await supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data: data || [], count: count || 0 };
};

export const getLead = async (id: string): Promise<Lead> => {
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

export const getLeadMessages = async (lead_id: string): Promise<LeadMessage[]> => {
    const { data, error } = await supabase
        .from('lead_messages')
        .select('*')
        .eq('lead_id', lead_id)
        .order('created_at', { ascending: true }); // Chat order

    if (error) throw error;
    return data || [];
};

export const convertLeadToClient = async (lead_id: string, client_data: any) => {
    // 1. Create Client
    const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
            name: client_data.name,
            phone: client_data.phone,
            email: client_data.email,
            address: client_data.address,
            contact_person: client_data.contact_person,
            notes: client_data.notes,
            // Assuming current user is authenticated, RLS or trigger handles user_id if implicit, 
            // but usually we pass it or rely on default.
            user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select('id')
        .single();

    if (clientError) throw clientError;

    // 2. Delete Lead (optional, or mark as converted if we had a status column)
    // Task requirement says "deleteLead" exists separately, but conversion usually implies moving data.
    // We will delete the lead after successful conversion to keep table clean as per typical "Leads -> Clients" flow.
    const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', lead_id);

    if (deleteError) {
        console.error('Failed to delete lead after conversion', deleteError);
        // Not throwing here to not block the success UI flow, but ideally should be transactional
    }

    return newClient;
};

export const deleteLead = async (id: string) => {
    const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

export const resetAutoReply = async (phone: string) => {
    const { error } = await supabase
        .from('lead_auto_reply_log')
        .delete()
        .eq('phone', phone); // RLS ensures user_id matches auth

    if (error) throw error;
};
