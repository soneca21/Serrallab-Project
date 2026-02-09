export const TEAM_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

export const ROLE_META = {
  [TEAM_ROLES.OWNER]: {
    label: 'Proprietário',
    description: 'Controle total da organização, faturamento e usuários.',
    badge: 'default',
  },
  [TEAM_ROLES.ADMIN]: {
    label: 'Administrador',
    description: 'Gerencia operações e configurações, sem acesso ao faturamento.',
    badge: 'secondary',
  },
  [TEAM_ROLES.EDITOR]: {
    label: 'Editor',
    description: 'Cria e atualiza clientes, orçamentos e agendamentos.',
    badge: 'outline',
  },
  [TEAM_ROLES.VIEWER]: {
    label: 'Visualizador',
    description: 'Acesso somente leitura aos dados essenciais.',
    badge: 'outline',
  },
};

export const PERMISSION_MATRIX = [
  { key: 'dashboard', label: 'Ver dashboard', owner: true, admin: true, editor: true, viewer: true },
  { key: 'clients', label: 'Gerenciar clientes', owner: true, admin: true, editor: true, viewer: false },
  { key: 'quotes', label: 'Criar/editar orçamentos', owner: true, admin: true, editor: true, viewer: false },
  { key: 'pipeline', label: 'Atualizar pipeline', owner: true, admin: true, editor: true, viewer: false },
  { key: 'schedules', label: 'Gerenciar agendamentos', owner: true, admin: true, editor: true, viewer: false },
  { key: 'materials', label: 'Gerenciar materiais', owner: true, admin: true, editor: true, viewer: false },
  { key: 'reports', label: 'Ver relatórios', owner: true, admin: true, editor: true, viewer: true },
  { key: 'integrations', label: 'Canais e integrações', owner: true, admin: true, editor: false, viewer: false },
  { key: 'security', label: 'Segurança e 2FA', owner: true, admin: true, editor: false, viewer: false },
  { key: 'team', label: 'Gerenciar equipe', owner: true, admin: true, editor: false, viewer: false },
  { key: 'billing', label: 'Planos e faturamento', owner: true, admin: false, editor: false, viewer: false },
];

export const hasPermission = (role, permissionKey) => {
  if (!permissionKey) return true;
  if (!role) return false;
  if (role === 'system_admin') return true;
  if (role === TEAM_ROLES.OWNER) return true;
  const row = PERMISSION_MATRIX.find((item) => item.key === permissionKey);
  if (!row) return false;
  return Boolean(row[role]);
};
