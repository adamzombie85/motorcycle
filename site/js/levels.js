/* 小類關卡清單：levels.html?sub=小類。所有關卡都可以直接點，不鎖關。 */
(function () {
  var root = document.getElementById('levels-root');

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

  function message(text) {
    root.textContent = '';
    var box = el('div', 'empty-state-card');
    box.appendChild(el('div', 'empty-state-title', text));
    box.appendChild(link('btn btn-primary btn-lg', '回首頁', 'index.html'));
    root.appendChild(box);
  }

  function statusOf(best) {
    if (best === undefined) return 'not-started';
    return best >= Stats.PASS_SCORE ? 'passed' : 'progress';
  }

  function renderHeader(sub, levels, best) {
    var passed = levels.filter(function (l) { return statusOf(best[l.id]) === 'passed'; }).length;
    var qCount = levels.reduce(function (s, l) { return s + l.questionIds.length; }, 0);
    var rate = (Stats.bySubcategory()[sub] || { rate: 0 }).rate;
    var maxSize = Math.max.apply(null, levels.map(function (l) { return l.questionIds.length; }));

    var card = el('section', 'levels-header-card');
    var crumbs = el('div', 'breadcrumb-row');
    crumbs.appendChild(link(null, '首頁', 'index.html'));
    crumbs.appendChild(el('span', null, '›'));
    crumbs.appendChild(el('span', null, levels[0].category));
    crumbs.appendChild(el('span', null, '›'));
    crumbs.appendChild(el('span', 'level-meta-state', sub));
    card.appendChild(crumbs);

    card.appendChild(el('h1', 'levels-category-title', sub));
    var desc = el('p', 'levels-category-desc');
    desc.appendChild(document.createTextNode('本小類共 '));
    desc.appendChild(el('strong', null, qCount + ' 題'));
    desc.appendChild(document.createTextNode('，分成 '));
    desc.appendChild(el('strong', null, levels.length + ' 個小關卡'));
    desc.appendChild(document.createTextNode('（' + (maxSize > Data.LEVEL_SIZE ? '每關約 10 題，最多 ' + maxSize + ' 題' : '每關 10 題以內') + '）。所有關卡都可以直接練習，'));
    desc.appendChild(el('strong', null, Stats.PASS_SCORE + ' 分以上算過關'));
    desc.appendChild(document.createTextNode('。'));
    card.appendChild(desc);

    var rules = el('div', 'rules-banner');
    rules.appendChild(el('span', 'rules-banner-icon', '🎯'));
    rules.appendChild(el('span', null, '過關規則：做完一關立刻看成績，' + Stats.PASS_SCORE + ' 分以上就是「已過關 ✔」。'));
    card.appendChild(rules);

    var wrap = el('div', 'levels-progress-wrap');
    var head = el('div', 'levels-progress-head');
    head.appendChild(el('span', null, '小類通關進度：已過關 ' + passed + ' / ' + levels.length + ' 關'));
    head.appendChild(el('span', 'stat-primary', '累計答對率 ' + rate + '%'));
    wrap.appendChild(head);
    var track = el('div', 'progress-bar-track');
    var fill = el('div', 'progress-bar-fill');
    fill.style.width = Math.round(passed / levels.length * 100) + '%';
    track.appendChild(fill);
    wrap.appendChild(track);
    card.appendChild(wrap);
    root.appendChild(card);
  }

  function renderGrid(levels, best) {
    var counts = { passed: 0, progress: 0, 'not-started': 0 };
    levels.forEach(function (l) { counts[statusOf(best[l.id])]++; });

    var bar = el('div', 'level-filter-bar');
    bar.setAttribute('role', 'tablist');
    var tabs = [
      ['all', '📋 全部關卡（' + levels.length + '）'],
      ['passed', '✔ 已過關（' + counts.passed + '）'],
      ['progress', '⚡ 練習中（' + counts.progress + '）'],
      ['not-started', '⚪ 未開始（' + counts['not-started'] + '）']
    ];
    var grid = el('div', 'level-item-grid');
    var btns = [];
    tabs.forEach(function (t, i) {
      var b = el('button', 'level-filter-tab' + (i === 0 ? ' is-active' : ''), t[1]);
      b.type = 'button';
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.classList.remove('is-active'); });
        b.classList.add('is-active');
        Array.prototype.forEach.call(grid.children, function (c) {
          c.style.display = (t[0] === 'all' || c.dataset.status === t[0]) ? '' : 'none';
        });
      });
      btns.push(b);
      bar.appendChild(b);
    });
    root.appendChild(bar);

    levels.forEach(function (l) {
      var b = best[l.id], st = statusOf(b);
      var card = el('div', 'level-item-card' + (st === 'passed' ? ' is-passed' : st === 'progress' ? ' is-in-progress' : ''));
      card.dataset.status = st;
      var top = el('div');
      var header = el('div', 'level-item-header');
      header.appendChild(el('span', 'level-item-num', '第 ' + ('0' + l.index).slice(-2) + ' 關'));
      header.appendChild(el('span', 'level-item-badge is-' + (st === 'progress' ? 'in-progress' : st),
        st === 'passed' ? '✔ 已過關 · 最高 ' + b + ' 分'
        : st === 'progress' ? '⚡ 練習中 · 最高 ' + b + ' 分' : '⚪ 尚未挑戰'));
      top.appendChild(header);
      card.appendChild(top);

      var bottom = el('div');
      var footer = el('div', 'level-item-footer');
      footer.appendChild(el('span', null, '題數：' + l.questionIds.length + ' 題'));
      footer.appendChild(el('span', null, st === 'passed' ? '已過關'
        : st === 'progress' ? '還差 ' + (Stats.PASS_SCORE - b) + ' 分及格' : '自由挑戰 · 不鎖關'));
      bottom.appendChild(footer);
      bottom.appendChild(link('level-action-btn btn ' + (st === 'passed' ? 'btn-outline' : st === 'progress' ? 'btn-secondary' : 'btn-primary'),
        (st === 'passed' ? '再次練習' : st === 'progress' ? '繼續挑戰' : '開始練習') + ' ➔',
        'quiz.html?level=' + encodeURIComponent(l.id)));
      card.appendChild(bottom);
      grid.appendChild(card);
    });
    root.appendChild(grid);
  }

  function init() {
    if (!Store.getStudent()) Store.setStudent('訪客');
    document.getElementById('user-chip').textContent = '👤 ' + Store.getStudent();
    var sub = new URLSearchParams(location.search).get('sub');
    Data.load().then(function () {
      if (!sub) return message('請從首頁選擇一個小類。');
      var levels = Data.getLevels().filter(function (l) { return l.subcategory === sub; });
      if (!levels.length) return message('找不到這個小類。');
      var best = Stats.bestScores();
      root.textContent = '';
      renderHeader(sub, levels, best);
      renderGrid(levels, best);
    }).catch(function () {
      message('資料載入失敗，請用網址 http://localhost:8000/site/ 開啟。');
    });
  }
  init();
})();
