/* 小類關卡清單：levels.html?sub=小類。所有關卡都可以直接點，不鎖關。 */
(function () {
  'use strict';

  var root = document.getElementById('levels-root');
  if (!root) return;

  var ICONS = {
    target: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    check: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
    bolt: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    circle: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/></svg>',
    list: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>'
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
    crumbs.appendChild(el('span', 'level-meta-state text-nowrap', sub));
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
    var rIcon = el('span', 'rules-banner-icon');
    rIcon.innerHTML = ICONS.target;
    rules.appendChild(rIcon);
    rules.appendChild(el('span', null, '過關規則：做完一關立刻看成績，' + Stats.PASS_SCORE + ' 分以上就是「已過關 ✔」。'));
    card.appendChild(rules);

    var wrap = el('div', 'levels-progress-wrap');
    var head = el('div', 'levels-progress-head');
    head.appendChild(el('span', 'text-nowrap', '小類通關進度：已過關 ' + passed + ' / ' + levels.length + ' 關'));
    head.appendChild(el('span', 'stat-primary text-nowrap', '累計答對率 ' + rate + '%'));
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
      ['all', ICONS.list + '<span style="margin-left:4px;">全部關卡（' + levels.length + '）</span>'],
      ['passed', ICONS.check + '<span style="margin-left:4px;">已過關（' + counts.passed + '）</span>'],
      ['progress', ICONS.bolt + '<span style="margin-left:4px;">練習中（' + counts.progress + '）</span>'],
      ['not-started', ICONS.circle + '<span style="margin-left:4px;">未開始（' + counts['not-started'] + '）</span>']
    ];

    var grid = el('div', 'level-item-grid');
    var btns = [];
    tabs.forEach(function (t, i) {
      var b = el('button', 'level-filter-tab' + (i === 0 ? ' is-active' : ''));
      b.type = 'button';
      b.innerHTML = t[1];
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
      var st = statusOf(best[l.id]);
      var card = link('level-item-card is-' + st, '', 'quiz.html?level=' + encodeURIComponent(l.id));
      card.dataset.status = st;

      var top = el('div', 'level-item-top');
      var badge = el('span', 'level-index-badge text-nowrap', '第 ' + l.index + ' 關');
      top.appendChild(badge);

      var tag = el('span', 'level-status-tag is-' + st + ' text-nowrap');
      if (st === 'passed') tag.innerHTML = ICONS.check + '<span>已過關 ' + best[l.id] + ' 分</span>';
      else if (st === 'progress') tag.innerHTML = ICONS.bolt + '<span>最高 ' + best[l.id] + ' 分</span>';
      else tag.innerHTML = ICONS.circle + '<span>未開始</span>';
      top.appendChild(tag);
      card.appendChild(top);

      var title = el('div', 'level-item-title', l.subcategory + ' 第 ' + l.index + ' 關');
      card.appendChild(title);

      var meta = el('div', 'level-item-meta');
      meta.appendChild(el('span', 'text-nowrap', '題數：' + l.questionIds.length + ' 題'));
      meta.appendChild(el('span', 'text-nowrap', '題號 ' + l.questionIds[0] + '～' + l.questionIds[l.questionIds.length - 1]));
      card.appendChild(meta);

      var btn = el('div', 'btn btn-primary level-item-action',
        st === 'passed' ? '再練一次' : st === 'progress' ? '繼續挑戰' : '開始練習');
      card.appendChild(btn);

      grid.appendChild(card);
    });
    root.appendChild(grid);
  }

  function init() {
    var studentCode = Store.getStudent();
    if (!studentCode) {
      studentCode = 'guest';
      Store.setStudent('guest');
    }
    var studentDisplay = studentCode === 'guest' ? '訪客' : studentCode;

    var userChip = document.getElementById('user-chip');
    if (userChip) userChip.textContent = studentDisplay;

    var params = new URLSearchParams(location.search);
    var sub = params.get('sub');

    Data.load().then(function () {
      var levels = Data.getLevels();
      if (!sub) {
        var first = levels[0];
        sub = first ? first.subcategory : '';
      }
      var subLevels = levels.filter(function (l) { return l.subcategory === sub; });
      if (!subLevels.length) return message('找不到這個小類的關卡。');

      var best = (typeof Stats.bestScores === 'function' ? Stats.bestScores() : {});
      root.textContent = '';
      renderHeader(sub, subLevels, best);
      renderGrid(subLevels, best);
    }).catch(function (err) {
      console.error('Levels error', err);
      message('資料載入失敗，請用網址 http://localhost:8000/site/ 開啟。');
    });
  }

  init();
})();
