/* 遊戲化邏輯（只做邏輯，不做畫面）。規格見 docs/遊戲化設計.md。
 * 所有資料都經過 Store；日期一律用 Store.now()，測試時可換成假日期。
 * 原則：獎勵努力，不懲罰缺席。 */
(function () {
  var DAILY_SIZE = 5;
  var DAILY_DUE_MISTAKES = 2;   // 每日挑戰最多放幾題「今天到期」的錯題
  var DAILY_DUE_GRAD = 1;       // 最多放幾題「畢業檢查」
  var DAILY_MAX_VIDEO = 1;      // 每日挑戰最多放幾題影片題（影片比較吃流量）
  var CHECKIN_ANSWERS = 5;      // 當天累計作答滿幾題算打卡

  /* ---------- 路段（地圖） ---------- */
  var SEGMENTS = [
    { id: 1, key: 'map-1-garage', name: '出發前準備', subs: ['行車檢查', '貨物裝載'] },
    { id: 2, key: 'map-2-city', name: '市區路口', subs: ['路口安全', '轉彎', '注意大型車'] },
    { id: 3, key: 'map-3-road', name: '一般道路', subs: ['行駛中應注意事項', '正確使用燈光'] },
    { id: 4, key: 'map-4-special', name: '特殊路況', subs: ['平交道', '禁止不當行為'] },
    { id: 5, key: 'map-5-goal', name: '終點考場', subs: ['事故預防及處理', '情境題', '影片題'] }
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

  function pickNewQuestions(need, exclude, videoLeft) {
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
        if (picked.length >= need || exclude[q.id]) return;
        if (q.video) { if (videoLeft <= 0) return; videoLeft--; }   // 影片題一天最多 DAILY_MAX_VIDEO 題
        picked.push(q.id); exclude[q.id] = true;
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
      if (r.src === 'daily' && (r.dailyDate || Store.dateStr(r.ts)) === date) done[r.qid] = true;
    });
    return ids.filter(function (id) { return done[id]; });
  }

  // 跨午夜：23:58 開始的挑戰，過了 00:00 繼續作答仍算開始那天。
  // 最近一次每日挑戰作答的 2 小時內、且那天的挑戰還沒做完，getDaily() 就繼續回傳那一天。
  var DAILY_RESUME_MS = 2 * 60 * 60 * 1000;

  function activeDailyDate(today, all) {
    var a = Store.getDoc('dailyActive', null);
    if (a && a.date < today && all[a.date] && Store.now().getTime() - a.ts <= DAILY_RESUME_MS &&
        dailyDoneIds(a.date, all[a.date]).length < all[a.date].length) return a.date;
    return today;
  }

  // date（選填）：指定要接續的挑戰日期（需已存在且不是未來）；不給就自動判斷
  function getDaily(date) {
    dataReady();
    var today = Store.today();
    var all = Store.getDoc('daily', {});
    var day = date && date <= today && all[date] ? date : activeDailyDate(today, all);
    if (!all[day]) {
      var ids = [], seen = {}, videoLeft = DAILY_MAX_VIDEO;
      function addDue(id) {
        if (seen[id]) return;
        var q = Data.getQuestion(id);
        if (q && q.video) { if (videoLeft <= 0) return; videoLeft--; }
        ids.push(id); seen[id] = true;
      }
      dueIds('mistake', DAILY_DUE_MISTAKES, day).forEach(addDue);
      dueIds('grad', DAILY_DUE_GRAD, day).forEach(addDue);
      pickNewQuestions(DAILY_SIZE - ids.length, seen, videoLeft).forEach(function (id) { ids.push(id); });
      all[day] = ids.slice(0, DAILY_SIZE);
      Store.setDoc('daily', all);
    }
    var ids2 = all[day];
    var done = dailyDoneIds(day, ids2);
    return {
      date: day,
      ids: ids2,
      done: done,
      remaining: ids2.filter(function (id) { return done.indexOf(id) === -1; }),
      completed: done.length === ids2.length && ids2.length > 0
    };
  }

  // 每日挑戰作答（會標記 src='daily' 和挑戰日期，用來判斷當天挑戰完成）
  function dailyAnswer(qid, correct, choice, date) {
    var day = getDaily(date).date;
    var res = Store.recordAnswer(qid, correct, { choice: choice, src: 'daily', dailyDate: day });
    Store.setDoc('dailyActive', { date: day, ts: Store.now().getTime() });
    return { result: res, daily: getDaily(day) };
  }

  function completedDailyDates() {
    var all = Store.getDoc('daily', {}), done = {};
    Store.getAnswerLog().forEach(function (r) {
      if (r.src === 'daily') {
        var d = r.dailyDate || Store.dateStr(r.ts);
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
    var first = null;   // 學生第一次作答的日子
    Store.getAnswerLog().forEach(function (r) { var d = Store.dateStr(r.ts); if (!first || d < first) first = d; });
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
      var st = day > today ? 'future'
        : (!first || day < first) ? (day === today ? 'today' : 'before')   // 還沒開始練習的日子
        : (status[day] || 'missed');
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

  /* ---------- 試玩重點（老師檢視頁用，吃 Store.exportMe()/importRecord() 的紀錄）---------- */
  // 預設值要和 settings.js 的 DEFAULT_SETTINGS 一致
  var READING_DEFAULTS = { fontSize: 'standard', zhuyin: false, speechAuto: false, speechRate: 'normal', reverseAlert: true, soundEffects: true, animation: true, confirmAnswer: false };
  var FONT_LABEL = { large: '大', xlarge: '特大' }, RATE_LABEL = { slow: '慢', fast: '快' };

  function readingSummary(rs) {
    var items = [];
    if (rs) {
      if (rs.fontSize && rs.fontSize !== READING_DEFAULTS.fontSize) items.push('字級：' + (FONT_LABEL[rs.fontSize] || rs.fontSize));
      if (rs.zhuyin) items.push('注音');
      if (rs.speechAuto) items.push('自動朗讀');
      if (rs.speechRate && rs.speechRate !== READING_DEFAULTS.speechRate) items.push('朗讀語速：' + (RATE_LABEL[rs.speechRate] || rs.speechRate));
      if (rs.confirmAnswer) items.push('作答二次確認');
      if (rs.reverseAlert === false) items.push('關閉反向題提醒');
      if (rs.soundEffects === false) items.push('關閉音效');
      if (rs.animation === false) items.push('關閉動效');
    }
    return { used: items.length > 0, items: items };
  }

  function summary(record) {
    dataReady();
    var d = (record && record.data) || {};
    var log = d.answers || [], attempts = d.attempts || [], docs = d.docs || {};
    var correct = log.filter(function (r) { return r.correct; }).length;
    // 用了多少時間：各次練習的秒數加總（每次練習結算時才記秒數）
    var seconds = attempts.reduce(function (n, a) { return n + (a.seconds || 0); }, 0);
    var days = {};
    log.forEach(function (r) { days[Store.dateStr(r.ts)] = true; });
    // 做了哪些關卡
    var lv = {};
    attempts.filter(function (a) { return a.mode !== 'mistakes'; }).forEach(function (a) {
      var e = lv[a.levelId] || (lv[a.levelId] = { levelId: a.levelId, tries: 0, best: 0, last: 0 });
      e.tries++; e.best = Math.max(e.best, a.score || 0); e.last = a.score || 0;
    });
    // 錯在哪些題（答錯次數多的在前）
    var wrong = {};
    log.forEach(function (r) { if (!r.correct) wrong[r.qid] = (wrong[r.qid] || 0) + 1; });
    var wrongList = Object.keys(wrong).map(function (id) {
      var q = Data.getQuestion(id);
      return { qid: id, wrong: wrong[id], subcategory: q ? q.subcategory : null, question: q ? q.question : null, inMistakes: Object.prototype.hasOwnProperty.call(d.mistakes || {}, id) };
    }).sort(function (a, b) { return b.wrong - a.wrong || (a.qid < b.qid ? -1 : 1); });
    var earned = docs.badges || {};
    return {
      student: record && record.student || '',
      exportedAt: record && record.exportedAt || null,
      device: record && record.device || {},
      totalAnswers: log.length,
      correctAnswers: correct,
      accuracy: log.length ? Math.round(correct / log.length * 1000) / 10 : 0,   // %
      seconds: seconds,
      activeDays: Object.keys(days).length,
      dailyAnswers: log.filter(function (r) { return r.src === 'daily'; }).length,
      levels: Object.keys(lv).map(function (k) { return lv[k]; }),
      wrongQuestions: wrongList,
      mistakesNow: Object.keys(d.mistakes || {}).length,
      badges: BADGES.filter(function (b) { return earned[b.code]; }).map(function (b) { return { code: b.code, name: b.name, date: earned[b.code] }; }),
      reading: readingSummary(record && record.readingSettings)
    };
  }

  /* ---------- 闖關路線與解鎖規則 ---------- */
  function getRouteLevels() {
    dataReady();
    var levels = Data.getLevels();
    var list = [];
    SEGMENTS.forEach(function (seg) {
      seg.subs.forEach(function (key) {
        levels.forEach(function (l) {
          if (l.subcategory.indexOf(key) === 0) {
            list.push(l);
          }
        });
      });
    });
    return list;
  }

  function isLevelDone(levelId) {
    dataReady();
    var lvl = Data.getLevel(levelId);
    if (!lvl) return false;
    if (!Store.getStudent()) return false;
    // 1. 已有該關的完成紀錄（attempts 包含舊紀錄）
    var attempts = Store.getAttempts(levelId).filter(function (a) { return a.mode !== 'mistakes'; });
    if (attempts.length > 0) return true;
    // 2. 作答紀錄中，該關每一題都至少作答過一次（關卡模式）
    var qids = lvl.questionIds || [];
    if (!qids.length) return false;
    var answered = {};
    Store.getAnswerLog().forEach(function (r) {
      if (r.src === 'level' || r.src === 'legacy' || !r.src) {
        answered[r.qid] = true;
      }
    });
    return qids.every(function (qid) { return !!answered[qid]; });
  }

  function isUnlocked(levelId) {
    var route = getRouteLevels();
    var idx = -1;
    for (var i = 0; i < route.length; i++) {
      if (route[i].id === levelId) { idx = i; break; }
    }
    if (idx === -1) return false;
    // 第 1 站一開始就開
    if (idx === 0) return true;
    // 舊紀錄裡做完的關卡，自動算解鎖
    if (isLevelDone(levelId)) return true;
    // 上一站做完就打開下一站
    return isLevelDone(route[idx - 1].id);
  }

  function nextStation(levelId) {
    var route = getRouteLevels();
    var target = null;
    if (levelId) {
      for (var i = 0; i < route.length; i++) {
        if (route[i].id === levelId) {
          target = (i + 1 < route.length) ? route[i + 1] : null;
          break;
        }
      }
    } else {
      for (var j = 0; j < route.length; j++) {
        if (!isLevelDone(route[j].id)) {
          target = route[j];
          break;
        }
      }
    }
    if (!target) return null;
    return {
      id: target.id,
      category: target.category,
      subcategory: target.subcategory,
      index: target.index,
      questionIds: target.questionIds,
      toString: function () { return this.id; },
      valueOf: function () { return this.id; }
    };
  }

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
            var unlocked = isUnlocked(l.id);
            var done = isLevelDone(l.id);
            list.push({
              id: l.id, subcategory: l.subcategory, index: l.index, best: b === undefined ? null : b,
              state: b === undefined ? 'untouched' : b >= Stats.PASS_SCORE ? 'passed' : 'practiced',
              unlocked: unlocked,
              done: done
            });
          }
        });
      });
      var allDone = list.length > 0 && list.every(function (x) { return x.done; });
      return {
        id: seg.id, key: seg.key, name: seg.name, levels: list,
        passedCount: list.filter(function (x) { return x.state === 'passed'; }).length,
        allPassed: list.length > 0 && list.every(function (x) { return x.state === 'passed'; }),
        doneCount: list.filter(function (x) { return x.done; }).length,
        allDone: allDone,
        unlocked: (seg.id === 1) || list.some(function (x) { return x.unlocked; })
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
    isUnlocked: isUnlocked, nextStation: nextStation,
    checkBadges: checkBadges, getBadges: getBadges,
    getAvatars: getAvatars, getAvatar: getAvatar, setAvatar: setAvatar,
    summary: summary
  };
})();
