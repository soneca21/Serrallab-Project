
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Filter } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { PERIOD_PRESETS } from '@/lib/reports';
import { cn } from '@/lib/utils';

interface PeriodFilterProps {
  period_start: string;
  period_end: string;
  onPeriodChange: (start: string, end: string) => void;
}

const PeriodFilter: React.FC<PeriodFilterProps> = ({ period_start, period_end, onPeriodChange }) => {
  const [start, setStart] = useState(period_start.split('T')[0]);
  const [end, setEnd] = useState(period_end.split('T')[0]);
  const [error, setError] = useState<string | null>(null);

  const validateAndSet = (s: string, e: string) => {
    const d1 = new Date(s);
    const d2 = new Date(e);
    
    if (d1 > d2) {
      setError('Data inicial deve ser menor que a final');
      return false;
    }
    if (differenceInDays(d2, d1) > 365) {
      setError('O período máximo é de 365 dias');
      return false;
    }
    setError(null);
    return true;
  };

  const handleApply = () => {
    if (validateAndSet(start, end)) {
      // Append time to ensure full day coverage
      onPeriodChange(new Date(start).toISOString(), new Date(end).toISOString());
    }
  };

  const handlePreset = (preset: typeof PERIOD_PRESETS.TODAY) => {
    const s = preset.start.split('T')[0];
    const e = preset.end.split('T')[0];
    setStart(s);
    setEnd(e);
    setError(null);
    onPeriodChange(preset.start, preset.end);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
      <div className="flex items-center gap-2">
         <Filter className="h-4 w-4 text-muted-foreground" />
         <span className="text-sm font-medium">Filtrar Período:</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {Object.values(PERIOD_PRESETS).slice(0, 3).map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={() => handlePreset(preset)}
            className="text-xs h-8"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <div className="grid gap-1">
            <Input 
                type="date" 
                value={start} 
                onChange={(e) => {
                    setStart(e.target.value);
                    validateAndSet(e.target.value, end);
                }} 
                className="h-8 w-36 text-xs"
            />
        </div>
        <span className="text-muted-foreground">-</span>
        <div className="grid gap-1">
            <Input 
                type="date" 
                value={end} 
                onChange={(e) => {
                    setEnd(e.target.value);
                    validateAndSet(start, e.target.value);
                }} 
                className="h-8 w-36 text-xs"
            />
        </div>
        <Button size="sm" onClick={handleApply} disabled={!!error} className="h-8">
            Aplicar
        </Button>
      </div>
      {error && <span className="text-xs text-red-500 absolute bottom-1 right-4">{error}</span>}
    </div>
  );
};

export default PeriodFilter;
