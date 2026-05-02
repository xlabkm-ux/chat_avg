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
          <div style="display:flex; align-items:center; gap:10px;">
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

function editAdminUser(username, usersMap) {
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
  
  const payload = {
    category: $('admin-category').value,
    expiration_date: $('admin-expiration').value || null,
    n_ctx: parseInt($('admin-n-ctx').value || '4096'),
    system_prompt: $('admin-system-prompt').value || null
  };
  
  const p = $('admin-password').value;
  if (p) payload.password = p;
  
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
    const err = await r.json();
    showToast('❌ Ошибка: ' + (err.detail || ''));
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
  const sel = $('admin-cat-model-select');
  sel.textContent = '';

  const provider = availableProviders.find(p => p.id === providerId);
  const models = provider?.models || [];

  if (models.length > 0) {
    const customOpt = document.createElement('option');
    customOpt.value = '';
    customOpt.textContent = '— Ввести вручную —';
    sel.appendChild(customOpt);

    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      if (m === selectedModel) opt.selected = true;
      sel.appendChild(opt);
    });

    sel.parentElement.style.display = '';
  } else {
    sel.parentElement.style.display = '';
  }

  $('admin-cat-model').value = selectedModel || '';
}

function updateProviderUI(providerId) {
  const isLlama = providerId === 'llamacpp';
  document.querySelectorAll('.llama-only-param').forEach(el => {
    el.style.display = isLlama ? '' : 'none';
  });
  $('cat-remote-fields').style.display = isLlama ? 'none' : '';
  $('cat-endpoint-field').style.display = isLlama ? '' : '';
}

async function editAdminCategory(name, data) {
  await loadProvidersList();
  currentEditCategory = name;
  $('admin-cat-edit-card').classList.remove('hidden');
  $('admin-cat-edit-title').textContent = 'Категория: ' + name;

  const providerId = data.provider || 'llamacpp';
  populateProviderDropdown(providerId);
  updateModelDropdown(providerId, data.model_name || '');
  updateProviderUI(providerId);

  $('admin-cat-endpoint').value = data.endpoint_url || '';
  $('admin-cat-apikey').value = data.api_key || '';
  $('admin-cat-system-prompt').value = data.system_prompt || '';
  
  const epEl = $('admin-cat-extra-params');
  const epErr = $('extra-params-error');
  epEl.disabled = false;
  epEl.readOnly = false;
  epErr.classList.add('hidden');
  if (data.extra_params && typeof data.extra_params === 'object' && Object.keys(data.extra_params).length > 0) {
    epEl.value = JSON.stringify(data.extra_params, null, 2);
  } else {
    epEl.value = '';
  }
  
  const paramMap = {
    temperature: data.temperature,
    top_p: data.top_p,
    top_k: data.top_k,
    min_p: data.min_p,
    repeat_penalty: data.repeat_penalty,
    max_tokens: data.max_tokens || data.n_predict,
  };
  Object.entries(paramMap).forEach(([k, v]) => {
    const el = $('param-' + k);
    if (el && v !== undefined) {
      el.value = v;
      if ($('val-' + k)) $('val-' + k).textContent = v;
    }
  });

  $('admin-cat-edit-card').scrollIntoView({ behavior: 'smooth' });
}

$('admin-cat-provider')?.addEventListener('change', (e) => {
  const pid = e.target.value;
  updateModelDropdown(pid, '');
  updateProviderUI(pid);
});

$('admin-cat-model-select')?.addEventListener('change', (e) => {
  if (e.target.value) {
    $('admin-cat-model').value = e.target.value;
  }
});

$('btn-cancel-cat')?.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  $('admin-cat-edit-card').classList.add('hidden');
});

$('btn-save-cat')?.addEventListener('click', async (e) => {
  e.preventDefault();
  if (!currentEditCategory) return;
  const payload = {
    provider: $('admin-cat-provider').value || 'llamacpp',
    endpoint_url: $('admin-cat-endpoint').value || null,
    model_name: $('admin-cat-model').value || null,
    api_key: $('admin-cat-apikey').value || null,
    system_prompt: $('admin-cat-system-prompt').value || null,
  };

  const epText = $('admin-cat-extra-params').value.trim();
  const epErr = $('extra-params-error');
  epErr.classList.add('hidden');
  if (epText) {
    try {
      payload.extra_params = JSON.parse(epText);
    } catch (e) {
      epErr.textContent = 'Ошибка JSON: ' + e.message;
      epErr.classList.remove('hidden');
      return;
    }
  } else {
    payload.extra_params = null;
  }
  
  ['temperature','top_p','top_k','min_p','repeat_penalty','max_tokens'].forEach(k => {
    const el = $('param-' + k);
    if (el) {
      payload[k] = k === 'top_k' || k === 'max_tokens' ? parseInt(el.value) : parseFloat(el.value);
    }
  });

  const r = await fetch('/api/admin/categories/' + currentEditCategory, {
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
  if (!currentEditCategory) return;
  const btn = $('btn-test-cat');
  const oldText = btn.textContent;
  btn.textContent = '⏳ Проверка...';
  btn.disabled = true;

  try {
    const payload = {
      provider: $('admin-cat-provider').value,
      endpoint_url: $('admin-cat-endpoint').value,
      api_key: $('admin-cat-apikey').value
    };

    const r = await fetch(`/api/admin/categories/${encodeURIComponent(currentEditCategory)}/test`, {
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
