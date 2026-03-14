export function mapRoleSelection(selectedRole) {
  if (selectedRole === 'staff') return 'vet';
  if (selectedRole === 'admin') return 'admin';
  return 'client';
}

export function getRoleFieldVisibility(selectedRole) {
  return {
    showStaffCode: selectedRole === 'staff',
    showAdminCode: selectedRole === 'admin',
  };
}

export function validateRoleSelection(selectedRole, codes) {
  if (selectedRole === 'staff' && !String(codes?.staffCode || '').trim()) {
    return 'Ingresa el código de staff para crear perfil profesional.';
  }

  if (selectedRole === 'admin' && !String(codes?.adminCode || '').trim()) {
    return 'Ingresa el código administrativo para crear perfil administrativo.';
  }

  return null;
}
