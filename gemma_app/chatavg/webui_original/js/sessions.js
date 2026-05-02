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
      }
    } catch (e) { console.error('Failed to load sessions', e); }
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

    const title = state.chatHistory[0]?.content.slice(0, 40) + (state.chatHistory[0]?.content.length > 40 ? '...' : '') || 'Новый чат';
    
    try {
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
    } catch (e) { console.error('Failed to save session', e); }
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

    sessions.forEach(s => {
      const item = document.createElement('div');
      item.className = 'session-item' + (state.currentSessionId === s.id ? ' active' : '');
      
      const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      iconSvg.setAttribute('width', '14'); iconSvg.setAttribute('height', '14'); iconSvg.setAttribute('viewBox', '0 0 24 24'); iconSvg.setAttribute('fill', 'none'); iconSvg.setAttribute('stroke', 'currentColor'); iconSvg.setAttribute('stroke-width', '2'); iconSvg.setAttribute('class', 'session-icon');
      iconSvg.innerHTML = '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>';
      
      const titleSpan = document.createElement('span');
      titleSpan.className = 'session-title';
      titleSpan.title = s.title;
      titleSpan.textContent = s.title;

      const delBtn = document.createElement('button');
      delBtn.className = 'session-delete';
      delBtn.title = 'Удалить';
      delBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';

      item.appendChild(iconSvg);
      item.appendChild(titleSpan);
      item.appendChild(delBtn);

      item.addEventListener('click', () => this.loadSession(s.id));
      delBtn.addEventListener('click', (e) => this.deleteSession(s.id, e));
      list.appendChild(item);
    });
  }
};
