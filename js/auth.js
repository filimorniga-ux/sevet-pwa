/* =========================================
   SEVET – Módulo de Autenticación
   Ecosistema Pet-Tech 360
   ========================================= */

import { supabase } from './supabase.js';

// ── Estado de sesión ──
let currentUser = null;
let currentProfile = null;
let initialized = false;
let appNavListenersAdded = false;

function escapeHtml(unsafe) {
  if (unsafe == null) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ── Role config ──
const ROLE_CONFIG = {
  client:       { label: 'Dueño/a',        home: '/pages/mi-mascota.html',   icon: '🐕', color: '#3b82f6' },
  vet:          { label: 'Veterinario/a',   home: '/pages/mi-agenda.html',    icon: '🩺', color: '#16a34a' },
  groomer:      { label: 'Peluquero/a',     home: '/pages/mi-agenda.html',    icon: '✂️', color: '#7c3aed' },
  receptionist: { label: 'Recepcionista',   home: '/pages/gestion-citas.html',icon: '📋', color: '#ea580c' },
  admin:        { label: 'Administrador/a', home: '/pages/admin.html',        icon: '⚙️', color: '#1e293b' },
  owner:        { label: 'Director/a',      home: '/pages/admin.html',        icon: '🏥', color: '#6b1d73' },
};

// ── Inicializar Auth ──
export async function initAuth() {
  if (initialized) return;
  initialized = true;

  // 1) Recuperar sesión existente de forma síncrona ANTES de escuchar cambios
  //    Esto evita el flash de "sin sesión" al navegar entre páginas
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      currentUser = session.user;
      currentProfile = await fetchProfile(session.user.id);
      updateNavbarForRole(currentProfile, currentUser);
      document.dispatchEvent(new CustomEvent('auth:ready', {
        detail: { user: currentUser, profile: currentProfile }
      }));
    } else {
      updateNavbarForRole(null);
    }
  } catch (err) {
    console.warn('[auth] getSession error:', err);
    updateNavbarForRole(null);
  }

  // 2) Escuchar cambios dinámicos (login/logout en vivo)
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (['INITIAL_SESSION', 'SIGNED_IN', 'PASSWORD_RECOVERY'].includes(event) && session?.user) {
      if (currentUser?.id === session.user.id && event === 'INITIAL_SESSION') return;
      currentUser = session.user;
      currentProfile = await fetchProfile(session.user.id);
      updateNavbarForRole(currentProfile, currentUser);

      // ── Capturar token de Google Calendar al hacer login con Google ──
      if (event === 'SIGNED_IN' && session.provider_token && session.user.app_metadata?.provider === 'google') {
        try {
          const tokenExpires = new Date(Date.now() + 3600 * 1000).toISOString();
          await supabase.from('user_tokens').upsert({
            user_id:              session.user.id,
            google_access_token:  session.provider_token,
            google_refresh_token: session.provider_refresh_token ?? undefined,
            google_token_expires: tokenExpires,
            gcal_enabled:         !!(session.provider_refresh_token),
          }, { onConflict: 'user_id' });
          console.info('[auth] Google Calendar tokens guardados ✅');
        } catch (err) {
          console.warn('[auth] No se pudieron guardar tokens de Google Calendar:', err);
        }
      }

      document.dispatchEvent(new CustomEvent('auth:login', {
        detail: { user: currentUser, profile: currentProfile }
      }));
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      currentProfile = null;
      updateNavbarForRole(null);
      document.dispatchEvent(new CustomEvent('auth:logout'));
    }
    // Ignorar eventos TOKEN_REFRESHED, USER_UPDATED, etc. para evitar re-renders innecesarios
  });
}

// ── Registro con email ──
export async function signUp(email, password, fullName, phone) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone } },
  });
  if (error) throw error;
  return data;
}

// ── Login con email ──
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// ── Login con Google ──
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      scopes: 'https://www.googleapis.com/auth/calendar.events',
      queryParams: {
        access_type: 'offline', // Necesario para obtener refresh_token y sincronizar GCal
        prompt: 'consent',      // Fuerza pantalla de consentimiento para que el usuario acepte Calendar
      },
    },
  });
  if (error) throw error;
  return data;
}

// ── Cerrar sesión (limpia todo) ──
export async function signOut() {
  try { await supabase.auth.signOut(); } catch (err) { console.warn('signOut:', err); } finally { _cleanStorage(); }
}

function _cleanStorage() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith('sb-')) localStorage.removeItem(k);
    }
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && (k.startsWith('sb-') || k === 'skipProfile')) sessionStorage.removeItem(k);
    }
  } catch (err) {}
}

// ── Logout global (llamable desde HTML inline) ──
window.signOutUser = async function(e) {
  if (e) e.preventDefault();
  try {
    await signOut();
  } finally {
    window.location.replace('/');
  }
};

// ── Obtener perfil ──
async function fetchProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116' && error.name !== 'AbortError') {
      console.warn('[auth] Perfil no encontrado:', error.message);
    }
    return data || null;
  } catch (err) {
    console.warn('[auth] Error de red al obtener perfil:', err.message ?? err);
    return null;
  }
}

// ── Page Guard ──
export async function guardPage(allowedRoles) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { window.location.href = '/pages/auth.html'; return null; }

  const { data: profile } = await supabase
    .from('profiles').select('*')
    .eq('user_id', session.user.id).single();

  if (!profile || !allowedRoles.includes(profile.role)) {
    window.location.href = '/?error=unauthorized';
    return null;
  }
  return profile;
}

// ── Redirect by role ──
export function redirectByRole(role) {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.client;
  window.location.href = config.home;
}

// ── Dynamic Navbar Update + Session Pill ──
function updateNavbarForRole(profile, user = null) {
  const navLinks = document.getElementById('navLinks');
  if (!navLinks) return;

  // Limpiar ítems anteriores de rol
  navLinks.querySelectorAll('.nav-role-item').forEach(el => el.remove());

  // Limpiar session pill previa
  document.getElementById('sessionPill')?.remove();

  if (!profile && !user) {
    // Sin sesión: asegurarse de que el botón de login es visible
    const loginBtn = navLinks.querySelector('.nav-login-btn');
    if (loginBtn) loginBtn.style.display = '';
    const ctaBtn = navLinks.querySelector('.nav-cta');
    if (ctaBtn && ctaBtn.parentElement) ctaBtn.parentElement.style.display = '';
    return;
  }

  if (!profile && user) {
    profile = { role: 'client', full_name: user.email };
  }

  const role = escapeHtml(profile.role);
  const config = ROLE_CONFIG[profile.role] || ROLE_CONFIG.client;
  const firstName = escapeHtml((profile.full_name || '').split(' ')[0] || 'Usuario');
  const safeHome = escapeHtml(config.home);
  const safeIcon = escapeHtml(config.icon);
  const safeLabel = escapeHtml(config.label);

  // ── Inyectar links de rol en el menú ──
  const roleLinks = [];
  if (role === 'client') {
    roleLinks.push({ href: '/pages/mi-mascota.html', label: '🐾 Mi Mascota' });
  }
  if (['vet', 'groomer', 'owner', 'admin', 'receptionist'].includes(role)) {
    roleLinks.push({ href: '/pages/mi-agenda.html', label: '📅 Mi Agenda' });
    roleLinks.push({ href: '/pages/gestion-citas.html', label: '📋 Gestión Citas' });
  }
  if (['owner', 'admin'].includes(role)) {
    roleLinks.push({ href: '/pages/admin.html', label: '⚙️ Dashboard' });
  }

  const loginItem = navLinks.querySelector('.nav-login-btn')?.parentElement;
  const ctaItem   = navLinks.querySelector('.nav-cta')?.parentElement;
  const insertBefore = loginItem || ctaItem || null;

  roleLinks.forEach(link => {
    const already = Array.from(navLinks.querySelectorAll('a')).some(a => a.getAttribute('href') === link.href);
    if (!already) {
      const li = document.createElement('li');
      li.className = 'nav-role-item';
      li.innerHTML = `<a href="${link.href}">${link.label}</a>`;
      insertBefore ? navLinks.insertBefore(li, insertBefore) : navLinks.appendChild(li);
    }
  });

  // ── Ocultar botón de login estático ──
  if (loginItem) loginItem.style.display = 'none';

  // ── Session Pill con Dropdown ──
  if (loginItem) loginItem.style.display = 'none';
  _buildSessionPill(profile, config, navLinks, safeIcon, safeLabel, firstName);
}

// ── Navbar para páginas App (/pages/) ──
function buildAppNav(profile, config, navLinks) {
  const role = profile.role;
  const path = window.location.pathname;

  const NAV_STRUCTURE = {
    client: [
      { href: '/pages/mi-mascota.html',   label: '🐾 Mi Mascota' },
      { href: '/pages/agendar.html',       label: '📅 Agendar Cita' },
      { href: '/pages/historial.html',     label: '📋 Historial' },
    ],
    receptionist: [
      { href: '/pages/mi-agenda.html',     label: '📅 Mi Agenda' },
      { href: '/pages/gestion-citas.html', label: '📋 Gestión Citas' },
      { href: '/pages/agendar.html',       label: '➕ Nueva Cita' },
    ],
    groomer: [
      { href: '/pages/mi-agenda.html',   label: '📅 Mi Agenda' },
      { href: '/pages/historial.html',   label: '📋 Historial' },
    ],
    vet: [
      { href: '/pages/mi-agenda.html', label: '📅 Mi Agenda' },
      { label: '📋 Clínica', dropdown: [
        { href: '/pages/gestion-citas.html', label: '📆 Gestión Citas' },
        { href: '/pages/historial.html',     label: '📋 Historial' },
        { href: '/pages/ficha-clinica.html', label: '📄 Ficha Clínica' },
      ]},
    ],
    admin: [
      { href: '/pages/mi-agenda.html', label: '📅 Mi Agenda' },
      { label: '📋 Clínica', dropdown: [
        { href: '/pages/gestion-citas.html', label: '📆 Gestión Citas' },
        { href: '/pages/historial.html',     label: '📋 Historial' },
      ]},
      { label: '⚙️ Admin', dropdown: [
        { href: '/pages/admin.html', label: '📊 Dashboard' },
      ]},
    ],
    owner: [
      { href: '/pages/mi-agenda.html', label: '📅 Mi Agenda' },
      { label: '📋 Clínica', dropdown: [
        { href: '/pages/gestion-citas.html', label: '📆 Gestión Citas' },
        { href: '/pages/historial.html',     label: '📋 Historial' },
        { href: '/pages/ficha-clinica.html', label: '📄 Ficha Clínica' },
      ]},
      { label: '⚙️ Admin', dropdown: [
        { href: '/pages/admin.html', label: '📊 Dashboard' },
      ]},
    ],
  };

  const items = NAV_STRUCTURE[role] || NAV_STRUCTURE.client;

  // Reconstruir navLinks completamente
  navLinks.innerHTML = `
    <li><button class="nav-close-btn app-nav-close" aria-label="Cerrar menú">✕</button></li>
    <li class="nav-role-item app-nav-home">
      <a href="${escapeHtml(config.home)}" class="${path === config.home ? 'app-nav-active' : ''}">🏠 Inicio</a>
    </li>
  `;

  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'nav-role-item';

    if (item.dropdown) {
      const isGroupActive = item.dropdown.some(sub => path === sub.href);
      li.className += ' app-nav-dropdown-wrapper';
      li.innerHTML = `
        <button class="app-nav-dropdown-trigger${isGroupActive ? ' app-nav-active' : ''}" aria-expanded="false">
          ${escapeHtml(item.label)} <span class="app-nav-chevron">▾</span>
        </button>
        <ul class="app-nav-dropdown" role="menu">
          ${item.dropdown.map(sub => `
            <li role="menuitem">
              <a href="${escapeHtml(sub.href)}" class="${path === sub.href ? 'app-nav-active' : ''}">
                ${escapeHtml(sub.label)}
              </a>
            </li>
          `).join('')}
        </ul>
      `;
      navLinks.appendChild(li);

      const trigger  = li.querySelector('.app-nav-dropdown-trigger');
      const dropdown = li.querySelector('.app-nav-dropdown');
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = li.classList.contains('open');
        navLinks.querySelectorAll('.app-nav-dropdown-wrapper.open').forEach(el => el.classList.remove('open'));
        if (!isOpen) li.classList.add('open');
        trigger.setAttribute('aria-expanded', String(!isOpen));
      });

      // Desktop: abrir al hover
      if (window.matchMedia('(hover: hover)').matches) {
        li.addEventListener('mouseenter', () => { li.classList.add('open'); trigger.setAttribute('aria-expanded', 'true'); });
        li.addEventListener('mouseleave', () => { li.classList.remove('open'); trigger.setAttribute('aria-expanded', 'false'); });
      }

    } else {
      const isActive = path === item.href;
      li.innerHTML = `<a href="${escapeHtml(item.href)}" class="${isActive ? 'app-nav-active' : ''}">${escapeHtml(item.label)}</a>`;
      navLinks.appendChild(li);
    }
  });

  // Cerrar dropdowns al click fuera o Escape
  if (!appNavListenersAdded) {
    document.addEventListener('click', (e) => {
      const currentNavLinks = document.getElementById('navLinks');
      if (currentNavLinks && !currentNavLinks.contains(e.target))
        currentNavLinks.querySelectorAll('.app-nav-dropdown-wrapper.open').forEach(el => el.classList.remove('open'));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const currentNavLinks = document.getElementById('navLinks');
        if (currentNavLinks)
          currentNavLinks.querySelectorAll('.app-nav-dropdown-wrapper.open').forEach(el => el.classList.remove('open'));
      }
    });
    appNavListenersAdded = true;
  }

  // Botón ✕ drawer móvil
  const closeBtn = navLinks.querySelector('.app-nav-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      navLinks.classList.remove('open');
      document.getElementById('navbar')?.classList.remove('nav-open');
    });
  }

  const firstName = escapeHtml((profile.full_name || '').split(' ')[0] || 'Usuario');
  _buildSessionPill(profile, config, navLinks, escapeHtml(config.icon), escapeHtml(config.label), firstName);
}

// ── Session Pill ──
function _buildSessionPill(profile, config, navLinks, safeIcon, safeLabel, firstName) {
  const role     = escapeHtml(profile.role);
  const fullName = escapeHtml(profile.full_name || 'Usuario');

  const menuItems = [
    { href: '/pages/perfil.html',        icon: '👤', label: 'Mi Perfil' },
    { href: '/pages/mi-mascota.html',   icon: '🐾', label: 'Mis Mascotas' },
    { href: '/pages/agendar.html',       icon: '📅', label: 'Agendar Cita' },
    { href: '/pages/historial.html',     icon: '📋', label: 'Historial de Citas' },
    { href: '/pages/ficha-clinica.html', icon: '📄', label: 'Fichas Clínicas' },
  ];
  if (['vet', 'groomer', 'owner', 'admin', 'receptionist'].includes(profile.role)) {
    menuItems.push({ href: config.home, icon: '🏠', label: 'Mi Panel' });
    menuItems.push({ href: '/pages/mi-agenda.html',     icon: '📅', label: 'Mi Agenda' });
    menuItems.push({ href: '/pages/gestion-citas.html', icon: '📆', label: 'Gestión Citas' });
  }
  if (['owner', 'admin'].includes(profile.role)) {
    menuItems.push({ href: '/pages/admin.html', icon: '📊', label: 'Dashboard' });
    menuItems.push({ href: '/pages/configuracion.html', icon: '⚙️', label: 'Configuración' });
    menuItems.push({ href: '/pages/inbox.html', icon: '💬', label: 'Inbox WhatsApp' });
  }

  const menuHTML = menuItems.map(item =>
    `<a href="${escapeHtml(item.href)}" class="sp-dd-item">
      <span class="sp-dd-icon">${item.icon}</span>
      <span>${escapeHtml(item.label)}</span>
    </a>`
  ).join('');

  const pill = document.createElement('li');
  pill.id = 'sessionPill';
  pill.className = 'nav-role-item session-pill-wrapper';
  pill.innerHTML = `
    <div class="session-pill" data-role="${role}" style="--role-color:${escapeHtml(config.color)}" id="sessionPillTrigger">
      <span class="sp-avatar">${safeIcon}</span>
      <div class="sp-info">
        <span class="sp-name">${firstName}</span>
        <span class="sp-role">${safeLabel}</span>
      </div>
      <span class="sp-chevron">▼</span>
    </div>
    <div class="sp-dropdown" id="sessionDropdown">
      <div class="sp-dd-header" style="--role-color:${escapeHtml(config.color)}">
        <div class="sp-dd-avatar">${safeIcon}</div>
        <div class="sp-dd-info">
          <div class="sp-dd-name">${fullName}</div>
          <div class="sp-dd-role-badge">${safeIcon} ${safeLabel}</div>
        </div>
      </div>
      ${menuHTML}
      <div class="sp-dd-sep"></div>
      <div class="sp-dd-session-status">
        <span class="sp-dd-session-dot"></span>
        Sesión activa
      </div>
      <button class="sp-dd-item sp-dd-logout" onclick="signOutUser(event)">
        <span class="sp-dd-icon">🚪</span>
        <span>Cerrar Sesión</span>
      </button>
    </div>
  `;

  const loginItem = navLinks.querySelector('.nav-login-btn')?.parentElement;
  const ctaItem   = navLinks.querySelector('.nav-cta')?.parentElement;
  if (loginItem) loginItem.style.display = 'none';

  ctaItem ? navLinks.insertBefore(pill, ctaItem) : navLinks.appendChild(pill);
  if (ctaItem) ctaItem.style.display = 'none';

  const trigger = pill.querySelector('#sessionPillTrigger');
  trigger.addEventListener('click', (e) => { e.stopPropagation(); pill.classList.toggle('open'); });
  document.addEventListener('click', (e) => { if (!pill.contains(e.target)) pill.classList.remove('open'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') pill.classList.remove('open'); });
}

// ── Profile completeness ──
export function isProfileComplete(profile) {
  if (!profile) return false;
  return !!(profile.phone || profile.whatsapp);
}

export function checkAndRedirect(profile) {
  if (!profile) return;
  if (!isProfileComplete(profile)) {
    if (sessionStorage.getItem('skipProfile') === 'true') {
      const config = ROLE_CONFIG[profile.role] || ROLE_CONFIG.client;
      if (!window.location.pathname.includes(config.home)) {
        window.location.href = config.home;
      }
      return;
    }
    if (!window.location.pathname.includes('/pages/completar-perfil.html')) {
      window.location.href = '/pages/completar-perfil.html';
    }
    return;
  }
  const config = ROLE_CONFIG[profile.role] || ROLE_CONFIG.client;
  window.location.href = config.home;
}

// ── Getters ──
export function getUser()          { return currentUser; }
export function getProfile()       { return currentProfile; }
export function isAuthenticated()  { return currentUser !== null; }
export function isVet()            { return currentProfile?.role === 'vet'; }
export function isAdmin()          { return ['admin', 'owner'].includes(currentProfile?.role); }
export { ROLE_CONFIG };
