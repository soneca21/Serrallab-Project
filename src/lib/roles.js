const normalizeRole = (role) => (typeof role === 'string' ? role.toLowerCase() : '');

export const isSystemAdmin = (profile, user) => {
  const role = normalizeRole(profile?.role || user?.user_metadata?.role);
  return role === 'admin' || role === 'system_admin';
};
