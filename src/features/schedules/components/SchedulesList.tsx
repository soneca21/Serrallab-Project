
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
        <div className="overflow-hidden rounded-xl border border-border bg-surface-variant">
          <Table className="w-full table-fixed">
            <TableHeader className="border-b border-border bg-surface-strong">
              <TableRow>
                <TableHead className="w-[32%] px-6 py-3 text-center border-l border-border first:border-l-0">
                  Cliente / Modelo
                </TableHead>
                <TableHead className="w-[12%] px-5 py-3 text-center border-l border-border">Canal</TableHead>
                <TableHead className="w-[14%] px-5 py-3 text-center border-l border-border">{'Recorr\u00eancia'}</TableHead>
                <TableHead className="w-[16%] px-5 py-3 text-center border-l border-border">
                  {'Pr\u00f3xima Execu\u00e7\u00e3o'}
                </TableHead>
                <TableHead className="w-[12%] px-5 py-3 text-center border-l border-border">Status</TableHead>
                <TableHead className="w-[14%] px-6 py-3 text-center border-l border-border">{'A\u00e7\u00f5es'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Nenhum agendamento encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                schedules.map((schedule) => {
                  const ChannelIcon = getChannelIcon(schedule.channel);
                  return (
                    <TableRow key={schedule.id} className="border-b border-border/60 last:border-b-0">
                      <TableCell className="px-6 py-3 align-middle border-l border-border first:border-l-0">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{schedule.client?.name || 'Cliente Removido'}</div>
                          <div className="text-xs text-muted-foreground truncate">{getTemplateLabel(schedule.template)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3 align-middle border-l border-border">
                        <div className="flex items-center justify-center gap-1 text-sm min-w-0">
                          <ChannelIcon className="w-4 h-4" />
                          <span className="capitalize truncate">{schedule.channel}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3 align-middle text-center border-l border-border truncate">
                        {formatScheduleRecurrence(schedule.recurrence, schedule.recurrence_interval, schedule.recurrence_weekdays)}
                      </TableCell>
                      <TableCell className="px-5 py-3 align-middle text-center border-l border-border truncate">
                        {schedule.next_run_at 
                          ? format(new Date(schedule.next_run_at), "dd/MM/yy HH:mm", { locale: ptBR })
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="px-5 py-3 align-middle border-l border-border">
                        <div className="flex items-center justify-center">
                          <Switch
                            checked={schedule.enabled}
                            onCheckedChange={(checked) => onToggle(schedule.id, checked)}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3 align-middle border-l border-border">
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => onViewHistory(schedule)} title={'Hist\u00f3rico'}>
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
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default SchedulesList;
