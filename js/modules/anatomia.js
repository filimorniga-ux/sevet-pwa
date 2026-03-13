/* =========================================
   SEVET – Módulo Anatomía Interactiva
   Explorador anatómico visual de mascotas
   ========================================= */

const ANATOMY_SYSTEMS = [
  { id: 'esqueletico', name: 'Esquelético', icon: '🦴', color: '#e0e0e0' },
  { id: 'muscular', name: 'Muscular', icon: '💪', color: '#ef4444' },
  { id: 'digestivo', name: 'Digestivo', icon: '🫁', color: '#f59e0b' },
  { id: 'nervioso', name: 'Nervioso', icon: '🧠', color: '#8b5cf6' },
  { id: 'circulatorio', name: 'Circulatorio', icon: '❤️', color: '#dc2626' },
  { id: 'respiratorio', name: 'Respiratorio', icon: '🌬️', color: '#06b6d4' },
];

const ANATOMY_POINTS = {
  esqueletico: [
    { x: 50, y: 25, name: 'Cráneo', desc: 'Protege el cerebro. En razas braquicéfalas puede presentar malformaciones.', detail: 'Huesos: frontal, parietal, temporal, occipital' },
    { x: 45, y: 45, name: 'Columna Vertebral', desc: '7 vértebras cervicales, 13 torácicas, 7 lumbares, 3 sacras.', detail: 'Total: ~30 vértebras según la raza' },
    { x: 55, y: 50, name: 'Costillas', desc: '13 pares de costillas. Las últimas 4 son "flotantes".', detail: 'Protegen corazón y pulmones' },
    { x: 35, y: 70, name: 'Extremidades Anteriores', desc: 'Húmero, radio, ulna. Articulación del codo y carpo.', detail: 'Adaptadas para tracción y apoyo' },
    { x: 65, y: 70, name: 'Extremidades Posteriores', desc: 'Fémur, tibia, fíbula. Articulación de la rodilla (displasia).', detail: 'Principal impulso de locomoción' },
    { x: 85, y: 35, name: 'Pelvis', desc: 'Ilion, isquion y pubis. Evaluación para displasia de cadera.', detail: 'Articulación coxofemoral' },
  ],
  muscular: [
    { x: 50, y: 30, name: 'Masetero', desc: 'Músculo de la masticación. Muy desarrollado en razas de mordida fuerte.', detail: 'Inervado por el nervio trigémino' },
    { x: 40, y: 45, name: 'Trapecio', desc: 'Estabiliza la escápula y permite el movimiento de la cabeza.', detail: 'Músculo superficial de la región dorsal' },
    { x: 55, y: 55, name: 'Dorsal Ancho', desc: 'El músculo más grande del tronco. Flexión del hombro.', detail: 'Importancia en rehabilitación física' },
    { x: 35, y: 65, name: 'Bíceps Braquial', desc: 'Flexión del codo. Fundamental para la marcha.', detail: 'Lesión común en perros deportistas' },
    { x: 65, y: 65, name: 'Cuádriceps', desc: 'Extensión de la rodilla. Importante en displasia patelar.', detail: 'Grupo de 4 músculos' },
  ],
  digestivo: [
    { x: 45, y: 28, name: 'Cavidad Oral', desc: 'Inicio del proceso digestivo. Glándulas salivales activas.', detail: '42 dientes en perros adultos' },
    { x: 48, y: 40, name: 'Esófago', desc: 'Transporta alimento al estómago. Megaesófago es una patología común.', detail: 'Longitud: 25-50cm según raza' },
    { x: 52, y: 50, name: 'Estómago', desc: 'pH muy ácido (1-2). Capacidad de 0.5-8L según tamaño del perro.', detail: 'Torsión gástrica: urgencia médica' },
    { x: 55, y: 60, name: 'Intestino Delgado', desc: 'Absorción de nutrientes. 1.8-4.8m de longitud.', detail: 'Duodeno, yeyuno, íleon' },
    { x: 60, y: 65, name: 'Intestino Grueso', desc: 'Absorción de agua y formación de heces. 0.3-0.6m.', detail: 'Ciego, colon, recto' },
    { x: 50, y: 55, name: 'Hígado', desc: 'El órgano interno más grande. Metabolismo y desintoxicación.', detail: '6 lóbulos hepáticos en el perro' },
  ],
  nervioso: [
    { x: 50, y: 22, name: 'Cerebro', desc: 'Centro de procesamiento. Corteza cerebral para funciones cognitivas.', detail: 'Peso: 70-130g según raza' },
    { x: 50, y: 28, name: 'Cerebelo', desc: 'Coordinación motora y equilibrio. Hipoplasia cerebelosa en cachorros.', detail: 'Control de movimiento fino' },
    { x: 48, y: 35, name: 'Médula Espinal', desc: 'Transmisión de señales nerviosas. Hernias discales son comunes.', detail: 'Se extiende por el canal vertebral' },
    { x: 35, y: 55, name: 'Plexo Braquial', desc: 'Red nerviosa para las extremidades anteriores.', detail: 'C6-T2: nervios que lo forman' },
    { x: 65, y: 55, name: 'Nervio Ciático', desc: 'El nervio más largo. Inerva la extremidad posterior.', detail: 'Lesión causa claudicación severa' },
  ],
  circulatorio: [
    { x: 45, y: 45, name: 'Corazón', desc: '4 cámaras. Frecuencia: 60-140 lpm en perros, 120-240 en gatos.', detail: 'Peso: 0.6-1% del peso corporal' },
    { x: 48, y: 38, name: 'Aorta', desc: 'Arteria principal. Distribuye sangre oxigenada a todo el cuerpo.', detail: 'Sale del ventrículo izquierdo' },
    { x: 52, y: 42, name: 'Vena Cava', desc: 'Retorno venoso al corazón. Superior e inferior.', detail: 'Recoge sangre desoxigenada' },
    { x: 40, y: 55, name: 'Arteria Femoral', desc: 'Principal arteria de la extremidad posterior. Sitio de pulso.', detail: 'Usada para monitoreo de signos vitales' },
  ],
  respiratorio: [
    { x: 48, y: 30, name: 'Cavidad Nasal', desc: 'Filtración, calentamiento y humidificación del aire.', detail: '~300 millones de receptores olfatorios' },
    { x: 48, y: 36, name: 'Laringe', desc: 'Control de la vocalización. Parálisis laríngea en razas grandes.', detail: 'Contiene las cuerdas vocales' },
    { x: 48, y: 40, name: 'Tráquea', desc: 'Tubo de anillos cartilaginosos. Colapso traqueal en razas toy.', detail: '35-45 anillos en forma de C' },
    { x: 45, y: 50, name: 'Pulmón Izquierdo', desc: '2 lóbulos (craneal y caudal). Menor volumen que el derecho.', detail: 'El corazón ocupa su espacio' },
    { x: 55, y: 50, name: 'Pulmón Derecho', desc: '4 lóbulos. Mayor capacidad que el izquierdo.', detail: 'Lobos: craneal, medio, caudal, accesorio' },
  ],
};

let activeSystem = 'esqueletico';
let selectedPoint = null;

export function initAnatomia() {
  const container = document.getElementById('anatomia-container');
  if (!container) return;

  container.innerHTML = `
    <div class="anatomy-layout">
      <aside class="anatomy-sidebar">
        <h3 class="anatomy-sidebar-title">Sistemas</h3>
        <div class="anatomy-systems" id="anatomySystems"></div>
        <div class="anatomy-info-card" id="anatomyInfo">
          <p class="anatomy-info-hint">Selecciona un punto en el diagrama para ver información detallada</p>
        </div>
      </aside>
      <div class="anatomy-viewer">
        <div class="anatomy-canvas" id="anatomyCanvas">
          <div class="anatomy-silhouette" id="anatomySilhouette">🐕</div>
          <div class="anatomy-points" id="anatomyPoints"></div>
        </div>
        <div class="anatomy-legend" id="anatomyLegend"></div>
      </div>
    </div>`;

  renderSystems();
  renderPoints();
}

function renderSystems() {
  const el = document.getElementById('anatomySystems');
  if (!el) return;
  el.innerHTML = ANATOMY_SYSTEMS.map(s => `
    <button class="anat-sys-btn ${s.id === activeSystem ? 'active' : ''}"
            onclick="window._selectSystem('${s.id}')" style="--sys-color: ${s.color}">
      <span class="anat-sys-icon">${s.icon}</span>
      <span class="anat-sys-name">${s.name}</span>
    </button>
  `).join('');
}

function renderPoints() {
  const el = document.getElementById('anatomyPoints');
  const legendEl = document.getElementById('anatomyLegend');
  if (!el) return;

  const points = ANATOMY_POINTS[activeSystem] || [];
  const sys = ANATOMY_SYSTEMS.find(s => s.id === activeSystem);

  el.innerHTML = points.map((p, i) => `
    <button class="anat-point ${selectedPoint === i ? 'active' : ''}"
            style="left:${p.x}%; top:${p.y}%; --point-color:${sys.color}"
            onclick="window._selectPoint(${i})"
            title="${p.name}">
      <span class="anat-point-dot"></span>
      <span class="anat-point-label">${p.name}</span>
    </button>
  `).join('');

  if (legendEl) {
    legendEl.innerHTML = `<span class="legend-active">${sys.icon} ${sys.name}</span> · ${points.length} estructuras`;
  }
}

window._selectSystem = function(id) {
  activeSystem = id;
  selectedPoint = null;
  renderSystems();
  renderPoints();
  document.getElementById('anatomyInfo').innerHTML = `
    <p class="anatomy-info-hint">Selecciona un punto en el diagrama para ver información detallada</p>`;
};

window._selectPoint = function(idx) {
  selectedPoint = idx;
  const points = ANATOMY_POINTS[activeSystem] || [];
  const p = points[idx];
  if (!p) return;

  renderPoints();

  const infoEl = document.getElementById('anatomyInfo');
  if (infoEl) {
    infoEl.innerHTML = `
      <h4 class="anatomy-info-title">${p.name}</h4>
      <p class="anatomy-info-desc">${p.desc}</p>
      <div class="anatomy-info-detail">
        <span class="anatomy-detail-label">Detalle clínico:</span>
        ${p.detail}
      </div>`;
  }
};
