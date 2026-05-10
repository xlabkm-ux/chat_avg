import { state } from './state.js';
import { $, showToast } from './index.js';

export function initAdminTabs() {
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      document.querySelectorAll('.admin-tab').forEach(t => {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', t === tab);
      });
      document.querySelectorAll('.admin-tab-content').forEach(c => {
        c.classList.toggle('active', c.id === `admin-tab-${target}`);
      });
      if (target === 'overview') loadAdminStats();
      else if (target === 'users') loadAdminUsers();
      else if (target === 'categories') loadAdminCategories();
      else if (target === 'audit') loadAuditLogs();
      else if (target === 'debug') loadDebugLogs();
    });
  });

  $('admin-user-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.user-item').forEach(item => {
      const name = item.querySelector('.user-item-name').textContent.toLowerCase();
      item.style.display = name.includes(q) ? '' : 'none';
    });
  });
}

export async function loadAdminStats() {
  try {
    const r = await fetch('/api/admin/stats', { headers: { 'Authorization': 'Bearer ' + state.authToken }});
    if (!r.ok) return;
    const stats = await r.json();

    $('stat-total-users').textContent = stats.users.total;
    $('stat-expired-users').textContent = `${stats.users.expired} истекло`;
    $('stat-total-sessions').textContent = stats.sessions.total;
    $('stat-total-categories').textContent = stats.categories;
    
    const uptimeS = stats.system.uptime;
    const h = Math.floor(uptimeS / 3600);
    const m = Math.floor((uptimeS % 3600) / 60);
    const s = uptimeS % 60;
    $('stat-uptime').textContent = `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    
    const memMb = Math.round(stats.system.memory.rss / 1024 / 1024);
    $('stat-memory').textContent = `${memMb} MB RAM`;

    const list = $('system-info-list');
    list.innerHTML = `
      <div class="system-info-item"><span class="system-info-label">Платформа</span><span class="system-info-value">${DOMPurify.sanitize(stats.system.platform)}</span></div>
      <div class="system-info-item"><span class="system-info-label">Node.js</span><span class="system-info-value">${DOMPurify.sanitize(stats.system.node_version)}</span></div>
      <div class="system-info-item"><span class="system-info-label">Свободная память</span><span class="system-info-value">${Math.round(stats.system.os_free_mem / 1024 / 1024)} MB</span></div>
      <div class="system-info-item"><span class="system-info-label">Загрузка (1/5/15)</span><span class="system-info-value">${DOMPurify.sanitize(stats.system.os_load.map(l => l.toFixed(2)).join(' / '))}</span></div>
    `;
  } catch (e) { console.error('Stats load failed', e); }
}

export async function loadAdminUsers() {
  const r = await fetch('/api/admin/users', { headers: { 'Authorization': 'Bearer ' + state.authToken }});
  if (r.ok) {
    const users = await r.json();
    const list = $('admin-user-list');
    list.textContent = '';
    
    Object.entries(users).forEach(([username, u]) => {
      const isExpired = u.expiration_date && new Date(u.expiration_date) < new Date();
      const statusClass = isExpired ? 'status-badge--expired' : 'status-badge--active';
      const statusLabel = isExpired ? 'Истек' : 'Активен';

      const el = document.createElement('div');
      el.className = 'user-item';
      el.innerHTML = `
        <div class="user-item-info">
          <div class="flex-center-gap">
            <span class="user-item-name">${DOMPurify.sanitize(username)}</span>
            <span class="status-badge ${statusClass}">${statusLabel}</span>
          </div>
          <span class="user-item-cat">${DOMPurify.sanitize(u.category)} | Контекст: ${u.n_ctx || 4096}</span>
          ${u.expiration_date ? `<span class="user-expiration">Срок до: ${DOMPurify.sanitize(u.expiration_date)}</span>` : ''}
        </div>
        <div class="user-item-actions">
          <button class="nav-btn btn-action-sm edit-usr-btn" data-usr="${DOMPurify.sanitize(username)}" aria-label="Редактировать ${DOMPurify.sanitize(username)}">✏️</button>
          <button class="nav-btn btn-action-sm--danger del-usr-btn" data-usr="${DOMPurify.sanitize(username)}" aria-label="Удалить ${DOMPurify.sanitize(username)}">🗑️</button>
        </div>
      `;
      list.appendChild(el);
    });
    
    document.querySelectorAll('.edit-usr-btn').forEach(b => b.addEventListener('click', e => editAdminUser(e.target.closest('button').dataset.usr, users)));
    document.querySelectorAll('.del-usr-btn').forEach(b => b.addEventListener('click', e => deleteAdminUser(e.target.closest('button').dataset.usr)));
  }
}

async function editAdminUser(username, usersMap) {
  // Populate category list for users
  try {
    const cr = await fetch('/api/admin/categories', { headers: { 'Authorization': 'Bearer ' + state.authToken }});
    if (cr.ok) {
      const cats = await cr.json();
      const sel = $('admin-category');
      if (sel) {
        sel.innerHTML = '';
        Object.keys(cats).sort().forEach(cname => {
          const opt = document.createElement('option');
          opt.value = cname;
          opt.textContent = cname;
          sel.appendChild(opt);
        });
      }
    }
  } catch(e) {}

  $('admin-edit-card').classList.remove('hidden');
  $('admin-edit-title').textContent = username ? 'Редактировать ' + username : 'Новый пользователь';
  
  $('admin-username').value = username || '';
  $('admin-username').disabled = !!username;
  $('admin-password').value = '';
  
  if (username && usersMap[username]) {
    const u = usersMap[username];
    $('admin-category').value = u.category || 'Консультант';
    $('admin-expiration').value = u.expiration_date || '';
    $('admin-n-ctx').value = u.n_ctx || 4096;
    $('admin-system-prompt').value = u.system_prompt || '';
  } else {
    $('admin-category').value = 'Консультант';
    $('admin-expiration').value = '2099-12-31';
    $('admin-n-ctx').value = 4096;
    $('admin-system-prompt').value = 'Ты — полезный ИИ-ассистент Gemma 4. Отвечай точно и по существу.';
  }
  $('admin-edit-card').scrollIntoView({ behavior: 'smooth' });
}

$('btn-create-user')?.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  editAdminUser('', {});
});
$('btn-cancel-user')?.addEventListener('click', (e) => {
  e.preventDefault();
  $('admin-edit-card').classList.add('hidden');
});

$('btn-save-user')?.addEventListener('click', async (e) => {
  e.preventDefault();
  const username = $('admin-username').value.trim();
  if (!username) return showToast('❌ Имя обязательно');
  
  if (!/^[a-zA-Z0-9_-]{3,64}$/.test(username)) {
    return showToast('❌ Имя должно быть от 3 до 64 символов (только a-z, A-Z, 0-9, _ и -)');
  }

  
  const payload = {
    category: $('admin-category').value,
    expiration_date: $('admin-expiration').value || null,
    n_ctx: parseInt($('admin-n-ctx').value || '4096'),
    system_prompt: $('admin-system-prompt').value || null
  };
  
  const p = $('admin-password').value;
  if (p) {
    if (p.length < 8) return showToast('❌ Пароль должен содержать не менее 8 символов');
    payload.password = p;
  }

  
  try {
    const r = await fetch('/api/admin/users/' + username, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.authToken },
      body: JSON.stringify(payload)
    });
    
    if (r.ok) {
      showToast('✅ Пользователь сохранен');
      $('admin-edit-card').classList.add('hidden');
      loadAdminUsers();
    } else {
      const errData = await r.json();
      console.error('[Admin] Save user failed:', errData);
      
      // Extract error message from various possible formats
      const errorMsg = errData.detail || 
                       (errData.error && errData.error.message) || 
                       errData.message || 
                       JSON.stringify(errData);
                       
      showToast('❌ Ошибка: ' + errorMsg);
    }
  } catch (err) {
    console.error('[Admin] Network error during save:', err);
    showToast('❌ Ошибка сети: ' + err.message);
  }
});

async function deleteAdminUser(username) {
  if (!confirm('Точно удалить ' + username + '?')) return;
  const r = await fetch('/api/admin/users/' + username, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + state.authToken }
  });
  if (r.ok) {
    showToast('🗑️ Пользователь удален');
    loadAdminUsers();
  } else {
    showToast('❌ Ошибка удаления');
  }
}

export async function loadAdminCategories() {
  const r = await fetch('/api/admin/categories', { headers: { 'Authorization': 'Bearer ' + state.authToken }});
  if (r.ok) {
    const cats = await r.json();
    const list = $('admin-category-list');
    list.textContent = '';
    Object.entries(cats).forEach(([catName, data]) => {
      const providerLabel = data.provider ? data.provider.toUpperCase() : 'llamacpp';
      const modelLabel = data.model_name || 'default';
      const el = document.createElement('div');
      el.className = 'user-item';
      el.innerHTML = `
        <div class="user-item-info">
          <span class="user-item-name">${DOMPurify.sanitize(catName)}</span>
          <span class="user-item-cat">${DOMPurify.sanitize(providerLabel)} → ${DOMPurify.sanitize(modelLabel)}</span>
        </div>
        <div class="user-item-actions">
          <button class="nav-btn btn-action-sm edit-cat-btn" data-cat="${DOMPurify.sanitize(catName)}" aria-label="Редактировать ${DOMPurify.sanitize(catName)}">✏️</button>
        </div>
      `;
      list.appendChild(el);
    });
    
    document.querySelectorAll('.edit-cat-btn').forEach(b => b.addEventListener('click', e => {
      const c = e.target.closest('button').dataset.cat;
      editAdminCategory(c, cats[c]);
    }));
  }
}

let availableProviders = [];
let currentEditCategory = '';

async function loadProvidersList() {
  if (availableProviders.length > 0) return;
  try {
    const r = await fetch('/api/providers', { headers: { 'Authorization': 'Bearer ' + state.authToken }});
    if (r.ok) availableProviders = await r.json();
  } catch (e) { console.error('Failed to load providers:', e); }
}

function populateProviderDropdown(selectedId) {
  const sel = $('admin-cat-provider');
  sel.textContent = '';
  availableProviders.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    if (p.id === selectedId) opt.selected = true;
    sel.appendChild(opt);
  });
}

function updateModelDropdown(providerId, selectedModel) {
  const provider = availableProviders.find(p => p.id === providerId);
  const models = provider?.models || [];
  const sel = $('admin-cat-model');
  sel.innerHTML = '';

  models.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    if (m === selectedModel) opt.selected = true;
    sel.appendChild(opt);
  });
}

function updateProviderUI(providerId) {
  const cfg = availableProviders.find(p => p.id === providerId) || {};
  const isLlama = cfg.adapter === 'llamacpp' || providerId === 'llamacpp';
  document.querySelectorAll('.llama-only-param').forEach(el => {
    el.classList.toggle('hidden', !isLlama);
  });

  const isResponses = cfg.adapter === 'openai_responses' || providerId === 'openai_responses';
  const modelEl = $('admin-cat-model');
  if (modelEl) {
    modelEl.disabled = isResponses;
    if (isResponses) {
       // Optionally set a placeholder-like value or clear it
       modelEl.style.opacity = '0.5';
    } else {
       modelEl.style.opacity = '1';
    }
  }

  const sysPromptEl = $('admin-cat-system-prompt');
  if (sysPromptEl) {
    sysPromptEl.disabled = isResponses;
    if (isResponses) {
      sysPromptEl.style.opacity = '0.5';
      sysPromptEl.placeholder = 'Используется Managed Prompt из OpenAI (инструкция зашита внутри)';
    } else {
      sysPromptEl.style.opacity = '1';
      sysPromptEl.placeholder = '';
    }
  }
}

async function updateJsonTemplate() {
  const providerId = $('admin-cat-provider').value;
  const modelName = $('admin-cat-model').value;
  if (!providerId || !modelName) return;

  try {
    const r = await fetch(`/api/admin/providers/template/${encodeURIComponent(providerId)}/${encodeURIComponent(modelName)}`, {
      headers: { 'Authorization': 'Bearer ' + state.authToken }
    });
    if (r.ok) {
      const template = await r.json();
      $('admin-cat-extra-params').value = JSON.stringify(template, null, 2);
    }
  } catch (e) {
    console.error('Failed to load template:', e);
  }
}

async function editAdminCategory(name, data) {
  await loadProvidersList();
  currentEditCategory = name;
  $('admin-cat-edit-card').classList.remove('hidden');
  $('admin-cat-edit-title').textContent = name ? 'Категория: ' + name : 'Новая категория';
  
  $('admin-cat-name').value = name || '';
  $('admin-cat-name').disabled = !!name;
  $('btn-del-cat').classList.toggle('hidden', !name);

  const providerId = data.provider || 'llamacpp';
  populateProviderDropdown(providerId);
  updateModelDropdown(providerId, data.model_name || '');
  updateProviderUI(providerId);

  $('admin-cat-system-prompt').value = data.system_prompt || '';
  $('admin-cat-extra-params').value = data.extra_params ? JSON.stringify(data.extra_params, null, 2) : '';
  
  const debugEl = $('admin-cat-debug-mode');
  if (debugEl) debugEl.checked = !!(data.debug_mode);

  $('admin-cat-edit-card').scrollIntoView({ behavior: 'smooth' });
}

$('admin-cat-provider')?.addEventListener('change', async (e) => {
  const pid = e.target.value;
  updateModelDropdown(pid, '');
  updateProviderUI(pid);
  await updateJsonTemplate();
});

$('admin-cat-model')?.addEventListener('change', async (e) => {
  await updateJsonTemplate();
});

$('btn-cancel-cat')?.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  $('admin-cat-edit-card').classList.add('hidden');
});

$('btn-create-cat')?.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  editAdminCategory('', {});
});

$('btn-del-cat')?.addEventListener('click', async (e) => {
  e.preventDefault();
  if (!currentEditCategory) return;
  if (!confirm(`Удалить категорию ${currentEditCategory}?`)) return;

  const r = await fetch('/api/admin/categories/' + encodeURIComponent(currentEditCategory), {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + state.authToken }
  });
  if (r.ok) {
    showToast('🗑️ Категория удалена');
    $('admin-cat-edit-card').classList.add('hidden');
    loadAdminCategories();
  } else {
    const err = await r.json();
    showToast('❌ Ошибка: ' + (err.detail || 'Ошибка удаления'));
  }
});

$('btn-save-cat')?.addEventListener('click', async (e) => {
  e.preventDefault();
  const catName = $('admin-cat-name').value.trim();
  if (!catName) {
    return showToast('❌ Название категории обязательно');
  }

  const payload = {
    provider: $('admin-cat-provider').value || 'llamacpp',
    model_name: $('admin-cat-model').value || null,
    system_prompt: $('admin-cat-system-prompt').value || null,
    debug_mode: !!($('admin-cat-debug-mode')?.checked),
    extra_params: null
  };

  const extraParamsRaw = $('admin-cat-extra-params').value.trim();
  if (extraParamsRaw) {
    try {
      payload.extra_params = JSON.parse(extraParamsRaw);
    } catch (e) {
      showToast('Ошибка в JSON дополнительных параметров');
      return;
    }
  }

  const r = await fetch('/api/admin/categories/' + encodeURIComponent(catName), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.authToken },
    body: JSON.stringify(payload)
  });
  if (r.ok) {
    showToast('✅ Категория сохранена');
    $('admin-cat-edit-card').classList.add('hidden');
    loadAdminCategories();
  } else {
    showToast('❌ Ошибка сохранения');
  }
});

$('btn-test-cat')?.addEventListener('click', async (e) => {
  e.preventDefault();
  e.stopPropagation();
  const catName = $('admin-cat-name').value.trim();
  if (!catName) return showToast('❌ Сначала сохраните категорию');
  const btn = $('btn-test-cat');
  const oldText = btn.textContent;
  btn.textContent = '⏳ Проверка...';
  btn.disabled = true;

  try {
    const payload = {
      provider: $('admin-cat-provider').value,
    };

    const r = await fetch(`/api/admin/categories/${encodeURIComponent(catName)}/test`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.authToken 
      },
      body: JSON.stringify(payload)
    });
    const d = await r.json();
    if (r.ok) {
      showToast('✅ ' + d.message);
    } else {
      showToast('❌ ' + (d.error || 'Ошибка соединения'));
    }
  } catch (e) {
    showToast('❌ Ошибка сети при проверке');
  } finally {
    btn.textContent = oldText;
    btn.disabled = false;
  }
});

export async function loadAuditLogs() {
  const username = $('admin-audit-search')?.value.trim() || '';
  const action = $('admin-audit-action')?.value || '';
  let url = '/api/admin/audit?limit=100';
  if (username) url += '&username=' + encodeURIComponent(username);
  if (action) url += '&action=' + encodeURIComponent(action);

  const r = await fetch(url, { headers: { 'Authorization': 'Bearer ' + state.authToken }});
  if (r.ok) {
    const logs = await r.json();
    const list = $('admin-audit-list');
    list.textContent = '';
    
    if (logs.length === 0) {
      list.innerHTML = '<div class="audit-log-empty">Логов не найдено</div>';
      return;
    }

    logs.forEach(log => {
      const date = new Date(log.created_at).toLocaleString('ru-RU');
      const el = document.createElement('div');
      el.className = 'user-item';
      let detailsHtml = '';
      if (log.details) {
        try {
          const parsed = JSON.parse(log.details);
          detailsHtml = `<div class="audit-log-details">${DOMPurify.sanitize(JSON.stringify(parsed))}</div>`;
        } catch (e) {
          detailsHtml = `<div class="audit-log-details">${DOMPurify.sanitize(log.details)}</div>`;
        }
      }

      el.innerHTML = `
        <div class="user-item-info w-full">
          <div class="audit-log-header">
            <span class="user-item-name audit-log-name">${DOMPurify.sanitize(date)}</span>
            <span class="status-badge audit-log-action-badge">${DOMPurify.sanitize(log.action)}</span>
          </div>
          <div class="audit-log-content">
            <strong>Пользователь:</strong> ${log.username ? DOMPurify.sanitize(log.username) : `<span class="text-secondary">Система/Аноним</span>`}
            ${log.ip_address ? ` | <strong>IP:</strong> ${DOMPurify.sanitize(log.ip_address)}` : ''}
          </div>
          ${detailsHtml}
        </div>
      `;
      list.appendChild(el);
    });
  }
}

$('btn-refresh-audit')?.addEventListener('click', loadAuditLogs);
$('admin-audit-search')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') loadAuditLogs();
});
$('admin-audit-action')?.addEventListener('change', loadAuditLogs);

// ── Debug Log ────────────────────────────────────────────

const debugLogBuffer = [];
const MAX_DEBUG_ENTRIES = 200;

export function appendDebugLog(entry) {
  debugLogBuffer.unshift(entry);
  if (debugLogBuffer.length > MAX_DEBUG_ENTRIES) debugLogBuffer.pop();
  // If debug tab is active, re-render
  const tab = document.querySelector('.admin-tab[data-tab="debug"]');
  if (tab && tab.classList.contains('active')) {
    renderDebugLogs();
  }
}

function renderDebugLogs() {
  const list = $('admin-debug-list');
  if (!list) return;
  if (debugLogBuffer.length === 0) {
    list.innerHTML = '<div class="audit-log-empty">Нет записей. Включите режим отладки в настройках категории.</div>';
    return;
  }
  list.innerHTML = '';
  debugLogBuffer.forEach(entry => {
    const el = document.createElement('div');
    el.className = 'user-item';
    const ts = new Date(entry.ts).toLocaleTimeString('ru-RU');
    const levelColor = entry.level === 'error' ? 'var(--color-error)' : entry.level === 'warn' ? 'orange' : 'var(--color-accent)';
    el.innerHTML = `
      <div class="user-item-info w-full">
        <div class="audit-log-header">
          <span class="user-item-name audit-log-name">${DOMPurify.sanitize(ts)}</span>
          <span class="status-badge" style="background:${levelColor}">${DOMPurify.sanitize(entry.level?.toUpperCase() || 'DEBUG')}</span>
          <span class="user-item-cat">${DOMPurify.sanitize(entry.provider || '')}</span>
        </div>
        <div class="audit-log-details" style="font-family:monospace;font-size:0.8em;white-space:pre-wrap">${DOMPurify.sanitize(entry.message)}</div>
      </div>
    `;
    list.appendChild(el);
  });
}

export function loadDebugLogs() {
  fetch('/api/admin/debug/stream', {
    headers: { 'Authorization': 'Bearer ' + state.authToken }
  }).then(r => r.ok ? r.json() : []).then(entries => {
    const list = $('admin-debug-list');
    if (!list) return;
    if (!entries || entries.length === 0) {
      list.innerHTML = '<div class="audit-log-empty">Нет записей. Включите режим отладки в настройках категории.</div>';
      return;
    }
    list.innerHTML = '';
    entries.forEach(entry => {
      const el = document.createElement('div');
      el.className = 'user-item';
      const ts = new Date(entry.ts).toLocaleTimeString('ru-RU');
      const levelColor = entry.level === 'error' ? 'var(--color-error)' : entry.level === 'warn' ? 'orange' : 'var(--color-accent)';
      el.innerHTML = `
        <div class="user-item-info w-full">
          <div class="audit-log-header">
            <span class="user-item-name audit-log-name">${DOMPurify.sanitize(ts)}</span>
            <span class="status-badge" style="background:${levelColor}">${DOMPurify.sanitize(entry.level?.toUpperCase() || 'DEBUG')}</span>
            <span class="user-item-cat">${DOMPurify.sanitize(entry.provider || '')}</span>
          </div>
          <div class="audit-log-details" style="font-family:monospace;font-size:0.8em;white-space:pre-wrap">${DOMPurify.sanitize(entry.message)}</div>
        </div>
      `;
      list.appendChild(el);
    });
  }).catch(e => console.error('Debug log load failed', e));
}

$('btn-refresh-debug')?.addEventListener('click', loadDebugLogs);
$('btn-clear-debug')?.addEventListener('click', async () => {
  await fetch('/api/admin/debug/log', {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + state.authToken }
  });
  loadDebugLogs();
});
