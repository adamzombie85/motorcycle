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

  // 構建閱讀設定抽屜面板 (Settings Drawer)
  function buildSettingsDrawer() {
    if (document.getElementById('settings-drawer-backdrop')) return;

    var backdrop = document.createElement('div');
    backdrop.id = 'settings-drawer-backdrop';
    backdrop.className = 'settings-drawer-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');

    var drawer = document.createElement('div');
    drawer.id = 'settings-drawer';
    drawer.className = 'settings-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', '閱讀與無障礙設定');

    drawer.innerHTML = 
      '<div class="settings-drawer-header">' +
      '  <div class="settings-drawer-title-box">' +
      '    <svg class="icon icon-md" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>' +
      '    <h2>閱讀設定</h2>' +
      '  </div>' +
      '  <button type="button" class="btn-drawer-close" id="btn-close-settings" aria-label="關閉閱讀設定">' +
      '    <svg class="icon icon-md" viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '  </button>' +
      '</div>' +
      '<div class="settings-drawer-body">' +
      '  <!-- 1. 字級設定 -->' +
      '  <div class="setting-group">' +
      '    <label class="setting-label">文字大小</label>' +
      '    <div class="segmented-control" role="radiogroup" aria-label="文字大小選擇">' +
      '      <button type="button" class="segment-btn" data-font="standard">標準</button>' +
      '      <button type="button" class="segment-btn" data-font="large">大</button>' +
      '      <button type="button" class="segment-btn" data-font="xlarge">特大</button>' +
      '    </div>' +
      '    <div class="font-preview-box" id="font-preview-text">預覽：安全駕駛，平安回家。</div>' +
      '  </div>' +
      '  <!-- 2. 注音字型 -->' +
      '  <div class="setting-group setting-row">' +
      '    <div>' +
      '      <label class="setting-label">顯示注音符號</label>' +
      '      <div class="setting-subtext">採用開源芫荽注音字型</div>' +
      '    </div>' +
      '    <button type="button" class="toggle-btn" id="toggle-zhuyin" role="switch" aria-checked="false">' +
      '      <span class="toggle-track"></span>' +
      '      <span class="toggle-thumb"></span>' +
      '      <span class="toggle-label-text">關</span>' +
      '    </button>' +
      '  </div>' +
      '  <!-- 3. 自動朗讀題目 -->' +
      '  <div class="setting-group setting-row">' +
      '    <div>' +
      '      <label class="setting-label">進入題目自動朗讀</label>' +
      '      <div class="setting-subtext">亦可在題目旁手動點選朗讀</div>' +
      '    </div>' +
      '    <button type="button" class="toggle-btn" id="toggle-speech-auto" role="switch" aria-checked="false">' +
      '      <span class="toggle-track"></span>' +
      '      <span class="toggle-thumb"></span>' +
      '      <span class="toggle-label-text">關</span>' +
      '    </button>' +
      '  </div>' +
      '  <!-- 4. 朗讀語速 -->' +
      '  <div class="setting-group">' +
      '    <label class="setting-label">朗讀語速</label>' +
      '    <div class="segmented-control" role="radiogroup" aria-label="朗讀語速選擇">' +
      '      <button type="button" class="segment-btn" data-speed="slow">慢速</button>' +
      '      <button type="button" class="segment-btn" data-speed="normal">正常</button>' +
      '      <button type="button" class="segment-btn" data-speed="fast">快速</button>' +
      '    </div>' +
      '  </div>' +
      '  <!-- 5. 反向題醒目提醒 -->' +
      '  <div class="setting-group setting-row">' +
      '    <div>' +
      '      <label class="setting-label">反向題提醒橫幅</label>' +
      '      <div class="setting-subtext">醒目標註「何者不正確」題目</div>' +
      '    </div>' +
      '    <button type="button" class="toggle-btn" id="toggle-reverse-alert" role="switch" aria-checked="true">' +
      '      <span class="toggle-track"></span>' +
      '      <span class="toggle-thumb"></span>' +
      '      <span class="toggle-label-text">開</span>' +
      '    </button>' +
      '  </div>' +
      '  <!-- 6. 音效反饋 -->' +
      '  <div class="setting-group setting-row">' +
      '    <div>' +
      '      <label class="setting-label">答題與過關音效</label>' +
      '      <div class="setting-subtext">答對提示音與過關效果音</div>' +
      '    </div>' +
      '    <button type="button" class="toggle-btn" id="toggle-sound" role="switch" aria-checked="true">' +
      '      <span class="toggle-track"></span>' +
      '      <span class="toggle-thumb"></span>' +
      '      <span class="toggle-label-text">開</span>' +
      '    </button>' +
      '  </div>' +
      '  <!-- 7. 介面動效 -->' +
      '  <div class="setting-group setting-row">' +
      '    <div>' +
      '      <label class="setting-label">介面動畫效果</label>' +
      '      <div class="setting-subtext">關閉過關彩帶與過場動效</div>' +
      '    </div>' +
      '    <button type="button" class="toggle-btn" id="toggle-animation" role="switch" aria-checked="true">' +
      '      <span class="toggle-track"></span>' +
      '      <span class="toggle-thumb"></span>' +
      '      <span class="toggle-label-text">開</span>' +
      '    </button>' +
      '  </div>' +
      '  <!-- 8. 確認作答防誤觸 -->' +
      '  <div class="setting-group setting-row">' +
      '    <div>' +
      '      <label class="setting-label">二次確認作答</label>' +
      '      <div class="setting-subtext">點選選項後需點擊確認才送出</div>' +
      '    </div>' +
      '    <button type="button" class="toggle-btn" id="toggle-confirm-answer" role="switch" aria-checked="false">' +
      '      <span class="toggle-track"></span>' +
      '      <span class="toggle-thumb"></span>' +
      '      <span class="toggle-label-text">關</span>' +
      '    </button>' +
      '  </div>' +
      '  <!-- 9. 學習紀錄管理（試玩工具） -->' +
      '  <div class="setting-group" style="border-top: 1px solid var(--color-border-subtle); padding-top: var(--space-4); margin-top: var(--space-4);">' +
      '    <label class="setting-label">學習紀錄管理</label>' +
      '    <div class="setting-subtext" style="margin-bottom: var(--space-3);">試玩測試與紀錄匯出</div>' +
      '    <div style="display: flex; gap: var(--space-3); flex-wrap: wrap;">' +
      '      <button type="button" class="btn btn-secondary" id="btn-export-record" style="flex: 1; min-width: 130px;">' +
      '        <span>下載我的紀錄</span>' +
      '      </button>' +
      '      <button type="button" class="btn btn-outline" id="btn-reset-record" style="flex: 1; min-width: 130px; color: var(--color-danger-600); border-color: var(--color-danger-300);">' +
      '        <span>重設我的紀錄</span>' +
      '      </button>' +
      '    </div>' +
      '  </div>' +
      '</div>' +
      '<div class="settings-drawer-footer">' +
      '  <button type="button" class="btn btn-outline" id="btn-reset-settings" style="flex: 1;">' +
      '    <span>恢復預設</span>' +
      '  </button>' +
      '  <button type="button" class="btn btn-primary" id="btn-done-settings" style="flex: 1;">' +
      '    <span>完成</span>' +
      '  </button>' +
      '</div>';

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);

    // 綁定抽屜內互動事件
    bindDrawerEvents(drawer, backdrop);
  }

  function updateToggleUI(btn, isChecked) {
    if (!btn) return;
    btn.setAttribute('aria-checked', isChecked ? 'true' : 'false');
    if (isChecked) {
      btn.classList.add('is-active');
    } else {
      btn.classList.remove('is-active');
    }
    var lbl = btn.querySelector('.toggle-label-text');
    if (lbl) lbl.textContent = isChecked ? '開' : '關';
  }

  function syncDrawerUI(drawer) {
    // 1. 字級
    var fontBtns = drawer.querySelectorAll('[data-font]');
    fontBtns.forEach(function (b) {
      if (b.getAttribute('data-font') === currentSettings.fontSize) {
        b.classList.add('is-active');
      } else {
        b.classList.remove('is-active');
      }
    });

    // 2. 語速
    var speedBtns = drawer.querySelectorAll('[data-speed]');
    speedBtns.forEach(function (b) {
      if (b.getAttribute('data-speed') === currentSettings.speechRate) {
        b.classList.add('is-active');
      } else {
        b.classList.remove('is-active');
      }
    });

    // 3. 開關們
    updateToggleUI(drawer.querySelector('#toggle-zhuyin'), currentSettings.zhuyin);
    updateToggleUI(drawer.querySelector('#toggle-speech-auto'), currentSettings.speechAuto);
    updateToggleUI(drawer.querySelector('#toggle-reverse-alert'), currentSettings.reverseAlert);
    updateToggleUI(drawer.querySelector('#toggle-sound'), currentSettings.soundEffects);
    updateToggleUI(drawer.querySelector('#toggle-animation'), currentSettings.animation);
    updateToggleUI(drawer.querySelector('#toggle-confirm-answer'), currentSettings.confirmAnswer);
  }

  function openDrawer() {
    buildSettingsDrawer();
    var backdrop = document.getElementById('settings-drawer-backdrop');
    var drawer = document.getElementById('settings-drawer');
    syncDrawerUI(drawer);
    backdrop.classList.add('is-open');
    drawer.classList.add('is-open');
    drawer.focus();
  }

  function closeDrawer() {
    var backdrop = document.getElementById('settings-drawer-backdrop');
    var drawer = document.getElementById('settings-drawer');
    if (backdrop) backdrop.classList.remove('is-open');
    if (drawer) drawer.classList.remove('is-open');
  }

  function bindDrawerEvents(drawer, backdrop) {
    backdrop.addEventListener('click', closeDrawer);
    drawer.querySelector('#btn-close-settings').addEventListener('click', closeDrawer);
    drawer.querySelector('#btn-done-settings').addEventListener('click', closeDrawer);

    // 字級切換
    drawer.querySelectorAll('[data-font]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var size = btn.getAttribute('data-font');
        currentSettings.fontSize = size;
        saveSettings(currentSettings);
        applyFontSize(size);
        syncDrawerUI(drawer);
      });
    });

    // 語速切換
    drawer.querySelectorAll('[data-speed]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var spd = btn.getAttribute('data-speed');
        currentSettings.speechRate = spd;
        saveSettings(currentSettings);
        syncDrawerUI(drawer);
        // 語音試聽
        speak('語速試聽：安全第一。', { rate: spd });
      });
    });

    // 注音切換
    var tZhuyin = drawer.querySelector('#toggle-zhuyin');
    tZhuyin.addEventListener('click', function () {
      currentSettings.zhuyin = !currentSettings.zhuyin;
      saveSettings(currentSettings);
      applyZhuyin(currentSettings.zhuyin);
      syncDrawerUI(drawer);
    });

    // 自動朗讀
    var tSpeech = drawer.querySelector('#toggle-speech-auto');
    tSpeech.addEventListener('click', function () {
      currentSettings.speechAuto = !currentSettings.speechAuto;
      saveSettings(currentSettings);
      syncDrawerUI(drawer);
    });

    // 反向題提醒
    var tRev = drawer.querySelector('#toggle-reverse-alert');
    tRev.addEventListener('click', function () {
      currentSettings.reverseAlert = !currentSettings.reverseAlert;
      saveSettings(currentSettings);
      applyReverseAlert(currentSettings.reverseAlert);
      syncDrawerUI(drawer);
    });

    // 音效
    var tSound = drawer.querySelector('#toggle-sound');
    tSound.addEventListener('click', function () {
      currentSettings.soundEffects = !currentSettings.soundEffects;
      saveSettings(currentSettings);
      syncDrawerUI(drawer);
    });

    // 動畫
    var tAnim = drawer.querySelector('#toggle-animation');
    tAnim.addEventListener('click', function () {
      currentSettings.animation = !currentSettings.animation;
      saveSettings(currentSettings);
      applyAnimation(currentSettings.animation);
      syncDrawerUI(drawer);
    });

    // 二次確認
    var tConfirm = drawer.querySelector('#toggle-confirm-answer');
    tConfirm.addEventListener('click', function () {
      currentSettings.confirmAnswer = !currentSettings.confirmAnswer;
      saveSettings(currentSettings);
      syncDrawerUI(drawer);
    });

    // 恢復預設值
    drawer.querySelector('#btn-reset-settings').addEventListener('click', function () {
      currentSettings = Object.assign({}, DEFAULT_SETTINGS);
      saveSettings(currentSettings);
      applyAll(currentSettings);
      syncDrawerUI(drawer);
    });

    // 下載我的紀錄（試玩工具）
    var btnExport = drawer.querySelector('#btn-export-record');
    if (btnExport) {
      btnExport.addEventListener('click', function () {
        if (window.Store && window.Store.exportMe) {
          try {
            var data = window.Store.exportMe();
            var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            var dateStr = (data.exportedAt || new Date().toISOString()).slice(0, 10);
            a.href = url;
            a.download = 'moto-record-' + (data.student || 'guest') + '-' + dateStr + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } catch (err) {
            alert('匯出失敗：' + (err && err.message ? err.message : err));
          }
        }
      });
    }

    // 重設我的紀錄（試玩工具，需二次確認）
    var btnResetRec = drawer.querySelector('#btn-reset-record');
    if (btnResetRec) {
      btnResetRec.addEventListener('click', function () {
        if (window.confirm('確定要清除所有練習紀錄、錯題與徽章嗎？此動作無法復原。')) {
          if (window.Store && window.Store.resetMe) {
            window.Store.resetMe();
            alert('已成功清除所有練習紀錄！');
            window.location.reload();
          }
        }
      });
    }
  }

  // 初始化入口
  function init() {
    applyAll(currentSettings);

    // 綁定所有頁面上可能存在的 #btn-reading-settings
    document.addEventListener('DOMContentLoaded', function () {
      applyAll(currentSettings);
      var trigger = document.getElementById('btn-reading-settings');
      if (trigger) {
        trigger.addEventListener('click', function (e) {
          e.preventDefault();
          openDrawer();
        });
      }
    });

    // 如果 DOM 已經就緒直接綁定
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      var trigger = document.getElementById('btn-reading-settings');
      if (trigger) {
        trigger.addEventListener('click', function (e) {
          e.preventDefault();
          openDrawer();
        });
      }
    }
  }

  // 自動執行初始化
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
