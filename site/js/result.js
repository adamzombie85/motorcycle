/* 結算頁：成績、圖表、下一步建議、本次錯題。不產生解析，只顯示對錯與正確答案。 */
(function () {
  'use strict';

  var root = document.getElementById('result-root');
  if (!root) return;

  var BLANK_PROMPT = '請看圖，選出正確的答案。';
  var charts = [];

  var ICONS = {
    check: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
    x: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    barChart: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    repeat: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>',
    home: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    search: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    download: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
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

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function formatTime(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return m ? m + ' 分 ' + s + ' 秒' : s + ' 秒';
  }

  function wrapLabel(text, n) {
    var parts = [];
    for (var i = 0; i < text.length; i += n) parts.push(text.slice(i, i + n));
    return parts;
  }

  function shortSub(name) { return name.replace(/（.*$/, ''); }

  function showMessage(text) {
    root.textContent = '';
    var box = el('div', 'empty-state-card');
    box.appendChild(el('div', 'empty-state-title', text));
    box.appendChild(link('btn btn-primary', '回首頁', 'index.html'));
    root.appendChild(box);
  }

  /* ---------- 成績大卡片 ---------- */
  function renderHero(attempt, isMistakes, level) {
    var wrong = attempt.total - attempt.correctCount;
    var pass = attempt.score >= Stats.PASS_SCORE;

    var sec = el('section', 'result-hero-card');
    sec.appendChild(el('div', 'result-subtitle text-nowrap', isMistakes
      ? '錯題重練 結算報告'
      : (level ? level.category + ' · ' + level.subcategory + '（第 ' + level.index + ' 關）' : '練習結算')));

    // 過關慶祝插圖（支援男女版角色與音效）
    if (!isMistakes && pass) {
      var currentAvatar = (typeof Game !== 'undefined' && Game.getAvatar) ? Game.getAvatar() : 'rider-1';
      var isFemale = (currentAvatar === 'rider-2' || currentAvatar === 'rider-4');
      var ill = el('div', 'result-celebration-ill');
      ill.style.cssText = 'display: flex; justify-content: center; margin: var(--space-2) 0 var(--space-4) 0;';
      var img = el('img');
      img.src = isFemale ? 'assets/illustrations/celebrate-level-f.png' : 'assets/illustrations/celebrate-level.png';
      img.alt = '合格通過慶祝插畫';
      img.style.cssText = 'max-width: 220px; height: auto; object-fit: contain;';
      ill.appendChild(img);
      sec.appendChild(ill);

      if (window.Sound && Sound.pass) {
        Sound.pass();
      }
    }

    var circle = el('div', 'score-badge-circle');
    circle.appendChild(el('span', 'score-num', String(attempt.score)));
    circle.appendChild(el('span', 'score-unit', '分 / 滿分 100'));
    sec.appendChild(circle);

    if (!isMistakes) {
      sec.appendChild(el('div', 'pass-status-pill ' + (pass ? 'is-pass' : 'is-fail'),
        pass ? '本關合格通過！（及格標準 ' + Stats.PASS_SCORE + ' 分）'
             : '還差一點，再練一次！（及格標準 ' + Stats.PASS_SCORE + ' 分）'));
    }

    var p = el('p', 'result-summary-text');
    p.appendChild(document.createTextNode(attempt.total + ' 題中答對 '));
    p.appendChild(el('strong', null, attempt.correctCount + ' 題'));
    sec.appendChild(p);

    if (!isMistakes) {
      var wrap = el('div', 'result-bar-wrap');
      var track = el('div', 'progress-bar-track');
      var fill = el('div', 'progress-bar-fill');
      fill.style.width = attempt.score + '%';
      track.appendChild(fill);
      track.appendChild(el('div', 'pass-mark-indicator'));
      track.appendChild(el('div', 'pass-mark-label text-nowrap', '及格線 ' + Stats.PASS_SCORE + ' 分'));
      wrap.appendChild(track);
      sec.appendChild(wrap);
    }

    var row = el('div', 'stats-summary-row');
    function box(numCls, num, label) {
      var b = el('div', 'stat-box');
      b.appendChild(el('div', 'stat-box-num ' + numCls + ' text-nowrap', num));
      b.appendChild(el('div', 'stat-box-label text-nowrap', label));
      row.appendChild(b);
    }
    box('stat-correct', attempt.correctCount + ' 題', '答對題數');
    box('stat-wrong', wrong + ' 題', '答錯題數');
    box('stat-time', formatTime(attempt.seconds || 0), '練習時間');
    if (isMistakes) {
      box('stat-correct', (attempt.clearedCount || 0) + ' 題', '本次移出錯題庫');
      box('stat-wrong', Store.getMistakeIds().length + ' 題', '錯題庫還剩');
    }
    sec.appendChild(row);
    root.appendChild(sec);
  }

  /* ---------- 下一步建議 ---------- */
  function nextUnpassedLevel(sub) {
    return Data.getLevels().filter(function (l) {
      return l.subcategory === sub && !Stats.levelPassed(l.id);
    })[0] || null;
  }

  function renderRecommend(subStats) {
    var subs = Object.keys(subStats).sort(function (a, b) { return subStats[a].rate - subStats[b].rate; });
    var target = null, targetLevel = null;
    for (var i = 0; i < subs.length; i++) {
      var l = nextUnpassedLevel(subs[i]);
      if (l) { target = subs[i]; targetLevel = l; break; }
    }
    var banner = el('section', 'recommend-banner');
    var left = el('div');
    if (target) {
      left.appendChild(el('div', 'recommend-title', '下一步建議：加強弱點小類'));
      var t = el('div', 'recommend-text');
      t.appendChild(document.createTextNode('累計答對率最低的是'));
      t.appendChild(el('strong', null, '「' + shortSub(target) + '」（' + subStats[target].rate + '%）'));
      t.appendChild(document.createTextNode('，從這一關開始練習。'));
      left.appendChild(t);
      banner.appendChild(left);
      banner.appendChild(link('btn btn-accent', '開始第 ' + targetLevel.index + ' 關 ➔',
        'quiz.html?level=' + encodeURIComponent(targetLevel.id)));
    } else {
      left.appendChild(el('div', 'recommend-title', '已練過的小類，關卡都過關了！'));
      left.appendChild(el('div', 'recommend-text', '可以到首頁挑選還沒練過的小類。'));
      banner.appendChild(left);
    }
    root.appendChild(banner);
  }

  /* ---------- 圖表 ---------- */
  function chartCard(title) {
    var card = el('div', 'chart-wrapper');
    var h = el('h3', 'chart-title', title);
    card.appendChild(h);
    return card;
  }

  function renderCharts(attempt, isMistakes, levelId) {
    Chart.defaults.font.size = 18;
    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
    Chart.defaults.color = cssVar('--color-slate-800');
    var primary = cssVar('--color-primary'), primaryFill = cssVar('--color-primary-200'),
        accent = cssVar('--color-accent-600'), grid = cssVar('--color-slate-200'),
        danger = cssVar('--color-danger-500'), warning = cssVar('--color-warning-500'),
        success = cssVar('--color-success-500');

    var sec = el('section', 'result-section');
    var head = el('div', 'section-heading');
    var h2 = el('h2', 'section-heading-title');
    h2.innerHTML = ICONS.barChart + '<span style="margin-left: 6px;">學習能力分析圖表</span>';
    head.appendChild(h2);

    var exp = el('button', 'btn btn-outline');
    exp.type = 'button';
    exp.innerHTML = ICONS.download + '<span style="margin-left: 4px;">匯出圖表</span>';
    exp.addEventListener('click', exportPng);
    head.appendChild(exp);
    sec.appendChild(head);

    var catStats = Stats.byCategory(), subStats = Stats.bySubcategory();
    var cats = Data.getCategories();
    var grid2 = el('div', 'grid-2');

    // 雷達圖：四大類
    var radar = chartCard('四大類累計答對率');
    var rbox = el('div', 'chart-box'); rbox.style.height = '400px';
    var rc = el('canvas'); rbox.appendChild(rc); radar.appendChild(rbox);
    var untouched = cats.filter(function (c) { return !catStats[c]; });
    radar.appendChild(el('div', 'chart-note', untouched.length
      ? '尚未練習：' + untouched.join('、') : '每一類都練過了，繼續加油！'));
    grid2.appendChild(radar);
    charts.push(new Chart(rc, {
      type: 'radar',
      data: {
        labels: cats.map(function (c) { return wrapLabel(c, 4); }),
        datasets: [{
          label: '累計答對率（%）',
          data: cats.map(function (c) { return catStats[c] ? catStats[c].rate : 0; }),
          borderColor: primary, backgroundColor: primaryFill, borderWidth: 3,
          pointBackgroundColor: primary, pointRadius: 5
        }]
      },
      options: {
        maintainAspectRatio: false, animation: false,
        layout: { padding: 4 },
        plugins: { legend: { display: false } },
        scales: { r: { min: 0, max: 100, ticks: { stepSize: 25, backdropColor: 'transparent' }, grid: { color: grid }, pointLabels: { font: { size: 18 } } } }
      }
    }));

    // 長條圖：各小類，由低到高
    var subs = Object.keys(subStats).sort(function (a, b) { return subStats[a].rate - subStats[b].rate; });
    var bar = chartCard('各小類累計答對率（由低到高）');
    var bbox = el('div', 'chart-box'); bbox.style.height = Math.max(200, subs.length * 74 + 70) + 'px';
    var bc = el('canvas'); bbox.appendChild(bc); bar.appendChild(bbox);
    var untouchedSubs = Data.getSubcategories().filter(function (s) { return !subStats[s]; });
    bar.appendChild(el('div', 'chart-note', untouchedSubs.length
      ? '尚未練習：' + untouchedSubs.map(shortSub).join('、') : '每個小類都練過了！'));
    grid2.appendChild(bar);
    charts.push(new Chart(bc, {
      type: 'bar',
      data: {
        labels: subs.map(function (s) { return wrapLabel(shortSub(s), 9); }),
        datasets: [{
          label: '累計答對率（%）',
          data: subs.map(function (s) { return subStats[s].rate; }),
          backgroundColor: subs.map(function (s) {
            var r = subStats[s].rate; return r < 60 ? danger : r < Stats.PASS_SCORE ? warning : success;
          })
        }]
      },
      options: {
        indexAxis: 'y', maintainAspectRatio: false, animation: false,
        plugins: { legend: { display: false } },
        scales: { x: { min: 0, max: 100, grid: { color: grid } }, y: { grid: { display: false } } }
      }
    }));
    sec.appendChild(grid2);

    // 折線圖：同一關歷次分數
    if (!isMistakes) {
      var tries = Store.getAttempts(levelId).filter(function (a) { return a.mode !== 'mistakes'; });
      var line = chartCard('這一關歷次分數');
      var lbox = el('div', 'chart-box'); lbox.style.height = '300px';
      var lc = el('canvas'); lbox.appendChild(lc); line.appendChild(lbox);
      sec.appendChild(line);
      charts.push(new Chart(lc, {
        type: 'line',
        data: {
          labels: tries.map(function (a, i) { return '第 ' + (i + 1) + ' 次'; }),
          datasets: [
            { label: '分數', data: tries.map(function (a) { return a.score; }), borderColor: primary,
              backgroundColor: primary, borderWidth: 4, pointRadius: 7, tension: 0 },
            { label: '及格線 ' + Stats.PASS_SCORE + ' 分', data: tries.map(function () { return Stats.PASS_SCORE; }),
              borderColor: accent, borderDash: [8, 6], borderWidth: 3, pointRadius: 0 }
          ]
        },
        options: {
          maintainAspectRatio: false, animation: false,
          plugins: { legend: { position: 'bottom' } },
          scales: { y: { min: 0, max: 100, grid: { color: grid } }, x: { grid: { display: false } } }
        }
      }));
    }
    root.appendChild(sec);
  }

  // 把畫面上的圖表合成一張 PNG 下載
  function exportPng() {
    var canvases = charts.map(function (c) { return c.canvas; });
    if (!canvases.length) return;
    var pad = 40, titleH = 90;
    var w = Math.max.apply(null, canvases.map(function (c) { return c.width; })) + pad * 2;
    var h = titleH + canvases.reduce(function (s, c) { return s + c.height + pad; }, 0);
    var out = document.createElement('canvas');
    out.width = w; out.height = h;
    var ctx = out.getContext('2d');
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, w, h);
    var sCode = Store.getStudent();
    var sDisplay = (!sCode || sCode === 'guest') ? '訪客' : sCode;
    ctx.fillText('機車筆試好過關 學習圖表（' + sDisplay + '）', pad, 56);
    var y = titleH;
    canvases.forEach(function (c) {
      ctx.drawImage(c, pad, y);
      y += c.height + pad;
    });
    out.toBlob(function (blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '學習圖表-' + new Date().toISOString().slice(0, 10) + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    }, 'image/png');
  }

  /* ---------- 本次錯題 ---------- */
  function renderMistakes(attempt) {
    var wrongs = attempt.answers.filter(function (r) { return !r.correct; });
    var sec = el('section', 'result-section');
    var head = el('div', 'section-heading');
    var h2 = el('h2', 'section-heading-title');
    h2.innerHTML = ICONS.search + '<span style="margin-left: 6px;">本次錯題（共 ' + wrongs.length + ' 題）</span>';
    head.appendChild(h2);
    sec.appendChild(head);

    if (!wrongs.length) {
      sec.appendChild(el('p', null, '這次全部答對，太棒了！'));
    }
    wrongs.forEach(function (r) {
      var q = Data.getQuestion(r.qid);
      if (!q) return;
      var card = el('div', 'mistake-review-card');
      var mTitle = el('div', 'mistake-title');
      var xIcon = el('span', 'text-danger');
      xIcon.innerHTML = ICONS.x;
      xIcon.style.marginRight = '6px';
      mTitle.appendChild(xIcon);
      mTitle.appendChild(document.createTextNode(q.question.trim() || BLANK_PROMPT));
      card.appendChild(mTitle);

      if (q.image) {
        var frame = el('div', 'question-image-frame');
        var img = el('img'); img.src = Data.assetUrl(q.image); img.alt = '題目圖片';
        frame.appendChild(img); card.appendChild(frame);
      }
      var lines = el('div', 'mistake-lines');
      var mine = el('div'); mine.appendChild(document.createTextNode('你的答案：'));
      mine.appendChild(el('span', 'mistake-mine', (r.choice + 1) + '. ' + q.options[r.choice]));
      var right = el('div'); right.appendChild(document.createTextNode('正確答案：'));
      right.appendChild(el('strong', 'mistake-right', (q.answer + 1) + '. ' + q.options[q.answer]));
      lines.appendChild(mine); lines.appendChild(right);
      card.appendChild(lines);
      sec.appendChild(card);
    });
    root.appendChild(sec);
  }

  /* ---------- 底部按鈕 ---------- */
  function renderActions(isMistakes, level) {
    var bar = document.getElementById('action-bar');
    var inner = document.getElementById('action-bar-inner');
    inner.textContent = '';

    var homeLink = link('btn btn-ghost', '', 'index.html');
    homeLink.innerHTML = ICONS.home + '<span style="margin-left: 4px;">回首頁</span>';
    inner.appendChild(homeLink);

    var btns = el('div', 'action-bar-buttons');
    if (isMistakes) {
      if (Store.getMistakeIds().length) {
        var rLink = link('btn btn-primary', '', 'quiz.html?mode=mistakes');
        rLink.innerHTML = ICONS.repeat + '<span style="margin-left: 4px;">繼續重練</span>';
        btns.appendChild(rLink);
      }
    } else {
      var retryLink = link('btn btn-secondary', '', 'quiz.html?level=' + encodeURIComponent(level ? level.id : ''));
      retryLink.innerHTML = ICONS.repeat + '<span style="margin-left: 4px;">再練一次本關</span>';
      btns.appendChild(retryLink);

      var levels = Data.getLevels();
      var next = levels[levels.indexOf(level) + 1];
      if (next) {
        btns.appendChild(link('btn btn-primary', '下一關 ➔', 'quiz.html?level=' + encodeURIComponent(next.id)));
      }
    }
    inner.appendChild(btns);
    bar.hidden = false;
  }

  /* ---------- 徽章解鎖慶祝對話框 ---------- */
  function renderBadgeCelebration(badgeCodes) {
    var allBadges = (typeof Game !== 'undefined' && Game.getBadges) ? Game.getBadges() : [];
    var names = badgeCodes.map(function (code) {
      for (var i = 0; i < allBadges.length; i++) {
        if (allBadges[i].code === code) return allBadges[i].name;
      }
      return code;
    });

    var currentAvatar = (typeof Game !== 'undefined' && Game.getAvatar) ? Game.getAvatar() : 'rider-1';
    var isFemale = (currentAvatar === 'rider-2' || currentAvatar === 'rider-4');

    var modal = el('div', 'celebration-modal');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    var box = el('div', 'celebration-box');

    // 彩帶特效
    var confetti = el('div', 'confetti-container');
    var colors = ['#2563EB', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6'];
    for (var i = 0; i < 20; i++) {
      var piece = el('div', 'confetti-piece');
      piece.style.left = (Math.random() * 100) + '%';
      piece.style.backgroundColor = colors[i % colors.length];
      piece.style.animationDelay = (Math.random() * 1.5) + 's';
      confetti.appendChild(piece);
    }
    box.appendChild(confetti);

    var img = el('img');
    img.src = isFemale ? 'assets/illustrations/celebrate-badge-f.png' : 'assets/illustrations/celebrate-badge.png';
    img.alt = '獲得新徽章';
    img.style.cssText = 'width: 140px; height: auto; margin-bottom: var(--space-4); object-fit: contain;';
    box.appendChild(img);

    var h2 = el('h2', 'text-nowrap', '獲得新成就徽章！');
    h2.style.cssText = 'font-size: var(--font-size-xl); font-weight: var(--font-weight-black); color: var(--color-slate-900);';
    box.appendChild(h2);

    var badgeText = el('p', '', '恭喜解鎖：' + names.join('、') + '！');
    badgeText.style.cssText = 'font-size: var(--font-size-md); font-weight: bold; color: var(--color-primary-700); margin: var(--space-3) 0 var(--space-6) 0;';
    box.appendChild(badgeText);

    var closeBtn = el('button', 'btn btn-primary btn-lg', '收入徽章館 ➔');
    closeBtn.type = 'button';
    closeBtn.addEventListener('click', function () {
      modal.remove();
    });
    box.appendChild(closeBtn);

    modal.appendChild(box);
    document.body.appendChild(modal);
    closeBtn.focus();
  }

  function init() {
    var params = new URLSearchParams(location.search);
    var isMistakes = params.get('mode') === 'mistakes';
    var levelId = params.get('level');
    var studentCode = Store.getStudent();
    if (!studentCode) {
      studentCode = 'guest';
      Store.setStudent('guest');
    }
    var studentDisplay = studentCode === 'guest' ? '訪客' : studentCode;

    var userChip = document.getElementById('user-chip');
    if (userChip) userChip.textContent = studentDisplay;

    Data.load().then(function () {
      var level = null;
      if (!isMistakes) {
        level = Data.getLevel(levelId);
        if (!level) return showMessage('找不到這個關卡。');
      }
      var tries = Store.getAttempts(isMistakes ? 'mistakes' : levelId);
      var attempt = tries[tries.length - 1];
      if (!attempt) return showMessage('還沒有這一次的作答紀錄。');

      root.textContent = '';
      renderHero(attempt, isMistakes, level);
      renderRecommend(Stats.bySubcategory());
      renderCharts(attempt, isMistakes, levelId);
      renderMistakes(attempt);
      renderActions(isMistakes, level);

      var newBadges = (typeof Game !== 'undefined' && Game.checkBadges) ? Game.checkBadges() : [];
      if (newBadges && newBadges.length > 0) {
        if (window.Sound && Sound.badge) setTimeout(function () { Sound.badge(); }, 400);
        renderBadgeCelebration(newBadges);
      }
    }).catch(function (err) {
      console.error('載入或顯示時出錯', err);   // 真正的錯誤寫到 console，學生看到白話訊息
      showMessage('載入時發生問題，請重新整理頁面。');
    });
  }

  init();
})();
