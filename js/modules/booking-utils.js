export function validateGuestBookingInput({ guestName, guestPhone, guestPetName, guestEmail }) {
  const safeName = String(guestName || '').trim();
  const safePhone = String(guestPhone || '').trim();
  const safePet = String(guestPetName || '').trim();
  const safeEmail = String(guestEmail || '').trim();

  if (!safeName) return 'Ingresa tu nombre para continuar.';

  const phoneRegex = /^\+?[\d\s-]{8,15}$/;
  if (!safePhone || !phoneRegex.test(safePhone)) return 'Ingresa un teléfono válido.';

  if (safeEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(safeEmail)) return 'Ingresa un correo válido.';
  }

  if (!safePet) return 'Ingresa el nombre de tu mascota.';
  return null;
}

export function buildCombinedBookingNotes({
  notes,
  guestName,
  guestPhone,
  guestEmail,
  guestPetName,
  includeGuestMetadata,
}) {
  const baseNotes = String(notes || '').trim();
  if (!includeGuestMetadata) return baseNotes;

  const segments = [
    baseNotes,
    guestName ? `Contacto: ${guestName}` : '',
    guestPhone ? `Tel: ${guestPhone}` : '',
    guestEmail ? `Email: ${guestEmail}` : '',
    guestPetName ? `Mascota: ${guestPetName}` : '',
  ].filter(Boolean);

  return segments.join(' | ');
}
