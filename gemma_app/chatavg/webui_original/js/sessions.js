import { state } from './state.js';
import { $ } from './index.js';
import { newChat, addMessageToUI } from './chat.js';
import { updateContextBadge, showToast } from './ui.js';

export const SessionManager = {
  async loadList() {
    try {
      const r = await fetch('/api/sessions', {
        headers: { 'Authorization': 'Bearer ' + state.authToken }
      });
      if (r.ok) {
        const sessions = await r.json();
        this.renderList(sessions);
        // Cache for offline/fallback
        localStorage.setItem(`chatavg_${state.currentUser?.username}_sessions_cache`, JSON.stringify(sessions));
      } else if (r.status === 401) {
          // Handle unauthorized
          return;
      }
    } catch (e) { 
      console.error('Failed to load sessions', e);
      // Fallback to cache
      const cached = localStorage.getItem(`chatavg_${state.currentUser?.username}_sessions_cache`);
      if (cached) this.renderList(JSON.parse(cached));
    }
  },

  async loadSession(id) {
    try {
      const r = await fetch('/api/sessions/' + id, {
        headers: { 'Authorization': 'Bearer ' + state.authToken }
      });
      if (r.ok) {
        const data = await r.json();
        state.currentSessionId = data.id;
        state.chatHistory = data.messages || [];
        state.attachedDocs = [];
        const messagesEl = $('messages');
        if(messagesEl) messagesEl.textContent = '';
        const welcomeScreen = $('welcome-screen');
        if(welcomeScreen) welcomeScreen.classList.add('hidden');
        state.chatHistory.forEach(m => {
          addMessageToUI(m.role, m.content);
        });
        updateContextBadge();
        this.loadList();
      }
    } catch (e) { showToast('Ошибка загрузки чата'); }
  },

  async saveCurrent() {
    if (state.chatHistory.length === 0) return;
    if (!state.currentSessionId) state.currentSessionId = crypto.randomUUID();

    // Generate title ONLY if it's the first message or we don't have a specific title yet
    const currentTitle = $('sessions-list')?.querySelector(`.session-item[data-id="${state.currentSessionId}"] .session-title`)?.textContent;
    let title = currentTitle;

    if (!title || title === 'Новый чат' || state.chatHistory.length <= 2) {
      const firstMsg = state.chatHistory.find(m => m.role === 'user')?.content || '';
      title = firstMsg.slice(0, 40) + (firstMsg.length > 40 ? '...' : '') || 'Новый чат';
    }
    
    try {
      const syncEl = $('sync-indicator');
      if (syncEl) syncEl.classList.remove('hidden');
      
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + state.authToken 
        },
        body: JSON.stringify({
          id: state.currentSessionId,
          title: title,
          messages: state.chatHistory,
          updatedAt: Date.now()
        })
      });
      this.loadList();
      
      if (syncEl) setTimeout(() => syncEl.classList.add('hidden'), 500);
    } catch (e) { 
      console.error('Failed to save session', e); 
      $('sync-indicator')?.classList.add('hidden');
    }
  },

  async renameSession(id, newTitle) {
    if (!newTitle) return;
    try {
      const syncEl = $('sync-indicator');
      if (syncEl) syncEl.classList.remove('hidden');

      const r = await fetch('/api/sessions/' + id, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + state.authToken 
        },
        body: JSON.stringify({ title: newTitle })
      });
      if (r.ok) this.loadList();

      if (syncEl) setTimeout(() => syncEl.classList.add('hidden'), 500);
    } catch (e) { 
      showToast('Ошибка переименования'); 
      $('sync-indicator')?.classList.add('hidden');
    }
  },

  async deleteSession(id, e) {
    if (e) e.stopPropagation();
    if (!confirm('Удалить этот чат?')) return;
    
    try {
      const r = await fetch('/api/sessions/' + id, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + state.authToken }
      });
      if (r.ok) {
        if (state.currentSessionId === id) newChat();
        this.loadList();
      }
    } catch (e) { showToast('Ошибка удаления'); }
  },

  renderList(sessions) {
    const list = $('sessions-list');
    if (!list) return;
    list.textContent = '';
    
    if (sessions.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'sessions-empty';
      empty.textContent = 'Нет истории чатов';
      list.appendChild(empty);
      return;
    }

    const groups = {
      'Сегодня': [],
      'Вчера': [],
      'На этой неделе': [],
      'В этом месяце': [],
      'Ранее': []
    };

    const now = new Date();
    sessions.forEach(s => {
      const date = new Date(s.updatedAt);
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) groups['Сегодня'].push(s);
      else if (diffDays === 1) groups['Вчера'].push(s);
      else if (diffDays < 7) groups['На этой неделе'].push(s);
      else if (diffDays < 30) groups['В этом месяце'].push(s);
      else groups['Ранее'].push(s);
    });

    Object.entries(groups).forEach(([groupName, items]) => {
      if (items.length === 0) return;

      const groupEl = document.createElement('div');
      groupEl.className = 'session-group-label';
      groupEl.textContent = groupName;
      list.appendChild(groupEl);

      items.forEach(s => {
        const item = document.createElement('div');
        item.className = 'session-item' + (state.currentSessionId === s.id ? ' active' : '');
        item.dataset.id = s.id;
        
        const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        iconSvg.setAttribute('width', '14'); iconSvg.setAttribute('height', '14'); iconSvg.setAttribute('viewBox', '0 0 24 24'); iconSvg.setAttribute('fill', 'none'); iconSvg.setAttribute('stroke', 'currentColor'); iconSvg.setAttribute('stroke-width', '2'); iconSvg.setAttribute('class', 'session-icon');
        iconSvg.innerHTML = '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>';
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'session-title';
        titleSpan.title = s.title;
        titleSpan.textContent = s.title;

        const actions = document.createElement('div');
        actions.className = 'session-actions';

        const renBtn = document.createElement('button');
        renBtn.className = 'session-action-btn';
        renBtn.title = 'Переименовать';
        renBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';

        const delBtn = document.createElement('button');
        delBtn.className = 'session-action-btn delete';
        delBtn.title = 'Удалить';
        delBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';

        actions.appendChild(renBtn);
        actions.appendChild(delBtn);

        item.appendChild(iconSvg);
        item.appendChild(titleSpan);
        item.appendChild(actions);

        item.addEventListener('click', () => this.loadSession(s.id));
        
        renBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const newTitle = prompt('Введите новое название чата:', s.title);
          if (newTitle && newTitle !== s.title) this.renameSession(s.id, newTitle);
        });

        delBtn.addEventListener('click', (e) => this.deleteSession(s.id, e));
        list.appendChild(item);
      });
    });
  }
};

// Sync across tabs
window.addEventListener('storage', (e) => {
  if (e.key === 'chatavg_token' && !e.newValue) {
    window.location.reload(); // Logout in other tabs
  }
  if (e.key?.includes('_sessions_cache')) {
    SessionManager.loadList();
  }
});
