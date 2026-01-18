
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MessageAutomationLog } from '@/types/automation';
import { getTriggerEventLabel, getActionTakenLabel } from '@/lib/messaging';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AutomationLogListProps {
  logs: MessageAutomationLog[];
  isLoading: boolean;
}

const AutomationLogList: React.FC<AutomationLogListProps> = ({ logs, isLoading }) => {
  if (isLoading) return <div className="p-4 text-center">Carregando logs...</div>;

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Regra</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Ação Tomada</TableHead>
              <TableHead>Resultado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  Nenhum log de automação encontrado.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-medium">{log.rule_name || 'Desconhecida'}</TableCell>
                  <TableCell>{getTriggerEventLabel(log.trigger_event)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getActionTakenLabel(log.action_taken)}</Badge>
                  </TableCell>
                  <TableCell>
                    {log.error_message ? (
                       <span className="text-red-500 text-xs">{log.error_message}</span>
                    ) : (
                       <span className="text-green-500 text-xs">Sucesso</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AutomationLogList;
