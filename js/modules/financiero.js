/* =========================================
   SEVET – Módulo 10: Panel Financiero
   Dashboard administrativo y analíticas
   ========================================= */

const MONTHLY_DATA = {
  ingresos: 12450000,
  consultas: 342,
  nuevosClientes: 58,
  ticketPromedio: 36400,
  crecimiento: 12.5,
};

const REVENUE_BY_SERVICE = [
  { name: 'Consultas', value: 4200000, pct: 33.7, color: '#2563eb' },
  { name: 'Cirugías', value: 2800000, pct: 22.5, color: '#7c3aed' },
  { name: 'Peluquería', value: 1900000, pct: 15.3, color: '#06b6d4' },
  { name: 'Tienda', value: 1600000, pct: 12.8, color: '#10b981' },
  { name: 'Vacunas', value: 1100000, pct: 8.8, color: '#f59e0b' },
  { name: 'Telemedicina', value: 850000, pct: 6.9, color: '#ef4444' },
];

const MONTHLY_TREND = [
  { month: 'Sep', value: 9200000 },
  { month: 'Oct', value: 9800000 },
  { month: 'Nov', value: 10500000 },
  { month: 'Dic', value: 11200000 },
  { month: 'Ene', value: 10800000 },
  { month: 'Feb', value: 11900000 },
  { month: 'Mar', value: 12450000 },
];

const TOP_CLIENTS = [
  { name: 'María González', pets: 3, total: 890000, visits: 12 },
  { name: 'Carlos Rodríguez', pets: 2, total: 650000, visits: 8 },
  { name: 'Ana Martínez', pets: 1, total: 520000, visits: 15 },
  { name: 'Pedro Silva', pets: 4, total: 480000, visits: 6 },
  { name: 'Laura Muñoz', pets: 2, total: 420000, visits: 9 },
];

const RECENT_TRANSACTIONS = [
  { date: '12 Mar', desc: 'Consulta + Hemograma – Luna', amount: 45000, type: 'ingreso' },
  { date: '12 Mar', desc: 'Royal Canin Gastrointestinal x2', amount: 67800, type: 'ingreso' },
  { date: '11 Mar', desc: 'Cirugía OVH – Misha', amount: 180000, type: 'ingreso' },
  { date: '11 Mar', desc: 'Reposición inventario farmacia', amount: -320000, type: 'egreso' },
  { date: '10 Mar', desc: 'Baño Premium + Corte – Rocky', amount: 29990, type: 'ingreso' },
  { date: '10 Mar', desc: 'Telemedicina – Dra. Reyes', amount: 25000, type: 'ingreso' },
];

export function initFinanciero() {
  const container = document.getElementById('financiero-container');
  if (!container) return;

  container.innerHTML = `
    <div class="fin-kpis">
      <div class="fin-kpi">
        <div class="fin-kpi-icon">💰</div>
        <div class="fin-kpi-data">
          <div class="fin-kpi-value">$${(MONTHLY_DATA.ingresos / 1000000).toFixed(1)}M</div>
          <div class="fin-kpi-label">Ingresos del mes</div>
        </div>
        <div class="fin-kpi-trend up">↑ ${MONTHLY_DATA.crecimiento}%</div>
      </div>
      <div class="fin-kpi">
        <div class="fin-kpi-icon">📊</div>
        <div class="fin-kpi-data">
          <div class="fin-kpi-value">${MONTHLY_DATA.consultas}</div>
          <div class="fin-kpi-label">Consultas realizadas</div>
        </div>
        <div class="fin-kpi-trend up">↑ 8.2%</div>
      </div>
      <div class="fin-kpi">
        <div class="fin-kpi-icon">👥</div>
        <div class="fin-kpi-data">
          <div class="fin-kpi-value">${MONTHLY_DATA.nuevosClientes}</div>
          <div class="fin-kpi-label">Nuevos clientes</div>
        </div>
        <div class="fin-kpi-trend up">↑ 15.3%</div>
      </div>
      <div class="fin-kpi">
        <div class="fin-kpi-icon">🎯</div>
        <div class="fin-kpi-data">
          <div class="fin-kpi-value">$${(MONTHLY_DATA.ticketPromedio / 1000).toFixed(1)}K</div>
          <div class="fin-kpi-label">Ticket promedio</div>
        </div>
        <div class="fin-kpi-trend up">↑ 4.1%</div>
      </div>
    </div>

    <div class="fin-charts-grid">
      <div class="fin-chart-card">
        <h4 class="fin-chart-title">📈 Tendencia Mensual de Ingresos</h4>
        <div class="fin-bar-chart">
          ${MONTHLY_TREND.map(m => {
            const maxVal = Math.max(...MONTHLY_TREND.map(t => t.value));
            const pct = (m.value / maxVal) * 100;
            return `
              <div class="fin-bar-col">
                <div class="fin-bar" style="height:${pct}%"></div>
                <div class="fin-bar-label">${m.month}</div>
                <div class="fin-bar-value">$${(m.value / 1000000).toFixed(1)}M</div>
              </div>`;
          }).join('')}
        </div>
      </div>
      <div class="fin-chart-card">
        <h4 class="fin-chart-title">🍩 Ingresos por Servicio</h4>
        <div class="fin-donut-list">
          ${REVENUE_BY_SERVICE.map(s => `
            <div class="fin-donut-item">
              <div class="fin-donut-color" style="background:${s.color}"></div>
              <div class="fin-donut-name">${s.name}</div>
              <div class="fin-donut-bar-wrap">
                <div class="fin-donut-bar" style="width:${s.pct}%; background:${s.color}"></div>
              </div>
              <div class="fin-donut-pct">${s.pct}%</div>
              <div class="fin-donut-val">$${(s.value / 1000).toFixed(0)}K</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="fin-bottom-grid">
      <div class="fin-chart-card">
        <h4 class="fin-chart-title">🏆 Top Clientes</h4>
        <table class="fin-table">
          <thead>
            <tr><th>Cliente</th><th>Mascotas</th><th>Visitas</th><th>Total</th></tr>
          </thead>
          <tbody>
            ${TOP_CLIENTS.map((c, i) => `
              <tr>
                <td><span class="fin-rank">#${i + 1}</span> ${c.name}</td>
                <td>${c.pets}</td>
                <td>${c.visits}</td>
                <td class="fin-amount">$${(c.total / 1000).toFixed(0)}K</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="fin-chart-card">
        <h4 class="fin-chart-title">💳 Últimas Transacciones</h4>
        <div class="fin-transactions">
          ${RECENT_TRANSACTIONS.map(t => `
            <div class="fin-tx">
              <div class="fin-tx-date">${t.date}</div>
              <div class="fin-tx-desc">${t.desc}</div>
              <div class="fin-tx-amount ${t.type}">${t.type === 'egreso' ? '' : '+'}$${Math.abs(t.amount).toLocaleString('es-CL')}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
}
