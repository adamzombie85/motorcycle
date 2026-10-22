/* 遊戲化邏輯（只做邏輯，不做畫面）。規格見 docs/遊戲化設計.md。
 * 所有資料都經過 Store；日期一律用 Store.now()，測試時可換成假日期。
 * 原則：獎勵努力，不懲罰缺席。 */
(function () {
  var DAILY_SIZE = 5;
  var DAILY_DUE_MISTAKES = 2;   // 每日挑戰最多放幾題「今天到期」的錯題
  var DAILY_DUE_GRAD = 1;       // 最多放幾題「畢業檢查」
  var CHECKIN_ANSWERS = 5;      // 當天累計作答滿幾題算打卡

  /* ---------- 路段（地圖） ---------- */
  var SEGMENTS = [
    { id: 1, key: 'map-1-garage', name: '出發前準備', subs: ['行車檢查', '貨物裝載'] },
    { id: 2, key: 'map-2-city', name: '市區路口', subs: ['路口安全', '轉彎', '注意大型車'] },
    { id: 3, key: 'map-3-road', name: '一般道路', subs: ['行駛中應注意事項', '正確使用燈光'] },
    { id: 4, key: 'map-4-special', name: '特殊路況', subs: ['平交道', '禁止不當行為'] },
    { id: 5, key: 'map-5-goal', name: '終點考場', subs: ['事故預防及處理', '情境題'] }
  ];

  /* ---------- 徽章 ---------- */
  var BADGES = [
    { code: 'first-ride', name: '出發了！', desc: '完成第 1 關' },
    { code: 'perfect', name: '全對達人', desc: '任一關全部答對' },
    { code: 'streak-3', name: '三天不間斷', desc: '連續練習 3 天' },
    { code: 'streak-7', name: '一週騎士', desc: '連續練習 7 天' },
    { code: 'streak-30', name: '月度車神', desc: '連續練習 30 天' },
    { code: 'reverse-20', name: '反向題剋星', desc: '反向題累計答對 20 題' },
    { code: 'clean-up', name: '錯題清道夫', desc: '錯題庫從有題目清到 0 題' },
    { code: 'sign-30', name: '看圖高手', desc: '有圖題累計答對 30 題' },
    { code: 'region', name: '路段制霸', desc: '任一路段的關卡全部過關' },
    { code: 'q-100', name: '百題里程', desc: '累計作答 100 題' },
    { code: 'q-500', name: '五百題里程', desc: '累計作答 500 題' },
    { code: 'daily-7', name: '挑戰常客', desc: '完成每日挑戰 7 次（不用連續）' }
  ];

  /* ---------- 角色 ---------- */
  var AVATARS = [
    { id: 'rider-1', badge: null }, { id: 'rider-2', badge: null },
    { id: 'rider-3', badge: null }, { id: 'rider-4', badge: null },
    { id: 'rider-5', badge: 'streak-7' }, { id: 'rider-6', badge: 'streak-30' }
  ];

  function dataReady() { return Data.getQuestions(); }

  /* ---------- 每日 3 分鐘挑戰 ---------- */
  function answeredIds() {
    var set = {};
    Store.getAnswerLog().forEach(function (r) { set[r.qid] = true; });
    return set;
  }

  function pickNewQuestions(need, exclude) {
    var latest = Stats.latestByQuestion(), answered = answeredIds();
    var subStats = Stats.bySubcategory();
    var subs = Data.getSubcategories();
    // 練過的小類依答對率由低到高；還沒練過的排在後面（照題庫順序）
    var practiced = subs.filter(function (s) { return subStats[s]; })
      .sort(function (a, b) { return subStats[a].rate - subStats[b].rate; });
    var order = practiced.concat(subs.filter(function (s) { return !subStats[s]; }));
    var byId = Data.getQuestions();
    var picked = [];
    function take(list) {
      list.forEach(function (q) {
        if (picked.length < need && !exclude[q.id]) { picked.push(q.id); exclude[q.id] = true; }
      });
    }
    var inSub = function (s) { return byId.filter(function (q) { return q.subcategory === s; }); };
    // 1) 最低答對率小類裡還沒作答過的題目（依序往下一個小類補）
    for (var i = 0; i < order.length && picked.length < need; i++) {
      take(inSub(order[i]).filter(function (q) { return !answered[q.id]; }));
    }
    // 2) 全部做過了：從答錯過的題目挑
    for (var j = 0; j < order.length && picked.length < need; j++) {
      take(inSub(order[j]).filter(function (q) { return latest[q.id] === false; }));
    }
    // 3) 還是不夠：任何題目
    take(byId);
    return picked;
  }

  function dueIds(kind, limit, today) {
    var srs = Store.getSrs(), m = Store.getMistakes();
    return Object.keys(srs).filter(function (id) {
      var e = srs[id];
      if (e.kind !== kind || e.due > today || !Data.getQuestion(id)) return false;
      return kind === 'grad' ? true : Object.prototype.hasOwnProperty.call(m, id);
    }).sort(function (a, b) { return srs[a].due < srs[b].due ? -1 : srs[a].due > srs[b].due ? 1 : 0; })
      .slice(0, limit);
  }

  function dailyDoneIds(date, ids) {
    var done = {};
    Store.getAnswerLog().forEach(function (r) {
      if (r.src === 'daily' && Store.dateStr(r.ts) === date) done[r.qid] = true;
    });
    return ids.filter(function (id) { return done[id]; });
  }

  function getDaily() {
    dataReady();
    var today = Store.today();
    var all = Store.getDoc('daily', {});
    if (!all[today]) {
      var ids = [], seen = {};
      dueIds('mistake', DAILY_DUE_MISTAKES, today).forEach(function (id) { ids.push(id); seen[id] = true; });
      dueIds('grad', DAILY_DUE_GRAD, today).forEach(function (id) {
        if (!seen[id]) { ids.push(id); seen[id] = true; }
      });
      pickNewQuestions(DAILY_SIZE - ids.length, seen).forEach(function (id) { ids.push(id); });
      all[today] = ids.slice(0, DAILY_SIZE);
      Store.setDoc('daily', all);
    }
    var ids2 = all[today];
    var done = dailyDoneIds(today, ids2);
    return {
      date: today,
      ids: ids2,
      done: done,
      remaining: ids2.filter(function (id) { return done.indexOf(id) === -1; }),
      completed: done.length === ids2.length && ids2.length > 0
    };
  }

  // 每日挑戰作答（會標記 src='daily'，用來判斷當天挑戰完成）
  function dailyAnswer(qid, correct, choice) {
    var res = Store.recordAnswer(qid, correct, { choice: choice, src: 'daily' });
    return { result: res, daily: getDaily() };
  }

  function completedDailyDates() {
    var all = Store.getDoc('daily', {}), done = {};
    Store.getAnswerLog().forEach(function (r) {
      if (r.src === 'daily') {
        var d = Store.dateStr(r.ts);
        (done[d] = done[d] || {})[r.qid] = true;
      }
    });
    return Object.keys(all).filter(function (d) {
      return all[d].length && all[d].every(function (id) { return done[d] && done[d][id]; });
    });
  }

  /* ---------- 連續天數＋休息卡 ---------- */
  function checkedDays() {
    var counts = {}, checked = {};
    Store.getAnswerLog().forEach(function (r) {
      var d = Store.dateStr(r.ts);
      counts[d] = (counts[d] || 0) + 1;
    });
    Object.keys(counts).forEach(function (d) { if (counts[d] >= CHECKIN_ANSWERS) checked[d] = true; });
    completedDailyDates().forEach(function (d) { checked[d] = true; });
    return checked;
  }

  function getStreak() {
    var today = Store.today();
    var checked = checkedDays();
    var days = Object.keys(checked).filter(function (d) { return d <= today; }).sort();
    var status = {}, usedWeeks = {};
    var streak = 0, best = 0, resets = 0, lastReset = null;
    if (days.length) {
      for (var d = days[0]; d < today; d = Store.addDays(d, 1)) {
        if (checked[d]) { streak++; status[d] = 'checked'; }
        else if (streak > 0) {
          var wk = Store.weekStart(d);
          if (!usedWeeks[wk]) { usedWeeks[wk] = true; status[d] = 'rest'; }
          else { streak = 0; resets++; lastReset = d; status[d] = 'missed'; }
        } else status[d] = 'missed';
        if (streak > best) best = streak;
      }
      if (checked[today]) { streak++; status[today] = 'checked'; if (streak > best) best = streak; }
    }
    if (!status[today]) status[today] = checked[today] ? 'checked' : 'today';

    var start = Store.weekStart(today), week = [];
    for (var i = 0; i < 7; i++) {
      var day = Store.addDays(start, i);
      var st = day > today ? 'future' : (status[day] || 'missed');
      week.push({ date: day, status: st, isToday: day === today });
    }
    return {
      current: streak,
      best: best,
      checkedToday: !!checked[today],
      restCardAvailable: !usedWeeks[start],      // 本週的休息卡還在不在
      restarted: resets > 0 && streak <= 1,      // 畫面可顯示「新的開始！今天是第 1 天」
      week: week
    };
  }

  /* ---------- 間隔複習 ---------- */
  function getDueMistakes() { return dueIds('mistake', 9999, Store.today()); }
  function getDueGraduation() { return dueIds('grad', 9999, Store.today()); }

  /* ---------- 地圖 ---------- */
  function getMap() {
    dataReady();
    var best = Stats.bestScores();
    var levels = Data.getLevels();
    var segs = SEGMENTS.map(function (seg) {
      var list = [];
      seg.subs.forEach(function (key) {
        levels.forEach(function (l) {
          if (l.subcategory.indexOf(key) === 0) {
            var b = best[l.id];
            list.push({
              id: l.id, subcategory: l.subcategory, index: l.index, best: b === undefined ? null : b,
              state: b === undefined ? 'untouched' : b >= Stats.PASS_SCORE ? 'passed' : 'practiced'
            });
          }
        });
      });
      return {
        id: seg.id, key: seg.key, name: seg.name, levels: list,
        passedCount: list.filter(function (x) { return x.state === 'passed'; }).length,
        allPassed: list.length > 0 && list.every(function (x) { return x.state === 'passed'; })
      };
    });
    var attempts = Store.getAttempts().filter(function (a) { return a.mode !== 'mistakes'; });
    var last = attempts.length ? attempts[attempts.length - 1].levelId : null;
    return { segments: segs, currentLevelId: last };
  }

  /* ---------- 徽章 ---------- */
  function stats() {
    var log = Store.getAnswerLog(), attempts = Store.getAttempts().filter(function (a) { return a.mode !== 'mistakes'; });
    var correctIds = {};
    log.forEach(function (r) { if (r.correct) correctIds[r.qid] = true; });
    var reverse = 0, sign = 0;
    Object.keys(correctIds).forEach(function (id) {
      var q = Data.getQuestion(id);
      if (!q) return;
      if (q.tags.indexOf('反向題') !== -1) reverse++;
      if (q.image) sign++;
    });
    return {
      answers: log.length, attempts: attempts, reverse: reverse, sign: sign,
      dailyDone: completedDailyDates().length, streakBest: getStreak().best,
      cleanedUp: !!Store.getDoc('cleanedUp', false),
      region: getMap().segments.some(function (s) { return s.allPassed; })
    };
  }

  function earnedMap() { return Store.getDoc('badges', {}); }

  function checkBadges() {
    dataReady();
    var s = stats(), have = earnedMap(), fresh = [], today = Store.today();
    var ok = {
      'first-ride': s.attempts.length >= 1,
      'perfect': s.attempts.some(function (a) { return a.score === 100; }),
      'streak-3': s.streakBest >= 3,
      'streak-7': s.streakBest >= 7,
      'streak-30': s.streakBest >= 30,
      'reverse-20': s.reverse >= 20,
      'clean-up': s.cleanedUp,
      'sign-30': s.sign >= 30,
      'region': s.region,
      'q-100': s.answers >= 100,
      'q-500': s.answers >= 500,
      'daily-7': s.dailyDone >= 7
    };
    BADGES.forEach(function (b) {
      if (ok[b.code] && !have[b.code]) { have[b.code] = today; fresh.push(b.code); }
    });
    if (fresh.length) Store.setDoc('badges', have);
    return fresh;   // 這次新取得的徽章（只會增加，不會收回）
  }

  function getBadges() {
    var have = earnedMap();
    return BADGES.map(function (b) {
      return { code: b.code, name: b.name, desc: b.desc, earned: !!have[b.code], date: have[b.code] || null };
    });
  }

  /* ---------- 角色 ---------- */
  function getAvatars() {
    var have = earnedMap();
    return AVATARS.map(function (a) {
      return { id: a.id, unlockBadge: a.badge, unlocked: !a.badge || !!have[a.badge] };
    });
  }
  function getAvatar() {
    var id = Store.getDoc('avatar', 'rider-1');
    var a = getAvatars().filter(function (x) { return x.id === id; })[0];
    return a && a.unlocked ? id : 'rider-1';
  }
  function setAvatar(id) {
    var a = getAvatars().filter(function (x) { return x.id === id; })[0];
    if (!a || !a.unlocked) return false;
    return Store.setDoc('avatar', id);
  }

  window.Game = {
    DAILY_SIZE: DAILY_SIZE, CHECKIN_ANSWERS: CHECKIN_ANSWERS,
    SEGMENTS: SEGMENTS, BADGES: BADGES, AVATARS: AVATARS,
    getDaily: getDaily, dailyAnswer: dailyAnswer,
    getStreak: getStreak,
    getDueMistakes: getDueMistakes, getDueGraduation: getDueGraduation,
    getMap: getMap,
    checkBadges: checkBadges, getBadges: getBadges,
    getAvatars: getAvatars, getAvatar: getAvatar, setAvatar: setAvatar
  };
})();
