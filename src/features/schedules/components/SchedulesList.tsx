
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { MessageSchedule } from '@/types/schedules';
import { formatScheduleRecurrence } from '@/lib/schedules';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit2, Trash2, History } from 'lucide-react';
import { getChannelIcon, getTemplateLabel } from '@/lib/messaging';

interface SchedulesListProps {
  schedules: MessageSchedule[];
  onEdit: (schedule: MessageSchedule) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onViewHistory: (schedule: MessageSchedule) => void;
  isLoading: boolean;
}

const SchedulesList: React.FC<SchedulesListProps> = ({ 
  schedules, 
  onEdit, 
  onDelete, 
  onToggle, 
  onViewHistory,
  isLoading 
}) => {
  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando agendamentos...</div>;

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente / Modelo</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Recorrência</TableHead>
              <TableHead>Próxima Execução</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum agendamento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              schedules.map((schedule) => {
                const ChannelIcon = getChannelIcon(schedule.channel);
                return (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <div className="font-medium">{schedule.client?.name || 'Cliente Removido'}</div>
                      <div className="text-xs text-muted-foreground">{getTemplateLabel(schedule.template)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <ChannelIcon className="w-4 h-4" />
                        <span className="capitalize">{schedule.channel}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatScheduleRecurrence(schedule.recurrence, schedule.recurrence_interval, schedule.recurrence_weekdays)}
                    </TableCell>
                    <TableCell className="text-sm">
                       {schedule.next_run_at 
                         ? format(new Date(schedule.next_run_at), "dd/MM/yy HH:mm", { locale: ptBR })
                         : '-'
                       }
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={schedule.enabled}
                        onCheckedChange={(checked) => onToggle(schedule.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => onViewHistory(schedule)} title="Histórico">
                        <History className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onEdit(schedule)} title="Editar">
                        <Edit2 className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => {
                          if (confirm('Tem certeza que deseja excluir?')) onDelete(schedule.id);
                      }} title="Excluir">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SchedulesList;
