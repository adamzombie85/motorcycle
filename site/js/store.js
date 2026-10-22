/* 學習紀錄存取。所有讀寫都經過這個檔案；以後換成 GAS 只改這裡。
 * 目前存在 localStorage，依學生代號分開存。
 *
 * attempt = { levelId, date(ISO), answers:[{qid, choice, correct}],
 *             correctCount, total, score, seconds }
 * mistakes = { 題號: 連續答對次數 }
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

  window.Store = {
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

    // 錯題庫規則：答錯 → 加入（或歸 0）；答對且在錯題庫 → +1，連續答對 2 次移出。
    // 回傳 { inMistakes, streak, cleared }，讓畫面決定要顯示什麼。
    recordAnswer: function (qid, correct) {
      var m = read(userKey('mistakes'), {});
      var wasIn = Object.prototype.hasOwnProperty.call(m, qid);
      var res;
      if (!correct) {
        m[qid] = 0;
        res = { inMistakes: true, streak: 0, cleared: false, added: !wasIn };
      } else if (wasIn) {
        m[qid] += 1;
        if (m[qid] >= window.Store.MISTAKE_CLEAR_STREAK) {
          delete m[qid];
          res = { inMistakes: false, streak: 0, cleared: true, added: false };
        } else {
          res = { inMistakes: true, streak: m[qid], cleared: false, added: false };
        }
      } else {
        res = { inMistakes: false, streak: 0, cleared: false, added: false };
      }
      write(userKey('mistakes'), m);
      return res;
    },
    MISTAKE_CLEAR_STREAK: 2,
    MISTAKE_RETEST_SIZE: 10
  };
})();
