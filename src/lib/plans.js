
export const PLANS = {
  BASIC: 'basic',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
};

export const PLAN_FEATURES = {
  [PLANS.BASIC]: ['clientes:50', 'orcamentos:100', 'usuarios:1', 'pipeline', 'suporte:email'],
  [PLANS.PRO]: ['clientes:500', 'orcamentos:1000', 'usuarios:3', 'pipeline', 'catalogo', 'relatorios', 'suporte:prioridade', 'sms', 'notifications'],
  [PLANS.ENTERPRISE]: ['clientes:unlimited', 'orcamentos:unlimited', 'usuarios:unlimited', 'pipeline', 'catalogo', 'relatorios', 'api_access', 'suporte:24h', 'sms', 'whatsapp', 'notifications']
};

export function getPlanById(id) {
    const map = {
        'basic': { id: 'basic', name: 'Plano Básico' },
        'pro': { id: 'pro', name: 'Plano Profissional' },
        'enterprise': { id: 'enterprise', name: 'Plano Empresarial' }
    };
    return map[id];
}

export function getFeaturesByPlan(planId) {
    return PLAN_FEATURES[planId] || [];
}

export function canAccessFeature(planId, feature) {
    const features = getFeaturesByPlan(planId);
    // Exact match or prefix match (e.g. clientes:50)
    return features.includes(feature) || features.some(f => f.startsWith(feature));
}
