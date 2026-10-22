/* 錯題庫：只顯示題目、對錯與正確答案，不顯示解析。 */
(function () {
  var root = document.getElementById('mistakes-root');
  var BLANK_PROMPT = '請看圖，選出正確的答案。';

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
    card.appendChild(el('div', 'empty-state-icon', '🏆✨'));
    card.appendChild(el('h2', 'empty-state-title', '太棒了！目前沒有任何錯題！'));
    card.appendChild(el('p', 'empty-state-desc',
      '答錯的題目會收進這裡，連續答對 ' + Store.MISTAKE_CLEAR_STREAK + ' 次就會移出。繼續練習，有錯題就會出現在這裡。'));
    var actions = el('div', 'empty-state-actions');
    actions.appendChild(link('btn btn-primary btn-lg', '🎯 繼續挑戰小關卡 ➔', 'index.html'));
    card.appendChild(actions);
    root.appendChild(card);
  }

  function renderHero(count) {
    var sec = el('section', 'mistakes-hero-card');
    var h1 = el('h1', 'mistakes-title');
    h1.appendChild(el('span', null, '🔁'));
    h1.appendChild(el('span', null, '錯題庫（' + count + ' 題待複習）'));
    sec.appendChild(h1);
    var need = Store.MISTAKE_CLEAR_STREAK;
    var desc = el('p', 'mistakes-desc');
    desc.appendChild(document.createTextNode('答錯的題目會自動保存在這裡。只要'));
    desc.appendChild(el('strong', null, '連續答對 ' + need + ' 次'));
    desc.appendChild(document.createTextNode('，就會移出錯題庫。'));
    sec.appendChild(desc);
    var rule = el('div', 'mistakes-rule');
    rule.appendChild(el('span', null, '💡'));
    rule.appendChild(el('span', null, '中途答錯，連續答對的次數會從 0 重算。'));
    sec.appendChild(rule);
    sec.appendChild(link('btn btn-primary btn-lg mistakes-start-btn',
      '🚀 開始重練（一次最多 ' + Store.MISTAKE_RETEST_SIZE + ' 題）➔', 'quiz.html?mode=mistakes'));
    root.appendChild(sec);
  }

  function renderCard(q, streak, wrongChoice) {
    var need = Store.MISTAKE_CLEAR_STREAK;
    var card = el('article', 'mistake-card');

    var head = el('div', 'mistake-card-header');
    var tags = el('div', 'tag-list');
    tags.appendChild(el('span', 'tag tag-category', q.category));
    tags.appendChild(el('span', 'tag tag-sub', q.subcategory));
    if (q.tags.indexOf('反向題') !== -1) tags.appendChild(el('span', 'tag tag-reverse', '⚠️ 反向題'));
    if (q.tags.indexOf('數字題') !== -1) tags.appendChild(el('span', 'tag', '🔢 數字題'));
    if (q.image) tags.appendChild(el('span', 'tag', '🖼️ 圖片題'));
    tags.appendChild(el('span', 'tag', '題號 ' + q.id));
    head.appendChild(tags);
    card.appendChild(head);

    var box = el('div', 'mistake-streak-box');
    var sh = el('div', 'mistake-streak-header');
    var left = el('span', streak ? 'streak-on' : 'streak-off');
    left.appendChild(document.createTextNode('🎯 連續答對進度：'));
    left.appendChild(el('strong', null, streak + ' / ' + need + ' 次'));
    sh.appendChild(left);
    sh.appendChild(el('span', 'streak-hint', streak ? '再答對 ' + (need - streak) + ' 次即可移出！' : '還需連續答對 ' + need + ' 次'));
    box.appendChild(sh);
    var dots = el('div', 'streak-dots');
    for (var i = 0; i < need; i++) {
      var d = el('div', 'streak-dot' + (i < streak ? ' is-active' : ''), i < streak ? '✔' : String(i + 1));
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
      card.appendChild(el('div', 'question-stem-prompt', '👉 ' + BLANK_PROMPT));
    }
    if (q.image) {
      var frame = el('div', 'question-image-frame');
      var img = el('img'); img.src = Data.assetUrl(q.image); img.alt = '題目圖片';
      frame.appendChild(img);
      card.appendChild(frame);
    }

    var list = el('div', 'options-list');
    q.options.forEach(function (opt, i) {
      var cls = 'option-card', ind = null;
      if (i === q.answer) { cls += ' is-correct'; ind = '✔ 正確解答'; }
      else if (i === wrongChoice) { cls += ' is-wrong'; ind = '✖ 你的上次選擇'; }
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
    if (!Store.getStudent()) Store.setStudent('訪客');
    document.getElementById('user-chip').textContent = '👤 ' + Store.getStudent();
    Data.load().then(function () {
      var m = Store.getMistakes();
      var ids = Object.keys(m).filter(function (id) { return Data.getQuestion(id); });
      root.textContent = '';
      if (!ids.length) return renderEmpty();
      var wrongs = lastWrongChoices();
      renderHero(ids.length);
      var list = el('div', 'mistakes-list');
      ids.forEach(function (id) { list.appendChild(renderCard(Data.getQuestion(id), m[id], wrongs[id])); });
      root.appendChild(list);
      var nav = el('div', 'mistakes-footer-nav');
      nav.appendChild(link('btn btn-outline btn-lg', '🏠 回首頁', 'index.html'));
      root.appendChild(nav);
    }).catch(function () {
      root.textContent = '資料載入失敗，請用網址 http://localhost:8000/site/ 開啟。';
    });
  }
  init();
})();
