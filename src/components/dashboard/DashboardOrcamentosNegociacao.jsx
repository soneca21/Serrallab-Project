import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

const DashboardOrcamentosNegociacao = ({ orders }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="h-full shadow-lg hover:shadow-xl transition-shadow duration-300 border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-heading text-foreground">{'Em Negociação'}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/80 gap-1"
            onClick={() => navigate('/app/orcamentos')}
          >
            Ver todos <ArrowRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-surface-strong/70 hover:bg-transparent">
                  <TableHead className="w-[50%] text-center">Cliente</TableHead>
                  <TableHead className="text-center">Valor</TableHead>
                  <TableHead className="text-center">{'Ação'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders && orders.length > 0 ? (
                  orders.map((order) => (
                    <TableRow key={order.id} className="border-surface-strong/70 hover:bg-muted/50 transition-colors">
                      <TableCell className="text-center">
                        <div className="mx-auto flex w-fit items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-orange-500" />
                          </div>
                          <div className="flex flex-col">
                             <span className="font-medium text-foreground truncate max-w-[140px]">
                              {order.title || 'Sem título'}
                            </span>
                            <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                              {new Date(order.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="mx-auto flex w-fit items-center gap-1 font-medium text-emerald-500">
                          {formatCurrency(order.final_price || order.total_cost || 0)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => navigate(`/app/orcamentos/editar/${order.id}`)}
                        >
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      {'Nenhuma negociação ativa'}
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

export default DashboardOrcamentosNegociacao;
