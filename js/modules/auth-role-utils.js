/* ============================================================
   SEVET – Utilidades de selección de rol en registro
   Skill activo: rbac-pin-security
   NUNCA se puede autoasignar 'owner' o 'admin' sin código validado.
   ============================================================ */

// Códigos internos por rol (skill: rbac-pin-security)
// En producción mover a server-side validation via Edge Function
const STAFF_CODES = {
  vet:          'VET2024SA',
  groomer:      'GROOM2024SA',
  receptionist: 'RECEP2024SA',
  admin:        'ADMIN2024SA',
  owner:        'DIRECTOR2024SA',
};

/**
 * Mapea la selección del formulario al rol almacenado en la DB.
 * El formulario usa 2 niveles: nivel1 (client|team) + nivel2 (subrole).
 * @param {string} level1 - 'client' | 'team'
 * @param {string} level2 - 'vet' | 'groomer' | 'receptionist' | 'admin' | 'owner' | ''
 * @returns {string} rol de DB
 */
export function mapRoleSelection(level1, level2 = '') {
  if (level1 === 'client') return 'client';
  // Mantener compatibilidad con flujo antiguo (selectedRole = 'staff'|'admin')
  if (level1 === 'staff') return 'vet';
  if (level1 === 'admin') return 'admin';
  // Nuevo flujo de 2 niveles
  const allowed = ['vet','groomer','receptionist','admin','owner'];
  if (level1 === 'team' && allowed.includes(level2)) return level2;
  return 'client';
}

/**
 * Controla qué campos adicionales mostrar en el registro.
 */
export function getRoleFieldVisibility(level1, level2 = '') {
  // Legado (1 nivel)
  if (level1 === 'staff')  return { showStaffCode: true,  showAdminCode: false, showTeamSubrole: false };
  if (level1 === 'admin')  return { showStaffCode: false, showAdminCode: true,  showTeamSubrole: false };
  // Nuevo flujo
  if (level1 === 'team')   return { showStaffCode: false, showAdminCode: false, showTeamSubrole: true, showTeamCode: true };
  return { showStaffCode: false, showAdminCode: false, showTeamSubrole: false };
}

/**
 * Valida la selección de rol y el código ingresado.
 * Devuelve null si OK, o string de error si falla.
 * skill: rbac-pin-security → owner/admin nunca sin código.
 *
 * @param {string} level1 - 'client' | 'team' | 'staff' (legado) | 'admin' (legado)
 * @param {{ staffCode, adminCode, teamCode, teamSubrole }} codes
 */
export function validateRoleSelection(level1, codes = {}) {
  // ── Flujo legado (mantener compatibilidad) ──
  if (level1 === 'staff') {
    const code = String(codes?.staffCode || '').trim();
    if (!code) return 'Ingresa el código de staff para crear perfil profesional.';
    if (code !== STAFF_CODES.vet) return '❌ Código de staff incorrecto. Contacta a la clínica.';
    return null;
  }
  if (level1 === 'admin') {
    const code = String(codes?.adminCode || '').trim();
    if (!code) return 'Ingresa el código administrativo para crear perfil administrativo.';
    if (code !== STAFF_CODES.admin) return '❌ Código administrativo incorrecto.';
    return null;
  }

  // ── Flujo nuevo (2 niveles) ──
  if (level1 === 'team') {
    const subrole = String(codes?.teamSubrole || '').trim();
    const code    = String(codes?.teamCode || '').trim();

    if (!subrole) return 'Selecciona tu rol dentro del equipo.';
    if (!code)    return 'Ingresa el código de acceso proporcionado por la clínica.';

    const expected = STAFF_CODES[subrole];
    if (!expected) return '❌ Rol no válido.';

    // rbac-pin-security: owner y admin tienen validación explícita con mensaje de seguridad
    if (subrole === 'owner' && code !== STAFF_CODES.owner) {
      return '🔒 Acceso denegado. El código de Director es incorrecto o no tienes autorización.';
    }
    if (code !== expected) {
      return `❌ Código incorrecto para el rol seleccionado. Si eres parte del equipo, pídele el código a tu Director/a.`;
    }
    return null;
  }

  // 'client': no requiere código
  return null;
}
