// ── State ──

const state = {
  conversations: [],
  activeId: null,
  messages: [],
  isStreaming: false,
  eventSource: null,
};

// ── DOM refs ──

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
  convList: $('#convList'),
  sidebarEmpty: $('#sidebarEmpty'),
  chatEmpty: $('#chatEmpty'),
  chatMessages: $('#chatMessages'),
  chatInput: $('#chatInput'),
  chatInputBar: $('#chatInputBar'),
  btnSend: $('#btnSend'),
  btnNew: $('#btnNewConv'),
  status: $('#status'),
};

// ── Marked setup ──

if (typeof marked !== 'undefined') {
  marked.setOptions({
    breaks: true,
    gfm: true,
  });
}

function renderMarkdown(text) {
  if (typeof marked === 'undefined') return escapeHtml(text);
  let html = marked.parse(text);
  // Basic XSS sanitization: strip script tags
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<script[\s\S]*?\/>/gi, '');
  html = html.replace(/on\w+="[^"]*"/gi, '');
  html = html.replace(/on\w+='[^']*'/gi, '');
  return html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function highlightCodeBlocks(root) {
  if (typeof hljs === 'undefined') return;
  root.querySelectorAll('pre code').forEach((block) => {
    hljs.highlightElement(block);
  });
}

// ── API ──

async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// ── Conversation list ──

async function loadConversations() {
  try {
    const data = await api('GET', '/api/conversations');
    state.conversations = data.conversations;
    renderSidebar();
  } catch (e) {
    console.error('Failed to load conversations:', e);
  }
}

async function createConversation() {
  try {
    const conv = await api('POST', '/api/conversations', {});
    state.conversations.unshift({
      id: conv.id,
      title: conv.title,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messageCount: 0,
    });
    renderSidebar();
    selectConversation(conv.id);
  } catch (e) {
    console.error('Failed to create conversation:', e);
  }
}

function renderSidebar() {
  dom.convList.innerHTML = '';

  if (state.conversations.length === 0) {
    dom.sidebarEmpty.style.display = 'block';
    return;
  }

  dom.sidebarEmpty.style.display = 'none';

  state.conversations.forEach((conv) => {
    const el = document.createElement('div');
    el.className = 'conv-item' + (conv.id === state.activeId ? ' active' : '');
    el.innerHTML = `
      <span class="conv-item-title">${escapeHtml(conv.title)}</span>
      <span class="conv-item-meta">${conv.messageCount || 0}</span>
      <button class="conv-item-del" title="Delete">&times;</button>
    `;
    el.addEventListener('click', (e) => {
      if (e.target.closest('.conv-item-del')) {
        e.stopPropagation();
        deleteConversation(conv.id);
        return;
      }
      selectConversation(conv.id);
    });
    dom.convList.appendChild(el);
  });
}

// ── Conversation selection ──

async function selectConversation(id) {
  // Close existing SSE
  closeSSE();

  state.activeId = id;
  state._prevUsage = null;
  try {
    const conv = await api('GET', `/api/conversations/${id}`);
    state.messages = conv.messages || [];
    renderMessages();
    renderSidebar();
    enableInput(true);
    dom.chatEmpty.style.display = 'none';
    dom.chatMessages.style.display = 'flex';
  } catch (e) {
    console.error('Failed to load conversation:', e);
  }
}

async function deleteConversation(id) {
  try {
    await api('DELETE', `/api/conversations/${id}`);
    state.conversations = state.conversations.filter((c) => c.id !== id);
    if (state.activeId === id) {
      state.activeId = null;
      state.messages = [];
      renderMessages();
      dom.chatEmpty.style.display = 'flex';
      dom.chatMessages.style.display = 'none';
      enableInput(false);
    }
    renderSidebar();
  } catch (e) {
    console.error('Failed to delete conversation:', e);
  }
}

// ── Messages ──

function renderMessages() {
  dom.chatMessages.innerHTML = '';

  state.messages.forEach((msg) => {
    const el = createMessageBubble(msg.role, msg.content, false);
    dom.chatMessages.appendChild(el);
  });

  scrollToBottom();
}

function createMessageBubble(role, content, isStreaming) {
  const el = document.createElement('div');
  el.className = `message ${role}`;
  if (isStreaming) el.classList.add('streaming');

  if (role === 'assistant') {
    el.innerHTML = renderMarkdown(content);
    highlightCodeBlocks(el);
  } else {
    el.textContent = content;
  }

  el.dataset.role = role;
  return el;
}

function addMessageBubble(role, content) {
  dom.chatEmpty.style.display = 'none';
  dom.chatMessages.style.display = 'flex';

  const el = createMessageBubble(role, content, true);
  dom.chatMessages.appendChild(el);
  scrollToBottom();
  return el;
}

function updateStreamingBubble(el, deltaText) {
  // Accumulate text and re-render
  const current = el.dataset.rawText || '';
  const updated = current + deltaText;
  el.dataset.rawText = updated;

  // Split thinking from text
  el.innerHTML = renderMarkdown(updated);
  highlightCodeBlocks(el);
  scrollToBottom();
}

function finalizeStreamingBubble(el) {
  el.classList.remove('streaming');
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
  });
}

// ── Thinking block ──

let thinkingAccumulator = '';
let thinkingBlockEl = null;
let lastAssistantBubble = null;

function appendThinking(delta) {
  thinkingAccumulator += delta;
}

function commitThinkingBlock(parentEl) {
  if (!thinkingAccumulator.trim()) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'thinking-block';
  wrapper.innerHTML = `
    <button class="thinking-toggle">
      <span class="toggle-icon">&#9654;</span> Thinking (${thinkingAccumulator.length} chars)
    </button>
    <div class="thinking-content">${escapeHtml(thinkingAccumulator)}</div>
  `;

  const toggle = wrapper.querySelector('.thinking-toggle');
  const content = wrapper.querySelector('.thinking-content');
  toggle.addEventListener('click', () => {
    const isOpen = content.classList.toggle('open');
    toggle.querySelector('.toggle-icon').innerHTML = isOpen ? '&#9660;' : '&#9654;';
  });

  parentEl.appendChild(wrapper);
  thinkingAccumulator = '';
}

// ── Tool use display ──

function addToolUse(parentEl, toolName, toolInput) {
  const wrapper = document.createElement('div');
  wrapper.className = 'tool-use';
  wrapper.innerHTML = `
    <div class="tool-use-header">
      <span>&#128736;</span>
      <span class="tool-use-name">${escapeHtml(toolName)}</span>
    </div>
  `;
  if (toolInput) {
    const detail = document.createElement('div');
    detail.className = 'tool-use-detail';
    detail.innerHTML = `<pre>${escapeHtml(JSON.stringify(toolInput, null, 2))}</pre>`;
    wrapper.appendChild(detail);
  }
  parentEl.appendChild(wrapper);
  return wrapper;
}

// ── SSE ──

function openSSE(convId) {
  closeSSE();

  const es = new EventSource(`/api/conversations/${convId}/stream`);
  state.eventSource = es;

  // Create a streaming bubble for the assistant response
  const bubble = addMessageBubble('assistant', '');
  bubble.dataset.rawText = '';
  lastAssistantBubble = bubble;

  es.onmessage = (e) => {
    try {
      const event = JSON.parse(e.data);
      handleSSEEvent(event, bubble);
    } catch (err) {
      console.error('SSE parse error:', err);
    }
  };

  es.onerror = () => {
    es.close();
    state.eventSource = null;
  };
}

function handleSSEEvent(event, bubble) {
  switch (event.type) {
    case 'stream_event': {
      const delta = event.event?.delta;
      if (delta) {
        switch (delta.type) {
          case 'text_delta':
            updateStreamingBubble(bubble, delta.text);
            pushStatus('Generating response');
            break;
          case 'thinking_delta':
            appendThinking(delta.thinking);
            pushStatus('Thinking');
            break;
          case 'input_json_delta':
            break;
        }
      }

      // Track tool use
      if (event.event?.type === 'content_block_start') {
        const block = event.event.content_block;
        if (block?.type === 'tool_use') {
          commitThinkingBlock(bubble);
          const toolEl = addToolUse(bubble, block.name, block.input);
          toolEl.dataset.toolId = block.id;
          pushStatus(`Running: ${block.name}`);
        }
      }

      // Track tool input
      if (event.event?.type === 'content_block_delta') {
        const d = event.event.delta;
        if (d?.type === 'input_json_delta') {
          const toolEl = bubble.querySelector('.tool-use:last-child');
          if (toolEl) {
            const detail = toolEl.querySelector('.tool-use-detail');
            if (detail) {
              toolEl.dataset.rawInput = (toolEl.dataset.rawInput || '') + d.partial_json;
            }
          }
        }
      }
      break;
    }

    case 'assistant':
      // Final assembled message — replace streaming content
      if (event.message?.content) {
        const textParts = event.message.content
          .filter((c) => c.type === 'text')
          .map((c) => c.text)
          .join('');
        if (textParts) {
          bubble.dataset.rawText = textParts;
          bubble.innerHTML = renderMarkdown(textParts);
          highlightCodeBlocks(bubble);
        }
        commitThinkingBlock(bubble);
      }
      break;

    case 'user':
      // Tool result
      if (event.message?.content) {
        const toolResult = event.message.content
          .filter((c) => c.type === 'tool_result')
          .map((c) => c.content)
          .join('\n');
        if (toolResult) {
          const toolEl = bubble.querySelector('.tool-use:last-child');
          if (toolEl) {
            const detail = toolEl.querySelector('.tool-use-detail');
            if (!detail) {
              const d = document.createElement('div');
              d.className = 'tool-use-detail open';
              d.innerHTML = `<pre>${escapeHtml(toolResult)}</pre>`;
              toolEl.appendChild(d);
            }
          }
        }
      }
      break;

    case 'result':
      finalizeStreamingBubble(bubble);
      if (event.usage) showTokenStats(event.usage);
      break;

    case 'done':
      finalizeStreamingBubble(bubble);
      commitThinkingBlock(bubble);
      enableInput(true);
      closeSSE();
      // Reload messages from server to sync
      if (state.activeId) {
        api('GET', `/api/conversations/${state.activeId}`).then((conv) => {
          state.messages = conv.messages || [];
        });
      }
      loadConversations(); // update sidebar counts
      break;

    case 'error':
      bubble.innerHTML = `<span style="color:var(--danger)">Error: ${escapeHtml(event.message)}</span>`;
      finalizeStreamingBubble(bubble);
      enableInput(true);
      closeSSE();
      break;

    default:
      // system, init, etc. — log for debugging
      break;
  }
}

function closeSSE() {
  if (state.eventSource) {
    state.eventSource.close();
    state.eventSource = null;
  }
  thinkingAccumulator = '';
  thinkingBlockEl = null;
  lastAssistantBubble = null;
}

// ── Status bar ──

function pushStatus(line) {
  const lines = state._statusLines || [];
  if (lines[lines.length - 1] === line) return;
  lines.push(line);
  if (lines.length > 5) lines.shift();
  state._statusLines = lines;
  dom.status.innerHTML = lines.map(l => escapeHtml(l)).join('<br>');
  dom.status.classList.add('visible');
}

function showTokenStats(usage) {
  const prev = state._prevUsage || { input_tokens: 0, output_tokens: 0 };
  const dInput = usage.input_tokens - prev.input_tokens;
  const dOutput = usage.output_tokens - prev.output_tokens;
  state._prevUsage = usage;
  const inK = Math.round(dInput / 100) / 10;
  const outK = Math.round(dOutput / 100) / 10;
  state._statusLines = [];
  dom.status.textContent = `${inK}k in · ${outK}k out tokens`;
  dom.status.classList.add('visible');
  clearTimeout(state._statsTimer);
  state._statsTimer = setTimeout(() => dom.status.classList.remove('visible'), 8000);
}

// ── Input ──

function enableInput(enabled) {
  dom.chatInput.disabled = !enabled;
  dom.btnSend.disabled = !enabled;
  if (enabled) state.isStreaming = false;
}

async function sendMessage() {
  const prompt = dom.chatInput.value.trim();
  if (!prompt || state.isStreaming || !state.activeId) return;

  state.isStreaming = true;
  dom.chatInput.value = '';
  dom.btnSend.disabled = true;
  state._statusLines = [];
  dom.status.innerHTML = '';
  dom.status.classList.add('visible');
  pushStatus('Connecting...');

  // Add user bubble
  addMessageBubble('user', prompt);

  // Open SSE before sending — so we don't miss events
  openSSE(state.activeId);

  try {
    await api('POST', `/api/conversations/${state.activeId}/send`, { prompt });
    // Response handled via SSE
  } catch (e) {
    closeSSE();
    addMessageBubble('assistant', `Error: ${e.message}`);
    enableInput(true);
    state._statusLines = [];
    dom.status.textContent = 'Error';
    dom.status.classList.add('visible');
    setTimeout(() => dom.status.classList.remove('visible'), 4000);
    state.isStreaming = false;
  }
}

// ── Event listeners ──

dom.btnSend.addEventListener('click', sendMessage);

dom.chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

dom.btnNew.addEventListener('click', createConversation);

// Auto-resize textarea
dom.chatInput.addEventListener('input', () => {
  dom.chatInput.style.height = 'auto';
  dom.chatInput.style.height = Math.min(dom.chatInput.scrollHeight, 120) + 'px';
});

// ── Init ──

async function init() {
  await loadConversations();
  if (state.conversations.length > 0) {
    selectConversation(state.conversations[0].id);
  } else {
    createConversation();
  }
}

init();