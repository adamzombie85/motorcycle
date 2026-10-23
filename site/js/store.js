/* 學習紀錄存取。所有讀寫都經過這個檔案；以後換成 GAS 只改這裡。
 * 目前存在 localStorage，依學生代號分開存。
 *
 * attempt = { levelId, date(ISO), answers:[{qid, choice, correct}],
 *             correctCount, total, score, seconds }
 * mistakes = { 題號: 連續答對次數 }
 * answers（作答紀錄，每答一題就寫入）= [{ qid, correct, ts(ms), choice?, src? }]
 * srs（間隔複習）= { 題號: { kind: 'mistake' | 'grad', due: 'YYYY-MM-DD' } }
 * 時間一律走 Store.now()，測試時可用 Store.setClock() 換成假日期。
 */
(function () {
  var PREFIX = 'moto:';
  var STUDENT_KEY = PREFIX + 'student';

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  // 儲存後端：預設 local（只有 localStorage）。BACKEND='firebase' 時，store-firebase.js 會用 Store.setBackend
  // 掛上一個後端，每次使用者資料寫入本機後會通知它（write-behind：本機永遠是先寫、先讀的那一份）。
  var backend = { name: 'local' };
  var muted = false;   // 套用遠端資料時暫停通知，避免來回同步
  function notify(fn, a, b, c) {
    if (muted || typeof backend[fn] !== 'function') return;
    try { backend[fn](a, b, c); } catch (e) { if (typeof console !== 'undefined') console.warn('儲存後端錯誤', e); }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { return false; }
    var m = key.indexOf(PREFIX + 'u:') === 0 && key.slice((PREFIX + 'u:').length).match(/^([^:]+):(.+)$/);
    if (m) notify('onWrite', m[1], m[2], value);
    return true;
  }
  function userKey(name) {
    var s = window.Store.getStudent();
    if (!s) throw new Error('尚未設定學生代號');
    return PREFIX + 'u:' + s + ':' + name;
  }

  var READING_KEY = PREFIX + 'reading-settings';   // 閱讀設定（settings.js 管，整台裝置共用）
  var RECORD_FORMAT = 'moto-record';
  function userCode() {
    var s = window.Store.getStudent();
    if (!s) throw new Error('尚未設定學生代號');
    return s;
  }

  // 讀某個學生代號在本機的全部紀錄（格式同 exportMe().data）
  function readRecord(code) {
    var pre = PREFIX + 'u:' + code + ':', docs = {}, cur = window.Store.getStudent();
    if (cur !== code) window.Store.setStudent(code);   // 借用 getAnswerLog() 的舊資料轉換，再換回來
    var answers;
    try { answers = window.Store.getAnswerLog(); } finally { if (cur !== code) { if (cur) window.Store.setStudent(cur); else window.Store.logout(); } }
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf(pre + 'doc:') === 0) docs[k.slice((pre + 'doc:').length)] = read(k, null);
    }
    return {
      attempts: read(pre + 'attempts', []), mistakes: read(pre + 'mistakes', {}), answers: answers,
      srs: read(pre + 'srs', {}), docs: docs
    };
  }
  // 把一份紀錄合併進目前使用者：作答、練習去重後相加；其他以「目前已有的為準，沒有才補」。
  // 徽章取聯集（日期取較早）；cleanedUp 取 or。
  function mergeRecord(rec) {
    var S = window.Store, out = { answers: 0, attempts: 0, mistakes: 0, srs: 0, docs: 0 };
    var log = S.getAnswerLog(), seen = {};
    log.forEach(function (r) { seen[r.qid + '@' + r.ts] = true; });
    (rec.answers || []).forEach(function (r) { if (!seen[r.qid + '@' + r.ts]) { log.push(r); seen[r.qid + '@' + r.ts] = true; out.answers++; } });
    if (out.answers) { log.sort(function (a, b) { return a.ts - b.ts; }); write(userKey('answers'), log); }
    var at = read(userKey('attempts'), []), aseen = {};
    at.forEach(function (a) { aseen[a.levelId + '@' + a.date] = true; });
    (rec.attempts || []).forEach(function (a) { if (!aseen[a.levelId + '@' + a.date]) { at.push(a); aseen[a.levelId + '@' + a.date] = true; out.attempts++; } });
    if (out.attempts) { at.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; }); write(userKey('attempts'), at); }
    ['mistakes', 'srs'].forEach(function (name) {
      var cur = read(userKey(name), {}), add = rec[name] || {}, n = 0;
      Object.keys(add).forEach(function (k) { if (!Object.prototype.hasOwnProperty.call(cur, k)) { cur[k] = add[k]; n++; } });
      if (n) { write(userKey(name), cur); out[name] = n; }
    });
    Object.keys(rec.docs || {}).forEach(function (name) {
      var cur = S.getDoc(name, null), add = rec.docs[name], next = cur;
      if (add === null || add === undefined) return;
      if (cur === null) next = add;
      else if (name === 'badges') { next = {}; Object.keys(cur).forEach(function (k) { next[k] = cur[k]; }); Object.keys(add).forEach(function (k) { if (!next[k] || add[k] < next[k]) next[k] = add[k]; }); }
      else if (name === 'cleanedUp') next = cur || add;
      else if (name === 'daily') { next = {}; Object.keys(add).forEach(function (k) { next[k] = add[k]; }); Object.keys(cur).forEach(function (k) { next[k] = cur[k]; }); }
      if (JSON.stringify(next) !== JSON.stringify(cur)) { S.setDoc(name, next); out.docs++; }
    });
    return out;
  }

  var clock = function () { return new Date(); };
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function dateStr(x) {
    var d = x instanceof Date ? x : new Date(x);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function parseDate(str) {
    var p = str.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function addDays(str, n) {
    var d = parseDate(str);
    d.setDate(d.getDate() + n);
    return dateStr(d);
  }

  window.Store = {
    // ---- 時間（可換成假日期做測試）----
    now: function () { return clock(); },
    setClock: function (fn) { clock = fn || function () { return new Date(); }; },
    today: function () { return dateStr(clock()); },
    dateStr: dateStr,
    parseDate: parseDate,
    addDays: addDays,
    // 該日期所在那週（週一～週日）的週一
    weekStart: function (str) {
      var dow = parseDate(str).getDay();
      return addDays(str, -((dow + 6) % 7));
    },

    // ---- 通用文件（遊戲化資料用：每日挑戰、徽章、角色…）----
    getDoc: function (name, fallback) { return read(userKey('doc:' + name), fallback); },
    setDoc: function (name, value) { return write(userKey('doc:' + name), value); },

    getStudent: function () { return read(STUDENT_KEY, null); },
    setStudent: function (code) {
      code = String(code || '').trim();
      if (!code) return false;
      return write(STUDENT_KEY, code);
    },
    logout: function () {
      try { localStorage.removeItem(STUDENT_KEY); } catch (e) {}
    },

    addAttempt: function (a) {
      var list = read(userKey('attempts'), []);
      a.date = a.date || new Date().toISOString();
      list.push(a);
      write(userKey('attempts'), list);
      return a;
    },
    getAttempts: function (levelId) {
      var list = read(userKey('attempts'), []);
      return levelId ? list.filter(function (a) { return a.levelId === levelId; }) : list;
    },

    getMistakes: function () { return read(userKey('mistakes'), {}); },
    setMistakes: function (m) { return write(userKey('mistakes'), m); },
    getMistakeIds: function () { return Object.keys(read(userKey('mistakes'), {})); },

    // 每一題的作答紀錄（每答一題就存，中途離開也算）。第一次讀取時把舊的 attempts 轉進來。
    getAnswerLog: function () {
      var key = userKey('answers'), flag = userKey('answers_v2');
      var log = read(key, []);
      if (!read(flag, false)) {
        var legacy = [];
        read(userKey('attempts'), []).forEach(function (a) {
          var ts = Date.parse(a.date) || 0;
          (a.answers || []).forEach(function (r) {
            legacy.push({ qid: r.qid, correct: !!r.correct, ts: ts, choice: r.choice, src: 'legacy' });
          });
        });
        log = legacy.concat(log);
        write(key, log);
        write(flag, true);
      }
      return log;
    },
    getSrs: function () { return read(userKey('srs'), {}); },

    // 作答一題：寫入紀錄、更新錯題庫與複習日期。
    // 錯題庫規則：答錯 → 加入（或歸 0），隔天到期；答對且在錯題庫 → +1（第 1 次 3 天後到期），
    // 連續答對 2 次移出並排 7 天後的「畢業檢查」；畢業檢查答對 → 完全畢業，答錯 → 重新進錯題庫。
    // meta（選填）：{ choice, src, dailyDate }，src 'daily' 代表每日挑戰，dailyDate 是該挑戰的日期。
    // 回傳 { inMistakes, streak, cleared, added, graduated }，讓畫面決定要顯示什麼。
    recordAnswer: function (qid, correct, meta) {
      meta = meta || {};
      var now = window.Store.now(), today = dateStr(now);
      var log = window.Store.getAnswerLog();
      var entry = { qid: qid, correct: !!correct, ts: now.getTime() };
      if (meta.choice !== undefined) entry.choice = meta.choice;
      if (meta.src) entry.src = meta.src;
      if (meta.dailyDate) entry.dailyDate = meta.dailyDate;   // 每日挑戰開始那天（跨午夜仍算那天）
      log.push(entry);
      write(userKey('answers'), log);

      var m = read(userKey('mistakes'), {});
      var srs = read(userKey('srs'), {});
      var hadAny = Object.keys(m).length > 0;
      var wasIn = Object.prototype.hasOwnProperty.call(m, qid);
      var res;
      if (!correct) {
        m[qid] = 0;
        srs[qid] = { kind: 'mistake', due: addDays(today, 1) };
        res = { inMistakes: true, streak: 0, cleared: false, added: !wasIn, graduated: false };
      } else if (wasIn) {
        m[qid] += 1;
        if (m[qid] >= window.Store.MISTAKE_CLEAR_STREAK) {
          delete m[qid];
          srs[qid] = { kind: 'grad', due: addDays(today, 7) };
          res = { inMistakes: false, streak: 0, cleared: true, added: false, graduated: false };
        } else {
          srs[qid] = { kind: 'mistake', due: addDays(today, 3) };
          res = { inMistakes: true, streak: m[qid], cleared: false, added: false, graduated: false };
        }
      } else if (srs[qid] && srs[qid].kind === 'grad') {
        delete srs[qid];
        res = { inMistakes: false, streak: 0, cleared: false, added: false, graduated: true };
      } else {
        res = { inMistakes: false, streak: 0, cleared: false, added: false, graduated: false };
      }
      write(userKey('mistakes'), m);
      write(userKey('srs'), srs);
      if (hadAny && !Object.keys(m).length) window.Store.setDoc('cleanedUp', true);
      return res;
    },
    // ---- 儲存後端 ----
    getBackend: function () { return backend; },
    // b = { name, onWrite(student, name, value), onReset(student) }（都選填）
    setBackend: function (b) { backend = b || { name: 'local' }; },
    // 套用從雲端讀到的紀錄（合併進本機，不會再通知後端）
    applyRemote: function (rec) {
      muted = true;
      try { return mergeRecord(rec); } finally { muted = false; }
    },

    // ---- 訪客紀錄匯入帳號（登入後，同一台裝置上才有）----
    // 本機有哪些學生代號有紀錄（例如 'guest'）
    listLocalStudents: function () {
      var seen = {}, pre = PREFIX + 'u:';
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i), m = k && k.indexOf(pre) === 0 && k.slice(pre.length).match(/^([^:]+):/);
        if (m) seen[m[1]] = true;
      }
      return Object.keys(seen);
    },
    // 這個本機代號的紀錄還沒匯入過、而且真的有作答／練習紀錄 → 值得問使用者要不要匯入
    hasImportable: function (from) {
      from = from || 'guest';
      if (from === window.Store.getStudent() || read(PREFIX + 'imported:' + from, null)) return false;
      var rec = readRecord(from);
      return rec.answers.length > 0 || rec.attempts.length > 0;
    },
    // 把本機 from（預設 'guest'）的紀錄合併進目前使用者；不會刪掉原本的訪客紀錄（opts.removeSource 才刪）。
    importLocalRecord: function (from, opts) {
      from = from || 'guest'; opts = opts || {};
      if (from === userCode()) throw new Error('不能匯入自己的紀錄');
      var res = mergeRecord(readRecord(from));
      write(PREFIX + 'imported:' + from, { to: userCode(), at: window.Store.now().toISOString() });
      if (opts.removeSource) {
        var pre = PREFIX + 'u:' + from + ':', kill = [];
        for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(pre) === 0) kill.push(k); }
        kill.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
      }
      return res;
    },

    // ---- 試玩用：重設、匯出、讀入別人的紀錄 ----
    // 清掉目前使用者的所有紀錄（作答、錯題、每日挑戰、徽章、角色…）和這台裝置的閱讀設定；學生代號保留。
    resetMe: function () {
      var prefix = PREFIX + 'u:' + userCode() + ':', kill = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(prefix) === 0) kill.push(k);
      }
      kill.push(READING_KEY);
      kill.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
      notify('onReset', userCode());
      return kill.length - 1;
    },
    // 把目前使用者的全部紀錄匯出成一個 JSON 物件（含匯出時間、裝置資訊、閱讀設定）。
    exportMe: function () {
      var code = userCode(), prefix = PREFIX + 'u:' + code + ':', docs = {};
      window.Store.getAnswerLog();   // 先把舊 attempts 轉進作答紀錄
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(prefix + 'doc:') === 0) docs[k.slice((prefix + 'doc:').length)] = read(k, null);
      }
      var nav = typeof navigator !== 'undefined' ? navigator : {}, scr = typeof screen !== 'undefined' ? screen : {};
      return {
        format: RECORD_FORMAT, version: 1,
        exportedAt: window.Store.now().toISOString(),
        student: code,
        device: {
          userAgent: nav.userAgent || '', language: nav.language || '',
          screenWidth: scr.width || null, screenHeight: scr.height || null,
          viewportWidth: typeof window.innerWidth === 'number' ? window.innerWidth : null
        },
        readingSettings: read(READING_KEY, null),
        data: {
          attempts: read(prefix + 'attempts', []),
          mistakes: read(prefix + 'mistakes', {}),
          answers: read(prefix + 'answers', []),
          srs: read(prefix + 'srs', {}),
          docs: docs
        }
      };
    },
    // 讀入匯出的紀錄（物件或 JSON 字串），驗證後回傳。只給老師的檢視頁用：不會寫入、不會覆蓋目前使用者。
    importRecord: function (json) {
      var r = typeof json === 'string' ? JSON.parse(json) : json;
      if (!r || r.format !== RECORD_FORMAT || !r.data) throw new Error('不是試玩紀錄檔');
      var d = r.data;
      return {
        format: r.format, version: r.version || 1, exportedAt: r.exportedAt || null,
        student: r.student || '', device: r.device || {}, readingSettings: r.readingSettings || null,
        data: {
          attempts: Array.isArray(d.attempts) ? d.attempts : [],
          mistakes: d.mistakes && typeof d.mistakes === 'object' ? d.mistakes : {},
          answers: Array.isArray(d.answers) ? d.answers : [],
          srs: d.srs && typeof d.srs === 'object' ? d.srs : {},
          docs: d.docs && typeof d.docs === 'object' ? d.docs : {}
        }
      };
    },
    MISTAKE_CLEAR_STREAK: 2,
    MISTAKE_RETEST_SIZE: 10
  };

  // 讀 config.js（BACKEND 切換）。頁面沒有自己載入時，在解析階段補載（所以不用改每一頁的 HTML）。
  if (typeof document !== 'undefined' && !window.APP_CONFIG && document.readyState === 'loading') {
    var cs = document.currentScript, base = cs && cs.src ? cs.src.replace(/store\.js(\?.*)?$/, '') : 'js/';
    document.write('<script src="' + base + 'config.js"><\/script>');
  }
})();
