
// Assuming plan is a string identifier like 'basic', 'pro', 'enterprise'

type PlanId = 'basic' | 'pro' | 'enterprise' | string;

export function canSendSms(plan: PlanId): boolean {
  return ['pro', 'enterprise'].includes(plan.toLowerCase());
}

export function canSendWhatsapp(plan: PlanId): boolean {
  return ['enterprise'].includes(plan.toLowerCase());
}

export function canGeneratePdf(plan: PlanId): boolean {
  return ['pro', 'enterprise'].includes(plan.toLowerCase());
}

export function canExportCsv(plan: PlanId): boolean {
  return ['pro', 'enterprise'].includes(plan.toLowerCase());
}

export function canCreateAutomations(plan: PlanId): boolean {
  return ['pro', 'enterprise'].includes(plan.toLowerCase());
}

export function canAccessReports(plan: PlanId): boolean {
  return ['basic', 'pro', 'enterprise'].includes(plan.toLowerCase());
}

export function canScheduleMessages(plan: PlanId): boolean {
  return ['pro', 'enterprise'].includes(plan.toLowerCase());
}
