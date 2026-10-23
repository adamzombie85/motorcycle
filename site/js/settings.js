/**
 * 閱讀設定模組 (Settings.js)
 * 採通用設計 (Universal Design)，讓全體學生皆能自主調整閱讀偏好。
 * 設定儲存於 localStorage ('moto:reading-settings')。
 * 支援：
 * 1. 字級（標準 18px、大 21px、特大 24px）
 * 2. 芫荽注音字型（動態載入，開啟時才下載字型檔）
 * 3. 語音朗讀（Web Speech API，zh-TW 繁體中文，支援慢/正常/快語速）
 * 4. 反向題醒目提醒（開/關）
 * 5. 音效反饋（開/關）
 * 6. 介面動效（開/關）
 * 7. 確認作答二次確認（開/關）
 */
(function () {
  'use strict';

  var SETTINGS_KEY = 'moto:reading-settings';
  var ZH_FONT_ID = 'moto-zhuyin-font-style';

  var DEFAULT_SETTINGS = {
    fontSize: 'standard', // 'standard' | 'large' | 'xlarge'
    zhuyin: false,
    speechAuto: false,
    speechRate: 'normal', // 'slow' (0.8) | 'normal' (1.0) | 'fast' (1.25)
    reverseAlert: true,
    soundEffects: true,
    animation: true,
    confirmAnswer: false
  };

  var RATE_MAP = {
    slow: 0.8,
    normal: 1.0,
    fast: 1.25
  };

  function loadSettings() {
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return Object.assign({}, DEFAULT_SETTINGS);
      var parsed = JSON.parse(raw);
      return Object.assign({}, DEFAULT_SETTINGS, parsed);
    } catch (e) {
      return Object.assign({}, DEFAULT_SETTINGS);
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('無法儲存閱讀設定至 localStorage', e);
    }
  }

  var currentSettings = loadSettings();

  // 1. 套用字級
  function applyFontSize(size) {
    var root = document.documentElement;
    root.classList.remove('font-size-large', 'font-size-xlarge');
    if (size === 'large') {
      root.classList.add('font-size-large');
    } else if (size === 'xlarge') {
      root.classList.add('font-size-xlarge');
    }
  }

  // 2. 套用注音字型（只有開啟注音時才動態載入字型檔）
  function applyZhuyin(enabled) {
    var styleEl = document.getElementById(ZH_FONT_ID);
    if (enabled) {
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = ZH_FONT_ID;
        // 使用相對於當前頁面的 fonts/ 目錄
        styleEl.textContent = 
          "@font-face {\n" +
          "  font-family: 'BpmfIansui';\n" +
          "  src: url('fonts/BpmfIansui-Subset.woff2') format('woff2');\n" +
          "  font-weight: normal;\n" +
          "  font-style: normal;\n" +
          "  font-display: swap;\n" +
          "}\n" +
          "body.mode-zhuyin, body.mode-zhuyin button, body.mode-zhuyin input, body.mode-zhuyin select, body.mode-zhuyin textarea {\n" +
          "  font-family: 'BpmfIansui', var(--font-family-sans) !important;\n" +
          "}\n";
        document.head.appendChild(styleEl);
      }
      document.body.classList.add('mode-zhuyin');
    } else {
      document.body.classList.remove('mode-zhuyin');
    }
  }

  // 3. 套用動效
  function applyAnimation(enabled) {
    if (!enabled) {
      document.body.classList.add('mode-no-motion');
    } else {
      document.body.classList.remove('mode-no-motion');
    }
  }

  // 4. 套用反向題提醒 (在答題畫面透過類別或屬性控制)
  function applyReverseAlert(enabled) {
    if (!enabled) {
      document.body.classList.add('hide-reverse-alert');
    } else {
      document.body.classList.remove('hide-reverse-alert');
    }
  }

  // 全面套用所有設定至 DOM
  function applyAll(settings) {
    applyFontSize(settings.fontSize);
    applyZhuyin(settings.zhuyin);
    applyAnimation(settings.animation);
    applyReverseAlert(settings.reverseAlert);
  }

  // 語音朗讀 (Web Speech API)
  function speak(text, options) {
    options = options || {};
    if (!('speechSynthesis' in window)) {
      console.warn('此瀏覽器不支援 Web Speech API 語音朗讀');
      return;
    }
    window.speechSynthesis.cancel();
    if (!text) return;

    var u = new SpeechSynthesisUtterance(text);
    var rateKey = options.rate || currentSettings.speechRate || 'normal';
    u.rate = typeof rateKey === 'number' ? rateKey : (RATE_MAP[rateKey] || 1.0);
    u.lang = 'zh-TW';

    var voices = window.speechSynthesis.getVoices();
    var zhVoice = voices.find(function (v) {
      return v.lang === 'zh-TW' || v.lang === 'zh_TW' || v.lang === 'cmn-Hant-TW' || v.lang.startsWith('zh');
    });
    if (zhVoice) u.voice = zhVoice;

    if (options.onEnd) u.onend = options.onEnd;
    if (options.onError) u.onerror = options.onError;
    window.speechSynthesis.speak(u);
  }

  function stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }


  /* ---------- 閱讀設定面板（標記照 design/screen-settings.html 的 class；樣式在 css/settings.css）---------- */
  var ICON = {
    gear: '<svg class="icon icon-md" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
    close: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>',
    font: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>',
    zhuyin: '<span class="settings-zhuyin-mark" aria-hidden="true">ㄅ</span>',
    speak: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
    sound: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
    warn: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>',
    spark: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>',
    check: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
    eye: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    download: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>',
    reset: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>'
  };

  function card(iconHtml, label, desc, controlHtml, extraHtml) {
    return '<section class="setting-card">' +
      '<div class="setting-card-header"><div class="setting-card-label">' + iconHtml + '<span>' + label + '</span></div>' + (controlHtml || '') + '</div>' +
      '<div class="setting-card-desc">' + desc + '</div>' + (extraHtml || '') + '</section>';
  }
  function toggle(id, label) {
    return '<label class="toggle-wrapper" title="' + label + '">' +
      '<input type="checkbox" class="toggle-input" id="' + id + '">' +
      '<span class="toggle-track" aria-hidden="true"><span class="toggle-thumb"></span><span class="toggle-label-on">開</span><span class="toggle-label-off">關</span></span>' +
      '<span class="toggle-status-badge" id="badge-' + id + '">已關閉</span></label>';
  }
  function segmented(label, attr, items) {
    return '<div class="segmented-group" role="radiogroup" aria-label="' + label + '">' + items.map(function (it) {
      return '<button type="button" class="segmented-btn" role="radio" aria-checked="false" data-' + attr + '="' + it[0] + '"><span>' + it[1] + '</span><span class="segmented-meta">' + it[2] + '</span></button>';
    }).join('') + '</div>';
  }
  function group(id, title, inner) {
    return '<section class="settings-group" aria-labelledby="' + id + '"><h3 class="settings-group-title" id="' + id + '">' + title + '</h3>' + inner + '</section>';
  }

  var lastTrigger = null;

  function buildSettingsDrawer() {
    if (document.getElementById('settings-drawer')) return;
    var backdrop = document.createElement('div');
    backdrop.id = 'settings-backdrop';
    backdrop.className = 'drawer-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');

    var drawer = document.createElement('div');
    drawer.id = 'settings-drawer';
    drawer.className = 'drawer-panel';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-labelledby', 'settings-drawer-title');
    drawer.setAttribute('aria-hidden', 'true');

    var reading = group('sg-read', '閱讀',
      card(ICON.font, '字級大小', '調整題目、選項與說明的字體大小，馬上看得到。', '',
        segmented('選擇字級大小', 'font', [['standard', '標準', '預設'], ['large', '大', '放大'], ['xlarge', '特大', '最大']]) +
        '<div class="reading-preview-box"><div class="reading-preview-label">' + ICON.eye + '<span>預覽：</span></div>' +
        '<div class="reading-preview-content">騎乘機車應依規定配戴合格安全帽，行經路口要減速慢行。</div></div>') +
      card(ICON.zhuyin, '注音符號標註', '在文字上方顯示注音。採用開源芫荽注音字型。', toggle('toggle-zhuyin', '切換注音符號標註')));

    var sound = group('sg-sound', '聲音',
      card(ICON.speak, '自動朗讀題目', '進入新題目時自動朗讀。關閉時，仍可點題目旁的「朗讀」。', toggle('toggle-speech-auto', '切換自動朗讀'),
        '<div class="settings-subrow"><div class="settings-subrow-label" id="speed-label">朗讀速度</div>' +
        segmented('選擇朗讀語速', 'speed', [['slow', '慢速', '0.8x'], ['normal', '正常', '1.0x'], ['fast', '快速', '1.25x']]) + '</div>') +
      card(ICON.sound, '音效回饋', '答對、答錯與過關時播放提示音。', toggle('toggle-sound', '切換音效')));

    var answer = group('sg-answer', '作答',
      card(ICON.warn, '反向題提醒', '遇到「何者不正確」「何者非」的題目，顯示醒目提醒，避免看錯。', toggle('toggle-reverse-alert', '切換反向題提醒')) +
      card(ICON.check, '確認作答', '開啟後，點選項只會先選取，按「確認作答」才送出，避免手滑。', toggle('toggle-confirm-answer', '切換確認作答')) +
      card(ICON.spark, '動畫效果', '選項彈跳與過關彩帶。關閉後畫面比較靜態。', toggle('toggle-animation', '切換動畫效果')));

    var advanced = '<details class="settings-advanced" id="settings-advanced"><summary>進階：學習紀錄</summary>' +
      '<div class="settings-advanced-body">' +
      '<p class="setting-card-desc">試玩時可下載這台裝置上的紀錄，或清除重來。</p>' +
      '<div class="settings-actions">' +
      '<button type="button" class="btn btn-secondary" id="btn-export-record">' + ICON.download + '<span>下載我的紀錄</span></button>' +
      '<button type="button" class="btn btn-outline settings-danger-btn" id="btn-reset-record">' + ICON.reset + '<span>重設我的紀錄</span></button>' +
      '</div>' +
      '<div class="settings-confirm" id="reset-confirm" hidden role="alertdialog" aria-labelledby="reset-confirm-text">' +
      '<p id="reset-confirm-text">確定要清除所有練習紀錄、錯題與徽章嗎？這個動作無法復原。</p>' +
      '<div class="settings-actions">' +
      '<button type="button" class="btn btn-outline" id="btn-reset-cancel"><span>取消</span></button>' +
      '<button type="button" class="btn btn-primary settings-danger-solid" id="btn-reset-confirm"><span>確定重設</span></button>' +
      '</div></div></div></details>';

    drawer.innerHTML =
      '<div class="drawer-handle-bar" aria-hidden="true"></div>' +
      '<div class="drawer-header"><div class="drawer-title-group">' +
      '<h2 class="drawer-title" id="settings-drawer-title" tabindex="-1">' + ICON.gear + '<span>閱讀設定</span></h2>' +
      '<div class="drawer-subtitle">調整後馬上生效，自動保存</div></div>' +
      '<button type="button" class="btn-drawer-close" id="btn-close-settings" aria-label="關閉閱讀設定" title="關閉">' + ICON.close + '</button></div>' +
      '<div class="drawer-body">' + reading + sound + answer + advanced + '</div>' +
      '<div class="drawer-footer">' +
      '<button type="button" class="btn btn-outline" id="btn-reset-settings">' + ICON.reset + '<span>恢復預設</span></button>' +
      '<button type="button" class="btn btn-primary" id="btn-done-settings"><span>完成</span></button></div>';

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);
    bindDrawerEvents(drawer, backdrop);
  }

  function setToggle(drawer, id, on) {
    var input = drawer.querySelector('#' + id);
    if (!input) return;
    input.checked = !!on;
    var badge = drawer.querySelector('#badge-' + id);
    if (badge) { badge.textContent = on ? '已開啟' : '已關閉'; badge.classList.toggle('is-active', !!on); }
  }
  function setSegment(drawer, attr, value) {
    drawer.querySelectorAll('[data-' + attr + ']').forEach(function (b) {
      var on = b.getAttribute('data-' + attr) === value;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }
  function syncDrawerUI(drawer) {
    setSegment(drawer, 'font', currentSettings.fontSize);
    setSegment(drawer, 'speed', currentSettings.speechRate);
    setToggle(drawer, 'toggle-zhuyin', currentSettings.zhuyin);
    setToggle(drawer, 'toggle-speech-auto', currentSettings.speechAuto);
    setToggle(drawer, 'toggle-sound', currentSettings.soundEffects);
    setToggle(drawer, 'toggle-reverse-alert', currentSettings.reverseAlert);
    setToggle(drawer, 'toggle-confirm-answer', currentSettings.confirmAnswer);
    setToggle(drawer, 'toggle-animation', currentSettings.animation);
  }

  function focusables(drawer) {
    return Array.prototype.filter.call(
      drawer.querySelectorAll('button, [href], input, summary, [tabindex]:not([tabindex="-1"])'),
      function (el) { return !el.disabled && el.offsetParent !== null; });
  }
  function isOpen() { var d = document.getElementById('settings-drawer'); return !!d && d.classList.contains('is-open'); }

  function openDrawer(trigger) {
    buildSettingsDrawer();
    var backdrop = document.getElementById('settings-backdrop');
    var drawer = document.getElementById('settings-drawer');
    lastTrigger = trigger || document.getElementById('btn-reading-settings') || document.activeElement;
    syncDrawerUI(drawer);
    drawer.querySelector('#reset-confirm').hidden = true;
    backdrop.classList.add('is-open');
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('settings-locked');   // 鎖住背後頁面捲動
    drawer.querySelector('.drawer-body').scrollTop = 0;
    drawer.querySelector('#settings-drawer-title').focus();
  }

  function closeDrawer() {
    var backdrop = document.getElementById('settings-backdrop');
    var drawer = document.getElementById('settings-drawer');
    if (!drawer) return;
    backdrop.classList.remove('is-open');
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('settings-locked');
    stopSpeaking();
    if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();   // 焦點回到「閱讀設定」按鈕
  }

  function bindDrawerEvents(drawer, backdrop) {
    backdrop.addEventListener('click', closeDrawer);
    drawer.querySelector('#btn-close-settings').addEventListener('click', closeDrawer);
    drawer.querySelector('#btn-done-settings').addEventListener('click', closeDrawer);

    // Esc 關閉；Tab 不會跑出面板
    document.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); return; }
      if (e.key !== 'Tab') return;
      var list = focusables(drawer);
      if (!list.length) return;
      var first = list[0], last = list[list.length - 1], active = document.activeElement;
      if (!drawer.contains(active)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && (active === first || active.id === 'settings-drawer-title')) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    });

    function change(key, value, applyFn) {
      currentSettings[key] = value;
      saveSettings(currentSettings);
      if (applyFn) applyFn(value);   // 即時套用到背後頁面
      syncDrawerUI(drawer);
    }
    drawer.querySelectorAll('[data-font]').forEach(function (btn) {
      btn.addEventListener('click', function () { change('fontSize', btn.getAttribute('data-font'), applyFontSize); });
    });
    drawer.querySelectorAll('[data-speed]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var spd = btn.getAttribute('data-speed');
        change('speechRate', spd);
        speak('語速試聽：安全第一。', { rate: spd });
      });
    });
    [['toggle-zhuyin', 'zhuyin', applyZhuyin], ['toggle-speech-auto', 'speechAuto', null], ['toggle-sound', 'soundEffects', null],
     ['toggle-reverse-alert', 'reverseAlert', applyReverseAlert], ['toggle-confirm-answer', 'confirmAnswer', null],
     ['toggle-animation', 'animation', applyAnimation]].forEach(function (t) {
      drawer.querySelector('#' + t[0]).addEventListener('change', function (e) { change(t[1], e.target.checked, t[2]); });
    });

    drawer.querySelector('#btn-reset-settings').addEventListener('click', function () {
      currentSettings = Object.assign({}, DEFAULT_SETTINGS);
      saveSettings(currentSettings);
      applyAll(currentSettings);
      syncDrawerUI(drawer);
    });

    // 下載我的紀錄（試玩工具）
    drawer.querySelector('#btn-export-record').addEventListener('click', function () {
      if (!(window.Store && window.Store.exportMe)) return;
      try {
        var data = window.Store.exportMe();
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'moto-record-' + (data.student || 'guest') + '-' + (data.exportedAt || new Date().toISOString()).slice(0, 10) + '.json';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        alert('匯出失敗：' + (err && err.message ? err.message : err));
      }
    });

    // 重設我的紀錄：先在面板裡出現確認列，再按「確定重設」才清除
    var confirmBox = drawer.querySelector('#reset-confirm');
    drawer.querySelector('#btn-reset-record').addEventListener('click', function () {
      confirmBox.hidden = false;
      drawer.querySelector('#btn-reset-cancel').focus();
      confirmBox.scrollIntoView({ block: 'nearest' });
    });
    drawer.querySelector('#btn-reset-cancel').addEventListener('click', function () {
      confirmBox.hidden = true;
      drawer.querySelector('#btn-reset-record').focus();
    });
    drawer.querySelector('#btn-reset-confirm').addEventListener('click', function () {
      if (window.Store && window.Store.resetMe) {
        window.Store.resetMe();
        currentSettings = Object.assign({}, DEFAULT_SETTINGS);
        window.location.reload();
      }
    });
  }

  // 初始化入口：套用設定，並綁定頁面上的「閱讀設定」按鈕
  function bindTrigger() {
    var trigger = document.getElementById('btn-reading-settings');
    if (trigger && !trigger.__settingsBound) {
      trigger.__settingsBound = true;
      trigger.addEventListener('click', function (e) { e.preventDefault(); openDrawer(trigger); });
    }
  }
  function init() {
    applyAll(currentSettings);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { applyAll(currentSettings); bindTrigger(); });
    } else {
      bindTrigger();
    }
  }
  init();

  // 匯出公開介面
  window.Settings = {
    get: function () { return Object.assign({}, currentSettings); },
    set: function (k, v) {
      currentSettings[k] = v;
      saveSettings(currentSettings);
      applyAll(currentSettings);
    },
    open: openDrawer,
    close: closeDrawer,
    speak: speak,
    stopSpeaking: stopSpeaking
  };
})();
