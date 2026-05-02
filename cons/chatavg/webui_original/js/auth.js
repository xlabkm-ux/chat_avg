import { state, settings } from './state.js';
import { $, t, I18N } from './index.js';
import { SessionManager } from './sessions.js';
import { updateContextBadge } from './ui.js';
import { loadAdminStats, loadAdminUsers, loadAdminCategories } from './admin.js';

export async function checkAuth() {
  if (!state.authToken) return showLogin();
  try {
    const r = await fetch('/api/users/me', { headers: { 'Authorization': 'Bearer ' + state.authToken }});
    if (r.ok) {
      state.currentUser = await r.json();
      completeLogin();
    } else {
      showLogin();
    }
  } catch (e) { showLogin(); }
}

export function showLogin() {
  $('login-screen')?.classList.add('active');
  $('app')?.classList.add('hidden');
}

export function completeLogin() {
  $('login-screen')?.classList.remove('active');
  $('app')?.classList.remove('hidden');
  
  const titleEl = $('chat-title-category');
  if (titleEl) titleEl.textContent = state.currentUser.category || 'Gemma AI';
  
  state.contextSize = state.currentUser.n_ctx || 4096;
  
  if (state.currentUser.category === 'Консультант') state.maxDocsAllowed = 3;
  else if (state.currentUser.category === 'Эксперт') state.maxDocsAllowed = 5;
  else state.maxDocsAllowed = 10;
  
  const navAdmin = $('nav-admin');
  if (navAdmin) {
    if (state.currentUser.category === 'Администратор') navAdmin.classList.remove('hidden');
    else navAdmin.classList.add('hidden');
  }
  
  const defaultPrompt = (I18N && I18N[state.lang]) ? I18N[state.lang].system_prompt_placeholder : '';
  settings.system_prompt = state.currentUser.system_prompt || defaultPrompt;
  
  if ($('user-email')) $('user-email').value = state.currentUser.email || '';
  
  updateContextBadge();
  startHealthPolling();
  SessionManager.loadList();
}

export async function handleLogin(e) {
  e.preventDefault();
  const u = $('login-user').value;
  const p = $('login-pass').value;
  const errEl = $('login-error');
  errEl.classList.add('hidden');
  
  try {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });
    const d = await r.json();
    if (r.ok) {
      state.authToken = d.access_token;
      localStorage.setItem('chatavg_token', state.authToken);
      checkAuth();
    } else {
      errEl.textContent = d.detail || 'Ошибка авторизации';
      errEl.classList.remove('hidden');
    }
  } catch (e) {
    errEl.textContent = 'Ошибка сети';
    errEl.classList.remove('hidden');
  }
}

async function checkServerHealth() {
  if (!state.authToken) return;
  const statusDot = $('status-dot');
  const statusText = $('status-text');
  try {
    const r = await fetch('/api/users/me', {
      headers: { 'Authorization': 'Bearer ' + state.authToken },
      signal: AbortSignal.timeout(5000)
    });
    if (r.ok) {
      if(statusDot) statusDot.className = 'status-dot online';
      if (statusText) statusText.textContent = state.currentUser ? state.currentUser.username : t('status_online');
    } else {
      if(statusDot) statusDot.className = 'status-dot offline';
      if (statusText) statusText.textContent = t('status_offline');
    }
  } catch {
    if(statusDot) statusDot.className = 'status-dot offline';
    if (statusText) statusText.textContent = t('status_offline');
  }
}

export function startHealthPolling() {
  checkServerHealth();
  setInterval(checkServerHealth, 30000);
}

export function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  $('view-' + name)?.classList.add('active');
  document.querySelector(`.nav-btn[data-view="${name}"]`)?.classList.add('active');
  $('sidebar')?.classList.remove('open');
  $('sidebar-backdrop')?.classList.remove('active');

  if (name === 'admin' && state.currentUser?.category === 'Администратор') {
    loadAdminStats();
    loadAdminUsers();
    loadAdminCategories();
    if (state.adminStatsInterval) clearInterval(state.adminStatsInterval);
    state.adminStatsInterval = setInterval(loadAdminStats, 10000);
  } else {
    if (state.adminStatsInterval) {
      clearInterval(state.adminStatsInterval);
      state.adminStatsInterval = null;
    }
  }
}
