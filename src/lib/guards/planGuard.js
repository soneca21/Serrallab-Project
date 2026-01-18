
import { canAccessFeature } from '@/lib/plans';

/**
 * Checks if the current plan allows a specific feature
 * @param {string} requiredFeature 
 * @param {object|null} currentPlan 
 * @returns {{allowed: boolean, message: string}}
 */
export function planGuard(requiredFeature, currentPlan) {
  if (!currentPlan) {
    return { 
      allowed: false, 
      message: "Você precisa de uma assinatura ativa para acessar esta funcionalidade." 
    };
  }

  // Use the plan_id from the DB object
  const planId = currentPlan.id; // Assuming plan object has id = 'basic'|'pro'|'enterprise' or similar from plans table
  
  // Hard check for messaging features based on plan constants
  if (requiredFeature === 'sms' && !canAccessFeature(planId, 'sms')) {
       return { allowed: false, message: "Envio de SMS disponível apenas no Plano Pro ou superior." };
  }
  
  if (requiredFeature === 'whatsapp' && !canAccessFeature(planId, 'whatsapp')) {
       return { allowed: false, message: "Envio de WhatsApp disponível apenas no Plano Enterprise." };
  }

  // Generic check using lib/plans
  if (canAccessFeature(planId, requiredFeature)) {
    return { allowed: true, message: "" };
  }
  
  // Check dynamic DB features if passed in object
  if (currentPlan.features && currentPlan.features[requiredFeature] === true) {
      return { allowed: true, message: "" };
  }

  return { 
    allowed: false, 
    message: "Faça upgrade do seu plano para desbloquear esta funcionalidade." 
  };
}
