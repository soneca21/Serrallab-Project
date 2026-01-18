
export const PIPELINE_STAGES = [
  'Novo',
  'Atendimento',
  'Proposta Enviada',
  'Ganho',
  'Perdido'
];

export const ORCAMENTO_STATUS = [
  'pendente',
  'enviado',
  'visualizado',
  'aprovado',
  'rejeitado'
];

export const AUTO_ESCALATION_DAYS_DEFAULT = 7;

export const SLA_DAYS = {
  'Novo': 24, // hours
  'Atendimento': 48,
  'Proposta Enviada': 72,
  'Ganho': 0,
  'Perdido': 0
};
