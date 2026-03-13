/* =========================================
   SEVET – Módulo de Autenticación
   Ecosistema Pet-Tech 360
   ========================================= */

import { supabase } from './supabase.js';

// ── Estado de sesión ──
let currentUser = null;
let currentProfile = null;

let initialized = false;

// ── Inicializar Auth Listener ──
export function initAuth() {
  if (initialized) return;
  initialized = true;

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      currentUser = session.user;
      currentProfile = await fetchProfile(session.user.id);
      document.dispatchEvent(new CustomEvent('auth:login', { detail: { user: currentUser, profile: currentProfile } }));
    } else {
      currentUser = null;
      currentProfile = null;
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
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
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

// ── Getters ──
export function getUser() { return currentUser; }
export function getProfile() { return currentProfile; }
export function isAuthenticated() { return currentUser !== null; }
export function isVet() { return currentProfile?.role === 'vet'; }
export function isAdmin() { return currentProfile?.role === 'admin'; }
