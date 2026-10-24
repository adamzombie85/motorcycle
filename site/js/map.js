/**
 * 考照之路地圖頁程式 (site/js/map.js)
 * 真正彎曲道路 (Winding Road with SVG Path)
 * 站點排在路上、主角騎士停在最近練習站點、場景圖橫幅、彈出小卡片進入答題
 */
(function () {
  'use strict';

  var root = document.getElementById('map-root');
  if (!root) return;

  var ICONS = {
    check: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
    circle: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/></svg>',
    list: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>',
    back: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    close: '<svg class="icon icon-md" viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    play: '<svg class="icon icon-md" viewBox="0 0 24 24" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
    lock: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
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

  function getShortSubcategory(sub) {
    if (!sub) return '';
    if (sub.indexOf('平交道') === 0) return '平交道';
    if (sub.indexOf('行車檢查') === 0) return '行車檢查';
    if (sub.indexOf('路口安全') === 0) return '路口安全';
    if (sub.indexOf('注意大型車') === 0) return '注意大型車';
    if (sub.indexOf('行駛中應注意事項') === 0) return '行駛注意事項';
    if (sub.indexOf('正確使用燈光') === 0) return '正確使用燈光';
    if (sub.indexOf('禁止不當行為') === 0) return '禁止不當行為';
    if (sub.indexOf('事故預防及處理') === 0) return '事故預防';
    if (sub.indexOf('轉彎') === 0) return '轉彎';
    if (sub.indexOf('貨物裝載') === 0) return '貨物裝載';
    if (sub.indexOf('情境題') === 0) return '情境題';
    if (sub.indexOf('影片題') === 0) return '影片題';
    return sub.replace(/（[^）]+）/g, '').trim();
  }

  function getCelebratedSegmentsKey(studentCode) {
    return 'moto:celebrated-segments-' + (studentCode || 'guest');
  }

  function getCelebratedSegments(studentCode) {
    try {
      var raw = localStorage.getItem(getCelebratedSegmentsKey(studentCode));
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function markSegmentCelebrated(studentCode, segId) {
    try {
      var list = getCelebratedSegments(studentCode);
      if (list.indexOf(segId) === -1) {
        list.push(segId);
        localStorage.setItem(getCelebratedSegmentsKey(studentCode), JSON.stringify(list));
      }
    } catch (e) {}
  }

  function showCelebrationModal(seg, nextSeg, studentCode) {
    var modal = el('div', 'celebration-modal');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', '路段過關慶祝');

    var box = el('div', 'celebration-box');

    // 判斷是否需要放彩帶 (若未關閉動效)
    var animEnabled = true;
    if (document.body.classList.contains('mode-no-motion')) animEnabled = false;
    if (window.Settings && window.Settings.get && window.Settings.get().animation === false) animEnabled = false;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) animEnabled = false;

    if (animEnabled) {
      var confettiContainer = el('div', 'confetti-container');
      var colors = ['#2563EB', '#16A34A', '#EAB308', '#DC2626', '#9333EA', '#06B6D4'];
      for (var i = 0; i < 24; i++) {
        var piece = el('div', 'confetti-piece');
        piece.style.left = (Math.random() * 100) + '%';
        piece.style.backgroundColor = colors[i % colors.length];
        piece.style.animationDelay = (Math.random() * 1.5) + 's';
        piece.style.animationDuration = (1.8 + Math.random() * 1.5) + 's';
        confettiContainer.appendChild(piece);
      }
      box.appendChild(confettiContainer);
    }

    // 關閉按鈕
    var closeBtn = el('button', 'map-station-modal-close');
    closeBtn.setAttribute('aria-label', '關閉慶祝視窗');
    closeBtn.innerHTML = ICONS.close;
    closeBtn.addEventListener('click', function () {
      if (modal.parentNode) modal.parentNode.removeChild(modal);
    });
    box.appendChild(closeBtn);

    // 插圖或解鎖標章
    var iconRow = el('div', '', '🎉');
    iconRow.style.cssText = 'font-size: 3rem; margin-bottom: var(--space-2);';
    box.appendChild(iconRow);

    var title = el('h2', '', '恭喜完成路段 ' + seg.id + '：' + seg.name + '！');
    title.style.cssText = 'font-size: var(--font-size-xl); font-weight: var(--font-weight-black); color: var(--color-slate-900); margin-bottom: var(--space-2);';
    box.appendChild(title);

    var msg = el('p');
    msg.style.cssText = 'font-size: var(--font-size-base); color: var(--color-slate-600); margin-bottom: var(--space-5); line-height: 1.6;';
    if (nextSeg) {
      msg.textContent = '太棒了！你已經完成路段 ' + seg.id + ' 的所有關卡，下一路段「路段 ' + nextSeg.id + '：' + nextSeg.name + '」已正式解鎖！';
    } else {
      msg.textContent = '太厲害了！你已經完成全地圖所有路線與關卡，具備充分的實戰實力！';
    }
    box.appendChild(msg);

    // 下一路段預覽橫幅 (若有)
    if (nextSeg) {
      var previewCard = el('div');
      previewCard.style.cssText = 'border-radius: var(--radius-lg); overflow: hidden; margin-bottom: var(--space-5); border: 2px solid var(--color-primary-500); position: relative; box-shadow: var(--shadow-sm);';
      var nextImg = el('img');
      nextImg.src = 'assets/illustrations/' + nextSeg.key + '.jpg';
      nextImg.alt = nextSeg.name;
      nextImg.style.cssText = 'width: 100%; height: 110px; object-fit: cover; display: block;';
      previewCard.appendChild(nextImg);

      var nextPill = el('div', 'text-nowrap', '🔓 新解鎖：' + nextSeg.name);
      nextPill.style.cssText = 'position: absolute; bottom: 8px; left: 8px; background: rgba(15, 23, 42, 0.85); color: #FFF; padding: 4px 10px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: bold;';
      previewCard.appendChild(nextPill);
      box.appendChild(previewCard);
    }

    // 確定按鈕
    var okBtn = el('button', 'btn btn-primary btn-lg', nextSeg ? '前往挑戰新路段' : '我知道了');
    okBtn.style.cssText = 'width: 100%; justify-content: center;';
    okBtn.addEventListener('click', function () {
      if (modal.parentNode) modal.parentNode.removeChild(modal);
      if (nextSeg) {
        var nextSec = document.querySelector('section[aria-label^="路段 ' + nextSeg.id + '"]');
        if (nextSec) {
          nextSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
    box.appendChild(okBtn);

    modal.appendChild(box);

    modal.addEventListener('click', function (e) {
      if (e.target === modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    });

    document.body.appendChild(modal);
    okBtn.focus();

    if (window.Sound && Sound.badge) {
      Sound.badge();
    }

    markSegmentCelebrated(studentCode, seg.id);
  }

  function checkSegmentCelebration(segments, studentCode) {
    var celebrated = getCelebratedSegments(studentCode);
    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i];
      if (seg.allDone && celebrated.indexOf(seg.id) === -1) {
        var nextSeg = segments[i + 1] || null;
        showCelebrationModal(seg, nextSeg, studentCode);
        break;
      }
    }
  }

  // 站點彈出小卡片元件
  var modalBackdrop = null;
  var modalTitle = null;
  var modalSub = null;
  var modalBadge = null;
  var modalQuestionsCount = null;
  var modalBestScore = null;
  var modalStatusText = null;
  var modalStartBtn = null;

  function createModal() {
    modalBackdrop = el('div', 'map-station-modal-backdrop');
    modalBackdrop.setAttribute('role', 'dialog');
    modalBackdrop.setAttribute('aria-modal', 'true');
    modalBackdrop.setAttribute('aria-hidden', 'true');

    var card = el('div', 'map-station-modal-card');

    var closeBtn = el('button', 'map-station-modal-close');
    closeBtn.setAttribute('aria-label', '關閉卡片');
    closeBtn.innerHTML = ICONS.close;
    closeBtn.addEventListener('click', closeModal);
    card.appendChild(closeBtn);

    modalBadge = el('div', 'map-station-modal-badge');
    card.appendChild(modalBadge);

    modalTitle = el('h2', 'map-station-modal-title', '');
    card.appendChild(modalTitle);

    modalSub = el('p', 'map-station-modal-sub', '');
    card.appendChild(modalSub);

    var infoBox = el('div', 'map-station-info-box');

    var r1 = el('div', 'map-station-info-row');
    r1.appendChild(el('span', 'map-station-info-label', '本關題數'));
    modalQuestionsCount = el('span', 'map-station-info-val', '10 題');
    r1.appendChild(modalQuestionsCount);
    infoBox.appendChild(r1);

    var r2 = el('div', 'map-station-info-row');
    r2.appendChild(el('span', 'map-station-info-label', '及格標準'));
    r2.appendChild(el('span', 'map-station-info-val', '85 分'));
    infoBox.appendChild(r2);

    var r3 = el('div', 'map-station-info-row');
    r3.appendChild(el('span', 'map-station-info-label', '最高紀錄'));
    modalBestScore = el('span', 'map-station-info-val', '尚未作答');
    r3.appendChild(modalBestScore);
    infoBox.appendChild(r3);

    var r4 = el('div', 'map-station-info-row');
    r4.appendChild(el('span', 'map-station-info-label', '當前狀態'));
    modalStatusText = el('span', 'map-station-info-val', '未練習');
    r4.appendChild(modalStatusText);
    infoBox.appendChild(r4);

    card.appendChild(infoBox);

    modalStartBtn = link('btn btn-primary btn-lg', '', '#');
    modalStartBtn.id = 'map-modal-start-btn';
    modalStartBtn.style.cssText = 'width: 100%; justify-content: center;';
    modalStartBtn.innerHTML = ICONS.play + '<span style="margin-left: 6px;">開始練習本關</span>';
    card.appendChild(modalStartBtn);

    modalBackdrop.appendChild(card);

    modalBackdrop.addEventListener('click', function (e) {
      if (e.target === modalBackdrop) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modalBackdrop.classList.contains('is-open')) {
        closeModal();
      }
    });

    document.body.appendChild(modalBackdrop);
  }

  function openModal(level, segment, stationLabel) {
    if (!modalBackdrop) createModal();

    modalTitle.textContent = stationLabel;
    modalSub.textContent = '路段 ' + segment.id + '：' + segment.name + ' · ' + level.subcategory;

    var levelDetail = Data.getLevel(level.id);
    var qCount = levelDetail ? levelDetail.questionIds.length : 10;
    modalQuestionsCount.textContent = qCount + ' 題';

    if (level.unlocked === false) {
      modalBadge.className = 'map-station-modal-badge';
      modalBadge.style.cssText = 'background: #F1F5F9; color: #64748B;';
      modalBadge.innerHTML = ICONS.lock + '<span>尚未解鎖</span>';
      modalBestScore.textContent = '—';
      modalStatusText.textContent = '完成上一站就能開啟';
      modalStartBtn.removeAttribute('href');
      modalStartBtn.setAttribute('aria-disabled', 'true');
      modalStartBtn.style.cssText = 'width: 100%; justify-content: center; opacity: 0.65; cursor: not-allowed; background-color: var(--color-slate-400); border-color: var(--color-slate-400); pointer-events: none;';
      modalStartBtn.innerHTML = ICONS.lock + '<span style="margin-left: 6px;">完成上一站就能開啟</span>';
    } else {
      modalStartBtn.removeAttribute('aria-disabled');
      modalStartBtn.style.cssText = 'width: 100%; justify-content: center; pointer-events: auto;';
      modalStartBtn.href = 'quiz.html?level=' + encodeURIComponent(level.id);

      if (level.state === 'passed') {
        modalBadge.className = 'map-station-modal-badge';
        modalBadge.style.cssText = 'background: #DCFCE7; color: #15803D;';
        modalBadge.innerHTML = ICONS.check + '<span>已過關</span>';
        modalBestScore.textContent = (level.best !== null ? level.best + ' 分' : '100 分');
        modalStatusText.textContent = '已達成及格標準 ✔';
        modalStartBtn.innerHTML = ICONS.play + '<span style="margin-left: 6px;">再練一次</span>';
      } else if (level.state === 'practiced') {
        modalBadge.className = 'map-station-modal-badge';
        modalBadge.style.cssText = 'background: #FEF3C7; color: #B45309;';
        modalBadge.innerHTML = ICONS.circle + '<span>練習中</span>';
        modalBestScore.textContent = level.best + ' 分';
        modalStatusText.textContent = '最高得分 ' + level.best + ' 分（差 ' + (85 - level.best) + ' 分及格）';
        modalStartBtn.innerHTML = ICONS.play + '<span style="margin-left: 6px;">繼續挑戰</span>';
      } else {
        modalBadge.className = 'map-station-modal-badge';
        modalBadge.style.cssText = 'background: #F1F5F9; color: #64748B;';
        modalBadge.innerHTML = ICONS.circle + '<span>未練習</span>';
        modalBestScore.textContent = '—';
        modalStatusText.textContent = '尚未開始練習';
        modalStartBtn.innerHTML = ICONS.play + '<span style="margin-left: 6px;">開始練習本關</span>';
      }
    }

    modalBackdrop.classList.add('is-open');
    modalBackdrop.setAttribute('aria-hidden', 'false');
    modalStartBtn.focus();
  }

  function closeModal() {
    if (modalBackdrop) {
      modalBackdrop.classList.remove('is-open');
      modalBackdrop.setAttribute('aria-hidden', 'true');
    }
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

      // 若尚未練習過任何關卡，預設停在第一段第一站
      var currentLevelId = mapData.currentLevelId;
      if (!currentLevelId && mapData.segments.length && mapData.segments[0].levels.length) {
        currentLevelId = mapData.segments[0].levels[0].id;
      }

      root.textContent = '';

      // 計算統計與總關數
      var passedTotal = 0, practicedTotal = 0, untouchedTotal = 0, totalLevelsCount = 0;
      mapData.segments.forEach(function (seg) {
        totalLevelsCount += seg.levels.length;
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

      var desc = el('p', '', totalLevelsCount + ' 關，可以從任何一關開始。');
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
      listBtn.id = 'btn-view-levels';
      listBtn.style.cssText = 'min-height: 40px; padding: 6px 14px; font-size: var(--font-size-sm);';
      listBtn.title = '切換為清單檢視模式';
      listBtn.innerHTML = ICONS.list + '<span class="text-nowrap" style="margin-left: 4px;">清單檢視</span>';
      toolsCol.appendChild(listBtn);

      headerBar.appendChild(toolsCol);
      root.appendChild(headerBar);

      // 2. 地圖主容器
      var mapContainer = el('div', 'map-container');

      mapData.segments.forEach(function (seg, segIdx) {
        var sec = el('section', 'map-road-section');
        sec.setAttribute('aria-label', '路段 ' + seg.id + '：' + seg.name);

        var isSegUnlocked = (seg.unlocked !== false);

        // (1) 場景圖橫幅 (Banner)
        var banner = el('div', 'map-scene-banner' + (!isSegUnlocked ? ' is-locked' : ''));
        var img = el('img', 'map-scene-banner-img');
        img.src = 'assets/illustrations/' + seg.key + '.jpg';
        img.alt = '場景：' + seg.name;
        img.loading = 'lazy';
        banner.appendChild(img);

        var overlay = el('div', 'map-scene-overlay');
        var badge = el('span', 'map-scene-badge' + (!isSegUnlocked ? ' is-locked' : ''), (!isSegUnlocked ? '🔒 路段 ' + seg.id + '（未解鎖）' : '路段 ' + seg.id));
        overlay.appendChild(badge);

        var title = el('h2', 'map-scene-title', seg.name);
        overlay.appendChild(title);

        var subNames = [];
        seg.levels.forEach(function (l) {
          var sn = getShortSubcategory(l.subcategory);
          if (sn && subNames.indexOf(sn) === -1) subNames.push(sn);
        });

        var subtitle = el('div', 'map-scene-subtitle');
        var namesSpan = el('span', 'text-nowrap', subNames.join('、'));
        var progText = !isSegUnlocked
          ? '完成上一路段解鎖'
          : seg.passedCount + ' / ' + seg.levels.length + ' 關過關';
        var progSpan = el('span', 'map-scene-progress-pill text-nowrap', progText);
        subtitle.appendChild(namesSpan);
        subtitle.appendChild(progSpan);
        overlay.appendChild(subtitle);

        banner.appendChild(overlay);
        sec.appendChild(banner);

        // (2) 彎曲道路 (Winding Road Track)
        var track = el('div', 'map-road-track');
        var N = seg.levels.length;
        var STEP_Y = 88;
        var TOP_PAD = 55;
        var BOTTOM_PAD = 65;
        var totalHeight = TOP_PAD + Math.max(0, N - 1) * STEP_Y + BOTTOM_PAD;
        track.style.height = totalHeight + 'px';

        // 計算各站點座標
        var points = [];
        var phase = segIdx * 0.8;
        for (var i = 0; i < N; i++) {
          // 左右蜿蜒波動：X 介於 23% ~ 77% (在 360 基準座標下介於 82px ~ 278px)
          var xPct = 50 + 26 * Math.sin(i * 1.15 + phase);
          var yPx = TOP_PAD + i * STEP_Y;
          points.push({
            xPct: xPct,
            yPx: yPx,
            svgX: (xPct / 100) * 360,
            svgY: yPx
          });
        }

        // 產生平滑貝茲曲線 SVG 道路路徑
        if (N > 0) {
          var pathD = 'M ' + points[0].svgX.toFixed(1) + ' ' + points[0].svgY.toFixed(1);
          for (var p = 0; p < points.length - 1; p++) {
            var curr = points[p];
            var next = points[p + 1];
            var dy = (next.svgY - curr.svgY) * 0.5;
            var cp1x = curr.svgX;
            var cp1y = curr.svgY + dy;
            var cp2x = next.svgX;
            var cp2y = next.svgY - dy;
            pathD += ' C ' + cp1x.toFixed(1) + ' ' + cp1y.toFixed(1) + ', ' +
                             cp2x.toFixed(1) + ' ' + cp2y.toFixed(1) + ', ' +
                             next.svgX.toFixed(1) + ' ' + next.svgY.toFixed(1);
          }

          var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('class', 'map-road-svg');
          svg.setAttribute('viewBox', '0 0 360 ' + totalHeight);
          svg.setAttribute('preserveAspectRatio', 'none');
          svg.setAttribute('aria-hidden', 'true');

          var pBorder = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          pBorder.setAttribute('d', pathD);
          pBorder.setAttribute('class', 'road-path-border');
          svg.appendChild(pBorder);

          var pSurface = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          pSurface.setAttribute('d', pathD);
          pSurface.setAttribute('class', 'road-path-surface');
          svg.appendChild(pSurface);

          var pLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          pLine.setAttribute('d', pathD);
          pLine.setAttribute('class', 'road-path-centerline');
          svg.appendChild(pLine);

          track.appendChild(svg);
        }

        // (3) 放置路上站點
        seg.levels.forEach(function (l, idx) {
          var pt = points[idx];
          var isCurrent = (currentLevelId === l.id);
          var shortSub = getShortSubcategory(l.subcategory);
          var stationLabel = shortSub + ' ' + l.index;
          var isStationUnlocked = (l.unlocked !== false);

          var stationCls = 'map-road-station is-' + l.state + (isCurrent ? ' is-current' : '') + (!isStationUnlocked ? ' is-locked' : '');
          var href = isStationUnlocked ? 'quiz.html?level=' + encodeURIComponent(l.id) : '#';
          var station = link(stationCls, '', href);
          station.style.left = pt.xPct.toFixed(1) + '%';
          station.style.top = pt.yPx + 'px';
          station.setAttribute('data-level-id', l.id);
          station.setAttribute('data-unlocked', isStationUnlocked ? 'true' : 'false');
          if (!isStationUnlocked) {
            station.setAttribute('aria-disabled', 'true');
            station.setAttribute('aria-label', stationLabel + '，狀態：鎖定中（完成上一站就能開啟）');
          } else {
            station.setAttribute('aria-label', stationLabel + '，狀態：' + (l.state === 'passed' ? '已過關' : l.state === 'practiced' ? '練習中' : '未練習'));
          }

          // 站點圓形本體
          var circle = el('div', 'station-node-circle');
          if (!isStationUnlocked) {
            circle.innerHTML = ICONS.lock;
          } else if (l.state === 'passed') {
            circle.innerHTML = ICONS.check;
          } else if (l.state === 'practiced') {
            circle.innerHTML = '<span class="station-score-badge">' + (l.best !== null ? l.best : '80') + '</span><span class="station-score-label">分</span>';
          } else {
            circle.innerHTML = '<span class="station-empty-dot"></span>';
          }
          station.appendChild(circle);

          // 站名標籤 pill (小類簡稱＋第幾關)
          var pill = el('span', 'station-name-pill text-nowrap');
          if (!isStationUnlocked) {
            pill.innerHTML = '<span class="pill-lock-icon" aria-hidden="true">🔒</span> ' + stationLabel;
          } else {
            pill.textContent = stationLabel;
          }
          station.appendChild(pill);

          // 主角騎士停靠位置（你在這裡 📍）
          if (isCurrent) {
            var isLeftSide = (pt.xPct >= 50); // 若站點偏右，騎士排在左側，反之亦然
            var marker = el('div', 'map-rider-marker ' + (isLeftSide ? 'is-left' : 'is-right'));
            marker.innerHTML =
              '<img src="assets/illustrations/' + currentAvatar + '.png" alt="當前騎士位置" class="map-rider-img">' +
              '<div class="map-rider-bubble text-nowrap"><span>📍</span> 你在這裡</div>';
            station.appendChild(marker);
          }

          // 點擊彈出站點資訊卡片（若為程式自動化腳本 a.click()，且已解鎖，則直接跳轉）
          station.addEventListener('click', function (e) {
            if (!isStationUnlocked) {
              e.preventDefault();
              openModal(l, seg, stationLabel);
              return;
            }
            if (!e.isTrusted) {
              return;
            }
            e.preventDefault();
            openModal(l, seg, stationLabel);
          });

          track.appendChild(station);
        });

        sec.appendChild(track);

        // 若是終點路段，追加考照終點橫幅
        if (segIdx === mapData.segments.length - 1) {
          var goalBanner = el('div', 'map-goal-banner');
          goalBanner.innerHTML =
            '<div style="font-size: 1.5rem; margin-bottom: 4px;">🏁</div>' +
            '<div style="font-size: var(--font-size-lg); font-weight: var(--font-weight-black); color: #78350F;">考照之路終點站</div>' +
            '<p style="margin: 4px 0 0; font-size: var(--font-size-sm); color: #92400E;">完成全部 ' + totalLevelsCount + ' 關，恭喜你具備萬全騎乘實力！可隨時前往 50 題全真模擬考挑戰及格！</p>';
          sec.appendChild(goalBanner);
        }

        mapContainer.appendChild(sec);
      });

      root.appendChild(mapContainer);

      // 檢查是否有剛全部做完的路段需要跳出慶祝彈窗
      checkSegmentCelebration(mapData.segments, studentCode);

      // 3. 自動捲動至主角騎士所在位置
      setTimeout(function () {
        var currentStationEl = document.querySelector('.map-road-station.is-current');
        if (currentStationEl) {
          currentStationEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 400);

    }).catch(function (err) {
      console.error(err);
      root.textContent = '載入時發生問題，請重新整理頁面。';
    });
  }

  init();
})();
