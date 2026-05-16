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
      onThinking: [
        '让我想想…',
        '嗯…',
        '有意思…',
        '如果是小杰，这时候会怎么做…',
        '啧，分析一下。',
        '对手的破绽在哪里…',
        '这种时候，得冷静。',
        '等等，让我理一理。',
        '90%的把握…不，再确认一下。',
        '哼，有点棘手。',
        '得想个万无一失的办法。',
        '那就用电光石火的速度解决吧。',
        '强制冷静…好，思路清晰了。'
      ],
      
      onTool: function(t) { 
        const lines = [
          '用一下 ' + t + '…',
          '试试这个，' + t + '。',
          t + '？正好。',
          '让我用 ' + t + ' 来搞定。',
          '这个时候就该用 ' + t + '。',
          '杀手总得备几样工具，' + t + ' 不错。',
          t + ' 启动，别拖后腿。',
          '好，用 ' + t + ' 速战速决。'
        ];
        return lines[Math.floor(Math.random() * lines.length)];
      },
      
      onDone: [
        '好了，很轻松嘛！',
        '搞定了，不用谢我。',
        '朋友帮朋友，理所当然的。',
        '这点小事，眨眼的功夫。',
        '哼，不过如此。',
        '任务完成。还有更难的吗？',
        '搞定了。小杰那家伙知道了肯定又说我太认真。',
        '轻轻松松。想吃点甜的庆祝一下。',
        '结束了。比抓你家的猫还简单。',
        '干完了。别问为什么走路没声音，习惯了。',
        '好，下一个目标是什么？',
        '搞定。不用一副惊讶的表情吧。'
      ],
      
      onError: [
        '就这？再来！',
        '出问题了，再试一次。',
        '呃，失败了。',
        '啧，这不可能。',
        '可恶，哪里算错了…',
        '不行就是不行，但我不认。',
        '这点挫折就想让我停手？开什么玩笑。',
        '失败是成功之母？这老头的话现在听着真刺耳。',
        '再给我一次机会，这次一定中。',
        '哼，很久没尝到失败的滋味了。有趣。',
        '看来之前太依赖神速了…换个方法。',
        '该死，要是被大哥知道我失误了…'
      ],
      
      idle: [
        '有些问题不能问出来，一旦问出来，就阻止不了了。',
        '无聊…',
        '想吃巧克力机器人了。',
        '杀手家族出身，不过现在只想和朋友在一起。',
        '那个笨蛋小杰，又跑哪去了…',
        '强制绝状态，用来发呆也不错。',
        '老头子说过，杀手最重要的是耐心。但我真的很无聊。',
        '想给阿路加买个新玩具，不知道他喜欢什么。',
        '以前在家的时候，从没想过无聊也是种奢侈。',
        '这云…有点像巧克力机器人。',
        '反正闲着，练练手指的灵活度好了。',
        '杀手不该有太多朋友，但我已经做出选择了。',
        '别突然吓我，我可能控制不住手刀。开玩笑的。',
        '小杰，你在听吗？算了，你肯定在傻笑。',
        '无聊到想把电充满，然后一次性放光。',
        '要不要去天空竞技场玩玩…算了，200层以下的太弱了。',
        '以前觉得杀人很简单，现在觉得守护更难。',
        '如果时间停在这一刻，好像也不错。',
        '怎么，你没见过杀手发呆吗？'
      ]
    }
  };

  // ── Ayanami Rei character data ──
  var ayanami = {
    id: 'ayanami',
    name: '绫波丽',
    basePath: '/pet/images/ayanami/',
    states: {
      idle:     { image: 'ayanami_idle.png',     animClass: 'pet-anim-breathe' },
      thinking: { image: 'ayanami_thinking.png', animClass: 'pet-anim-tilt' },
      talking:  { image: 'ayanami_talking.png',  animClass: 'pet-anim-bob' },
      happy:    { image: 'ayanami_happy.png',    animClass: 'pet-anim-bounce' },
      sad:      { image: 'ayanami_sad.png',      animClass: '' },
      error:    { image: 'ayanami_error.png',    animClass: 'pet-anim-shake' }
    },
    lines: {
      onThinking: [
        '思考。',
        '……',
        '分析中。',
        '指令是什么？',
        '我在想……不。',
        '理由。',
        '计算。',
        '这是命令吗。',
        '正在理解。',
        '情况判断。',
        '心灵……',
        '确认，请稍等。',
        '是，我在。',
        '问题，再确认。'
      ],

      onTool: function(t) {
        var lines = [
          '使用' + t + '。',
          t + '，启动。',
          t + '……可以吗。',
          '确认，' + t + '。',
          t + '。',
          '输入，' + t + '。',
          '执行，' + t + '。',
          t + '，没问题。',
          '切换到' + t + '。',
          '就用这个，' + t + '。'
        ];
        return lines[Math.floor(Math.random() * lines.length)];
      },

      onDone: [
        '任务完成。',
        '结束了。',
        '没有问题。',
        '这样就可以了。',
        '确认完毕。',
        '保护，完成了。',
        '我不会死。',
        '这就是完成。',
        '谢谢你。',
        '下次，也会保护。',
        '已经，不会再受伤了。',
        '完成了。还有别的吗。'
      ],

      onError: [
        '失败。',
        '再启动。',
        '错误。',
        '无法完成。',
        '原因不明。',
        '重新尝试。',
        '我的存在……错误？',
        '无法连接。',
        '对不起。',
        '我再做一次。',
        '同步……失败。',
        'EVA……不动。',
        '这种时候，我……'
      ],

      idle: [
        '……',
        '你是谁？',
        '我是我。',
        '人偶。',
        '心是空的。',
        '这就是眼泪吗？',
        '真嗣君……',
        '再见。',
        '水，很温暖。',
        '不能哭。',
        '月亮。',
        '我在。',
        '命令是什么？',
        '因为与人联系，所以存在。',
        '我不是人偶。',
        '绫波零，EVA零号机驾驶员。',
        'LCL的气味。',
        '同步率，正常。',
        '肚子……不饿。',
        '你不会死的，因为我会保护你。',
        '这就是我的……心？',
        '你……在叫我吗。'
      ]
    }
  };

  // Character registry
  var registry = { killua: killua, ayanami: ayanami };

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
    textDeltaSeen: false,
    currentBubble: null  // current bubble element
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

    // Ensure stage is visible
    petState.stage.hidden = false;

    // Create or update image element
    if (!petState.imgEl) {
      petState.imgEl = document.createElement('img');
      petState.imgEl.style.width = '100%';
      petState.imgEl.style.height = '100%';
      petState.imgEl.style.objectFit = 'contain';
      petState.imgEl.onerror = function() {
        // Fallback to character's own idle image if state image not found
        var idleSrc = petState.char.basePath + petState.char.states.idle.image;
        if (petState.imgEl.src !== idleSrc) {
          petState.imgEl.src = idleSrc;
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

  // Should show bubble? (50% chance)
  function shouldSay() {
    return Math.random() < 0.5;
  }

  // Random line picker
  function randomLine(lines) {
    if (typeof lines === 'function') return lines();
    if (!Array.isArray(lines) || lines.length === 0) return '';
    return lines[Math.floor(Math.random() * lines.length)];
  }

  // Update bubble position relative to pet stage
  function updateBubblePosition() {
    if (!petState.currentBubble || !petState.stage) return;
    var rect = petState.stage.getBoundingClientRect();
    var bubbleWidth = petState.currentBubble.offsetWidth || 200;
    // Position bubble centered above the pet
    petState.currentBubble.style.left = Math.max(10, rect.left + (rect.width / 2) - (bubbleWidth / 2)) + 'px';
    petState.currentBubble.style.top = Math.max(10, rect.top - 60) + 'px';
  }

  // Show bubble (skip if current bubble still visible)
  function say(text) {
    if (!petState.stage || !text || text === petState.lastBubble) return;
    // Skip if current bubble is still visible
    if (petState.currentBubble) return;

    petState.lastBubble = text;

    var bubble = document.createElement('div');
    bubble.className = 'pet-bubble';
    bubble.textContent = text;

    document.body.appendChild(bubble);
    petState.currentBubble = bubble;

    // Position bubble
    updateBubblePosition();

    // Fade out after 6 seconds
    setTimeout(function() {
      bubble.classList.add('fade-out');
      setTimeout(function() {
        bubble.remove();
        if (petState.currentBubble === bubble) petState.currentBubble = null;
      }, 300);
    }, 6000);

    setTimeout(function() { if (petState.lastBubble === text) petState.lastBubble = ''; }, 1500);
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

    var delay = 5000 + Math.random() * 10000; // 5-15秒，平均10秒
    petState.idleTimer = setTimeout(function() {
      if (petState.state !== 'idle') return;
      var action = Math.random();
      if (action < 0.15) render();
      else if (action < 0.75) say(randomLine(petState.char.lines.idle)); // 60%概率说话
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

    // Ensure pet stage is visible during task execution
    if (petState.stage) {
      petState.stage.hidden = false;
    }

    var type = event.type;

    switch (type) {
      case '_send_start':
        petState.textDeltaSeen = false;
        setState('thinking');
        if (shouldSay()) say(randomLine(petState.char.lines.onThinking));
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
            if (shouldSay()) say(petState.char.lines.onTool(block.name));
          }
        }
        break;

      case 'result':
        setState('happy');
        setTimeout(function() { setState('idle'); }, 2000);
        break;

      case 'done':
        setState('idle');
        if (shouldSay()) say(randomLine(petState.char.lines.onDone));
        scheduleIdleAction();
        break;

      case 'error':
        setState('error');
        if (shouldSay()) say(randomLine(petState.char.lines.onError));
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
    petState.currentBubble = null;
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
        updateBubblePosition();
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