/* 題庫讀取與關卡切分。只讀 data/questions.json，不改題目內容。 */
(function () {
  var LEVEL_SIZE = 10;
  var MIN_LAST_LEVEL = 5; // 最後一關少於 5 題，併進前一關
  var EXCLUDED_SOURCES = ['影片']; // 影片題階段 4 才做
  // 題庫更新時改這個版本號，瀏覽器才不會繼續用舊的快取（Claude 會在 STATUS.md 提醒）
  var DATA_VERSION = '2026-10-22';
  var PREFIXES = ['../', '']; // 頁面在 site/ 裡，資料在上一層；找不到再試同層

  var state = null;
  var base = ''; // 資料檔所在的相對前綴，圖片路徑也用它

  function fetchFirst(prefixes) {
    return fetch(prefixes[0] + 'data/questions.json?v=' + DATA_VERSION).then(function (res) {
      if (!res.ok) throw new Error(res.status);
      base = prefixes[0];
      return res.json();
    }).catch(function (err) {
      if (prefixes.length > 1) return fetchFirst(prefixes.slice(1));
      throw err;
    });
  }

  function build(all) {
    var questions = all.filter(function (q) {
      return EXCLUDED_SOURCES.indexOf(q.source) === -1;
    });
    var byId = {};
    var groups = {};   // 小類 -> 題目（保持題庫原順序）
    var order = [];
    questions.forEach(function (q) {
      byId[q.id] = q;
      if (!groups[q.subcategory]) { groups[q.subcategory] = []; order.push(q.subcategory); }
      groups[q.subcategory].push(q);
    });
    var levels = [];
    order.forEach(function (sub) {
      var list = groups[sub];
      var chunks = [];
      for (var i = 0; i < list.length; i += LEVEL_SIZE) chunks.push(list.slice(i, i + LEVEL_SIZE));
      if (chunks.length > 1 && chunks[chunks.length - 1].length < MIN_LAST_LEVEL) {
        var tail = chunks.pop();
        chunks[chunks.length - 1] = chunks[chunks.length - 1].concat(tail);
      }
      chunks.forEach(function (c, k) {
        levels.push({
          id: sub + '-' + (k + 1),
          category: c[0].category,
          subcategory: sub,
          index: k + 1,
          questionIds: c.map(function (q) { return q.id; })
        });
      });
    });
    return { questions: questions, all: all, byId: byId, levels: levels, subcategories: order };
  }

  function need() {
    if (!state) throw new Error('請先呼叫 Data.load()');
    return state;
  }

  window.Data = {
    LEVEL_SIZE: LEVEL_SIZE,
    load: function () {
      if (state) return Promise.resolve(window.Data);
      return fetchFirst(PREFIXES).then(function (all) {
        state = build(all);
        return window.Data;
      });
    },
    // 題目圖片的可用網址（依資料檔位置換算）
    assetUrl: function (path) { return path ? base + path : null; },
    getQuestions: function () { return need().questions; },
    // 含影片題的完整題庫（階段 4 的模擬考用；平常練習仍用 getQuestions，不含影片題）
    getAllQuestions: function () { return need().all; },
    getQuestion: function (id) { return need().byId[id] || null; },
    getLevels: function () { return need().levels; },
    getLevel: function (levelId) {
      var l = need().levels.filter(function (x) { return x.id === levelId; })[0];
      return l || null;
    },
    getLevelQuestions: function (levelId) {
      var d = need(), l = this.getLevel(levelId);
      return l ? l.questionIds.map(function (id) { return d.byId[id]; }) : [];
    },
    getSubcategories: function () { return need().subcategories.slice(); },
    getCategories: function () {
      var seen = [];
      need().questions.forEach(function (q) { if (seen.indexOf(q.category) === -1) seen.push(q.category); });
      return seen;
    }
  };
})();
