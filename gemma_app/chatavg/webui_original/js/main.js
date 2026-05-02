import { state } from './state.js';
import { $, t, applyLang, showToast } from './index.js';
import { checkAuth, handleLogin, switchView } from './auth.js';
import { autoResizeTextarea } from './ui.js';
import { newChat, handleSend, stopGeneration, handleFiles } from './chat.js';
import { initAdminTabs } from './admin.js';

function init() {
  applyLang();
  bindEvents();
  autoResizeTextarea();
  checkAuth();
  initAdminTabs();
  
  if (typeof marked !== 'undefined') {
    marked.setOptions({
      breaks: true,
      gfm: true,
      highlight: (code, lang) => {
        if (lang && window.hljs && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value;
        if (window.hljs) return hljs.highlightAuto(code).value;
        return code;
      }
    });
  }
}

async function saveSettings() {
  localStorage.setItem('gemma_lang', state.lang);
  const payload = {};
  if ($('user-email') && $('user-email').value !== undefined) payload.email = $('user-email').value;
  if ($('user-password') && $('user-password').value) payload.password = $('user-password').value;
  
  if (Object.keys(payload).length > 0) {
    try {
      const r = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.authToken },
        body: JSON.stringify(payload)
      });
      if (r.ok && payload.password) {
        $('user-password').value = '';
      }
    } catch (e) {}
  }
  showToast(t('saved'));
}

function bindEvents() {
  document.querySelectorAll('.nav .nav-btn').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
  $('new-chat-btn')?.addEventListener('click', newChat);
  $('save-btn')?.addEventListener('click', () => { saveSettings(); switchView('chat'); });
  const loginForm = $('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  } else {
    console.error('Login form not found during bindEvents');
  }
  $('login-submit-btn')?.addEventListener('click', (e) => {
    if (!$('login-form')) handleLogin(e);
  });

  document.querySelectorAll('.lang-btn').forEach(btn => btn.addEventListener('click', () => {
    state.lang = btn.dataset.lang;
    applyLang();
  }));

  document.querySelectorAll('.param-item input[type="range"]').forEach(slider => {
    slider.addEventListener('input', () => {
      const key = slider.id.replace('param-', '');
      const el = $('val-' + key);
      if(el) el.textContent = slider.value;
    });
  });

  $('send-btn')?.addEventListener('click', handleSend);
  $('user-input')?.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } });
  $('stop-btn')?.addEventListener('click', stopGeneration);

  const fileInput = $('file-input');
  $('attach-btn')?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', e => handleFiles(e.target.files));

  const wrapper = $('input-wrapper');
  const dropOverlay = $('drop-overlay');
  if(wrapper && dropOverlay) {
      ['dragenter','dragover'].forEach(ev => wrapper.addEventListener(ev, e => { e.preventDefault(); dropOverlay.classList.add('active'); }));
      ['dragleave','drop'].forEach(ev => dropOverlay.addEventListener(ev, e => { e.preventDefault(); dropOverlay.classList.remove('active'); }));
      dropOverlay.addEventListener('drop', e => handleFiles(e.dataTransfer.files));
  }

  document.querySelectorAll('.hint-chip').forEach(chip => chip.addEventListener('click', () => {
    const key = 'prompt_' + chip.dataset.prompt;
    const userInput = $('user-input');
    if(userInput) {
        userInput.value = t(key);
        userInput.focus();
        autoResizeTextarea();
    }
  }));

  $('sidebar-toggle')?.addEventListener('click', () => {
    const sidebar = $('sidebar');
    if(!sidebar) return;
    const isDesktop = window.innerWidth >= 1024;
    if (isDesktop) {
      sidebar.classList.toggle('collapsed');
    } else {
      sidebar.classList.toggle('open');
      $('sidebar-backdrop')?.classList.toggle('active', sidebar.classList.contains('open'));
    }
  });

  function openSidebar() {
    $('sidebar')?.classList.add('open');
    $('sidebar-backdrop')?.classList.add('active');
  }
  function closeSidebar() {
    $('sidebar')?.classList.remove('open');
    $('sidebar-backdrop')?.classList.remove('active');
  }
  $('mobile-menu-btn')?.addEventListener('click', openSidebar);
  $('mobile-menu-btn-setup')?.addEventListener('click', openSidebar);
  $('mobile-menu-btn-admin')?.addEventListener('click', openSidebar);
  $('sidebar-backdrop')?.addEventListener('click', closeSidebar);

  $('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('chatavg_token');
    state.authToken = null;
    state.currentUser = null;
    state.chatHistory = [];
    state.attachedDocs = [];
    if($('messages')) $('messages').textContent = '';
    if($('attached-docs')) $('attached-docs').textContent = '';
    $('welcome-screen')?.classList.remove('hidden');
    import('./auth.js').then(m => m.showLogin());
  });

  $('user-input')?.addEventListener('input', autoResizeTextarea);

  $('advanced-toggle-btn')?.addEventListener('click', () => {
    $('advanced-panel')?.classList.toggle('hidden');
    $('advanced-toggle-btn')?.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    const panel = $('advanced-panel');
    const btn = $('advanced-toggle-btn');
    if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) {
      panel.classList.add('hidden');
      btn.classList.remove('active');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
