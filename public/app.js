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
  return DOMPurify.sanitize(marked.parse(text));
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
    state._prevUsage = null;
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
    // Show welcome when empty, chat area when has messages
    if (state.messages.length === 0) {
      dom.chatEmpty.style.display = 'flex';
      dom.chatMessages.style.display = 'none';
    } else {
      dom.chatEmpty.style.display = 'none';
      dom.chatMessages.style.display = 'flex';
    }
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
    // Auto-create new conversation if all deleted
    if (state.conversations.length === 0) {
      createConversation();
    }
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

// ── Stream status (retry / rate-limit notices) ──

function showStatus(parentEl, message) {
  let status = parentEl.querySelector('.stream-status');
  if (!status) {
    status = document.createElement('div');
    status.className = 'stream-status';
    status.style.cssText = 'font-size:12px;color:#a06000;font-style:italic;margin-bottom:8px;padding:6px 10px;background:rgba(255,200,0,0.15);border-left:3px solid #f0a000;border-radius:4px;';
    parentEl.insertBefore(status, parentEl.firstChild);
  }
  status.textContent = message;
}

function clearStatus(parentEl) {
  const status = parentEl.querySelector('.stream-status');
  if (status) status.remove();
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

function openSSE(convId, onReady) {
  closeSSE();

  const es = new EventSource(`/api/conversations/${convId}/stream`);
  state.eventSource = es;

  const bubble = addMessageBubble('assistant', '');
  bubble.dataset.rawText = '';
  lastAssistantBubble = bubble;

  es.onopen = () => { if (onReady) onReady(); };
  es.onmessage = (e) => {
    try {
      const event = JSON.parse(e.data);
      handleSSEEvent(event, bubble);
    } catch (err) {
      console.error('SSE parse error:', err);
    }
  };

  es.onerror = () => {
    // Graceful close (after 'done') already nulled state.eventSource.
    // Only handle real connection failures here.
    if (!state.eventSource) return;

    es.close();
    state.eventSource = null;

    if (lastAssistantBubble) {
      if (!lastAssistantBubble.dataset.rawText) {
        lastAssistantBubble.innerHTML =
          '<span style="color:var(--danger)">连接中断，请稍后重试</span>';
        // Mark non-empty so closeSSE won't remove the bubble next time.
        lastAssistantBubble.dataset.rawText = ' ';
      }
      finalizeStreamingBubble(lastAssistantBubble);
    }
    thinkingAccumulator = '';
    thinkingBlockEl = null;
    lastAssistantBubble = null;
    enableInput(true);
  };
}

function handleSSEEvent(event, bubble) {
  // Forward to pet module
  window.pet?.onStreamEvent(event);

  switch (event.type) {
    case 'retry': {
      const eta = event.delaySec ? `，${event.delaySec}s 后` : '';
      const attempt = event.attempt && event.maxAttempts
        ? `第 ${event.attempt}/${event.maxAttempts} 次` : '';
      showStatus(bubble, `⏳ Claude API 触发限流${eta}重试 ${attempt}...`);
      break;
    }

    case 'rate_limit':
      showStatus(bubble, `⚠️  ${event.message}`);
      break;

    case 'stderr':
      // Quietly log; don't disturb UI for non-error noise
      console.debug('[claude stderr]', event.message);
      break;

    case 'stream_event': {
      // Any real content arriving means retries have succeeded — clear the banner.
      const delta = event.event?.delta;
      if (delta?.type === 'text_delta' || delta?.type === 'thinking_delta') {
        clearStatus(bubble);
      }
      if (delta) {
        switch (delta.type) {
          case 'text_delta':
            updateStreamingBubble(bubble, delta.text);
            break;
          case 'thinking_delta':
            appendThinking(delta.thinking);
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
  // Remove empty assistant bubble if aborting early
  if (lastAssistantBubble && !lastAssistantBubble.dataset.rawText) {
    lastAssistantBubble.remove();
  }
  thinkingAccumulator = '';
  thinkingBlockEl = null;
  lastAssistantBubble = null;
}

// ── Input ──

function enableInput(enabled) {
  dom.chatInput.disabled = !enabled;
  dom.btnSend.disabled = !enabled;
  if (enabled) {
    state.isStreaming = false;
    dom.btnSend.textContent = 'Send';
    dom.btnSend.classList.remove('btn-stop');
  }
}

async function sendMessage() {
  const prompt = dom.chatInput.value.trim();
  if (!prompt || state.isStreaming || !state.activeId) return;

  state.isStreaming = true;
  dom.chatInput.value = '';
  dom.chatInput.disabled = true;
  dom.btnSend.textContent = 'Stop';
  dom.btnSend.classList.add('btn-stop');
  dom.btnSend.disabled = false;
  window.pet?.onStreamEvent({ type: '_send_start' });

  addMessageBubble('user', prompt);

  openSSE(state.activeId, async () => {
    try {
      await api('POST', `/api/conversations/${state.activeId}/send`, { prompt });
    } catch (e) {
      closeSSE();
      addMessageBubble('assistant', `Error: ${e.message}`);
      enableInput(true);
      window.pet?.onStreamEvent({ type: 'error' });
    }
  });
}

async function abortRequest() {
  if (!state.activeId || !state.isStreaming) return;
  try {
    await api('POST', `/api/conversations/${state.activeId}/abort`);
  } catch (e) {
    console.error('Abort failed:', e);
  }
  closeSSE();
  enableInput(true);
}

// ── Event listeners ──

dom.btnSend.addEventListener('click', () => {
  if (state.isStreaming) abortRequest();
  else sendMessage();
});

dom.chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
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