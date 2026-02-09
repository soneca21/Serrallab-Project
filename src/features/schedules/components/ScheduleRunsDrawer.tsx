
import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MessageSchedule, MessageScheduleRun } from '@/types/schedules';
import { getScheduleRuns } from '@/features/schedules/api/schedules';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

interface ScheduleRunsDrawerProps {
  schedule: MessageSchedule | null;
  isOpen: boolean;
  onClose: () => void;
}

const ScheduleRunsDrawer: React.FC<ScheduleRunsDrawerProps> = ({ schedule, isOpen, onClose }) => {
  const [runs, setRuns] = useState<MessageScheduleRun[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && schedule) {
      fetchRuns();
    }
  }, [isOpen, schedule]);

  const fetchRuns = async () => {
    if (!schedule) return;
    setLoading(true);
    try {
      const data = await getScheduleRuns(schedule.id);
      setRuns(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (action: string) => {
    switch (action) {
      case 'sent': return <Badge className="bg-green-500">Enviado</Badge>;
      case 'failed': return <Badge variant="destructive">Falha</Badge>;
      case 'skipped': return <Badge variant="secondary">Ignorado</Badge>;
      case 'disabled': return <Badge variant="outline" className="border-red-500 text-red-500">Desativado Auto</Badge>;
      default: return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{'Histórico de Execuções'}</SheetTitle>
          <SheetDescription>
            {schedule?.client?.name} - {schedule?.template}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Info</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                       {'Nenhuma execução registrada.'}
                     </TableCell>
                   </TableRow>
                ) : (
                  runs.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="text-xs">
                        {format(new Date(run.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{getStatusBadge(run.action_taken)}</TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">
                        {run.error_message || (run.action_taken === 'sent' ? 'Sucesso' : '-')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ScheduleRunsDrawer;
