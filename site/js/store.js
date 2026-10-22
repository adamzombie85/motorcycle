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
    getMistakeIds: function () { return Object.keys(read(userKey('mistakes'), {})); }
  };
})();
