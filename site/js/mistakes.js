/* 錯題庫：只顯示題目、對錯與正確答案，不顯示解析。 */
(function () {
  'use strict';

  var root = document.getElementById('mistakes-root');
  if (!root) return;

  var BLANK_PROMPT = '請看圖，選出正確的答案。';

  var ICONS = {
    repeat: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>',
    check: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
    x: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    info: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    play: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
    home: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
  };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function link(cls, text, href) {
    var a = el('a', cls, text);
    a.href = href;
    return a;
  }

  // 每一題最近一次答錯時選的選項
  function lastWrongChoices() {
    var map = {};
    Store.getAttempts().forEach(function (a) {
      a.answers.forEach(function (r) { if (!r.correct) map[r.qid] = r.choice; });
    });
    return map;
  }

  function renderEmpty() {
    var card = el('div', 'empty-state-card');

    var ill = el('div', 'empty-state-illustration');
    ill.style.cssText = 'display: flex; justify-content: center; margin-bottom: var(--space-4);';
    var img = el('img');
    img.src = 'assets/illustrations/empty-mistakes.png';
    img.alt = '太棒了！目前沒有任何錯題';
    img.style.cssText = 'max-width: 220px; height: auto; object-fit: contain;';
    ill.appendChild(img);
    card.appendChild(ill);

    card.appendChild(el('h2', 'empty-state-title', '太棒了！目前沒有任何錯題'));
    card.appendChild(el('p', 'empty-state-desc',
      '答錯的題目會收進這裡，連續答對 ' + Store.MISTAKE_CLEAR_STREAK + ' 次就會移出。繼續練習，有錯題就會出現在這裡。'));

    var actions = el('div', 'empty-state-actions');
    actions.appendChild(link('btn btn-primary btn-lg', '繼續挑戰小關卡 ➔', 'index.html'));
    card.appendChild(actions);
    root.appendChild(card);
  }

  function renderHero(count) {
    var sec = el('section', 'mistakes-hero-card');
    var h1 = el('h1', 'mistakes-title');
    var rIcon = el('span', 'mistakes-title-icon');
    rIcon.innerHTML = ICONS.repeat;
    h1.appendChild(rIcon);
    h1.appendChild(el('span', null, '錯題庫（' + count + ' 題待複習）'));
    sec.appendChild(h1);

    var need = Store.MISTAKE_CLEAR_STREAK;
    var desc = el('p', 'mistakes-desc');
    desc.appendChild(document.createTextNode('答錯的題目會自動保存在這裡。只要'));
    desc.appendChild(el('strong', null, '連續答對 ' + need + ' 次'));
    desc.appendChild(document.createTextNode('，就會移出錯題庫。'));
    sec.appendChild(desc);

    var rule = el('div', 'mistakes-rule');
    var iIcon = el('span');
    iIcon.innerHTML = ICONS.info;
    rule.appendChild(iIcon);
    rule.appendChild(el('span', null, '中途答錯，連續答對的次數會從 0 重算。'));
    sec.appendChild(rule);

    var startBtn = link('btn btn-primary btn-lg mistakes-start-btn',
      '開始練習錯題（一次最多 ' + Store.MISTAKE_RETEST_SIZE + ' 題）➔', 'quiz.html?mode=mistakes');
    sec.appendChild(startBtn);
    root.appendChild(sec);
  }

  function renderCard(q, streak, wrongChoice) {
    var need = Store.MISTAKE_CLEAR_STREAK;
    var card = el('article', 'mistake-card');

    var head = el('div', 'mistake-card-header');
    var tags = el('div', 'tag-list');
    tags.appendChild(el('span', 'tag tag-category text-nowrap', q.category));
    tags.appendChild(el('span', 'tag tag-sub text-nowrap', q.subcategory));
    if (q.tags.indexOf('反向題') !== -1) tags.appendChild(el('span', 'tag tag-reverse text-nowrap', '反向題'));
    if (q.tags.indexOf('數字題') !== -1) tags.appendChild(el('span', 'tag text-nowrap', '數字題'));
    if (q.image) tags.appendChild(el('span', 'tag text-nowrap', '圖片題'));
    tags.appendChild(el('span', 'tag text-nowrap', '題號 ' + q.id));
    head.appendChild(tags);
    card.appendChild(head);

    var box = el('div', 'mistake-streak-box');
    var sh = el('div', 'mistake-streak-header');
    var left = el('span', streak ? 'streak-on text-nowrap' : 'streak-off text-nowrap');
    left.appendChild(document.createTextNode('連續答對進度：'));
    left.appendChild(el('strong', null, streak + ' / ' + need + ' 次'));
    sh.appendChild(left);
    sh.appendChild(el('span', 'streak-hint text-nowrap', streak ? '再答對 ' + (need - streak) + ' 次即可移出！' : '還需連續答對 ' + need + ' 次'));
    box.appendChild(sh);

    var dots = el('div', 'streak-dots');
    for (var i = 0; i < need; i++) {
      var d = el('div', 'streak-dot' + (i < streak ? ' is-active' : ''));
      if (i < streak) d.innerHTML = ICONS.check;
      else d.textContent = String(i + 1);
      d.title = i < streak ? '第 ' + (i + 1) + ' 次答對' : '還需第 ' + (i + 1) + ' 次答對';
      dots.appendChild(d);
    }
    box.appendChild(dots);
    card.appendChild(box);

    var text = q.question.trim();
    if (text) {
      var wrap = el('div', 'question-title-wrapper');
      wrap.appendChild(el('h2', 'question-title', text));
      card.appendChild(wrap);
    } else {
      card.appendChild(el('div', 'question-stem-prompt', BLANK_PROMPT));
    }

    if (q.image) {
      var frame = el('div', 'question-image-frame');
      var img = el('img');
      img.src = Data.assetUrl(q.image);
      img.alt = '題目圖片';
      frame.appendChild(img);
      card.appendChild(frame);
    }

    var list = el('div', 'options-list');
    q.options.forEach(function (opt, i) {
      var cls = 'option-card', ind = null;
      if (i === q.answer) { cls += ' is-correct'; ind = '正確解答'; }
      else if (i === wrongChoice) { cls += ' is-wrong'; ind = '你的上次選擇'; }
      else cls += ' is-dimmed';
      var o = el('div', cls);
      o.appendChild(el('span', 'option-badge', String(i + 1)));
      o.appendChild(el('span', 'option-label', opt));
      if (ind) o.appendChild(el('span', 'option-indicator', ind));
      list.appendChild(o);
    });
    card.appendChild(list);

    var actions = el('div', 'mistake-card-actions');
    actions.appendChild(link('btn btn-secondary', '單獨複習此題 ➔', 'quiz.html?mode=mistakes&qid=' + encodeURIComponent(q.id)));
    card.appendChild(actions);
    return card;
  }

  function init() {
    var student = Store.getStudent() || '301 班 12 號';
    Store.setStudent(student);

    var userChip = document.getElementById('user-chip');
    if (userChip) userChip.textContent = student;

    Data.load().then(function () {
      var m = Store.getMistakes();
      var ids = Object.keys(m).filter(function (id) { return Data.getQuestion(id); });
      root.textContent = '';
      if (!ids.length) return renderEmpty();

      var wrongs = lastWrongChoices();
      renderHero(ids.length);
      var list = el('div', 'mistakes-list');
      ids.forEach(function (id) {
        list.appendChild(renderCard(Data.getQuestion(id), m[id], wrongs[id]));
      });
      root.appendChild(list);

      var nav = el('div', 'mistakes-footer-nav');
      var backBtn = link('btn btn-outline btn-lg', '', 'index.html');
      backBtn.innerHTML = ICONS.home + '<span style="margin-left: 6px;">回首頁</span>';
      nav.appendChild(backBtn);
      root.appendChild(nav);
    }).catch(function () {
      root.textContent = '資料載入失敗，請用網址 http://localhost:8000/site/ 開啟。';
    });
  }

  init();
})();
