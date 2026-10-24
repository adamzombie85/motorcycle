/* 模擬考出題引擎（新制：50 題，其中危險感知 15 題）。只負責「出哪些題」和「怎麼算分」，不管畫面。
 *
 * 出題規則（都在 Exam.CONFIG，可以改）：
 *   - 總題數 total（預設 50）；危險感知 dangerCount 題（預設 15）
 *   - 其餘（total - dangerCount 題）分給「危險感知以外」的各大類，預設照題庫裡各類題數的比例分配
 *     （最大餘數法，加起來剛好等於題數）；也可以用 categoryCounts 直接指定每類題數
 *   - 危險感知從「情境題」和「影片題」出，預設按兩者題數比例分；includeVideo 預設 true（C24 起影片題納入）
 *   - 同一次考試不重複出題；同一支影片也最多出一題
 *   - order：'sections' = 先筆試題、再危險感知（預設）；'mixed' = 全部打散
 *
 * 用法：
 *   var exam = Exam.generate();                    // { ids: [...], plan: {...}, config: {...} }
 *   var exam = Exam.generate({ includeVideo: true, avoid: ['M0001'], seed: 123 });
 *   var result = Exam.grade(exam.ids, { M0001: true, M0002: false });   // { correct, total, score, passed, byCategory }
 */
(function () {
  var CONFIG = {
    total: 50,
    dangerCount: 15,
    dangerCategory: '危險感知',
    includeVideo: true,
    categoryCounts: null,     // 例如 { '正確觀念與態度': 21, '安全駕駛能力': 10, '主動停讓文化': 4 }；null = 照題庫比例
    order: 'sections',
    passScore: 85             // 及格分（滿分 100）
  };

  // 可重複的亂數（測試用）：mulberry32
  function makeRng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  // 最大餘數法：把 total 分給各項，比例 = weights，結果加總剛好 total
  function apportion(total, weights) {
    var keys = Object.keys(weights), sum = keys.reduce(function (n, k) { return n + weights[k]; }, 0);
    var out = {}, used = 0, rem = [];
    keys.forEach(function (k) {
      var exact = sum ? total * weights[k] / sum : 0;
      out[k] = Math.floor(exact); used += out[k];
      rem.push({ k: k, r: exact - out[k], w: weights[k] });
    });
    rem.sort(function (x, y) { return y.r - x.r || y.w - x.w; });
    for (var i = 0; used < total && rem.length; i++, used++) out[rem[i % rem.length].k]++;
    return out;
  }
  function merge(base, over) {
    var o = {};
    Object.keys(base).forEach(function (k) { o[k] = base[k]; });
    Object.keys(over || {}).forEach(function (k) { if (k !== 'rng' && k !== 'seed' && k !== 'avoid' && k !== 'pool') o[k] = over[k]; });
    return o;
  }

  // 從 list 依序挑 n 題：不在 used 裡、同一支影片只挑一題；回傳挑到的題目（可能不足 n 題）
  function pick(list, n, used, videos) {
    var out = [];
    for (var i = 0; i < list.length && out.length < n; i++) {
      var q = list[i];
      if (used[q.id]) continue;
      if (q.video) { if (videos[q.video]) continue; videos[q.video] = true; }
      used[q.id] = true; out.push(q);
    }
    return out;
  }

  /* opts：覆蓋 CONFIG 的任何設定，另外可給 rng（函式）、seed（數字）、avoid（盡量避開的題號，例如上一次考過的）、
   * pool（題目陣列，預設是題庫；includeVideo 時用含影片題的完整題庫） */
  function generate(opts) {
    opts = opts || {};
    var cfg = merge(CONFIG, opts);
    var rng = opts.rng || makeRng(opts.seed === undefined ? Math.floor(Math.random() * 4294967296) : opts.seed);
    var pool = opts.pool || (cfg.includeVideo ? Data.getAllQuestions() : Data.getQuestions());
    var avoid = {};
    (opts.avoid || []).forEach(function (id) { avoid[id] = true; });

    var dangerPool = [], otherByCat = {}, catOrder = [];
    pool.forEach(function (q) {
      if (!cfg.includeVideo && q.source === '影片') return;
      if (q.category === cfg.dangerCategory) dangerPool.push(q);
      else { if (!otherByCat[q.category]) { otherByCat[q.category] = []; catOrder.push(q.category); } otherByCat[q.category].push(q); }
    });

    var dangerN = Math.min(cfg.dangerCount, cfg.total);
    var otherN = cfg.total - dangerN;
    var weights = {};
    catOrder.forEach(function (c) { weights[c] = otherByCat[c].length; });
    var want = cfg.categoryCounts ? cfg.categoryCounts : apportion(otherN, weights);

    var used = {}, videos = {}, plan = { total: cfg.total, danger: { want: dangerN, got: 0, bySource: {} }, categories: {}, shortfall: 0 };
    var chosen = [], sectionOther = [], sectionDanger = [];

    // 一般類別：先挑沒被 avoid 的，不夠再用 avoid 的補
    Object.keys(want).forEach(function (c) {
      var list = shuffle(otherByCat[c] || [], rng);
      var fresh = list.filter(function (q) { return !avoid[q.id]; }), old = list.filter(function (q) { return avoid[q.id]; });
      var got = pick(fresh, want[c], used, videos);
      if (got.length < want[c]) got = got.concat(pick(old, want[c] - got.length, used, videos));
      plan.categories[c] = { want: want[c], got: got.length };
      sectionOther = sectionOther.concat(got);
    });

    // 危險感知：依來源（情境／影片）題數比例分配
    var bySource = {}, srcOrder = [];
    dangerPool.forEach(function (q) { if (!bySource[q.source]) { bySource[q.source] = []; srcOrder.push(q.source); } bySource[q.source].push(q); });
    var srcWeights = {};
    srcOrder.forEach(function (s) { srcWeights[s] = bySource[s].length; });
    var srcWant = apportion(dangerN, srcWeights);
    srcOrder.forEach(function (s) {
      var list = shuffle(bySource[s], rng);
      var fresh = list.filter(function (q) { return !avoid[q.id]; }), old = list.filter(function (q) { return avoid[q.id]; });
      var got = pick(fresh, srcWant[s], used, videos);
      if (got.length < srcWant[s]) got = got.concat(pick(old, srcWant[s] - got.length, used, videos));
      plan.danger.bySource[s] = { want: srcWant[s], got: got.length };
      sectionDanger = sectionDanger.concat(got);
    });

    // 某一類題目不夠（例如影片題同一支只算一題）：從還沒用過的題目補到總題數
    var gotAll = sectionOther.length + sectionDanger.length;
    if (gotAll < cfg.total) {
      var rest = shuffle(pool.filter(function (q) { return cfg.includeVideo || q.source !== '影片'; }), rng);
      var fill = pick(rest.filter(function (q) { return !avoid[q.id]; }), cfg.total - gotAll, used, videos);
      if (fill.length < cfg.total - gotAll) fill = fill.concat(pick(rest, cfg.total - gotAll - fill.length, used, videos));
      fill.forEach(function (q) { (q.category === cfg.dangerCategory ? sectionDanger : sectionOther).push(q); });
      gotAll += fill.length;
    }
    plan.danger.got = sectionDanger.length;
    plan.shortfall = cfg.total - (sectionOther.length + sectionDanger.length);

    if (cfg.order === 'mixed') chosen = shuffle(sectionOther.concat(sectionDanger), rng);
    else chosen = shuffle(sectionOther, rng).concat(shuffle(sectionDanger, rng));
    return { ids: chosen.map(function (q) { return q.id; }), plan: plan, config: cfg };
  }

  // answers：{ 題號: true/false（答對與否） }；沒作答的算答錯
  function grade(ids, answers) {
    var correct = 0, by = {};
    ids.forEach(function (id) {
      var q = Data.getQuestion(id) || (Data.getAllQuestions && Data.getAllQuestions().filter(function (x) { return x.id === id; })[0]);
      var cat = q ? q.category : '?', ok = !!answers[id];
      var b = by[cat] || (by[cat] = { total: 0, correct: 0, rate: 0 });
      b.total++; if (ok) { b.correct++; correct++; }
    });
    Object.keys(by).forEach(function (c) { by[c].rate = Math.round(by[c].correct / by[c].total * 100); });
    var score = ids.length ? Math.round(correct / ids.length * 100) : 0;
    return { correct: correct, total: ids.length, score: score, passed: score >= CONFIG.passScore, byCategory: by };
  }

  window.Exam = { CONFIG: CONFIG, generate: generate, grade: grade, apportion: apportion, makeRng: makeRng };
})();
