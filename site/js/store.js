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
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }
  function userKey(name) {
    var s = window.Store.getStudent();
    if (!s) throw new Error('尚未設定學生代號');
    return PREFIX + 'u:' + s + ':' + name;
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
    MISTAKE_CLEAR_STREAK: 2,
    MISTAKE_RETEST_SIZE: 10
  };
})();
