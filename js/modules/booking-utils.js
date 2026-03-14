export function validateGuestBookingInput({ guestName, guestPhone, guestPetName }) {
  const safeName = String(guestName || '').trim();
  const safePhone = String(guestPhone || '').trim();
  const safePet = String(guestPetName || '').trim();

  if (!safeName) return 'Ingresa tu nombre para continuar.';
  if (!safePhone) return 'Ingresa un teléfono de contacto.';
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
