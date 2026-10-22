/* 題庫讀取與關卡切分。只讀 data/questions.json，不改題目內容。 */
(function () {
  var LEVEL_SIZE = 10;
  var EXCLUDED_SOURCES = ['影片']; // 影片題階段 4 才做
  var URLS = ['data/questions.json', '../data/questions.json'];

  var state = null;

  function fetchFirst(urls) {
    return fetch(urls[0]).then(function (res) {
      if (!res.ok) throw new Error(res.status);
      return res.json();
    }).catch(function (err) {
      if (urls.length > 1) return fetchFirst(urls.slice(1));
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
      for (var i = 0, n = 1; i < list.length; i += LEVEL_SIZE, n++) {
        levels.push({
          id: sub + '-' + n,
          category: list[0].category,
          subcategory: sub,
          index: n,
          questionIds: list.slice(i, i + LEVEL_SIZE).map(function (q) { return q.id; })
        });
      }
    });
    return { questions: questions, byId: byId, levels: levels, subcategories: order };
  }

  function need() {
    if (!state) throw new Error('請先呼叫 Data.load()');
    return state;
  }

  window.Data = {
    LEVEL_SIZE: LEVEL_SIZE,
    load: function () {
      if (state) return Promise.resolve(window.Data);
      return fetchFirst(URLS).then(function (all) {
        state = build(all);
        return window.Data;
      });
    },
    getQuestions: function () { return need().questions; },
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
