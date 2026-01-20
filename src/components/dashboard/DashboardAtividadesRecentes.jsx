import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const ACTION_LABELS = {
  create: 'Criado',
  update: 'Atualizado',
  delete: 'Exclu\u00eddo',
  login: 'Login',
  logout: 'Logout',
};

const ENTITY_LABELS = {
  cliente: 'Cliente',
  fornecedor: 'Fornecedor',
  orcamento: 'Or\u00e7amento',
  pedido: 'Pedido',
  lead: 'Lead',
  usuario: 'Usu\u00e1rio',
};

const formatRelativeDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Hoje';
  if (diffDays === 2) return 'Ontem';
  if (diffDays <= 7) return `H\u00e1 ${diffDays} dias`;

  return date.toLocaleDateString('pt-BR');
};

const DashboardAtividadesRecentes = ({ logs }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.35 }}
    >
      <Card className="h-full shadow-lg hover:shadow-xl transition-shadow duration-300 border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-heading text-foreground flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" /> {'Atividades recentes'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/80 gap-1"
            onClick={() => navigate('/app/config?tab=audit')}
          >
            {'Ver auditoria'} <ArrowRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[35%] text-center">{'A\u00e7\u00e3o'}</TableHead>
                  <TableHead className="text-center">Entidade</TableHead>
                  <TableHead className="text-center">{'Quando'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs && logs.length > 0 ? (
                  logs.map((log) => (
                    <TableRow key={log.id} className="border-border hover:bg-muted/50 transition-colors">
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[10px] uppercase inline-flex mx-auto">
                          {ACTION_LABELS[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {ENTITY_LABELS[log.entity] || log.entity || '-'}
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {formatRelativeDate(log.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      {'Sem atividades recentes'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DashboardAtividadesRecentes;



