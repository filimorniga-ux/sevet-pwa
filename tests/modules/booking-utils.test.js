import { describe, expect, it } from 'vitest';
import {
  buildCombinedBookingNotes,
  validateGuestBookingInput,
} from '../../js/modules/booking-utils.js';

describe('booking-utils', () => {
  it('valida datos mínimos para agendamiento invitado', () => {
    expect(validateGuestBookingInput({ guestName: '', guestPhone: '123', guestPetName: 'Luna' }))
      .toContain('nombre');
    expect(validateGuestBookingInput({ guestName: 'Ana', guestPhone: '', guestPetName: 'Luna' }))
      .toContain('teléfono');
    expect(validateGuestBookingInput({ guestName: 'Ana', guestPhone: '98765432' }))
      .toContain('mascota');
    expect(validateGuestBookingInput({ guestName: 'Ana', guestPhone: '98765432', guestPetName: 'Luna' }))
      .toBeNull();
  });

  it('construye notas combinadas con metadata de invitado', () => {
    const combined = buildCombinedBookingNotes({
      notes: 'Paciente con tos',
      guestName: 'Ana',
      guestPhone: '+56 9 1234 5678',
      guestEmail: 'ana@test.com',
      guestPetName: 'Luna',
      includeGuestMetadata: true,
    });

    expect(combined).toContain('Paciente con tos');
    expect(combined).toContain('Contacto: Ana');
    expect(combined).toContain('Tel: +56 9 1234 5678');
    expect(combined).toContain('Email: ana@test.com');
    expect(combined).toContain('Mascota: Luna');
  });

  it('mantiene solo notas base cuando no corresponde metadata de invitado', () => {
    const combined = buildCombinedBookingNotes({
      notes: 'Control anual',
      guestName: 'Ana',
      guestPhone: '+56',
      guestEmail: '',
      guestPetName: 'Luna',
      includeGuestMetadata: false,
    });

    expect(combined).toBe('Control anual');
  });
});
