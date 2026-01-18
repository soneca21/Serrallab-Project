
import { PlanType } from '@/types/db'; // Assuming this type exists or we define loose types

export const PLAN_LIMITS = {
  basic: { sms: 0, whatsapp: 0, pdfs: 0, automations: 0 },
  pro: { sms: 1000, whatsapp: 0, pdfs: 200, automations: 2000 },
  enterprise: { sms: 10000, whatsapp: 5000, pdfs: 2000, automations: 20000 },
};

export const RATE_LIMITS = {
  send_message: 100,
  generate_pdf: 30,
  export_csv: 10,
  automation: 300,
};

export function getMonthlyLimit(plan: string = 'basic', feature: keyof typeof PLAN_LIMITS.basic): number {
  const p = plan.toLowerCase() as keyof typeof PLAN_LIMITS;
  return PLAN_LIMITS[p]?.[feature] ?? 0;
}

export function getRateLimit(scope: keyof typeof RATE_LIMITS): number {
  return RATE_LIMITS[scope] ?? 0;
}

export function formatLimitMessage(used: number, limit: number): string {
  if (limit === 0) return 'Funcionalidade não disponível no seu plano';
  const pct = Math.round((used / limit) * 100);
  return `${used} / ${limit} (${pct}%)`;
}
