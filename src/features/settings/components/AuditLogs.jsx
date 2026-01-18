
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AuditLogs = () => {
    const { profile } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            if (!profile?.company_id) return;
            setLoading(true);
            
            // Assuming table audit_logs has company_id
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('company_id', profile.company_id)
                .order('created_at', { ascending: false })
                .limit(20);
                
            if (error) {
                console.error("Error fetching logs:", error);
            } else {
                setLogs(data || []);
            }
            setLoading(false);
        };

        fetchLogs();
    }, [profile]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Auditoria</CardTitle>
                <CardDescription>Registro de atividades importantes na sua conta.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-surface-strong overflow-hidden">
                    <Table>
                        <TableHeader className="bg-surface-strong">
                            <TableRow>
                                <TableHead>Data/Hora</TableHead>
                                <TableHead>Ação</TableHead>
                                <TableHead>Entidade</TableHead>
                                <TableHead>Detalhes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell>
                                </TableRow>
                            ) : logs.length > 0 ? (
                                logs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-xs">
                                            {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                        </TableCell>
                                        <TableCell className="font-medium text-primary text-xs uppercase">{log.action}</TableCell>
                                        <TableCell className="text-xs">{log.entity}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">
                                            {JSON.stringify(log.details || log.metadata)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                        Nenhum registro de atividade encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default AuditLogs;
