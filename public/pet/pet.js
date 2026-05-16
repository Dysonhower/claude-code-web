// Pet system main controller
(function() {
  // ── Killua character data ──
  var killua = {
    id: 'killua',
    name: '奇犽',
    basePath: '/pet/images/killua/',
    states: {
      idle:     { image: 'killua_idle.png',     animClass: 'pet-anim-breathe' },
      thinking: { image: 'killua_thinking.png', animClass: 'pet-anim-tilt' },
      talking:  { image: 'killua_talking.png',  animClass: 'pet-anim-bob' },
      happy:    { image: 'killua_happy.png',    animClass: 'pet-anim-bounce' },
      sad:      { image: 'killua_sad.png',      animClass: '' },
      error:    { image: 'killua_error.png',    animClass: 'pet-anim-shake' }
    },
    lines: {
      onThinking: ['让我想想…', '嗯…', '有意思…'],
      onTool: function(t) { return '用一下 ' + t + '…'; },
      onDone: ['好了，很轻松嘛！', '搞定了，不用谢我。', '朋友帮朋友，理所当然的。'],
      onError: ['就这？再来！', '出问题了，再试一次。', '呃，失败了。'],
      idle: ['有些问题不能问出来，一旦问出来，就阻止不了了。', '无聊…', '想吃巧克力机器人了。', '杀手家族出身，不过现在只想和朋友在一起。']
    }
  };

  // Character registry
  var registry = { killua: killua };

  // Pet singleton state
  var petState = {
    active: null,
    char: null,
    state: 'idle',
    stage: null,
    imgEl: null,
    position: { x: null, y: null },
    lastBubble: '',
    idleTimer: null,
    textDeltaSeen: false
  };

  // Default position (right bottom)
  function defaultPos() {
    return {
      x: window.innerWidth - 304,
      y: window.innerHeight - 344
    };
  }

  // Clamp position to viewport
  function clampPos(x, y) {
    return {
      x: Math.max(0, Math.min(window.innerWidth - 280, x)),
      y: Math.max(0, Math.min(window.innerHeight - 320, y))
    };
  }

  // Load saved position
  function loadPosition() {
    try {
      var saved = localStorage.getItem('pet.position');
      if (saved) return clampPos(JSON.parse(saved).x, JSON.parse(saved).y);
    } catch (e) {}
    return defaultPos();
  }

  // Save position
  function savePosition(pos) {
    try { localStorage.setItem('pet.position', JSON.stringify(pos)); } catch (e) {}
  }

  // Render current state
  function render() {
    if (!petState.stage || !petState.char) return;
    var stateData = petState.char.states[petState.state];
    if (!stateData) return;

    // Create or update image element
    if (!petState.imgEl) {
      petState.imgEl = document.createElement('img');
      petState.imgEl.style.width = '100%';
      petState.imgEl.style.height = '100%';
      petState.imgEl.style.objectFit = 'contain';
      petState.imgEl.onerror = function() {
        // Fallback to idle image if state image not found
        if (petState.imgEl.src !== petState.char.basePath + 'killua_idle.png') {
          petState.imgEl.src = petState.char.basePath + 'killua_idle.png';
        }
      };
      petState.stage.appendChild(petState.imgEl);
    }

    petState.imgEl.src = petState.char.basePath + stateData.image;
    petState.stage.className = 'pet-stage';
    if (stateData.animClass) petState.stage.classList.add(stateData.animClass);

    if (petState.position.x !== null) {
      petState.stage.style.right = 'auto';
      petState.stage.style.bottom = 'auto';
      petState.stage.style.left = petState.position.x + 'px';
      petState.stage.style.top = petState.position.y + 'px';
    }
  }

  // Random line picker
  function randomLine(lines) {
    if (typeof lines === 'function') return lines();
    if (!Array.isArray(lines) || lines.length === 0) return '';
    return lines[Math.floor(Math.random() * lines.length)];
  }

  // Show bubble
  function say(text) {
    if (!petState.stage || !text || text === petState.lastBubble) return;
    petState.lastBubble = text;

    var bubble = document.createElement('div');
    bubble.className = 'pet-bubble';
    bubble.textContent = text;

    var rect = petState.stage.getBoundingClientRect();
    bubble.style.left = Math.max(10, rect.left - 20) + 'px';
    bubble.style.top = Math.max(10, rect.top - 50) + 'px';

    document.body.appendChild(bubble);

    setTimeout(function() {
      bubble.classList.add('fade-out');
      setTimeout(function() { bubble.remove(); }, 300);
    }, 3500);

    setTimeout(function() { if (petState.lastBubble === text) petState.lastBubble = ''; }, 1000);
  }

  // Set state
  function setState(name) {
    if (!petState.char || !petState.char.states[name]) return;
    petState.state = name;
    render();
  }

  // Idle action scheduler
  function scheduleIdleAction() {
    if (petState.idleTimer) clearTimeout(petState.idleTimer);
    if (!petState.active || petState.state !== 'idle') return;

    var delay = 30000 + Math.random() * 60000;
    petState.idleTimer = setTimeout(function() {
      if (petState.state !== 'idle') return;
      var action = Math.random();
      if (action < 0.3) render();
      else if (action < 0.6) say(randomLine(petState.char.lines.idle));
      else {
        petState.stage.classList.add('pet-anim-bounce');
        setTimeout(function() { petState.stage.classList.remove('pet-anim-bounce'); }, 500);
      }
      scheduleIdleAction();
    }, delay);
  }

  // Handle stream events
  function onStreamEvent(event) {
    if (!petState.active || !petState.char) return;

    var type = event.type;

    switch (type) {
      case '_send_start':
        petState.textDeltaSeen = false;
        setState('thinking');
        say(randomLine(petState.char.lines.onThinking));
        break;

      case 'stream_event':
        var delta = event.event && event.event.delta;
        if (delta && delta.type === 'text_delta' && !petState.textDeltaSeen) {
          petState.textDeltaSeen = true;
          setState('talking');
        }
        var eventType = event.event && event.event.type;
        if (eventType === 'content_block_start') {
          var block = event.event.content_block;
          if (block && block.type === 'tool_use') {
            setState('thinking');
            say(petState.char.lines.onTool(block.name));
          }
        }
        break;

      case 'result':
        setState('happy');
        setTimeout(function() { setState('idle'); }, 2000);
        break;

      case 'done':
        setState('idle');
        say(randomLine(petState.char.lines.onDone));
        scheduleIdleAction();
        break;

      case 'error':
        setState('error');
        say(randomLine(petState.char.lines.onError));
        setTimeout(function() { setState('idle'); }, 2000);
        scheduleIdleAction();
        break;
    }
  }

  // Load character
  function load(charId) {
    if (charId === 'off') { unload(); return; }
    var char = registry[charId];
    if (!char) return;

    petState.active = charId;
    petState.char = char;
    petState.state = 'idle';
    petState.position = loadPosition();

    petState.stage = document.getElementById('petStage');
    petState.imgEl = null; // Reset image element
    if (petState.stage) {
      petState.stage.innerHTML = ''; // Clear previous content
      petState.stage.hidden = false;
      render();
      setupDrag();
    }
    scheduleIdleAction();
    try { localStorage.setItem('pet.active', charId); } catch (e) {}
  }

  // Unload
  function unload() {
    if (petState.idleTimer) clearTimeout(petState.idleTimer);
    petState.active = null;
    petState.char = null;
    petState.state = 'idle';
    petState.imgEl = null;
    if (petState.stage) {
      petState.stage.hidden = true;
      petState.stage.innerHTML = '';
    }
    document.querySelectorAll('.pet-bubble').forEach(function(b) { b.remove(); });
    try { localStorage.setItem('pet.active', 'off'); } catch (e) {}
  }

  // Drag setup
  function setupDrag() {
    if (!petState.stage) return;
    var dragging = false, startX, startY;

    petState.stage.addEventListener('pointerdown', function(e) {
      dragging = true;
      petState.stage.classList.add('dragging');
      petState.stage.setPointerCapture(e.pointerId);
      startX = e.clientX - petState.position.x;
      startY = e.clientY - petState.position.y;
    });

    petState.stage.addEventListener('pointermove', function(e) {
      if (!dragging) return;
      requestAnimationFrame(function() {
        var pos = clampPos(e.clientX - startX, e.clientY - startY);
        petState.position = pos;
        petState.stage.style.left = pos.x + 'px';
        petState.stage.style.top = pos.y + 'px';
      });
    });

    petState.stage.addEventListener('pointerup', function(e) {
      if (!dragging) return;
      dragging = false;
      petState.stage.classList.remove('dragging');
      petState.stage.releasePointerCapture(e.pointerId);
      savePosition(petState.position);
    });

    petState.stage.addEventListener('dblclick', function() {
      petState.position = defaultPos();
      petState.stage.style.left = petState.position.x + 'px';
      petState.stage.style.top = petState.position.y + 'px';
      savePosition(petState.position);
      render();
    });
  }

  // Resize handler
  function onResize() {
    if (!petState.active || !petState.stage) return;
    var pos = clampPos(petState.position.x, petState.position.y);
    if (pos.x !== petState.position.x || pos.y !== petState.position.y) {
      petState.position = pos;
      petState.stage.style.left = pos.x + 'px';
      petState.stage.style.top = pos.y + 'px';
      savePosition(pos);
    }
  }

  // Init
  function init() {
    var savedPet = 'killua';
    try {
      var saved = localStorage.getItem('pet.active');
      if (saved === 'off') savedPet = 'off';
      else if (saved && registry[saved]) savedPet = saved;
    } catch (e) {}

    var btn = document.getElementById('petSelectorBtn');
    var menu = document.getElementById('petSelectorMenu');
    if (!btn || !menu) return;

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
    });

    menu.querySelectorAll('button').forEach(function(b) {
      b.addEventListener('click', function() {
        var petId = b.dataset.pet;
        load(petId);
        menu.hidden = true;
        menu.querySelectorAll('button').forEach(function(bb) {
          bb.style.fontWeight = bb.dataset.pet === petId ? '600' : 'normal';
        });
      });
    });

    document.addEventListener('click', function(e) {
      if (!btn.contains(e.target) && !menu.contains(e.target)) {
        menu.hidden = true;
      }
    });

    window.addEventListener('resize', onResize);

    if (savedPet !== 'off') {
      var activeBtn = menu.querySelector('button[data-pet="' + savedPet + '"]');
      if (activeBtn) activeBtn.style.fontWeight = '600';
      load(savedPet);
    } else {
      menu.querySelector('button[data-pet="off"]').style.fontWeight = '600';
    }
  }

  // Export to window
  window.pet = {
    load: load,
    unload: unload,
    say: say,
    setState: setState,
    onStreamEvent: onStreamEvent
  };

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();