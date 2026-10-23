/* 試玩重點檢視程式（老師專用頁面）：吃 Store.importRecord() 與 Game.summary() */
(function () {
  'use strict';

  var root = document.getElementById('teacher-root');
  if (!root) return;

  var loadedSummaries = [];

  var ICONS = {
    upload: '<svg class="icon icon-md" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>',
    file: '<svg class="icon icon-md" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>',
    check: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
    clock: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    user: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    award: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>',
    alert: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>',
    settings: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    trash: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
  };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function formatDuration(sec) {
    sec = Math.round(sec || 0);
    if (sec <= 0) return '0 秒';
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    if (m === 0) return s + ' 秒';
    return m + ' 分 ' + s + ' 秒';
  }

  function formatDate(isoStr) {
    if (!isoStr) return '無日期資訊';
    try {
      var d = new Date(isoStr);
      var Y = d.getFullYear();
      var M = String(d.getMonth() + 1).padStart(2, '0');
      var D = String(d.getDate()).padStart(2, '0');
      var h = String(d.getHours()).padStart(2, '0');
      var m = String(d.getMinutes()).padStart(2, '0');
      return Y + '-' + M + '-' + D + ' ' + h + ':' + m;
    } catch (_) {
      return isoStr;
    }
  }

  // 渲染頁面核心
  function render() {
    root.innerHTML = '';

    // 1. 頁首英雄說明卡
    var hero = el('div', 'card');
    hero.style.cssText = 'margin-bottom: var(--space-6); background: linear-gradient(135deg, var(--color-primary-50) 0%, #FFFFFF 100%); border-left: 5px solid var(--color-primary-600);';
    var h1 = el('h1', 'page-title', '試玩觀察重點檢視');
    h1.style.cssText = 'font-size: clamp(1.5rem, 4vw, 2rem); margin-bottom: var(--space-2);';
    hero.appendChild(h1);

    var desc = el('p', 'page-desc', '本工具供教師分析學生試玩匯出的 .json 紀錄檔。可同時選取或拖曳多個檔案，系統將自動比對作答題數、答對率、使用時間、閱讀設定與錯題分布。');
    desc.style.cssText = 'color: var(--color-slate-600); font-size: var(--font-size-base); line-height: 1.5; margin-bottom: var(--space-4);';
    hero.appendChild(desc);

    // 操作工具列
    var toolbar = el('div');
    toolbar.style.cssText = 'display: flex; gap: var(--space-3); flex-wrap: wrap; align-items: center;';

    // 隱藏的檔案輸入
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.multiple = true;
    fileInput.id = 'teacher-file-input';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', function (e) {
      if (e.target.files && e.target.files.length) {
        handleFiles(e.target.files);
      }
    });
    toolbar.appendChild(fileInput);

    // 上傳按鈕
    var btnUpload = el('button', 'btn btn-primary btn-md');
    btnUpload.type = 'button';
    btnUpload.innerHTML = ICONS.upload + '<span style="margin-left: 6px;">選擇學生 .json 檔</span>';
    btnUpload.addEventListener('click', function () {
      fileInput.click();
    });
    toolbar.appendChild(btnUpload);

    // 載入範例按鈕
    var btnSample = el('button', 'btn btn-secondary btn-md');
    btnSample.type = 'button';
    btnSample.innerHTML = ICONS.file + '<span style="margin-left: 6px;">載入範例資料</span>';
    btnSample.addEventListener('click', loadSampleData);
    toolbar.appendChild(btnSample);

    // 清除按鈕
    if (loadedSummaries.length > 0) {
      var btnClear = el('button', 'btn btn-outline btn-md');
      btnClear.type = 'button';
      btnClear.style.color = 'var(--color-danger-600)';
      btnClear.style.borderColor = 'var(--color-danger-300)';
      btnClear.innerHTML = ICONS.trash + '<span style="margin-left: 6px;">清除目前清單 (' + loadedSummaries.length + ')</span>';
      btnClear.addEventListener('click', function () {
        if (confirm('確定要清除目前檢視中的所有紀錄嗎？')) {
          loadedSummaries = [];
          render();
        }
      });
      toolbar.appendChild(btnClear);
    }

    hero.appendChild(toolbar);
    root.appendChild(hero);

    // 拖曳上傳區 (Dropzone)
    var dropzone = el('div', 'upload-dropzone');
    dropzone.innerHTML =
      '<div style="color: var(--color-primary-600); margin-bottom: var(--space-2);">' + ICONS.upload + '</div>' +
      '<div style="font-weight: var(--font-weight-bold); font-size: var(--font-size-base); color: var(--color-text-main); margin-bottom: 4px;">拖曳多個 .json 紀錄檔至此處</div>' +
      '<div style="font-size: var(--font-size-sm); color: var(--color-slate-500);">或點擊上方「選擇學生 .json 檔」按鈕進行批次上傳</div>';
    
    dropzone.addEventListener('click', function () {
      fileInput.click();
    });

    ['dragenter', 'dragover'].forEach(function (eventName) {
      dropzone.addEventListener(eventName, function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('is-dragover');
      });
    });

    ['dragleave', 'drop'].forEach(function (eventName) {
      dropzone.addEventListener(eventName, function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('is-dragover');
      });
    });

    dropzone.addEventListener('drop', function (e) {
      var dt = e.dataTransfer;
      var files = dt.files;
      if (files && files.length) {
        handleFiles(files);
      }
    });

    root.appendChild(dropzone);

    // 若尚無任何資料
    if (loadedSummaries.length === 0) {
      var emptyCard = el('div', 'card');
      emptyCard.style.cssText = 'text-align: center; padding: var(--space-10) var(--space-4); margin-top: var(--space-6); background-color: var(--color-bg-card);';
      emptyCard.innerHTML =
        '<div style="width: 64px; height: 64px; border-radius: var(--radius-full); background-color: var(--color-primary-50); color: var(--color-primary-600); display: inline-flex; align-items: center; justify-content: center; margin-bottom: var(--space-4);">' + ICONS.file + '</div>' +
        '<h2 style="font-size: 1.25rem; font-weight: var(--font-weight-bold); color: var(--color-text-main); margin-bottom: var(--space-2);">尚未載入任何試玩紀錄</h2>' +
        '<p style="color: var(--color-slate-500); font-size: var(--font-size-base); max-width: 460px; margin: 0 auto;">請先上傳學生透過「閱讀設定 → 下載我的紀錄」匯出的檔案，或點擊上方「載入範例資料」快速檢驗功能。</p>';
      root.appendChild(emptyCard);
      return;
    }

    // 2. 多學生試玩比較表
    renderComparisonTable();

    // 3. 每位學生個別詳細觀察卡
    renderIndividualDetails();
  }

  // 渲染多學生試玩比較表
  function renderComparisonTable() {
    var sec = el('section');
    sec.style.cssText = 'margin-top: var(--space-8); margin-bottom: var(--space-8);';

    var h2 = el('h2', 'section-title');
    h2.style.cssText = 'font-size: 1.25rem; font-weight: var(--font-weight-bold); margin-bottom: var(--space-3); display: flex; align-items: center; gap: 8px;';
    h2.innerHTML = ICONS.file + '<span>學生試玩重點比較表</span> <span class="badge badge-primary text-nowrap" style="font-size: var(--font-size-sm);">' + loadedSummaries.length + ' 位學生</span>';
    sec.appendChild(h2);

    var tableWrapper = el('div', 'table-responsive');
    var tbl = el('table', 'data-table');
    
    // 表頭
    tbl.innerHTML =
      '<thead>' +
      '  <tr>' +
      '    <th>學生代號</th>' +
      '    <th>總題數 / 正確</th>' +
      '    <th>答對率</th>' +
      '    <th>累積時間</th>' +
      '    <th>嘗試關卡</th>' +
      '    <th>當前錯題</th>' +
      '    <th>獲得徽章</th>' +
      '    <th>閱讀設定</th>' +
      '    <th>螢幕 / 裝置</th>' +
      '  </tr>' +
      '</thead>';

    var tbody = el('tbody');
    loadedSummaries.forEach(function (s) {
      var tr = el('tr');

      // 答對率 badge
      var accBadgeClass = s.accuracy >= 85 ? 'badge-success' : s.accuracy >= 70 ? 'badge-warning' : 'badge-danger';
      var readingSummaryText = s.reading.used ? s.reading.items.join('、') : '預設';
      var devStr = s.device.screenWidth ? s.device.screenWidth + 'px' : '-';

      tr.innerHTML =
        '<td><strong>' + escapeHtml(s.student || '訪客') + '</strong></td>' +
        '<td>' + s.totalAnswers + ' 題 (' + s.correctAnswers + ' 對)</td>' +
        '<td><span class="badge ' + accBadgeClass + ' text-nowrap">' + s.accuracy + '%</span></td>' +
        '<td>' + formatDuration(s.seconds) + '</td>' +
        '<td>' + s.levels.length + ' 關</td>' +
        '<td><span style="color: ' + (s.mistakesNow > 0 ? 'var(--color-danger-600)' : 'var(--color-success-600)') + '; font-weight: bold;">' + s.mistakesNow + ' 題</span></td>' +
        '<td>' + s.badges.length + ' 個</td>' +
        '<td><span class="badge badge-secondary" style="font-weight: normal;">' + escapeHtml(readingSummaryText) + '</span></td>' +
        '<td><span class="text-nowrap" style="color: var(--color-slate-500);">' + escapeHtml(devStr) + '</span></td>';

      tbody.appendChild(tr);
    });

    tbl.appendChild(tbody);
    tableWrapper.appendChild(tbl);
    sec.appendChild(tableWrapper);

    root.appendChild(sec);
  }

  // 渲染學生個別詳細紀錄
  function renderIndividualDetails() {
    var sec = el('section');
    sec.style.cssText = 'margin-top: var(--space-8);';

    var h2 = el('h2', 'section-title');
    h2.style.cssText = 'font-size: 1.25rem; font-weight: var(--font-weight-bold); margin-bottom: var(--space-4); display: flex; align-items: center; gap: 8px;';
    h2.innerHTML = ICONS.user + '<span>個別學生詳細觀察</span>';
    sec.appendChild(h2);

    loadedSummaries.forEach(function (s, idx) {
      var card = el('div', 'card');
      card.style.cssText = 'margin-bottom: var(--space-6); background-color: var(--color-bg-card); border-radius: var(--radius-lg); box-shadow: var(--shadow-card); padding: var(--space-5);';

      // 卡片標頭
      var header = el('div');
      header.style.cssText = 'display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-4); border-bottom: 1px solid var(--color-border-subtle); padding-bottom: var(--space-3);';
      
      var titleGroup = el('div');
      var name = el('h3');
      name.style.cssText = 'font-size: 1.25rem; font-weight: var(--font-weight-bold); color: var(--color-primary-800); margin-bottom: 4px;';
      name.textContent = (idx + 1) + '. 學生代號：' + (s.student || '訪客');
      titleGroup.appendChild(name);

      var meta = el('div');
      meta.style.cssText = 'font-size: var(--font-size-sm); color: var(--color-slate-500); display: flex; gap: var(--space-3); flex-wrap: wrap;';
      meta.innerHTML =
        '<span>匯出時間：' + formatDate(s.exportedAt) + '</span>' +
        '<span>裝置：' + escapeHtml(s.device.userAgent || '未知') + '</span>';
      titleGroup.appendChild(meta);

      header.appendChild(titleGroup);

      var badgeGroup = el('div');
      badgeGroup.style.cssText = 'display: flex; gap: 6px; align-items: center;';
      badgeGroup.innerHTML = '<span class="badge badge-primary text-nowrap">' + s.totalAnswers + ' 題</span>' +
        '<span class="badge ' + (s.accuracy >= 85 ? 'badge-success' : 'badge-warning') + ' text-nowrap">答對率 ' + s.accuracy + '%</span>';
      header.appendChild(badgeGroup);

      card.appendChild(header);

      // 核心指標小卡排
      var statsRow = el('div');
      statsRow.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: var(--space-3); margin-bottom: var(--space-5);';

      var statItems = [
        { label: '答對率', val: s.accuracy + '%', color: s.accuracy >= 85 ? 'var(--color-success-600)' : 'var(--color-accent-600)' },
        { label: '累積作答時間', val: formatDuration(s.seconds), color: 'var(--color-primary-700)' },
        { label: '嘗試關卡數', val: s.levels.length + ' 關', color: 'var(--color-text-main)' },
        { label: '目前待複習錯題', val: s.mistakesNow + ' 題', color: s.mistakesNow > 0 ? 'var(--color-danger-600)' : 'var(--color-success-600)' },
        { label: '已解鎖成就', val: s.badges.length + ' 款', color: 'var(--color-accent-700)' }
      ];

      statItems.forEach(function (st) {
        var box = el('div');
        box.style.cssText = 'background-color: var(--color-slate-50); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); padding: var(--space-3); text-align: center;';
        box.innerHTML =
          '<div style="font-size: var(--font-size-sm); color: var(--color-slate-500); margin-bottom: 2px;">' + st.label + '</div>' +
          '<div style="font-size: 1.125rem; font-weight: var(--font-weight-bold); color: ' + st.color + ';">' + st.val + '</div>';
        statsRow.appendChild(box);
      });
      card.appendChild(statsRow);

      // 閱讀設定區塊
      var readSec = el('div');
      readSec.style.cssText = 'background-color: var(--color-primary-50); border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); margin-bottom: var(--space-5); border: 1px solid var(--color-primary-100);';
      var readTitle = el('div');
      readTitle.style.cssText = 'font-weight: var(--font-weight-bold); font-size: var(--font-size-sm); color: var(--color-primary-900); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;';
      readTitle.innerHTML = ICONS.settings + '<span>學生使用之閱讀設定：</span>';
      readSec.appendChild(readTitle);

      var readContent = el('div');
      if (s.reading.used && s.reading.items.length) {
        readContent.style.cssText = 'display: flex; gap: 6px; flex-wrap: wrap;';
        s.reading.items.forEach(function (it) {
          var tag = el('span', 'badge badge-primary text-nowrap', it);
          tag.style.cssText = 'font-size: var(--font-size-sm); padding: 4px 10px; background-color: #FFFFFF; border: 1px solid var(--color-primary-300); color: var(--color-primary-800);';
          readContent.appendChild(tag);
        });
      } else {
        readContent.textContent = '使用系統標準預設設定（標準字級 20px、未開啟注音、未開啟自動朗讀、開啟反向題提醒與音效動效）。';
        readContent.style.cssText = 'font-size: var(--font-size-sm); color: var(--color-slate-600);';
      }
      readSec.appendChild(readContent);
      card.appendChild(readSec);

      // 嘗試關卡與成績
      if (s.levels && s.levels.length) {
        var lvSec = el('div');
        lvSec.style.cssText = 'margin-bottom: var(--space-5);';
        lvSec.innerHTML = '<div style="font-weight: var(--font-weight-bold); font-size: var(--font-size-sm); margin-bottom: var(--space-2); color: var(--color-text-main);">關卡練習紀錄：</div>';
        
        var lvTableWrap = el('div', 'table-responsive');
        var lvTbl = el('table', 'data-table');
        lvTbl.innerHTML =
          '<thead><tr><th>關卡代號</th><th>嘗試次數</th><th>最高分數</th><th>最後得分</th></tr></thead>' +
          '<tbody>' +
          s.levels.map(function (l) {
            return '<tr>' +
              '<td><strong>' + escapeHtml(l.levelId) + '</strong></td>' +
              '<td>' + l.tries + ' 次</td>' +
              '<td><span class="badge ' + (l.best >= 85 ? 'badge-success' : 'badge-warning') + ' text-nowrap">' + l.best + ' 分</span></td>' +
              '<td>' + l.last + ' 分</td>' +
              '</tr>';
          }).join('') +
          '</tbody>';
        lvTableWrap.appendChild(lvTbl);
        lvSec.appendChild(lvTableWrap);
        card.appendChild(lvSec);
      }

      // 常錯題目明細
      var wrongSec = el('div');
      wrongSec.innerHTML = '<div style="font-weight: var(--font-weight-bold); font-size: var(--font-size-sm); margin-bottom: var(--space-2); color: var(--color-text-main); display: flex; align-items: center; gap: 6px;">' + ICONS.alert + '<span>錯題明細分析 (共錯 ' + s.wrongQuestions.length + ' 題)：</span></div>';
      
      if (s.wrongQuestions.length > 0) {
        var wTableWrap = el('div', 'table-responsive');
        var wTbl = el('table', 'data-table');
        wTbl.innerHTML =
          '<thead><tr><th>題號</th><th>小類分類</th><th>答錯次數</th><th>題目重點摘要</th><th>錯題庫狀態</th></tr></thead>' +
          '<tbody>' +
          s.wrongQuestions.map(function (wq) {
            var qTitle = wq.question ? (wq.question.length > 40 ? wq.question.slice(0, 40) + '…' : wq.question) : '題目文字未載入';
            var misBadge = wq.inMistakes
              ? '<span class="badge badge-danger text-nowrap">待複習中</span>'
              : '<span class="badge badge-success text-nowrap">已連續答對移出</span>';
            return '<tr>' +
              '<td><code>' + escapeHtml(wq.qid) + '</code></td>' +
              '<td><span class="text-nowrap">' + escapeHtml(wq.subcategory || '-') + '</span></td>' +
              '<td><strong style="color: var(--color-danger-600);">' + wq.wrong + ' 次</strong></td>' +
              '<td>' + escapeHtml(qTitle) + '</td>' +
              '<td>' + misBadge + '</td>' +
              '</tr>';
          }).join('') +
          '</tbody>';
        wTableWrap.appendChild(wTbl);
        wrongSec.appendChild(wTableWrap);
      } else {
        wrongSec.innerHTML += '<div style="font-size: var(--font-size-sm); color: var(--color-success-700); background-color: var(--color-success-50); padding: var(--space-3); border-radius: var(--radius-md);">🎉 太厲害了！該生所有作答皆無錯誤。</div>';
      }
      card.appendChild(wrongSec);

      sec.appendChild(card);
    });

    root.appendChild(sec);
  }

  // 處理檔案匯入
  function handleFiles(fileList) {
    var files = Array.from(fileList);
    var remaining = files.length;
    var newRecords = [];

    files.forEach(function (file) {
      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          var json = JSON.parse(e.target.result);
          var record = window.Store.importRecord(json);
          var summary = window.Game.summary(record);
          newRecords.push(summary);
        } catch (err) {
          alert('檔案「' + file.name + '」讀取失敗：' + (err && err.message ? err.message : err));
        } finally {
          remaining--;
          if (remaining === 0) {
            loadedSummaries = loadedSummaries.concat(newRecords);
            render();
          }
        }
      };
      reader.onerror = function () {
        alert('檔案「' + file.name + '」讀取錯誤。');
        remaining--;
        if (remaining === 0) render();
      };
      reader.readAsText(file);
    });
  }

  // 載入範例資料 (site/tests/sample-record.json)
  function loadSampleData() {
    fetch('tests/sample-record.json')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        var record = window.Store.importRecord(json);
        var summary = window.Game.summary(record);
        loadedSummaries.push(summary);
        render();
      })
      .catch(function (err) {
        // 若無法透過 fetch（如以 file:// 協定開啟），則載入內建範例結構
        var fallbackJson = {
          format: "moto-record",
          version: 1,
          exportedAt: new Date().toISOString(),
          student: "S101-範例學生",
          device: { userAgent: "Mozilla/5.0 (Mobile) Chrome/120.0", screenWidth: 390 },
          readingSettings: { fontSize: "large", zhuyin: true, confirmAnswer: true },
          data: {
            answers: [
              { qid: "M0001", choice: 0, correct: true, ts: Date.now() },
              { qid: "M0002", choice: 1, correct: false, ts: Date.now() },
              { qid: "M0003", choice: 0, correct: true, ts: Date.now() },
              { qid: "M0004", choice: 0, correct: true, ts: Date.now() }
            ],
            attempts: [{ levelId: "貨物裝載-1", seconds: 45, score: 75, mode: "level" }],
            mistakes: { "M0002": { wrongCount: 1, streak: 0 } },
            docs: { badges: { "badge-first-ride": "2026-10-23" } }
          }
        };
        var record = window.Store.importRecord(fallbackJson);
        var summary = window.Game.summary(record);
        loadedSummaries.push(summary);
        render();
      });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 初始化入口
  function init() {
    window.Data.load(function (err) {
      if (err) {
        root.innerHTML = '<p class="text-danger" style="padding: var(--space-4);">題庫資料載入失敗，請確認網路連線或重新整理頁面。</p>';
        return;
      }
      render();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
