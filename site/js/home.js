/* 首頁：數字全部來自真實紀錄，沒有紀錄就顯示 0。 */
(function () {
  var root = document.getElementById('home-root');
  var CAT_STYLE = [
    { border: 'var(--color-primary)', badgeBg: '', fill: '', btn: 'btn-primary' },
    { border: 'var(--color-accent)', badgeBg: 'accent', fill: 'var(--color-accent)', btn: 'btn-secondary' },
    { border: 'var(--color-slate-400)', badgeBg: 'slate', fill: '', btn: 'btn-outline' },
    { border: 'var(--color-success)', badgeBg: 'success', fill: 'var(--color-success-500)', btn: 'btn-secondary' }
  ];
  var BADGE = {
    accent: 'background-color: var(--color-accent-100); color: var(--color-accent-700);',
    slate: 'background-color: var(--color-slate-100); color: var(--color-slate-700);',
    success: 'background-color: var(--color-success-100); color: var(--color-success-700);'
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
  function levelUrl(l) { return 'quiz.html?level=' + encodeURIComponent(l.id); }
  function shortSub(name) { return name.replace(/（.*$/, ''); }

  function nextUnpassed(levels, afterIndex) {
    for (var i = afterIndex + 1; i < levels.length; i++) if (!Stats.levelPassed(levels[i].id)) return levels[i];
    for (var j = 0; j <= afterIndex && j < levels.length; j++) if (!Stats.levelPassed(levels[j].id)) return levels[j];
    return null;
  }

  function sectionHeading(icon, title, subtitle, right) {
    var head = el('div', 'section-heading');
    var box = el('div');
    var h2 = el('h2', 'section-heading-title');
    h2.appendChild(el('span', null, icon));
    h2.appendChild(el('span', null, title));
    box.appendChild(h2);
    if (subtitle) box.appendChild(el('div', 'section-heading-subtitle', subtitle));
    head.appendChild(box);
    if (right) head.appendChild(el('span', 'section-heading-subtitle', right));
    return head;
  }

  function renderHero(levels, total) {
    var attempts = Store.getAttempts();
    var lastLevelAttempt = attempts.filter(function (a) { return a.mode !== 'mistakes'; }).pop();
    var target;
    if (!lastLevelAttempt) target = levels[0];
    else {
      var last = Data.getLevel(lastLevelAttempt.levelId);
      target = Stats.levelPassed(last.id) ? nextUnpassed(levels, levels.indexOf(last)) : last;
    }
    var lastAny = attempts[attempts.length - 1];

    var sec = el('section', 'hero-banner');
    var ill = el('div', 'hero-illustration');
    var img = el('img'); img.src = 'assets/illustrations/hero.jpg';
    img.alt = '高中生戴安全帽騎著淺藍色速克達的扁平插畫';
    ill.appendChild(img);
    sec.appendChild(ill);

    var c = el('div', 'hero-content');
    c.appendChild(el('div', 'hero-badge', '✨ 小關卡練習 · 輕鬆過關無壓力'));
    var h1 = el('h1', 'hero-title');
    h1.appendChild(document.createTextNode('輕鬆學騎車，'));
    h1.appendChild(el('span', null, '安心考駕照'));
    h1.appendChild(document.createTextNode('！'));
    c.appendChild(h1);
    c.appendChild(el('p', 'hero-desc', '目前題庫共 ' + total + ' 題，切成 ' + levels.length +
      ' 個小關卡，一關一關練。答錯的題目會收進錯題庫，反向題會特別提醒。'));

    var actions = el('div', 'hero-quick-actions');
    if (target) {
      actions.appendChild(link('btn btn-primary btn-lg',
        (lastLevelAttempt ? '▶ 繼續練習：' : '▶ 開始練習：') + shortSub(target.subcategory) + ' 第 ' + target.index + ' 關',
        levelUrl(target)));
    } else {
      actions.appendChild(el('span', 'hero-badge', '🎉 所有關卡都過關了！'));
    }
    if (lastAny) {
      actions.appendChild(link('btn btn-secondary btn-lg', '📊 查看最近成績分析',
        lastAny.mode === 'mistakes' ? 'result.html?mode=mistakes' : 'result.html?level=' + encodeURIComponent(lastAny.levelId)));
    }
    c.appendChild(actions);
    sec.appendChild(c);
    root.appendChild(sec);
  }

  function renderStats(levels) {
    var passed = levels.filter(function (l) { return Stats.levelPassed(l.id); }).length;
    var cats = Stats.byCategory(), answered = 0, correct = 0;
    Object.keys(cats).forEach(function (k) { answered += cats[k].answered; correct += cats[k].correct; });
    var rate = answered ? Math.round(correct / answered * 100) : 0;
    var sec = el('section', 'page-block');
    var row = el('div', 'stats-summary-row');
    function box(cls, num, label) {
      var b = el('div', 'stat-box');
      b.appendChild(el('div', 'stat-box-num ' + cls, num));
      b.appendChild(el('div', 'stat-box-label', label));
      row.appendChild(b);
    }
    box('stat-primary', passed + ' / ' + levels.length, '已通關小關卡');
    box('stat-success', rate + '%', '累計答對率');
    box('stat-accent', Store.getMistakeIds().length + ' 題', '待複習錯題庫');
    sec.appendChild(row);
    root.appendChild(sec);
  }

  function renderCategories(levels) {
    var sec = el('section', 'page-block');
    sec.appendChild(sectionHeading('🎯', '核心關卡學習', '集中練習一個重點，做完馬上看成績。',
      '目前題庫 ' + Data.getQuestions().length + ' 題'));
    var grid = el('div', 'grid-2');

    Data.getCategories().forEach(function (cat, i) {
      var st = CAT_STYLE[i % CAT_STYLE.length];
      var catLevels = levels.filter(function (l) { return l.category === cat; });
      var passed = catLevels.filter(function (l) { return Stats.levelPassed(l.id); }).length;
      var subs = [];
      catLevels.forEach(function (l) { if (subs.indexOf(l.subcategory) === -1) subs.push(l.subcategory); });

      var card = el('div', 'level-card');
      card.style.borderLeft = '8px solid ' + st.border;
      var top = el('div', 'level-card-top');
      var badge = el('span', 'level-badge', ('0' + (i + 1)).slice(-2));
      if (st.badgeBg) badge.style.cssText = BADGE[st.badgeBg];
      top.appendChild(badge);
      card.appendChild(top);

      var info = el('div');
      info.appendChild(el('h3', 'level-title', '第 ' + (i + 1) + ' 大類：' + cat));
      info.appendChild(el('p', 'level-desc', subs.map(shortSub).join('、')));
      card.appendChild(info);

      var prog = el('div');
      var track = el('div', 'progress-bar-track');
      var fill = el('div', 'progress-bar-fill');
      fill.style.width = Math.round(passed / catLevels.length * 100) + '%';
      if (st.fill) fill.style.background = st.fill;
      track.appendChild(fill);
      prog.appendChild(track);
      var meta = el('div', 'level-meta');
      meta.appendChild(el('span', null, '已過關：' + passed + ' / ' + catLevels.length + ' 關'));
      meta.appendChild(el('span', 'level-meta-state', passed === catLevels.length ? '全部通關' : passed ? '進行中' : '待挑戰'));
      prog.appendChild(meta);
      card.appendChild(prog);

      var first = catLevels.filter(function (l) { return !Stats.levelPassed(l.id); })[0];
      if (first) {
        card.appendChild(link('btn ' + st.btn, '進入練習：' + shortSub(first.subcategory) + ' 第 ' + first.index + ' 關 ➔', levelUrl(first)));
      }

      var list = el('div', 'cat-sub-list');
      subs.forEach(function (sub) {
        var ls = catLevels.filter(function (l) { return l.subcategory === sub; });
        var p = ls.filter(function (l) { return Stats.levelPassed(l.id); }).length;
        var a = link('cat-sub-link', '', 'levels.html?sub=' + encodeURIComponent(sub));
        a.appendChild(el('span', null, sub));
        a.appendChild(el('span', 'cat-sub-count', p + ' / ' + ls.length + ' 關'));
        list.appendChild(a);
      });
      card.appendChild(list);
      grid.appendChild(card);
    });
    sec.appendChild(grid);
    root.appendChild(sec);
  }

  function featureCard(opts) {
    var card = opts.href ? link('feature-card', '', opts.href) : el('div', 'feature-card is-soon');
    if (!opts.href) card.setAttribute('aria-disabled', 'true');
    var icon = el('div', 'feature-icon-box', opts.icon);
    icon.style.cssText = opts.iconStyle;
    card.appendChild(icon);
    var body = el('div');
    var h3 = el('h3', 'feature-title', opts.title);
    if (!opts.href) h3.appendChild(el('span', 'soon-tag', '即將推出'));
    body.appendChild(h3);
    body.appendChild(el('p', 'feature-desc', opts.desc));
    card.appendChild(body);
    return card;
  }

  function renderFeatures() {
    var reverseCount = Data.getQuestions().filter(function (q) { return q.tags.indexOf('反向題') !== -1; }).length;
    var sec = el('section', 'page-block');
    sec.appendChild(sectionHeading('⚡', '加強練習', '針對容易失分的題型練習。'));
    var grid = el('div', 'grid-2');
    var n = Store.getMistakeIds().length;
    grid.appendChild(featureCard({
      href: 'mistakes.html', icon: '🔁',
      iconStyle: 'background-color: var(--color-danger-100); color: var(--color-danger-600);',
      title: '錯題庫（' + n + ' 題待練）',
      desc: '答錯的題目都會收進這裡，連續答對 ' + Store.MISTAKE_CLEAR_STREAK + ' 次才算真正掌握。'
    }));
    grid.appendChild(featureCard({
      icon: '⚠️', iconStyle: 'background-color: var(--color-warning-100); color: var(--color-warning-700);',
      title: '反向題專區（' + reverseCount + ' 題）',
      desc: '專門練習題目問「不正確」的反向題。'
    }));
    grid.appendChild(featureCard({
      icon: '🃏', iconStyle: 'background-color: var(--color-primary-100); color: var(--color-primary-700);',
      title: '數字與罰鍰記憶翻卡',
      desc: '把公分、公斤、罰鍰整理成翻卡來記。'
    }));
    grid.appendChild(featureCard({
      icon: '🏁', iconStyle: 'background-color: var(--color-primary); color: var(--color-text-inverse);',
      title: '50 題模擬考',
      desc: '比照新制：50 題選擇題，含 15 題危險感知，' + Stats.PASS_SCORE + ' 分及格。'
    }));
    sec.appendChild(grid);
    root.appendChild(sec);
  }

  function init() {
    if (!Store.getStudent()) Store.setStudent('訪客');
    document.getElementById('user-chip').textContent = '👤 ' + Store.getStudent();
    Data.load().then(function () {
      var levels = Data.getLevels();
      root.textContent = '';
      renderHero(levels, Data.getQuestions().length);
      renderStats(levels);
      renderCategories(levels);
      renderFeatures();
    }).catch(function () {
      root.textContent = '資料載入失敗，請用網址 http://localhost:8000/site/ 開啟。';
    });
  }
  init();
})();
