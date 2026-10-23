/**
 * 學習成果報告頁程式 (report.js)
 * 依據 TASKS_AGY.md A7 與 TASKS_CODE.md C12 規範：
 * 1. 資料來源：所有作答（關卡、今日挑戰、錯題重練、模擬考）。
 * 2. 直式成績單，適合傳 LINE 與列印，保護學生隱私（絕不顯示 email）。
 * 3. 支援一鍵下載 PNG 成績圖片，支援 iPhone 長按儲存影像至相簿。
 * 4. 無作答紀錄時顯示友善引導卡與開始練習按鈕。
 */
(function () {
  'use strict';

  var ICONS = {
    award: '<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
    check: '<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    chart: '<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    trend: '<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
    target: '<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    user: '<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    calendar: '<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    info: '<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
  };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }

  // 取得學生安全稱呼（保護隱私：絕不顯示 email）
  function getStudentDisplayName() {
    var profile = null;
    try {
      profile = Store.getDoc('profile', null);
    } catch (e) { profile = null; }

    if (profile && (profile.className || profile.seat)) {
      var cls = profile.className ? profile.className + ' 班 ' : '';
      var st = profile.seat ? profile.seat + ' 號' : '';
      return (cls + st).trim();
    }

    var code = Store.getStudent();
    if (!code || code === 'guest') return '同學';
    // 若為 email 則隱藏，顯示為同學
    if (code.indexOf('@') !== -1) return '同學';
    return code;
  }

  // 取得目前角色插畫
  function getHeaderIllustration() {
    var avatar = 'rider-1';
    var hasChosen = false;
    try {
      if (typeof Game !== 'undefined' && Game.getAvatar) {
        avatar = Game.getAvatar();
      }
      hasChosen = (Store.getDoc('avatar', null) !== null);
    } catch (e) {}

    var isFemale = (avatar === 'rider-2' || avatar === 'rider-4');
    if (!hasChosen) {
      return {
        header: 'assets/illustrations/report-header-duo.png',
        empty: 'assets/illustrations/empty-start.png'
      };
    }
    return {
      header: isFemale ? 'assets/illustrations/report-header-f.png' : 'assets/illustrations/report-header.png',
      empty: isFemale ? 'assets/illustrations/empty-start-f.png' : 'assets/illustrations/empty-start.png'
    };
  }

  // 格式化今日日期
  function getFormattedDate() {
    var d = new Date();
    return d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日';
  }

  function renderEmptyState(root, illus) {
    root.textContent = '';
    var box = el('div', 'report-sheet');
    box.style.textAlign = 'center';
    box.style.padding = 'var(--space-10) var(--space-6)';

    var img = el('img');
    img.src = illus.empty;
    img.alt = '尚未有練習紀錄';
    img.style.maxWidth = '240px';
    img.style.height = 'auto';
    img.style.marginBottom = 'var(--space-6)';
    box.appendChild(img);

    var h2 = el('h2', 'report-sheet-title', '先做一關，就會有你的成績報告喔');
    h2.style.fontSize = 'var(--font-size-2xl)';
    box.appendChild(h2);

    var p = el('p', null, '你目前尚未有任何作答紀錄。完成任何一關練習、每日挑戰或全真模擬考後，系統會自動統整四大能力面向、小類掌握度與成績趨勢！');
    p.style.maxWidth = '560px';
    p.style.margin = '0 auto var(--space-6)';
    p.style.fontSize = 'var(--font-size-base)';
    p.style.color = 'var(--color-text-secondary)';
    p.style.lineHeight = 'var(--line-height-relaxed)';
    box.appendChild(p);

    var btn = el('a', 'btn btn-primary btn-lg', '開始第一關練習');
    btn.href = 'levels.html';
    btn.style.display = 'inline-flex';
    btn.style.alignItems = 'center';
    btn.style.gap = '8px';
    btn.style.padding = '12px 32px';
    box.appendChild(btn);

    root.appendChild(box);

    // 停用下載按鈕
    var dlBtn = document.getElementById('btn-download-image');
    if (dlBtn) {
      dlBtn.disabled = true;
      dlBtn.style.opacity = '0.5';
      dlBtn.title = '請先完成至少一次練習即可產生報告';
    }
  }

  function renderReportSheet(root, illus) {
    root.textContent = '';

    var answers = Store.getAnswerLog();
    var attempts = Store.getAttempts();
    var mistakes = Store.getMistakes();
    var latest = Stats.latestByQuestion();
    var studentName = getStudentDisplayName();
    var todayStr = getFormattedDate();

    // 總題數與答對率計算
    var totalAnswersCount = answers.length;
    var uniqueAnsweredIds = Object.keys(latest);
    var uniqueCorrectCount = uniqueAnsweredIds.filter(function (id) { return latest[id]; }).length;
    var overallRate = uniqueAnsweredIds.length > 0 ? Math.round(uniqueCorrectCount / uniqueAnsweredIds.length * 100) : 0;

    // 過關數
    var levels = Data.getLevels();
    var passedLevelsCount = levels.filter(function (l) { return Stats.levelPassed(l.id); }).length;

    // 待複習錯題數
    var mistakesCount = Object.keys(mistakes).length;

    // 外層卡片容器（作為截圖目標）
    var sheet = el('div', 'report-sheet');
    sheet.id = 'report-printable-sheet';

    // 1. 頂部標題與插畫橫幅
    var headerBanner = el('div', 'report-header-banner');

    var riderImg = el('img');
    riderImg.src = illus.header;
    riderImg.alt = '騎士插畫';
    riderImg.style.maxHeight = '120px';
    riderImg.style.width = 'auto';
    riderImg.style.display = 'inline-block';
    riderImg.style.marginBottom = 'var(--space-4)';
    headerBanner.appendChild(riderImg);

    var watermarkTag = el('div', 'report-watermark-tag');
    watermarkTag.innerHTML =
      '<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle;">' +
        '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>' +
      '</svg>' +
      '<span>機車筆試好過關 · 新制題庫自主學習成果</span>';
    headerBanner.appendChild(watermarkTag);

    var title = el('h1', 'report-sheet-title', '我的學習成果報告');
    headerBanner.appendChild(title);

    var studentMeta = el('div', 'report-student-meta');
    studentMeta.innerHTML =
      '<span style="display: inline-flex; align-items: center; gap: 4px;">' +
        ICONS.user + '<span>學生：' + studentName + '</span>' +
      '</span>' +
      '<span style="display: inline-flex; align-items: center; gap: 4px;">' +
        ICONS.calendar + '<span>統計日期：' + todayStr + '</span>' +
      '</span>' +
      '<span style="display: inline-flex; align-items: center; gap: 4px;">' +
        ICONS.target + '<span>總關數：92 關</span>' +
      '</span>';
    headerBanner.appendChild(studentMeta);
    sheet.appendChild(headerBanner);

    // 2. 四大核心摘要指標
    var statGrid = el('div', 'report-stat-grid');
    var statsData = [
      { val: totalAnswersCount + ' 題', desc: '累計練習題數', color: 'var(--color-primary-600)' },
      { val: passedLevelsCount + ' / 92', desc: '過關關卡數 (85分及格)', color: 'var(--color-success-600)' },
      { val: overallRate + '%', desc: '累計平均答對率', color: 'var(--color-primary-700)' },
      { val: mistakesCount + ' 題', desc: '待複習錯題庫', color: 'var(--color-danger-600)' }
    ];
    statsData.forEach(function (s) {
      var box = el('div', 'report-stat-box');
      var valEl = el('div', 'report-stat-val', s.val);
      valEl.style.color = s.color;
      box.appendChild(valEl);
      box.appendChild(el('div', 'report-stat-desc', s.desc));
      statGrid.appendChild(box);
    });
    sheet.appendChild(statGrid);

    // 3. 第一大面向：四大題庫面向能力分析
    var catStats = Stats.byCategory();
    var categories = [
      { name: '正確觀念與態度', key: '正確觀念與態度' },
      { name: '主動停讓文化', key: '主動停讓文化' },
      { name: '安全駕駛能力', key: '安全駕駛能力' },
      { name: '危險感知', key: '危險感知' }
    ];

    var cRates = categories.map(function (c) {
      var item = catStats[c.key];
      return item ? item.rate : 0;
    });

    var secCat = el('div', 'report-section-card');
    secCat.innerHTML =
      '<div class="report-section-heading">' +
        '<span style="display: flex; align-items: center; gap: 6px;">' +
          ICONS.award + '<span>1. 四大題庫面向能力分析</span>' +
        '</span>' +
        '<span style="font-size: var(--font-size-sm); color: var(--color-primary-700); font-weight: bold;">官方新制四大核心能力</span>' +
      '</div>';

    var radarGrid = el('div', 'report-radar-grid');

    // 雷達圖 SVG 繪製 (200x200，center at 100,100，radius 75)
    var rBox = el('div');
    rBox.style.cssText = 'height: 230px; display: flex; align-items: center; justify-content: center; background-color: #FFFFFF; border-radius: var(--radius-lg); border: 2px solid var(--color-border-card);';
    
    // 計算頂點 (正觀=上, 停讓=右, 安全=下, 危險=左)
    var rMax = 75;
    var p0 = { x: 100, y: 100 - rMax * (cRates[0] / 100) };
    var p1 = { x: 100 + rMax * (cRates[1] / 100), y: 100 };
    var p2 = { x: 100, y: 100 + rMax * (cRates[2] / 100) };
    var p3 = { x: 100 - rMax * (cRates[3] / 100), y: 100 };
    var polyPoints = p0.x.toFixed(1) + ',' + p0.y.toFixed(1) + ' ' +
                     p1.x.toFixed(1) + ',' + p1.y.toFixed(1) + ' ' +
                     p2.x.toFixed(1) + ',' + p2.y.toFixed(1) + ' ' +
                     p3.x.toFixed(1) + ',' + p3.y.toFixed(1);

    rBox.innerHTML =
      '<svg viewBox="0 0 200 200" style="width: 200px; height: 200px;" aria-label="四大面向雷達圖">' +
        '<polygon points="100,25 175,100 100,175 25,100" fill="none" stroke="var(--color-slate-200)" stroke-width="1.5" />' +
        '<polygon points="100,50 150,100 100,150 50,100" fill="none" stroke="var(--color-slate-200)" stroke-width="1.5" />' +
        '<polygon points="100,75 125,100 100,125 75,100" fill="none" stroke="var(--color-slate-200)" stroke-width="1.5" />' +
        '<line x1="100" y1="25" x2="100" y2="175" stroke="var(--color-slate-300)" stroke-width="1.5" />' +
        '<line x1="25" y1="100" x2="175" y2="100" stroke="var(--color-slate-300)" stroke-width="1.5" />' +
        '<polygon points="' + polyPoints + '" fill="rgba(44, 157, 176, 0.3)" stroke="var(--color-primary-600)" stroke-width="3" />' +
        '<circle cx="' + p0.x.toFixed(1) + '" cy="' + p0.y.toFixed(1) + '" r="5" fill="var(--color-primary-600)" />' +
        '<circle cx="' + p1.x.toFixed(1) + '" cy="' + p1.y.toFixed(1) + '" r="5" fill="var(--color-primary-600)" />' +
        '<circle cx="' + p2.x.toFixed(1) + '" cy="' + p2.y.toFixed(1) + '" r="5" fill="var(--color-primary-600)" />' +
        '<circle cx="' + p3.x.toFixed(1) + '" cy="' + p3.y.toFixed(1) + '" r="5" fill="var(--color-primary-600)" />' +
      '</svg>';
    radarGrid.appendChild(rBox);

    // 四大面向指標進度條
    var catCol = el('div');
    catCol.style.cssText = 'display: flex; flex-direction: column; gap: var(--space-3);';
    categories.forEach(function (c, i) {
      var rate = cRates[i];
      var statusText = rate >= 90 ? '表現優異' : rate >= 85 ? '及格通過' : rate >= 70 ? '接近門檻' : '需多加練習';
      var statusColor = rate >= 85 ? 'var(--color-success-700)' : rate >= 70 ? 'var(--color-warning-700)' : 'var(--color-danger-700)';
      var barColor = rate >= 85 ? 'var(--color-success-500)' : rate >= 70 ? 'var(--color-warning-500)' : 'var(--color-danger-500)';

      var row = el('div');
      row.innerHTML =
        '<div style="display: flex; justify-content: space-between; font-size: var(--font-size-base); font-weight: bold; margin-bottom: 4px;">' +
          '<span>' + c.name + '</span>' +
          '<span style="color: ' + statusColor + ';">' + rate + '% (' + statusText + ')</span>' +
        '</div>' +
        '<div class="progress-bar-track">' +
          '<div class="progress-bar-fill" style="width: ' + rate + '%; background-color: ' + barColor + ';"></div>' +
        '</div>';
      catCol.appendChild(row);
    });
    radarGrid.appendChild(catCol);
    secCat.appendChild(radarGrid);
    sheet.appendChild(secCat);

    // 4. 第二大面向：各小類掌握度清單（由低到高排列 - 精確掌握盲點）
    var subStats = Stats.bySubcategory();
    var allSubs = Data.getSubcategories();
    var subList = allSubs.map(function (sub) {
      var s = subStats[sub];
      return {
        name: sub,
        answered: s ? s.answered : 0,
        correct: s ? s.correct : 0,
        rate: s ? s.rate : 0
      };
    });
    // 依答對率由低到高排序
    subList.sort(function (a, b) {
      if (a.answered === 0 && b.answered > 0) return 1;
      if (b.answered === 0 && a.answered > 0) return -1;
      return a.rate - b.rate;
    });

    var secSub = el('div', 'report-section-card');
    secSub.innerHTML =
      '<div class="report-section-heading">' +
        '<span style="display: flex; align-items: center; gap: 6px;">' +
          ICONS.chart + '<span>2. 各小類掌握度清單 (由低到高排列)</span>' +
        '</span>' +
        '<span style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">由待加強至已精熟</span>' +
      '</div>';

    var subCol = el('div');
    subCol.style.cssText = 'display: flex; flex-direction: column; gap: var(--space-3);';
    subList.forEach(function (sub) {
      var statusColor = sub.rate >= 85 ? 'var(--color-success-700)' : sub.rate >= 70 ? 'var(--color-warning-700)' : 'var(--color-danger-700)';
      var barColor = sub.rate >= 85 ? 'var(--color-success-500)' : sub.rate >= 70 ? 'var(--color-warning-500)' : 'var(--color-danger-500)';
      var note = sub.answered === 0 ? '尚未作答' : sub.rate >= 85 ? '及格過關' : sub.rate >= 70 ? '建議複習' : '需加強';

      var row = el('div', 'report-bar-row');
      row.innerHTML =
        '<div class="report-bar-meta">' +
          '<span style="color: var(--color-slate-900); font-weight: bold;">' + sub.name + '</span>' +
          '<span style="color: ' + statusColor + ';">' + sub.rate + '% (' + note + ')</span>' +
        '</div>' +
        '<div class="progress-bar-track">' +
          '<div class="progress-bar-fill" style="width: ' + sub.rate + '%; background-color: ' + barColor + ';"></div>' +
        '</div>';
      subCol.appendChild(row);
    });
    secSub.appendChild(subCol);
    sheet.appendChild(secSub);

    // 5. 第三大面向：最近 10 次成績趨勢 (折線圖含 85 分及格標線)
    var secTrend = el('div', 'report-section-card');
    secTrend.innerHTML =
      '<div class="report-section-heading">' +
        '<span style="display: flex; align-items: center; gap: 6px;">' +
          ICONS.trend + '<span>3. 最近 10 次練習成績趨勢</span>' +
        '</span>' +
        '<span style="font-size: var(--font-size-sm); color: var(--color-danger-600); font-weight: bold;">85 分及格門檻</span>' +
      '</div>';

    var validAttempts = attempts.filter(function (a) {
      return a.score !== undefined && a.score !== null;
    });
    var recent10 = validAttempts.slice(-10);

    var trendBox = el('div', 'trend-chart-box');

    if (recent10.length === 0) {
      trendBox.innerHTML =
        '<div style="text-align: center; padding: var(--space-8) var(--space-4); color: var(--color-text-secondary); font-size: var(--font-size-base);">' +
          '完成關卡或模擬考後，將自動在此繪製連續 10 次成績起伏折線圖。' +
        '</div>';
    } else {
      // 繪製 SVG 折線圖 (viewBox: 0 0 500 180)
      // 分數範圍 0 ~ 100，y: 100分 -> y=30, 85分 -> y=52.5, 0分 -> y=150
      var width = 500, height = 180;
      var leftPad = 50, rightPad = 40;
      var availWidth = width - leftPad - rightPad;
      var stepX = recent10.length > 1 ? availWidth / (recent10.length - 1) : availWidth / 2;

      var pts = recent10.map(function (a, i) {
        var x = recent10.length === 1 ? (width / 2) : (leftPad + i * stepX);
        var scoreClamped = Math.max(0, Math.min(100, a.score));
        // y: 0 -> 150, 100 -> 30
        var y = 150 - (scoreClamped / 100) * 120;
        return { x: x, y: y, score: a.score };
      });

      var polylinePoints = pts.map(function (p) {
        return p.x.toFixed(1) + ',' + p.y.toFixed(1);
      }).join(' ');

      var circlesHtml = pts.map(function (p, i) {
        var dotColor = p.score >= 85 ? '#059669' : '#D97706';
        var label = (i === pts.length - 1)
          ? '<text x="' + p.x.toFixed(1) + '" y="' + (p.y - 10).toFixed(1) + '" font-size="13" fill="' + dotColor + '" font-weight="bold" text-anchor="middle">' + p.score + '分</text>'
          : '';
        return '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="5" fill="' + dotColor + '" />' + label;
      }).join('');

      trendBox.innerHTML =
        '<svg viewBox="0 0 500 180" style="width: 100%; height: 160px;" aria-label="最近10次練習成績折線圖">' +
          '<line x1="50" y1="150" x2="470" y2="150" stroke="#F1F5F9" stroke-width="1" />' +
          '<line x1="50" y1="110" x2="470" y2="110" stroke="#F1F5F9" stroke-width="1" />' +
          '<line x1="50" y1="70" x2="470" y2="70" stroke="#F1F5F9" stroke-width="1" />' +
          '<line x1="50" y1="30" x2="470" y2="30" stroke="#F1F5F9" stroke-width="1" />' +
          '<text x="40" y="154" font-size="12" fill="#94A3B8" text-anchor="end">0分</text>' +
          '<text x="40" y="94" font-size="12" fill="#94A3B8" text-anchor="end">50分</text>' +
          '<text x="40" y="34" font-size="12" fill="#94A3B8" text-anchor="end">100分</text>' +
          '<line x1="50" y1="48" x2="470" y2="48" stroke="#E11D48" stroke-width="2" stroke-dasharray="6,4" />' +
          '<text x="465" y="44" font-size="11" fill="#BE123C" font-weight="bold" text-anchor="end">85分及格線</text>' +
          (pts.length > 1 ? '<polyline fill="none" stroke="var(--color-primary-600)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" points="' + polylinePoints + '" />' : '') +
          circlesHtml +
        '</svg>' +
        '<div style="font-size: var(--font-size-sm); color: var(--color-text-secondary); text-align: center; margin-top: var(--space-2);">' +
          '橫軸為最近作答回合，綠點表示達到 85 分及格標準。' +
        '</div>';
    }
    secTrend.appendChild(trendBox);
    sheet.appendChild(secTrend);

    // 6. 第四大面向：學習診斷與複習建議
    var secDiag = el('div', 'report-section-card');
    secDiag.style.cssText = 'background-color: var(--color-primary-50); border: 2px solid var(--color-primary-200);';

    var weakestSub = subList.filter(function (s) { return s.answered > 0; })[0] || subList[0];

    secDiag.innerHTML =
      '<div class="report-section-heading">' +
        '<span style="color: var(--color-primary-900); display: flex; align-items: center; gap: 6px;">' +
          ICONS.info + '<span>4. 學習診斷與複習建議</span>' +
        '</span>' +
        '<span style="font-size: var(--font-size-sm); color: var(--color-primary-800); font-weight: bold;">待複習錯題：' + mistakesCount + ' 題</span>' +
      '</div>' +
      '<div style="font-size: var(--font-size-base); color: var(--color-primary-950); line-height: var(--line-height-relaxed);">' +
        '<p style="margin-bottom: var(--space-2);">' +
          '<strong>總體評估：</strong> 你的累計答對率為 <strong>' + overallRate + '%</strong>。' +
          (overallRate >= 85 ? '表現非常優異，已穩健超越 85 分及格標準！' : '持續練習、掌握各類核心原則，即將達到及格標準！') +
        '</p>' +
        '<p style="margin-bottom: 0;">' +
          '<strong>強化重點：</strong> 建議加強練習<strong>「' + (weakestSub ? weakestSub.name : '各小類題目') + '」</strong>。' +
          '錯題庫中目前收錄 ' + mistakesCount + ' 題，在錯題庫中<strong>連續答對 2 次</strong>即可順利出庫，考取駕照萬無一失！' +
        '</p>' +
      '</div>';
    sheet.appendChild(secDiag);

    // 7. 成果單底部認證宣告
    var footerSheet = el('div');
    footerSheet.style.cssText = 'text-align: center; border-top: 2px dashed var(--color-primary-200); padding-top: var(--space-5); margin-top: var(--space-6); font-size: var(--font-size-sm); color: var(--color-text-muted);';
    footerSheet.innerHTML =
      '<p>© 2026 41 研究室｜版權所有 · 機車駕照筆試新制學習系統</p>' +
      '<p style="margin-top: 4px;">本學習報告適合以直式長圖分享給老師或家長</p>';
    sheet.appendChild(footerSheet);

    root.appendChild(sheet);

    // 啟用下載按鈕
    var dlBtn = document.getElementById('btn-download-image');
    if (dlBtn) {
      dlBtn.disabled = false;
      dlBtn.style.opacity = '1';
      dlBtn.title = '下載成績圖片';
    }
  }

  // 下載或開啟成績單長圖 (支援 iPhone 長按儲存)
  function setupDownloadAction() {
    var dlBtn = document.getElementById('btn-download-image');
    var printBtn = document.getElementById('btn-print-report');
    var modal = document.getElementById('report-save-modal');
    var modalImg = document.getElementById('report-modal-img');
    var closeBtn = document.getElementById('btn-close-save-modal');

    if (printBtn) {
      printBtn.addEventListener('click', function () {
        window.print();
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', function () {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
      });
      modal.addEventListener('click', function (e) {
        if (e.target === modal) {
          modal.classList.remove('is-open');
          modal.setAttribute('aria-hidden', 'true');
        }
      });
    }

    if (!dlBtn) return;

    dlBtn.addEventListener('click', function () {
      var sheet = document.getElementById('report-printable-sheet');
      if (!sheet) return;

      var origHtml = dlBtn.innerHTML;
      dlBtn.disabled = true;
      dlBtn.innerHTML = ICONS.chart + '<span style="margin-left: 6px;">產生圖片中...</span>';

      function handleBlob(blob) {
        dlBtn.disabled = false;
        dlBtn.innerHTML = origHtml;

        var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        var dateStr = (typeof Store !== 'undefined' && Store.today) ? Store.today() : new Date().toISOString().slice(0, 10);
        var filename = '機車好過關-學習成果報告-' + dateStr + '.png';
        var imgUrl = URL.createObjectURL(blob);

        if (isIOS) {
          // iPhone Safari 友善處理：顯示長按儲存視窗，並嘗試 window.open
          if (modalImg && modal) {
            modalImg.src = imgUrl;
            modal.classList.add('is-open');
            modal.setAttribute('aria-hidden', 'false');
          }
          try {
            window.open(imgUrl, '_blank');
          } catch (e) {}
        } else {
          // 一般瀏覽器直接觸發檔案下載
          var a = document.createElement('a');
          a.href = imgUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(function () {
            URL.revokeObjectURL(imgUrl);
          }, 10000);
        }
      }

      if (typeof html2canvas === 'function') {
        html2canvas(sheet, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#FFFFFF',
          logging: false
        }).then(function (canvas) {
          canvas.toBlob(handleBlob, 'image/png');
        }).catch(function (err) {
          console.warn('html2canvas 產生圖片失敗，改用預備畫布', err);
          renderFallbackCanvas(sheet, handleBlob);
        });
      } else {
        renderFallbackCanvas(sheet, handleBlob);
      }
    });
  }

  // 離線或無 html2canvas 時的備用 Canvas 渲染器
  function renderFallbackCanvas(sheet, callback) {
    var canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1600;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 1080, 1600);
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('機車筆試好過關 - 學習成果報告', 540, 120);
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText('學生：' + getStudentDisplayName() + '  |  日期：' + getFormattedDate(), 540, 180);
    canvas.toBlob(callback, 'image/png');
  }

  function init() {
    var studentDisplay = getStudentDisplayName();
    var userChip = document.getElementById('user-chip');
    if (userChip) userChip.textContent = studentDisplay;

    var root = document.getElementById('report-content-root');
    if (!root) return;

    var answers = Store.getAnswerLog();
    var illus = getHeaderIllustration();

    if (!answers || answers.length === 0) {
      renderEmptyState(root, illus);
    } else {
      renderReportSheet(root, illus);
    }

    setupDownloadAction();
  }

  // 等候題庫資料就緒後渲染
  if (typeof Data !== 'undefined' && Data.load) {
    Data.load().then(init).catch(init);
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
