
import { supabase } from '@/lib/customSupabaseClient';

export interface UserConnection {
    id: string;
    user_id: string;
    type: string;
    category: 'channel' | 'integration';
    status: 'connected' | 'disconnected' | 'error';
    connected_at?: string;
    disconnected_at?: string;
    last_tested_at?: string;
    error_details?: any;
    metadata?: any;
    created_at: string;
    updated_at: string;
}

export const getConnections = async (userId: string) => {
    const { data, error } = await supabase
        .from('user_connections')
        .select('*')
        .eq('user_id', userId);

    if (error) throw error;
    return data as UserConnection[];
};

export const getConnection = async (userId: string, type: string) => {
    const { data, error } = await supabase
        .from('user_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore not found error
    return data as UserConnection | null;
};

export const createConnection = async (
    userId: string, 
    type: string, 
    category: 'channel' | 'integration',
    token?: string,
    credentials?: any
) => {
    // In a real app, encrypt token here before sending if not using Vault
    const { data, error } = await supabase
        .from('user_connections')
        .upsert({
            user_id: userId,
            type,
            category,
            token, // NOTE: In production, ensure this is encrypted!
            credentials,
            status: 'connected',
            connected_at: new Date().toISOString(),
            last_tested_at: new Date().toISOString(),
            disconnected_at: null,
            error_details: null
        }, { onConflict: 'user_id, type' })
        .select()
        .single();

    if (error) throw error;
    return data as UserConnection;
};

export const updateConnectionStatus = async (id: string, status: string, errorDetails?: any) => {
    const updates: any = { status, updated_at: new Date().toISOString() };
    if (status === 'disconnected') {
        updates.disconnected_at = new Date().toISOString();
        updates.token = null;
        updates.credentials = null;
    }
    if (errorDetails) {
        updates.error_details = errorDetails;
    }

    const { data, error } = await supabase
        .from('user_connections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as UserConnection;
};

export const deleteConnection = async (id: string) => {
    const { error } = await supabase
        .from('user_connections')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// Mock testing function - in real world this would hit a backend/edge function
export const testConnection = async (type: string, token: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simple mock validation logic
    if (!token || token.length < 5) {
        throw new Error('Token inválido ou muito curto.');
    }
    
    return true;
};
