import { state, settings } from './state.js';
import { $, t } from './index.js';

export function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

export function estimateTokens(text) { return Math.ceil((text || '').length / 3.5); }
export function getTotalDocTokens() { return state.attachedDocs.reduce((s, d) => s + d.tokens, 0); }

export function updateContextBadge() {
  const sysTokens = estimateTokens(settings.system_prompt);
  const docTokens = getTotalDocTokens();
  const chatTokens = state.chatHistory.reduce((s, m) => s + estimateTokens(m.content), 0);
  const total = sysTokens + docTokens + chatTokens;
  const pct = Math.min(100, Math.round((total / state.contextSize) * 100));

  const icon = pct < 60 ? '🟢' : pct < 85 ? '🟡' : '🔴';
  const contextUsage = $('context-usage');
  const contextBadge = $('context-badge');
  const sendBtn = $('send-btn');
  
  if(contextUsage) contextUsage.textContent = `${icon} ${pct}%`;
  if(contextBadge) {
    contextBadge.title = `Использовано ${total} из ${state.contextSize} токенов`;
    contextBadge.classList.remove('warn', 'danger');
  }

  const isOverLimit = total > state.contextSize;

  if (isOverLimit) {
    if(contextBadge) contextBadge.classList.add('danger');
    if(contextBadge) contextBadge.title = state.lang === 'ru' ? 'Превышен лимит контекста!' : 'Context limit exceeded!';
    if(sendBtn) {
        sendBtn.disabled = true;
        sendBtn.title = state.lang === 'ru' ? 'Слишком много текста' : 'Too much text';
    }
  } else {
    if(sendBtn) {
        sendBtn.disabled = state.isGenerating;
        sendBtn.title = state.lang === 'ru' ? 'Отправить' : 'Send';
    }
    if (pct >= 85 && contextBadge) contextBadge.classList.add('warn');
  }
}

export function updateTokenInfo() {
  const docTokens = getTotalDocTokens();
  const tokenInfo = $('token-info');
  if(!tokenInfo) return;
  if (docTokens > 0) {
    tokenInfo.textContent = `📎 ~${docTokens} tokens`;
  } else {
    tokenInfo.textContent = '';
  }
}

export function autoResizeTextarea() {
  const userInput = $('user-input');
  if(!userInput) return;
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 160) + 'px';
}

export function renderMarkdown(el, text) {
  el.dataset.raw = text;
  let thinkContent = '';
  let mainContent = text;
  const thinkMatch = text.match(/<think>([\s\S]*?)(<\/think>|$)/);
  if (thinkMatch) {
    thinkContent = thinkMatch[1].trim();
    mainContent = text.replace(/<think>[\s\S]*?(<\/think>|$)/, '').trim();
  }

  let html = '';
  if (thinkContent) {
    html += `<div class="think-block">
      <button class="think-toggle" aria-expanded="false" aria-label="Показать/скрыть размышление">
        💭 ${t('thinking')}… <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="think-content">${DOMPurify.sanitize(marked.parse(thinkContent))}</div>
    </div>`;
  }

  if (mainContent) {
    html += DOMPurify.sanitize(marked.parse(mainContent));
  }

  el.innerHTML = html; // Safe because of DOMPurify

  el.querySelectorAll('.think-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const content = btn.nextElementSibling;
      const isOpen = content.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen);
    });
  });
  
  const toolRegex = /<tool name="([\s\S]*?)">([\s\S]*?)(<\/tool>|$)/g;
  let toolHtml = el.innerHTML;
  toolHtml = toolHtml.replace(toolRegex, (match, name, content, closed) => {
    const isDone = closed === '</tool>';
    const displayName = name === 'web_search' ? (state.lang === 'ru' ? 'Поиск в сети' : 'Web Search') : name;
    const statusText = isDone 
      ? (state.lang === 'ru' ? 'готово' : 'done') 
      : (state.lang === 'ru' ? 'выполняется...' : 'running...');
    
    return `<div class="tool-block ${isDone ? 'done' : ''}">
      <div class="tool-header">
        <span class="tool-icon">${isDone ? '✅' : '🔧'}</span>
        <span class="tool-name">${DOMPurify.sanitize(displayName)}</span>
        <span class="tool-status">${DOMPurify.sanitize(statusText)}</span>
      </div>
    </div>`;
  });
  el.innerHTML = toolHtml;

  el.querySelectorAll('pre code').forEach(block => {
    if(window.hljs) hljs.highlightElement(block);
    const pre = block.parentElement;
    if (!pre.querySelector('.copy-code-btn')) {
      const btn = document.createElement('button');
      btn.className = 'copy-code-btn';
      btn.textContent = t('copy');
      btn.setAttribute('aria-label', t('copy'));
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(block.textContent).then(() => {
          btn.textContent = '✓';
          setTimeout(() => btn.textContent = t('copy'), 1500);
        });
      });
      pre.appendChild(btn);
    }
  });
}

export function showTypingIndicator(el) {
  el.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
}

export function renderDocChip(name, tokens, index) {
  const container = $('attached-docs');
  if(!container) return;
  const chip = document.createElement('div');
  chip.className = 'doc-chip';
  chip.innerHTML = `<span>📎 ${name} (~${tokens})</span>
                    <button class="remove-doc-btn" data-index="${index}">×</button>`;
  container.appendChild(chip);
  chip.querySelector('.remove-doc-btn').addEventListener('click', () => removeDoc(index));
}

export function removeDoc(index) {
  state.attachedDocs.splice(index, 1);
  const container = $('attached-docs');
  if(container) {
    container.textContent = '';
    state.attachedDocs.forEach((d, i) => renderDocChip(d.name, d.tokens, i));
  }
  updateTokenInfo();
  updateContextBadge();
}
