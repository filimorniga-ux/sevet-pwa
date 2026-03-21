import { describe, expect, it } from 'vitest';
import {
  getRoleFieldVisibility,
  mapRoleSelection,
  validateRoleSelection,
} from '../../js/modules/auth-role-utils.js';

describe('auth-role-utils', () => {
  it('mapea selección de UI al rol persistido', () => {
    expect(mapRoleSelection('client')).toBe('client');
    expect(mapRoleSelection('staff')).toBe('vet');
    expect(mapRoleSelection('admin')).toBe('admin');
    expect(mapRoleSelection('desconocido')).toBe('client');
  });

  it('expone visibilidad correcta para campos de código', () => {
    expect(getRoleFieldVisibility('client')).toEqual({ showStaffCode: false, showAdminCode: false, showTeamSubrole: false });
    expect(getRoleFieldVisibility('staff')).toEqual({ showStaffCode: true, showAdminCode: false, showTeamSubrole: false });
    expect(getRoleFieldVisibility('admin')).toEqual({ showStaffCode: false, showAdminCode: true, showTeamSubrole: false });
  });

  it('valida códigos requeridos según rol', () => {
    expect(validateRoleSelection('client', {})).toBeNull();
    expect(validateRoleSelection('staff', { staffCode: '' })).toContain('staff');
    expect(validateRoleSelection('admin', { adminCode: '' })).toContain('administrativo');
    expect(validateRoleSelection('staff', { staffCode: 'VET2024SA' })).toBeNull();
    expect(validateRoleSelection('admin', { adminCode: 'ADMIN2024SA' })).toBeNull();
  });
});
