/* =========================================
   SEVET – Módulo de Autenticación
   Ecosistema Pet-Tech 360
   ========================================= */

import { supabase } from './supabase.js';

// ── Estado de sesión ──
let currentUser = null;
let currentProfile = null;
let initialized = false;

// ── Role config ──
const ROLE_CONFIG = {
  client:       { label: 'Dueño', home: '/pages/mi-mascota.html', icon: '🐕' },
  vet:          { label: 'Veterinario', home: '/pages/mi-agenda.html', icon: '🩺' },
  groomer:      { label: 'Peluquero/a', home: '/pages/mi-agenda.html', icon: '✂️' },
  receptionist: { label: 'Recepcionista', home: '/pages/gestion-citas.html', icon: '📋' },
  admin:        { label: 'Administrador', home: '/pages/admin.html', icon: '⚙️' },
  owner:        { label: 'Director', home: '/pages/admin.html', icon: '🏥' },
};

// ── Inicializar Auth Listener ──
export function initAuth() {
  if (initialized) return;
  initialized = true;

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      currentUser = session.user;
      currentProfile = await fetchProfile(session.user.id);
      updateNavbarForRole(currentProfile);
      document.dispatchEvent(new CustomEvent('auth:login', { detail: { user: currentUser, profile: currentProfile } }));
    } else {
      currentUser = null;
      currentProfile = null;
      updateNavbarForRole(null);
      document.dispatchEvent(new CustomEvent('auth:logout'));
    }
  });
}

// ── Registro con email ──
export async function signUp(email, password, fullName, phone) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone },
    },
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

// ── Cerrar sesión ──
export async function signOut() {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Sign out error:', err);
  }
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-')) localStorage.removeItem(key);
  });
}

// ── Obtener perfil ──
async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116' && error.name !== 'AbortError') {
    console.warn('Perfil no encontrado:', error.message);
  }
  return data;
}

// ── Page Guard ──
export async function guardPage(allowedRoles) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    window.location.href = '/pages/auth.html';
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

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

// ── Dynamic Navbar Update ──
function updateNavbarForRole(profile) {
  const navLinks = document.getElementById('navLinks');
  if (!navLinks) return;

  // Remove any previously injected role-specific items
  navLinks.querySelectorAll('.nav-role-item').forEach(el => el.remove());

  if (profile) {
    const role = profile.role;
    const config = ROLE_CONFIG[role] || ROLE_CONFIG.client;
    
    // Build role-specific links
    const roleLinks = [];

    if (['client'].includes(role)) {
      roleLinks.push({ href: '/pages/mi-mascota.html', label: 'Mi Mascota' });
    }
    if (['vet', 'groomer', 'owner', 'admin', 'receptionist'].includes(role)) {
      roleLinks.push({ href: '/pages/mi-agenda.html', label: 'Mi Agenda' });
      roleLinks.push({ href: '/pages/gestion-citas.html', label: 'Gestión Citas' });
    }
    if (['owner', 'admin'].includes(role)) {
      roleLinks.push({ href: '/pages/admin.html', label: 'Dashboard' });
    }

    // Find the login button to insert before it
    const loginItem = navLinks.querySelector('.nav-login-btn')?.parentElement;
    const ctaItem = navLinks.querySelector('.nav-cta')?.parentElement;
    const insertBefore = loginItem || ctaItem || null;

    roleLinks.forEach(link => {
      const exists = Array.from(navLinks.querySelectorAll('a')).some(a => a.getAttribute('href') === link.href);
      if (!exists) {
        const li = document.createElement('li');
        li.className = 'nav-role-item';
        li.innerHTML = `<a href="${link.href}">${link.label}</a>`;
        if (insertBefore) {
          navLinks.insertBefore(li, insertBefore);
        } else {
          navLinks.appendChild(li);
        }
      }
    });

    // Replace login button with user info + logout
    if (loginItem) {
      loginItem.innerHTML = `<span class="nav-user-name" style="color:var(--gray-600);font-size:0.85rem;">${config.icon} ${profile.full_name}</span>`;
      loginItem.className = 'nav-role-item';
    }
    if (ctaItem) {
      ctaItem.innerHTML = `<a href="#" class="nav-cta" onclick="window._doLogout(event)">🚪 Cerrar Sesión</a>`;
      ctaItem.className = 'nav-role-item';
    }

    // Global logout function
    window._doLogout = async function(e) {
      e.preventDefault();
      try { await supabase.auth.signOut(); } catch(err) { console.warn('signOut error:', err); }
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-')) localStorage.removeItem(key);
        });
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('sb-')) sessionStorage.removeItem(key);
        });
      } catch(err) {}
      window.location.replace('/');
    };
  }
}

// ── Getters ──
export function getUser() { return currentUser; }
export function getProfile() { return currentProfile; }
export function isAuthenticated() { return currentUser !== null; }
export function isVet() { return currentProfile?.role === 'vet'; }
export function isAdmin() { return ['admin', 'owner'].includes(currentProfile?.role); }
export { ROLE_CONFIG };
