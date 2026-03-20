import { describe, it, expect } from 'vitest';
import { validateGuestBookingInput } from '../../js/modules/booking-utils.js';

describe('agendamiento.js utils', () => {
  it('_confirmBooking lanza error si faltan campos obligatorios', () => {
    expect(validateGuestBookingInput({ guestName: '', guestPhone: '', guestPetName: '' })).toBe('Ingresa tu nombre para continuar.');
    expect(validateGuestBookingInput({ guestName: 'Juan', guestPhone: '', guestPetName: '' })).toBe('Ingresa un teléfono válido.');
    expect(validateGuestBookingInput({ guestName: 'Juan', guestPhone: '123', guestPetName: '' })).toBe('Ingresa un teléfono válido.');
    expect(validateGuestBookingInput({ guestName: 'Juan', guestPhone: '+56912345678', guestEmail: 'invalid', guestPetName: '' })).toBe('Ingresa un correo válido.');
    expect(validateGuestBookingInput({ guestName: 'Juan', guestPhone: '12345678', guestEmail: 'test@example.com', guestPetName: '' })).toBe('Ingresa el nombre de tu mascota.');
    expect(validateGuestBookingInput({ guestName: 'Juan', guestPhone: '12345678', guestPetName: 'Rex' })).toBeNull();
  });
});
