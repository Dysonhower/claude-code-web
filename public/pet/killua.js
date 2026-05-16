// Killua character data - 16-bit pixel art style
export default {
  id: 'killua',
  name: '奇犽',
  states: {
    idle: {
      svg: `<svg viewBox="0 0 32 40" style="background:none">
  <!-- Body - layered purple/white top -->
  <rect x="8" y="20" width="16" height="8" fill="#6b5b95"/>
  <rect x="10" y="18" width="12" height="2" fill="#fff"/>
  <rect x="6" y="28" width="20" height="6" fill="#333"/>
  <!-- Boots -->
  <rect x="6" y="34" width="6" height="6" fill="#6b5b95"/>
  <rect x="20" y="34" width="6" height="6" fill="#6b5b95"/>
  <!-- Head -->
  <rect x="10" y="4" width="12" height="12" fill="#fce8d5"/>
  <!-- Hair - spiky white -->
  <rect x="8" y="0" width="16" height="4" fill="#e8e8e8"/>
  <rect x="6" y="2" width="4" height="6" fill="#e8e8e8"/>
  <rect x="22" y="2" width="4" height="6" fill="#e8e8e8"/>
  <rect x="10" y="0" width="2" height="2" fill="#fff"/>
  <rect x="20" y="0" width="2" height="2" fill="#fff"/>
  <rect x="14" y="0" width="4" height="2" fill="#fff"/>
  <!-- Eyes - simple pixels -->
  <rect x="12" y="8" width="3" height="3" fill="#333"/>
  <rect x="17" y="8" width="3" height="3" fill="#333"/>
  <!-- Mouth -->
  <rect x="14" y="12" width="4" height="1" fill="#333"/>
</svg>`,
      animClass: 'pet-anim-breathe'
    },
    thinking: {
      svg: `<svg viewBox="0 0 32 40" style="background:none">
  <!-- Body -->
  <rect x="8" y="20" width="16" height="8" fill="#6b5b95"/>
  <rect x="10" y="18" width="12" height="2" fill="#fff"/>
  <rect x="6" y="28" width="20" height="6" fill="#333"/>
  <rect x="6" y="34" width="6" height="6" fill="#6b5b95"/>
  <rect x="20" y="34" width="6" height="6" fill="#6b5b95"/>
  <!-- Head tilted -->
  <rect x="11" y="3" width="12" height="12" fill="#fce8d5"/>
  <!-- Hair spiky -->
  <rect x="9" y="0" width="16" height="4" fill="#e8e8e8"/>
  <rect x="7" y="2" width="4" height="6" fill="#e8e8e8"/>
  <rect x="23" y="2" width="4" height="6" fill="#e8e8e8"/>
  <rect x="11" y="0" width="2" height="2" fill="#fff"/>
  <rect x="21" y="0" width="2" height="2" fill="#fff"/>
  <rect x="15" y="0" width="4" height="2" fill="#fff"/>
  <!-- Eyes looking up -->
  <rect x="13" y="6" width="3" height="3" fill="#333"/>
  <rect x="18" y="6" width="3" height="3" fill="#333"/>
  <!-- Mouth closed -->
  <rect x="15" y="11" width="2" height="1" fill="#333"/>
  <!-- Hand to chin -->
  <rect x="4" y="16" width="4" height="4" fill="#fce8d5"/>
</svg>`,
      animClass: 'pet-anim-tilt'
    },
    talking: {
      svg: `<svg viewBox="0 0 32 40" style="background:none">
  <!-- Body -->
  <rect x="8" y="20" width="16" height="8" fill="#6b5b95"/>
  <rect x="10" y="18" width="12" height="2" fill="#fff"/>
  <rect x="6" y="28" width="20" height="6" fill="#333"/>
  <rect x="6" y="34" width="6" height="6" fill="#6b5b95"/>
  <rect x="20" y="34" width="6" height="6" fill="#6b5b95"/>
  <!-- Head -->
  <rect x="10" y="4" width="12" height="12" fill="#fce8d5"/>
  <!-- Hair -->
  <rect x="8" y="0" width="16" height="4" fill="#e8e8e8"/>
  <rect x="6" y="2" width="4" height="6" fill="#e8e8e8"/>
  <rect x="22" y="2" width="4" height="6" fill="#e8e8e8"/>
  <rect x="10" y="0" width="2" height="2" fill="#fff"/>
  <rect x="20" y="0" width="2" height="2" fill="#fff"/>
  <rect x="14" y="0" width="4" height="2" fill="#fff"/>
  <!-- Eyes wide -->
  <rect x="12" y="7" width="3" height="4" fill="#333"/>
  <rect x="17" y="7" width="3" height="4" fill="#333"/>
  <!-- Mouth open -->
  <rect x="13" y="12" width="6" height="2" fill="#333"/>
  <rect x="14" y="13" width="4" height="1" fill="#fce8d5"/>
</svg>`,
      animClass: 'pet-anim-bob'
    },
    happy: {
      svg: `<svg viewBox="0 0 32 40" style="background:none">
  <!-- Body -->
  <rect x="8" y="20" width="16" height="8" fill="#6b5b95"/>
  <rect x="10" y="18" width="12" height="2" fill="#fff"/>
  <rect x="6" y="28" width="20" height="6" fill="#333"/>
  <rect x="6" y="34" width="6" height="6" fill="#6b5b95"/>
  <rect x="20" y="34" width="6" height="6" fill="#6b5b95"/>
  <!-- Head -->
  <rect x="10" y="4" width="12" height="12" fill="#fce8d5"/>
  <!-- Hair -->
  <rect x="8" y="0" width="16" height="4" fill="#e8e8e8"/>
  <rect x="6" y="2" width="4" height="6" fill="#e8e8e8"/>
  <rect x="22" y="2" width="4" height="6" fill="#e8e8e8"/>
  <rect x="10" y="0" width="2" height="2" fill="#fff"/>
  <rect x="20" y="0" width="2" height="2" fill="#fff"/>
  <rect x="14" y="0" width="4" height="2" fill="#fff"/>
  <!-- Eyes happy (curved lines approximated) -->
  <rect x="12" y="8" width="3" height="2" fill="#333"/>
  <rect x="17" y="8" width="3" height="2" fill="#333"/>
  <!-- Big smile -->
  <rect x="12" y="12" width="8" height="2" fill="#333"/>
  <rect x="13" y="13" width="6" height="1" fill="#fce8d5"/>
</svg>`,
      animClass: 'pet-anim-bounce'
    },
    sad: {
      svg: `<svg viewBox="0 0 32 40" style="background:none">
  <!-- Body slumped -->
  <rect x="8" y="22" width="16" height="8" fill="#6b5b95"/>
  <rect x="10" y="20" width="12" height="2" fill="#fff"/>
  <rect x="6" y="30" width="20" height="6" fill="#333"/>
  <rect x="6" y="36" width="6" height="4" fill="#6b5b95"/>
  <rect x="20" y="36" width="6" height="4" fill="#6b5b95"/>
  <!-- Head lowered -->
  <rect x="10" y="6" width="12" height="12" fill="#fce8d5"/>
  <!-- Hair drooping -->
  <rect x="8" y="2" width="16" height="4" fill="#ccc"/>
  <rect x="6" y="4" width="4" height="6" fill="#ccc"/>
  <rect x="22" y="4" width="4" height="6" fill="#ccc"/>
  <!-- Eyes sad -->
  <rect x="12" y="10" width="3" height="3" fill="#333"/>
  <rect x="17" y="10" width="3" height="3" fill="#333"/>
  <!-- Mouth frown -->
  <rect x="14" y="14" width="4" height="1" fill="#333"/>
</svg>`,
      animClass: ''
    },
    error: {
      svg: `<svg viewBox="0 0 32 40" style="background:none">
  <!-- Body -->
  <rect x="8" y="20" width="16" height="8" fill="#6b5b95"/>
  <rect x="10" y="18" width="12" height="2" fill="#fff"/>
  <rect x="6" y="28" width="20" height="6" fill="#333"/>
  <rect x="6" y="34" width="6" height="6" fill="#6b5b95"/>
  <rect x="20" y="34" width="6" height="6" fill="#6b5b95"/>
  <!-- Head -->
  <rect x="10" y="4" width="12" height="12" fill="#fce8d5"/>
  <!-- Hair messy -->
  <rect x="8" y="0" width="16" height="4" fill="#e8e8e8"/>
  <rect x="4" y="2" width="6" height="6" fill="#e8e8e8"/>
  <rect x="22" y="2" width="6" height="6" fill="#e8e8e8"/>
  <!-- Eyes annoyed X -->
  <rect x="12" y="7" width="1" height="1" fill="#333"/>
  <rect x="14" y="9" width="1" height="1" fill="#333"/>
  <rect x="17" y="7" width="1" height="1" fill="#333"/>
  <rect x="19" y="9" width="1" height="1" fill="#333"/>
  <rect x="13" y="8" width="1" height="1" fill="#333"/>
  <rect x="18" y="8" width="1" height="1" fill="#333"/>
  <!-- Mouth grit -->
  <rect x="13" y="12" width="6" height="2" fill="#333"/>
</svg>`,
      animClass: 'pet-anim-shake'
    }
  },
  lines: {
    onThinking: ['让我想想…', '嗯…', '有意思…'],
    onTool: (t) => `用一下 ${t}…`,
    onDone: ['好了，很轻松嘛！', '搞定了，不用谢我。', '朋友帮朋友，理所当然的。'],
    onError: ['就这？再来！', '出问题了，再试一次。', '呃，失败了。'],
    idle: ['有些问题不能问出来，一旦问出来，就阻止不了了。', '无聊…', '想吃巧克力机器人了。', '杀手家族出身，不过现在只想和朋友在一起。']
  }
};