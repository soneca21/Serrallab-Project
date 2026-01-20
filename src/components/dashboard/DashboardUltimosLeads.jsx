
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Phone, User } from 'lucide-react';
import { motion } from 'framer-motion';

const DashboardUltimosLeads = ({ leads }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
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

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="h-full shadow-lg hover:shadow-xl transition-shadow duration-300 border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-heading text-foreground">{'\u00daltimos Leads'}</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-primary/80 gap-1"
            onClick={() => navigate('/app/leads')}
          >
            Ver todos <ArrowRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[40%] text-center">Lead</TableHead>
                  <TableHead className="text-center">Contato</TableHead>
                  <TableHead className="text-center">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads && leads.length > 0 ? (
                  leads.map((lead) => (
                    <TableRow key={lead.id} className="border-border hover:bg-muted/50 transition-colors">
                      <TableCell className="text-center">
                        <div className="mx-auto flex w-fit items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground truncate max-w-[120px]">
                              {lead.name || 'Sem nome'}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="mx-auto flex w-fit items-center gap-2 text-muted-foreground text-sm">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {formatDate(lead.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      Nenhum lead recente
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

export default DashboardUltimosLeads;



