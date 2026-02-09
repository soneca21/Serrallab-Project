
import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Plus, CalendarClock, PlayCircle, PauseCircle, Activity } from 'lucide-react';
import SchedulesList from '@/features/schedules/components/SchedulesList';
import ScheduleMessageForm from '@/features/schedules/components/ScheduleMessageForm';
import ScheduleRunsDrawer from '@/features/schedules/components/ScheduleRunsDrawer';
import { getSchedules, deleteSchedule, toggleSchedule } from '@/features/schedules/api/schedules';
import { MessageSchedule } from '@/types/schedules';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import AppSectionHeader from '@/components/AppSectionHeader';

const SchedulesPage = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    
    // State
    const [schedules, setSchedules] = useState<MessageSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<MessageSchedule | undefined>(undefined);
    
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historySchedule, setHistorySchedule] = useState<MessageSchedule | null>(null);

    useEffect(() => {
        if (user) fetchSchedules();
    }, [user]);

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            const data = await getSchedules();
            setSchedules(data);
        } catch (error) {
            toast({ title: "Erro", description: "Falha ao carregar agendamentos.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteSchedule(id);
            setSchedules(prev => prev.filter(s => s.id !== id));
            toast({ title: "Sucesso", description: "Agendamento excluído." });
        } catch (error) {
            toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" });
        }
    };

    const handleToggle = async (id: string, enabled: boolean) => {
        try {
            await toggleSchedule(id, enabled);
            setSchedules(prev => prev.map(s => s.id === id ? { ...s, enabled } : s));
            toast({ title: "Sucesso", description: `Agendamento ${enabled ? 'ativado' : 'pausado'}.` });
        } catch (error) {
            toast({ title: "Erro", description: "Falha ao alterar status.", variant: "destructive" });
        }
    };

    // Stats
    const totalActive = schedules.filter(s => s.enabled).length;
    const totalPaused = schedules.length - totalActive;

    return (
        <HelmetProvider>
            <Helmet><title>Agendamentos - Serrallab</title></Helmet>
            <div className="space-y-8 pb-8">
                {/* Header Section */}
                <AppSectionHeader
                    title="Agendamentos"
                    description="Programe mensagens recorrentes, lembretes e follow-ups automáticos."
                    actions={
                        <Button onClick={() => { setEditingSchedule(undefined); setIsFormOpen(true); }} className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" /> Novo Agendamento
                        </Button>
                    }
                />

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="rounded-xl shadow-sm bg-card hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                                <CalendarClock className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Agendado</p>
                                <p className="text-2xl font-bold text-foreground">{schedules.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="rounded-xl shadow-sm bg-card hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
                                <PlayCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                                <p className="text-2xl font-bold text-foreground">{totalActive}</p>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="rounded-xl shadow-sm bg-card hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 rounded-full bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/20">
                                <PauseCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Pausados</p>
                                <p className="text-2xl font-bold text-foreground">{totalPaused}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main List */}
                <SchedulesList 
                    schedules={schedules} 
                    isLoading={loading}
                    onEdit={(s) => { setEditingSchedule(s); setIsFormOpen(true); }}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                    onViewHistory={(s) => { setHistorySchedule(s); setIsHistoryOpen(true); }}
                />

                {/* Create/Edit Modal */}
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
                        <DialogHeader>
                            <DialogTitle className="text-foreground">
                                {editingSchedule ? 'Editar Agendamento' : 'Novo Agendamento'}
                            </DialogTitle>
                        </DialogHeader>
                        <ScheduleMessageForm 
                            schedule={editingSchedule}
                            onSave={() => { setIsFormOpen(false); fetchSchedules(); }}
                            onCancel={() => setIsFormOpen(false)}
                        />
                    </DialogContent>
                </Dialog>

                {/* History Drawer */}
                <ScheduleRunsDrawer 
                    isOpen={isHistoryOpen}
                    onClose={() => setIsHistoryOpen(false)}
                    schedule={historySchedule}
                />
            </div>
        </HelmetProvider>
    );
};

export default SchedulesPage;

