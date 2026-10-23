/* 首頁畫面程式：對接 Game 與 Stats 引擎，完全符合 D4 設計規範 */
(function () {
  'use strict';

  var root = document.getElementById('home-root');
  if (!root) return;

  var ICONS = {
    target: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    flame: '<svg class="icon icon-lg" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
    play: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
    check: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
    coffee: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>',
    circle: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/></svg>',
    repeat: '<svg class="icon icon-lg" viewBox="0 0 24 24" aria-hidden="true"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>',
    map: '<svg class="icon icon-lg" viewBox="0 0 24 24" aria-hidden="true"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>',
    badge: '<svg class="icon icon-lg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>',
    levels: '<svg class="icon icon-lg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    chart: '<svg class="icon icon-lg" viewBox="0 0 24 24" aria-hidden="true"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>',
    exam: '<svg class="icon icon-lg" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>'
  };

  var DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

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

  // 1. 今日挑戰大卡 ＋ 連續天數打卡格
  function renderTopGrid(streak, daily) {
    var sec = el('section', 'home-top-grid');

    // 今日挑戰卡
    var cDaily = el('div', 'card-daily-challenge');
    var h1 = el('h1', 'daily-challenge-title', '今日挑戰');
    cDaily.appendChild(h1);

    var meta = el('p', 'daily-challenge-meta', '5 題，大約 3 分鐘。');
    cDaily.appendChild(meta);

    var actions = el('div', 'daily-challenge-actions');
    var doneCount = daily && daily.done ? daily.done.length : 0;
    var isDone = daily && daily.completed;

    var startBtn = el('a', 'btn btn-primary btn-lg');
    startBtn.href = 'quiz.html?mode=daily';
    startBtn.style.cssText = 'background-color: #FFFFFF; color: var(--color-primary-900); font-weight: 800; border: none;';
    startBtn.innerHTML = ICONS.play + '<span>' + (isDone ? '今日已完成！再練習一次' : '開始今日練習 (' + doneCount + '/5)') + '</span>';
    actions.appendChild(startBtn);

    var stateSpan = el('span', 'text-nowrap', isDone ? '今日挑戰完成 ✔' : '今日尚未作答');
    stateSpan.style.cssText = 'font-size: var(--font-size-sm); color: var(--color-primary-100);';
    actions.appendChild(stateSpan);

    cDaily.appendChild(actions);
    sec.appendChild(cDaily);

    // 連續天數與 7 天打卡格
    var cStreak = el('div', 'streak-hero-card');
    var sHead = el('div', 'streak-header');
    var countBox = el('div', 'streak-count-box');
    var flameBox = el('div', 'streak-flame-icon');
    flameBox.innerHTML = ICONS.flame;
    countBox.appendChild(flameBox);

    var txtWrap = el('div');
    var cText = el('div', 'streak-count-text');
    cText.innerHTML = '連續 <span class="text-nowrap">' + (streak.current || 0) + ' 天</span>';
    txtWrap.appendChild(cText);

    var subTxt = el('div', 'streak-subtext', '每週配備 1 張自動休息卡');
    txtWrap.appendChild(subTxt);
    countBox.appendChild(txtWrap);
    sHead.appendChild(countBox);

    var sBadge = el('span', 'badge badge-success text-nowrap', streak.checkedToday ? '今日已打卡' : '進行中');
    sHead.appendChild(sBadge);
    cStreak.appendChild(sHead);

    // 7 天打卡格
    var weekGrid = el('div', 'streak-week-grid');
    var weekDays = streak.week || [];
    if (!weekDays.length) {
      for (var i = 0; i < 7; i++) {
        weekDays.push({ status: i === 0 ? 'today' : 'future', date: '' });
      }
    }

    weekDays.forEach(function (day, i) {
      var cellCls = 'punch-cell';
      var iconHtml = ICONS.circle;
      var statusText = '待打卡';

      if (day.status === 'checked') {
        cellCls += ' is-completed';
        iconHtml = ICONS.check;
        statusText = '完成';
      } else if (day.status === 'today') {
        cellCls += ' is-today';
        iconHtml = ICONS.target;
        statusText = '今天';
      } else if (day.status === 'rest') {
        cellCls += ' is-rest';
        iconHtml = ICONS.coffee;
        statusText = '休息卡';
      } else {
        cellCls += ' is-future';
        iconHtml = ICONS.circle;
        statusText = '待打卡';
      }

      var cell = el('div', cellCls);
      cell.setAttribute('title', '週' + DAY_LABELS[i] + '：' + statusText);
      cell.appendChild(el('span', 'punch-day-label', DAY_LABELS[i]));

      var iconWrap = el('div', 'punch-status-icon');
      iconWrap.innerHTML = iconHtml;
      cell.appendChild(iconWrap);

      cell.appendChild(el('span', 'punch-status-text', statusText));
      weekGrid.appendChild(cell);
    });

    cStreak.appendChild(weekGrid);
    sec.appendChild(cStreak);

    root.appendChild(sec);
  }

  // 2. 主角機車騎士展示 ＋ 核心統計簡覽
  function renderProfileAndStats(levels, studentName) {
    var sec = el('section', 'profile-summary-grid');

    // 騎士角色卡 (真實插圖置入)
    var rCard = el('div', 'rider-card');
    var currentAvatar = (typeof Game !== 'undefined' && Game.getAvatar) ? Game.getAvatar() : 'rider-1';
    var img = el('img');
    img.src = 'assets/illustrations/' + currentAvatar + '.png';
    img.alt = '騎士角色';
    img.style.cssText = 'width: 96px; height: 96px; object-fit: contain; margin-bottom: var(--space-2);';
    rCard.appendChild(img);

    var rName = el('div', 'text-nowrap', studentName);
    rName.style.cssText = 'font-size: var(--font-size-md); font-weight: var(--font-weight-black); color: var(--color-slate-900);';
    rCard.appendChild(rName);

    var cBtn = link('btn btn-outline btn-sm', '更換角色 ➔', 'character.html');
    cBtn.style.marginTop = 'var(--space-2)';
    cBtn.style.fontSize = 'var(--font-size-xs)';
    rCard.appendChild(cBtn);

    sec.appendChild(rCard);

    // 三合一統計卡
    var passed = levels.filter(function (l) { return Stats.levelPassed(l.id); }).length;
    var cats = Stats.byCategory(), answered = 0, correct = 0;
    Object.keys(cats).forEach(function (k) { answered += cats[k].answered; correct += cats[k].correct; });
    var rate = answered ? Math.round(correct / answered * 100) : 0;
    var mistakesCount = Store.getMistakeIds().length;

    var trio = el('div', 'stats-trio-grid');

    function miniCard(num, numColor, label) {
      var c = el('div', 'stat-mini-card');
      var n = el('div', 'stat-mini-num text-nowrap', num);
      n.style.color = numColor;
      c.appendChild(n);
      c.appendChild(el('div', 'stat-mini-label text-nowrap', label));
      trio.appendChild(c);
    }

    miniCard(passed + ' / ' + levels.length, 'var(--color-primary-800)', '已過關');
    miniCard(rate + '%', 'var(--color-success-700)', '答對率');
    miniCard(mistakesCount + ' 題', 'var(--color-accent-700)', '待練錯題');

    sec.appendChild(trio);
    root.appendChild(sec);
  }

  // 3. 快捷功能卡 (照 D4 screen-home.html 排版)
  function renderFeatures(mistakesCount) {
    var sec = el('section', 'page-block');
    var head = el('div', 'section-heading');
    var h2 = el('h2', 'section-heading-title');
    h2.innerHTML = ICONS.target + '<span>學習功能總覽</span>';
    head.appendChild(h2);
    sec.appendChild(head);

    var grid = el('div', 'feature-grid');

    // 1. 全部關卡清單
    var cLevels = link('feature-item-card', '', 'levels.html');
    cLevels.style.borderLeft = '6px solid var(--color-primary)';
    var iLevels = el('div', 'feature-icon-wrapper');
    iLevels.style.cssText = 'background-color: var(--color-primary-100); color: var(--color-primary-700);';
    iLevels.innerHTML = ICONS.levels;
    cLevels.appendChild(iLevels);
    var bLevels = el('div');
    bLevels.appendChild(el('h3', 'feature-title', '92 關全部關卡'));
    bLevels.appendChild(el('p', 'feature-desc', '92 關，可以從任何一關開始。'));
    cLevels.appendChild(bLevels);
    grid.appendChild(cLevels);

    // 2. 錯題特訓庫
    var cMistakes = link('feature-item-card', '', 'mistakes.html');
    cMistakes.style.borderLeft = '6px solid var(--color-danger)';
    var iMistakes = el('div', 'feature-icon-wrapper');
    iMistakes.style.cssText = 'background-color: var(--color-danger-100); color: var(--color-danger-700);';
    iMistakes.innerHTML = ICONS.repeat;
    cMistakes.appendChild(iMistakes);
    var bMistakes = el('div');
    bMistakes.appendChild(el('h3', 'feature-title', '錯題特訓庫（' + mistakesCount + ' 題待練）'));
    bMistakes.appendChild(el('p', 'feature-desc', '連續答對 2 次才會移出錯題庫。'));
    cMistakes.appendChild(bMistakes);
    grid.appendChild(cMistakes);

    // 3. 考照之路地圖
    var cMap = link('feature-item-card', '', 'map.html');
    cMap.style.borderLeft = '6px solid var(--color-accent)';
    var iMap = el('div', 'feature-icon-wrapper');
    iMap.style.cssText = 'background-color: var(--color-accent-100); color: var(--color-accent-700);';
    iMap.innerHTML = ICONS.map;
    cMap.appendChild(iMap);
    var bMap = el('div');
    bMap.appendChild(el('h3', 'feature-title', '考照之路地圖'));
    bMap.appendChild(el('p', 'feature-desc', '5 大路段、92 關路線圖，自主前進。'));
    cMap.appendChild(bMap);
    grid.appendChild(cMap);

    // 4. 成就徽章館
    var cBadges = link('feature-item-card', '', 'badges.html');
    cBadges.style.borderLeft = '6px solid var(--color-success)';
    var iBadges = el('div', 'feature-icon-wrapper');
    iBadges.style.cssText = 'background-color: var(--color-success-100); color: var(--color-success-700);';
    iBadges.innerHTML = ICONS.badge;
    cBadges.appendChild(iBadges);
    var bBadges = el('div');
    bBadges.appendChild(el('h3', 'feature-title', '成就徽章館'));
    bBadges.appendChild(el('p', 'feature-desc', '12 款專屬徽章，紀錄努力痕跡。'));
    cBadges.appendChild(bBadges);
    grid.appendChild(cBadges);

    // 5. 學習成果報告
    var cReport = link('feature-item-card', '', 'result.html?level=level-1');
    cReport.style.borderLeft = '6px solid var(--color-primary-600)';
    var iReport = el('div', 'feature-icon-wrapper');
    iReport.style.cssText = 'background-color: var(--color-primary-50); color: var(--color-primary-800);';
    iReport.innerHTML = ICONS.chart;
    cReport.appendChild(iReport);
    var bReport = el('div');
    bReport.appendChild(el('h3', 'feature-title', '我的學習成果報告'));
    bReport.appendChild(el('p', 'feature-desc', '產生直式成績圖片，包含各類答對率分析。'));
    cReport.appendChild(bReport);
    grid.appendChild(cReport);

    // 6. 50 題全真模擬考 (即將推出)
    var cExam = el('div', 'feature-item-card');
    cExam.style.cssText = 'border-left: 6px solid var(--color-slate-300); background-color: var(--color-slate-50); opacity: 0.85;';
    var iExam = el('div', 'feature-icon-wrapper');
    iExam.style.cssText = 'background-color: var(--color-slate-200); color: var(--color-slate-600);';
    iExam.innerHTML = ICONS.exam;
    cExam.appendChild(iExam);
    var bExam = el('div');
    var h3Wrap = el('div');
    h3Wrap.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 4px;';
    var h3 = el('h3', 'feature-title', '50 題全真模擬考');
    h3.style.marginBottom = '0';
    h3Wrap.appendChild(h3);
    var badgeSoon = el('span', 'badge text-nowrap', '即將推出');
    badgeSoon.style.cssText = 'background-color: var(--color-slate-200); color: var(--color-slate-700); font-size: 0.85rem;';
    h3Wrap.appendChild(badgeSoon);
    bExam.appendChild(h3Wrap);
    bExam.appendChild(el('p', 'feature-desc', '比照正式新制：50 題，含 15 題危險感知影片題。'));
    cExam.appendChild(bExam);
    grid.appendChild(cExam);

    sec.appendChild(grid);
    root.appendChild(sec);
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

    Data.load().then(function () {
      var levels = Data.getLevels();
      root.textContent = '';

      var streak = (typeof Game !== 'undefined' && Game.getStreak) 
        ? Game.getStreak() 
        : { current: 3, checkedToday: false, week: [] };

      var daily = (typeof Game !== 'undefined' && Game.getDaily)
        ? Game.getDaily()
        : { questions: [], done: [], completed: false };

      renderTopGrid(streak, daily);
      renderProfileAndStats(levels, studentDisplay);
      renderFeatures(Store.getMistakeIds().length);
    }).catch(function (err) {
      console.error(err);
      root.textContent = '資料載入失敗，請用網址 http://localhost:8000/site/ 開啟。';
    });
  }

  init();
})();
