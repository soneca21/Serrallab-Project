
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MessageRetryRule } from '@/types/automation';
import { getTriggerEventLabel, getActionLabel } from '@/lib/messaging';
import { Edit2, Trash2, Plus } from 'lucide-react';

interface AutomationRulesListProps {
  rules: MessageRetryRule[];
  onEdit: (rule: MessageRetryRule) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  isLoading: boolean;
}

const AutomationRulesList: React.FC<AutomationRulesListProps> = ({ rules, onEdit, onDelete, onCreate, isLoading }) => {
  if (isLoading) return <div className="p-4 text-center">Carregando regras...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Regras Ativas</h3>
        <Button onClick={onCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Nova Regra
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Gatilho</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Nenhuma regra de automação configurada.
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>{getTriggerEventLabel(rule.trigger_event)}</TableCell>
                    <TableCell>{getActionLabel(rule.action)}</TableCell>
                    <TableCell>
                      <Badge variant={rule.enabled ? "default" : "secondary"}>
                        {rule.enabled ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(rule)}>
                        <Edit2 className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => {
                        if (confirm('Tem certeza que deseja excluir esta regra?')) {
                          onDelete(rule.id);
                        }
                      }}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomationRulesList;
