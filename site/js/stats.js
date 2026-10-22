/* 累計答對率等統計（結算頁、首頁、報告共用）。
 * 算法：每一題只看「最近一次」作答結果（關卡練習或錯題重練都算）；
 * 答對率 = 最近一次答對的題數 ÷ 至少作答過一次的題數。 */
(function () {
  var PASS_SCORE = 85;

  function latestByQuestion() {
    var latest = {};
    Store.getAttempts().forEach(function (a) {
      a.answers.forEach(function (r) { latest[r.qid] = r.correct; });
    });
    return latest;
  }

  function tally(keyOf) {
    var latest = latestByQuestion(), out = {};
    Object.keys(latest).forEach(function (qid) {
      var q = Data.getQuestion(qid);
      if (!q) return;
      var k = keyOf(q);
      var t = out[k] || (out[k] = { answered: 0, correct: 0, rate: 0 });
      t.answered++;
      if (latest[qid]) t.correct++;
    });
    Object.keys(out).forEach(function (k) {
      out[k].rate = Math.round(out[k].correct / out[k].answered * 100);
    });
    return out;
  }

  var Stats = window.Stats = {
    PASS_SCORE: PASS_SCORE,
    byCategory: function () { return tally(function (q) { return q.category; }); },
    bySubcategory: function () { return tally(function (q) { return q.subcategory; }); },
    // 每一關的最高分（只算關卡練習，錯題重練不算）
    bestScores: function () {
      var best = {};
      Store.getAttempts().forEach(function (a) {
        if (a.mode === 'mistakes') return;
        if (best[a.levelId] === undefined || a.score > best[a.levelId]) best[a.levelId] = a.score;
      });
      return best;
    },
    levelPassed: function (levelId) {
      var b = Stats.bestScores()[levelId];
      return b !== undefined && b >= PASS_SCORE;
    }
  };
})();
