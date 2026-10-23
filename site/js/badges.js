/**
 * 成就徽章館程式 (site/js/badges.js)
 * 呼叫 Game.getBadges() 讀取 12 個徽章狀態，展示真實圖示與達成狀態
 */
(function () {
  'use strict';

  var root = document.getElementById('badges-root');
  if (!root) return;

  var ICONS = {
    check: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
    lock: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    back: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    award: '<svg class="icon icon-md" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>'
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
      var badges = (typeof Game !== 'undefined' && Game.getBadges) ? Game.getBadges() : [];
      var earnedCount = badges.filter(function (b) { return b.earned; }).length;

      root.textContent = '';

      // 1. 頁面頂部導航與成就統計
      var topBar = el('div');
      topBar.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-3);';

      var titleCol = el('div');
      var nav = el('nav');
      nav.setAttribute('aria-label', '麵包屑導航');
      nav.style.marginBottom = 'var(--space-2)';
      var backLink = link('', '', 'index.html');
      backLink.style.cssText = 'color: var(--color-primary-700); font-size: var(--font-size-sm); text-decoration: none; font-weight: bold; display: inline-flex; align-items: center; gap: 4px;';
      backLink.innerHTML = ICONS.back + '<span>回首頁</span>';
      nav.appendChild(backLink);
      titleCol.appendChild(nav);

      var h1 = el('h1', 'text-nowrap', '成就徽章館');
      h1.style.cssText = 'font-size: var(--font-size-2xl); font-weight: var(--font-weight-black); color: var(--color-slate-900);';
      titleCol.appendChild(h1);

      var desc = el('p', '', '累積作答、連續練習與突破障礙。獲得的徽章將永久珍藏！');
      desc.style.cssText = 'font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-top: 4px;';
      titleCol.appendChild(desc);
      topBar.appendChild(titleCol);

      // 右側徽章統計藥丸
      var countPill = el('div');
      countPill.style.cssText = 'background-color: var(--color-bg-card); border: 1px solid var(--color-border-card); border-radius: var(--radius-full); padding: 8px 20px; box-shadow: var(--shadow-sm); display: flex; align-items: center; gap: 8px;';
      countPill.innerHTML = 
        '<span style="color: var(--color-accent-600); display: inline-flex; align-items: center;">' + ICONS.award + '</span>' +
        '<span style="font-size: var(--font-size-md); font-weight: var(--font-weight-black); color: var(--color-slate-900);" class="text-nowrap">' +
          '已獲得 <span style="color: var(--color-primary-700);">' + earnedCount + '</span> / ' + badges.length + ' 個' +
        '</span>';
      topBar.appendChild(countPill);
      root.appendChild(topBar);

      // 2. 徽章網格
      var grid = el('section', 'badges-grid');
      grid.setAttribute('aria-label', '12 個騎士成就徽章列表');

      badges.forEach(function (b) {
        var card = el('article', 'badge-card' + (b.earned ? '' : ' is-locked'));

        // 徽章圖示框
        var iconBox = el('div', 'badge-icon-box');
        iconBox.setAttribute('title', b.name);
        var img = el('img');
        img.src = 'assets/illustrations/badge-' + b.code + '.png';
        img.alt = b.name;
        img.style.cssText = 'width: 64px; height: 64px; object-fit: contain;' + (b.earned ? '' : ' filter: grayscale(100%) opacity(0.45);');
        iconBox.appendChild(img);
        card.appendChild(iconBox);

        // 徽章資訊
        var info = el('div', 'badge-info');
        var title = el('h2', 'badge-title text-nowrap', b.name);
        info.appendChild(title);

        var cond = el('p', 'badge-condition', b.desc);
        info.appendChild(cond);

        var pill = el('span', 'badge-status-pill ' + (b.earned ? 'is-unlocked' : 'is-locked'));
        if (b.earned) {
          pill.innerHTML = ICONS.check + '<span class="text-nowrap">已解鎖' + (b.date ? ' · ' + b.date : '') + '</span>';
        } else {
          pill.innerHTML = ICONS.lock + '<span class="text-nowrap">未達成</span>';
        }
        info.appendChild(pill);
        card.appendChild(info);

        grid.appendChild(card);
      });

      root.appendChild(grid);
    }).catch(function (err) {
      console.error(err);
      root.textContent = '徽章資料載入失敗，請確認網路連線。';
    });
  }

  init();
})();
