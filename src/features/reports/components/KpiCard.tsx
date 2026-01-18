
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  color?: string; // e.g., 'bg-blue-500'
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, change, icon, color = 'bg-primary' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
              <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
              {change !== undefined && (
                <div className={cn("flex items-center mt-1 text-xs", change >= 0 ? "text-green-600" : "text-red-600")}>
                  {change >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  <span className="font-medium">{Math.abs(change)}%</span>
                  <span className="text-muted-foreground ml-1">vs. período anterior</span>
                </div>
              )}
            </div>
            {icon && (
              <div className={cn("p-3 rounded-full text-white shadow-sm", color)}>
                {icon}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default KpiCard;
