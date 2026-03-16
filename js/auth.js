/* =========================================
   SEVET – Módulo de Autenticación
   Ecosistema Pet-Tech 360
   ========================================= */

import { supabase } from './supabase.js';

// ── Estado de sesión ──
let currentUser = null;
let currentProfile = null;
let initialized = false;

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
    options: { redirectTo: window.location.origin },
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
  const pill = document.createElement('li');
  pill.id = 'sessionPill';
  pill.className = 'nav-role-item session-pill-wrapper';

  // Build dropdown menu items based on role
  const menuItems = [];

  // Common: perfil
  menuItems.push({ href: '/pages/completar-perfil.html?edit=true', icon: '👤', label: 'Mi Perfil' });

  // Client-specific
  if (profile.role === 'client') {
    menuItems.push({ href: '/pages/mi-mascota.html', icon: '🐾', label: 'Mis Mascotas' });
    menuItems.push({ href: '/pages/agendar.html', icon: '📅', label: 'Agendar Cita' });
    menuItems.push({ href: '/pages/historial.html', icon: '📋', label: 'Historial de Citas' });
    menuItems.push({ href: '/pages/ficha-clinica.html', icon: '📄', label: 'Fichas Clínicas' });
  }

  // Staff-specific
  if (['vet', 'groomer', 'owner', 'admin', 'receptionist'].includes(profile.role)) {
    menuItems.push({ href: config.home, icon: '🏠', label: 'Mi Panel' });
    menuItems.push({ href: '/pages/mi-agenda.html', icon: '📅', label: 'Mi Agenda' });
    menuItems.push({ href: '/pages/gestion-citas.html', icon: '📋', label: 'Gestión Citas' });
  }

  // Admin/Owner
  if (['owner', 'admin'].includes(profile.role)) {
    menuItems.push({ href: '/pages/admin.html', icon: '⚙️', label: 'Dashboard' });
  }

  const menuHTML = menuItems.map(item =>
    `<a href="${escapeHtml(item.href)}" class="sp-dd-item">
      <span class="sp-dd-icon">${item.icon}</span>
      <span>${escapeHtml(item.label)}</span>
    </a>`
  ).join('');

  const fullName = escapeHtml(profile.full_name || 'Usuario');

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

  if (ctaItem) {
    navLinks.insertBefore(pill, ctaItem);
    ctaItem.style.display = 'none';
  } else {
    navLinks.appendChild(pill);
  }

  // Toggle dropdown on click
  const trigger = pill.querySelector('#sessionPillTrigger');
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    pill.classList.toggle('open');
  });

  // Close on click outside
  document.addEventListener('click', (e) => {
    if (!pill.contains(e.target)) {
      pill.classList.remove('open');
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') pill.classList.remove('open');
  });
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
