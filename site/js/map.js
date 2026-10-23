/**
 * 考照之路地圖頁程式 (site/js/map.js)
 * 串接 Game.getMap() 與 Game.getAvatar()，提供 5 個路段、92 關垂直地圖
 */
(function () {
  'use strict';

  var root = document.getElementById('map-root');
  if (!root) return;

  var ICONS = {
    check: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
    circle: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/></svg>',
    list: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>',
    back: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>'
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
      var mapData = Game.getMap();
      var currentAvatar = (typeof Game !== 'undefined' && Game.getAvatar) ? Game.getAvatar() : 'rider-1';
      var currentLevelId = mapData.currentLevelId;

      root.textContent = '';

      // 計算全站統計計數
      var passedTotal = 0, practicedTotal = 0, untouchedTotal = 0;
      mapData.segments.forEach(function (seg) {
        seg.levels.forEach(function (l) {
          if (l.state === 'passed') passedTotal++;
          else if (l.state === 'practiced') practicedTotal++;
          else untouchedTotal++;
        });
      });

      // 1. 頁面頂部導航與標題
      var headerBar = el('div', 'map-header-bar');
      var titleCol = el('div');

      var nav = el('nav');
      nav.setAttribute('aria-label', '麵包屑導航');
      nav.style.marginBottom = 'var(--space-2)';
      var backLink = link('', '', 'index.html');
      backLink.style.cssText = 'color: var(--color-primary-700); font-size: var(--font-size-sm); text-decoration: none; font-weight: bold; display: inline-flex; align-items: center; gap: 4px;';
      backLink.innerHTML = ICONS.back + '<span>回首頁</span>';
      nav.appendChild(backLink);
      titleCol.appendChild(nav);

      var h1 = el('h1', 'text-nowrap', '考照之路地圖');
      h1.style.cssText = 'font-size: var(--font-size-2xl); font-weight: var(--font-weight-black); color: var(--color-slate-900);';
      titleCol.appendChild(h1);

      var desc = el('p', '', '92 關，可以從任何一關開始。');
      desc.style.cssText = 'font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-top: 4px;';
      titleCol.appendChild(desc);
      headerBar.appendChild(titleCol);

      // 右側圖例與清單切換
      var toolsCol = el('div');
      toolsCol.style.cssText = 'display: flex; gap: var(--space-3); flex-wrap: wrap; align-items: center;';

      var legend = el('div', 'map-legend');
      legend.innerHTML = 
        '<div class="map-legend-item">' +
          '<span style="color: var(--color-success-700); display: inline-flex; align-items: center;">' + ICONS.check + '</span>' +
          '<span class="text-nowrap">已過關 (' + passedTotal + ')</span>' +
        '</div>' +
        '<div class="map-legend-item">' +
          '<span style="color: var(--color-accent-700); display: inline-flex; align-items: center;">' + ICONS.circle + '</span>' +
          '<span class="text-nowrap">練習中 (' + practicedTotal + ')</span>' +
        '</div>' +
        '<div class="map-legend-item">' +
          '<span style="color: var(--color-slate-400); display: inline-flex; align-items: center;">' + ICONS.circle + '</span>' +
          '<span class="text-nowrap">未練習 (' + untouchedTotal + ')</span>' +
        '</div>';
      toolsCol.appendChild(legend);

      var listBtn = link('btn btn-outline', '', 'levels.html');
      listBtn.style.cssText = 'min-height: 40px; padding: 6px 14px; font-size: var(--font-size-sm);';
      listBtn.title = '切換為清單檢視模式';
      listBtn.innerHTML = ICONS.list + '<span class="text-nowrap" style="margin-left: 4px;">清單檢視</span>';
      toolsCol.appendChild(listBtn);

      headerBar.appendChild(toolsCol);
      root.appendChild(headerBar);

      // 2. 地圖路段主要容器
      var mapContainer = el('div', 'map-container');

      mapData.segments.forEach(function (seg) {
        var sec = el('section', 'map-road-section');
        sec.setAttribute('aria-label', '路段 ' + seg.id + '：' + seg.name);

        // 場景真實圖片橫幅
        var banner = el('div', 'map-scene-banner');
        var img = el('img', 'map-scene-banner-img');
        img.src = 'assets/illustrations/' + seg.key + '.jpg';
        img.alt = '場景：' + seg.name;
        banner.appendChild(img);
        sec.appendChild(banner);

        // 路段標題資訊
        var sHead = el('div', 'map-scene-header');
        var sTitle = el('h2', 'map-scene-title', '路段 ' + seg.id + '：' + seg.name);
        sHead.appendChild(sTitle);
        var sSub = el('div', 'map-scene-subtitle', seg.subs.join('、') + ' (' + seg.passedCount + ' / ' + seg.levels.length + ' 關過關)');
        sHead.appendChild(sSub);
        sec.appendChild(sHead);

        // 關卡站點網格
        var grid = el('div', 'map-stations-grid');

        seg.levels.forEach(function (l) {
          var isCurrent = (currentLevelId === l.id);
          var cardCls = 'map-station-card is-' + l.state;
          var card = link(cardCls, '', 'quiz.html?level=' + encodeURIComponent(l.id));

          // 若主角停在此站，顯示機車與「你在這裡」
          if (isCurrent) {
            card.style.borderWidth = '3px';
            card.style.boxShadow = 'var(--shadow-hover)';
            var marker = el('div', 'station-rider-marker');
            marker.innerHTML = 
              '<img src="assets/illustrations/' + currentAvatar + '.png" alt="騎士位置" style="width: 20px; height: 20px; object-fit: contain; vertical-align: middle;">' +
              '<span class="text-nowrap" style="margin-left: 4px;">你在這裡</span>';
            card.appendChild(marker);
          }

          var numSpan = el('span', 'map-station-num text-nowrap', l.id);
          card.appendChild(numSpan);

          var statusSpan = el('span', 'map-station-status text-nowrap');
          if (l.state === 'passed') {
            statusSpan.innerHTML = ICONS.check + ' ' + (l.best !== null ? l.best + ' 分' : '已過關');
          } else if (l.state === 'practiced') {
            statusSpan.innerHTML = ICONS.circle + ' 最高 ' + l.best + ' 分';
          } else {
            statusSpan.innerHTML = ICONS.circle + ' 未開始';
          }
          card.appendChild(statusSpan);

          grid.appendChild(card);
        });

        sec.appendChild(grid);
        mapContainer.appendChild(sec);
      });

      root.appendChild(mapContainer);
    }).catch(function (err) {
      console.error(err);
      root.textContent = '地圖載入失敗，請確認網路連線。';
    });
  }

  init();
})();
