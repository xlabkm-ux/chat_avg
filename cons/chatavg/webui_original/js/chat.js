import { state, settings } from './state.js';
import { $, t, showToast } from './index.js';
import { updateContextBadge, updateTokenInfo, autoResizeTextarea, renderMarkdown, estimateTokens, getTotalDocTokens, showTypingIndicator, renderDocChip, removeDoc } from './ui.js';
import { SessionManager } from './sessions.js';

export function newChat(reloadList = true) {
  state.chatHistory = [];
  state.attachedDocs = [];
  state.currentSessionId = null;
  const messagesEl = $('messages');
  const attachedDocsEl = $('attached-docs');
  if(messagesEl) messagesEl.textContent = '';
  if(attachedDocsEl) attachedDocsEl.textContent = '';
  $('welcome-screen')?.classList.remove('hidden');
  updateContextBadge();
  updateTokenInfo();
  if (reloadList) {
    SessionManager.renderList([]);
    SessionManager.loadList();
  }
}

export async function handleFiles(fileList) {
  const files = Array.from(fileList).filter(f => /\.(txt|md|docx|pdf)$/i.test(f.name));
  for (const file of files) {
    if (state.attachedDocs.length >= state.maxDocsAllowed) { showToast(`Максимум ${state.maxDocsAllowed} документов для вашей категории`); break; }
    try {
      const text = await parseFile(file);
      const tokens = estimateTokens(text);
      state.attachedDocs.push({ name: file.name, text, tokens });
      renderDocChip(file.name, tokens, state.attachedDocs.length - 1);
    } catch (e) { console.error('File parse error:', e); }
  }
  const fileInput = $('file-input');
  if(fileInput) fileInput.value = '';
  updateTokenInfo();
  checkDocsFitContext();
  updateContextBadge();
}

export async function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'txt' || ext === 'md') return await file.text();
  if (ext === 'docx' && window.mammoth) {
    const ab = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: ab });
    return result.value;
  }
  if (ext === 'pdf' && window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(it => it.str).join(' ') + '\n';
    }
    return text;
  }
  return '';
}

export function checkDocsFitContext() {
  const docTokens = getTotalDocTokens();
  const sysTokens = estimateTokens(settings.system_prompt);
  const total = docTokens + sysTokens + 200;
  if (total > state.contextSize) {
    const recommend = total < 8192 ? 8192 : 16384;
    showToast(t('doc_too_large', { tokens: total, ctx: state.contextSize, recommend }));
  }
}

export async function handleSend() {
  const userInput = $('user-input');
  if(!userInput) return;
  const text = userInput.value.trim();
  if (!text || state.isGenerating) return;

  $('welcome-screen')?.classList.add('hidden');
  userInput.value = '';
  autoResizeTextarea();

  let userContent = text;
  if (state.attachedDocs.length > 0) {
    const docBlock = state.attachedDocs.map((d, i) => `=== ${state.lang==='ru'?'Документ':'Document'} ${i+1}: ${d.name} ===\n${d.text}`).join('\n\n');
    userContent = docBlock + '\n\n---\n\n' + text;
  }
  const docsToRender = [...state.attachedDocs];
  addMessageToUI('user', text, docsToRender);
  state.chatHistory.push({ role: 'user', content: userContent, docs: docsToRender });

  if (state.attachedDocs.length > 0) {
    state.attachedDocs = [];
    const attachedDocsEl = $('attached-docs');
    if(attachedDocsEl) attachedDocsEl.textContent = '';
    updateTokenInfo();
  }

  const messages = [{ role: 'system', content: settings.system_prompt }, ...state.chatHistory];

  state.isGenerating = true;
  $('send-btn')?.classList.add('hidden');
  $('stop-btn')?.classList.remove('hidden');

  const msgEl = addMessageToUI('assistant', '');
  const contentEl = msgEl.querySelector('.msg-content');
  showTypingIndicator(contentEl);

  state.abortCtrl = new AbortController();
  let fullText = '';
  let tokenCount = 0;
  const startTime = Date.now();

  try {
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + state.authToken
    };

    const isCreative = $('feat-creative') && $('feat-creative').checked;
    const response = await fetch('/api/chat/completions', {
      method: 'POST',
      headers,
      signal: state.abortCtrl.signal,
      body: JSON.stringify({
        messages,
        stream: true,
        temperature: isCreative ? 1.2 : settings.temperature,
        top_p: settings.top_p,
        top_k: settings.top_k,
        min_p: settings.min_p,
        repeat_penalty: settings.repeat_penalty,
        n_predict: settings.n_predict,
        extra_params: buildExtraParams()
      })
    });

    if (!response.ok) throw new Error('HTTP ' + response.status);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') break;
        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content || '';
          if (token) {
            if (tokenCount === 0) contentEl.textContent = '';
            fullText += token;
            tokenCount++;
            renderMarkdown(contentEl, fullText);
            const messagesEl = $('messages');
            if(messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
          }
          if (parsed.usage) {
            tokenCount = parsed.usage.completion_tokens;
          }
        } catch {}
      }
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      fullText = fullText || t('error_server');
      renderMarkdown(contentEl, fullText);
    }
  }

  state.chatHistory.push({ role: 'assistant', content: fullText });
  finishGeneration();
  SessionManager.saveCurrent();
}

export function stopGeneration() {
  if (state.abortCtrl) state.abortCtrl.abort();
  finishGeneration();
}

export function finishGeneration() {
  state.isGenerating = false;
  $('send-btn')?.classList.remove('hidden');
  $('stop-btn')?.classList.add('hidden');
  updateContextBadge();
}

export function buildExtraParams() {
  const params = {};
  if ($('feat-reasoning')?.checked) params.reasoning = {};
  if ($('feat-websearch')?.checked) {
    params.tools = [{ type: 'web_search' }];
    params.tool_choice = 'auto';
    // For Qwen/DashScope native grounding
    params.enable_search = true;
  }
  return Object.keys(params).length > 0 ? params : null;
}

export function addMessageToUI(role, text, docs = []) {
  const msg = document.createElement('div');
  msg.className = 'msg ' + role;
  const avatarText = role === 'user' ? '👤' : '✦';
  
  let docsHtml = '';
  if (docs && docs.length > 0) {
    docsHtml = `<div class="msg-attachments">${docs.map(d => `<span class="msg-attachment-badge" title="${DOMPurify.sanitize(d.name)}">📎 ${DOMPurify.sanitize(d.name)}</span>`).join('')}</div>`;
  }

  msg.innerHTML = `<div class="msg-avatar">${avatarText}</div>
    <div class="msg-body">
      <div class="msg-content"></div>
      ${docsHtml}
      <div class="msg-actions">
        <button class="msg-action-btn copy-btn" title="${t('copy')}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span>${t('copy')}</span>
        </button>
      </div>
    </div>`;

  const contentEl = msg.querySelector('.msg-content');
  if (text) renderMarkdown(contentEl, text);

  msg.querySelector('.copy-btn').addEventListener('click', function() {
    const raw = contentEl.dataset.raw || contentEl.textContent;
    navigator.clipboard.writeText(raw).then(() => {
      this.classList.add('copied');
      this.querySelector('span').textContent = t('copied');
      setTimeout(() => { this.classList.remove('copied'); this.querySelector('span').textContent = t('copy'); }, 2000);
    });
  });

  const messagesEl = $('messages');
  if(messagesEl) {
      messagesEl.appendChild(msg);
      messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  return msg;
}
