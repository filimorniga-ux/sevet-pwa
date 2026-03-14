export function normalizeServiceClassifier(value) {
  return (value || '').toString().trim().toLowerCase();
}

export function buildServicePriceIndex(services) {
  const byId = new Map();
  const byClassifier = new Map();

  (services || []).forEach((service) => {
    if (service?.id) byId.set(service.id, Number(service.price) || 0);

    const classifier = normalizeServiceClassifier(service?.specialty || service?.category);
    if (!classifier) return;
    if (!byClassifier.has(classifier)) {
      byClassifier.set(classifier, Number(service.price) || 0);
    }
  });

  return { byId, byClassifier };
}

export function estimateAppointmentRevenue(appointments, serviceIndex) {
  const safeAppointments = appointments || [];
  if (!serviceIndex) return 0;

  return safeAppointments.reduce((acc, appt) => {
    const byIdPrice = appt?.service_id ? serviceIndex.byId.get(appt.service_id) : undefined;
    if (typeof byIdPrice === 'number') return acc + byIdPrice;

    const classifier = normalizeServiceClassifier(appt?.service_type);
    const byClassifierPrice = serviceIndex.byClassifier.get(classifier);
    return acc + (typeof byClassifierPrice === 'number' ? byClassifierPrice : 0);
  }, 0);
}

export function calculateStockAfterMovement(currentStock, movementType, quantity) {
  const base = Math.max(0, Number(currentStock) || 0);
  const qty = Math.abs(Number(quantity) || 0);

  if (movementType === 'entrada') return base + qty;
  if (movementType === 'salida') return Math.max(0, base - qty);
  return base;
}
