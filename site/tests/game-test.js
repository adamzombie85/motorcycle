/* 遊戲化引擎測試：node site/tests/game-test.js（在專案根目錄執行） */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..', '..');
const store = {};
const ctx = {
  fetch: async () => ({ ok: true, json: async () => JSON.parse(fs.readFileSync(path.join(root, 'data/questions.json'), 'utf8')) }),
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
  Promise, JSON, Date, Object, Error, Math, Array, String, Number, setTimeout
};
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['data', 'store', 'stats', 'game']) vm.runInContext(fs.readFileSync(path.join(root, 'site/js/' + f + '.js'), 'utf8'), ctx);
const { Data, Store, Stats, Game } = ctx;

let pass = 0, fail = 0, user = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + '\n      ' + e.message); }
}
function eq(a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((msg || '') + ' 期望 ' + JSON.stringify(b) + '，實際 ' + JSON.stringify(a));
}
function fresh() { Store.setStudent('t' + (++user)); Store.setClock(null); }
// 假日期：2026-10-19 是星期一
function at(date, h) { const p = date.split('-'); Store.setClock(() => new Date(+p[0], +p[1] - 1, +p[2], h === undefined ? 12 : h)); }
let qi = 0;
function qs() { return Data.getQuestions(); }
function answer(date, n, correct) {
  at(date);
  for (let i = 0; i < n; i++) Store.recordAnswer(qs()[(qi++) % qs().length].id, correct !== false);
}

(async () => {
  await Data.load();

  console.log('連續天數與休息卡');
  t('連續 3 天 → 3', () => { fresh(); answer('2026-10-19', 5); answer('2026-10-20', 5); answer('2026-10-21', 5); eq(Game.getStreak().current, 3); });
  t('今天還沒打卡，連續天數不被中斷（先顯示昨天為止）', () => { fresh(); answer('2026-10-19', 5); answer('2026-10-20', 5); at('2026-10-21'); const s = Game.getStreak(); eq(s.current, 2); eq(s.checkedToday, false); });
  t('作答 4 題不算打卡', () => { fresh(); answer('2026-10-19', 4); eq(Game.getStreak().current, 0); });
  t('漏 1 天自動用休息卡，連續天數不中斷', () => { fresh(); answer('2026-10-19', 5); answer('2026-10-21', 5); const s = Game.getStreak(); eq(s.current, 2); eq(s.week.map(d => d.status).slice(0, 3), ['checked', 'rest', 'checked']); eq(s.restCardAvailable, false); });
  t('同一週漏 2 天 → 歸 0，之後重新從 1 開始', () => { fresh(); answer('2026-10-19', 5); answer('2026-10-22', 5); const s = Game.getStreak(); eq(s.current, 1); eq(s.restarted, true); eq(s.week.map(d => d.status).slice(0, 4), ['checked', 'rest', 'missed', 'checked']); });
  t('歸 0 之後的缺席不會把天數變負、也不報錯', () => { fresh(); answer('2026-10-19', 5); at('2026-10-30'); eq(Game.getStreak().current, 0); });
  t('跨週：每週各有 1 張休息卡', () => { fresh(); answer('2026-10-23', 5); /* 週五 */ answer('2026-10-25', 5); /* 週日（週六用卡） */ answer('2026-10-27', 5); /* 下週二（週一用新卡） */ eq(Game.getStreak().current, 3); });
  t('跨週：下週連漏 2 天才歸 0', () => { fresh(); answer('2026-10-25', 5); answer('2026-10-28', 5); /* 週一、週二漏 */ eq(Game.getStreak().current, 1); });
  t('本週 7 天格子：未來的日子是 future', () => { fresh(); answer('2026-10-19', 5); at('2026-10-20'); const w = Game.getStreak().week; eq(w.length, 7); eq(w[0].date, '2026-10-19'); eq(w[1].status, 'today'); eq(w[2].status, 'future'); eq(w[6].date, '2026-10-25'); });
  t('最長連續天數 best 保留', () => { fresh(); answer('2026-10-19', 5); answer('2026-10-20', 5); answer('2026-10-21', 5); answer('2026-10-26', 5); const s = Game.getStreak(); eq(s.best, 3); });

  console.log('打卡格：開始練習之前／漏打卡（ISSUE-05）');
  t('第一次作答之前的日子是 before，不是 missed', () => { fresh(); answer('2026-10-21', 5); at('2026-10-23'); eq(Game.getStreak().week.map(d => d.status), ['before', 'before', 'checked', 'rest', 'today', 'future', 'future']); });
  t('第一次作答之後沒打卡也沒休息卡 → missed', () => { fresh(); answer('2026-10-21', 2); at('2026-10-23'); eq(Game.getStreak().week.map(d => d.status).slice(0, 5), ['before', 'before', 'missed', 'missed', 'today']); });
  t('完全沒作答過：今天之前都是 before，今天是 today', () => { fresh(); at('2026-10-21'); eq(Game.getStreak().week.map(d => d.status).slice(0, 4), ['before', 'before', 'today', 'future']); });

  console.log('每題立即存作答（中途離開也算）');
  t('沒交卷的作答也進答對率', () => { fresh(); at('2026-10-19'); const q = qs()[0]; Store.recordAnswer(q.id, true); Store.recordAnswer(qs()[1].id, false); eq(Stats.byCategory()[q.category].answered >= 1, true); eq(Object.keys(Stats.latestByQuestion()).length, 2); });
  t('舊的 attempts 第一次讀取時轉進作答紀錄', () => { fresh(); Store.addAttempt({ levelId: 'x', date: '2026-10-19T08:00:00.000Z', answers: [{ qid: qs()[0].id, choice: 0, correct: true }, { qid: qs()[1].id, choice: 0, correct: false }], score: 50 }); eq(Store.getAnswerLog().length, 2); eq(Store.getAnswerLog().length, 2, '再讀一次不會重複轉'); });
  t('最近一次答對才算（先錯後對）', () => { fresh(); at('2026-10-19'); const id = qs()[0].id; Store.recordAnswer(id, false); Store.recordAnswer(id, true); eq(Stats.latestByQuestion()[id], true); });

  console.log('間隔複習');
  t('答錯 → 隔天到期', () => { fresh(); const id = qs()[0].id; at('2026-10-19'); Store.recordAnswer(id, false); eq(Game.getDueMistakes(), []); at('2026-10-20'); eq(Game.getDueMistakes(), [id]); });
  t('答對第 1 次 → 3 天後到期', () => { fresh(); const id = qs()[0].id; at('2026-10-19'); Store.recordAnswer(id, false); at('2026-10-20'); Store.recordAnswer(id, true); at('2026-10-22'); eq(Game.getDueMistakes(), []); at('2026-10-23'); eq(Game.getDueMistakes(), [id]); });
  t('答對第 2 次 → 移出，7 天後畢業檢查', () => { fresh(); const id = qs()[0].id; at('2026-10-19'); Store.recordAnswer(id, false); at('2026-10-20'); Store.recordAnswer(id, true); at('2026-10-23'); const r = Store.recordAnswer(id, true); eq(r.cleared, true); eq(Store.getMistakeIds(), []); at('2026-10-29'); eq(Game.getDueGraduation(), []); at('2026-10-30'); eq(Game.getDueGraduation(), [id]); });
  t('畢業檢查答對 → 完全畢業', () => { fresh(); const id = qs()[0].id; at('2026-10-19'); Store.recordAnswer(id, false); Store.recordAnswer(id, true); Store.recordAnswer(id, true); at('2026-10-26'); const r = Store.recordAnswer(id, true); eq(r.graduated, true); eq(Game.getDueGraduation(), []); eq(Store.getMistakeIds(), []); });
  t('畢業檢查答錯 → 重新進錯題庫（隔天到期）', () => { fresh(); const id = qs()[0].id; at('2026-10-19'); Store.recordAnswer(id, false); Store.recordAnswer(id, true); Store.recordAnswer(id, true); at('2026-10-26'); Store.recordAnswer(id, false); eq(Store.getMistakeIds(), [id]); at('2026-10-27'); eq(Game.getDueMistakes(), [id]); eq(Game.getDueGraduation(), []); });

  console.log('每日挑戰');
  t('一組 5 題，重新整理內容不變', () => { fresh(); at('2026-10-19'); const a = Game.getDaily(); eq(a.ids.length, 5); eq(new Set(a.ids).size, 5); eq(Game.getDaily().ids, a.ids); });
  t('隔天換新的一組', () => { fresh(); at('2026-10-19'); const a = Game.getDaily().ids; Game.getDaily().ids.forEach(id => Game.dailyAnswer(id, true, 0)); at('2026-10-20'); const b = Game.getDaily().ids; eq(a.some(id => b.indexOf(id) !== -1), false); });
  t('做一半離開，回來接著做；做完 completed', () => { fresh(); at('2026-10-19'); const d = Game.getDaily(); Game.dailyAnswer(d.ids[0], true, 0); Game.dailyAnswer(d.ids[1], false, 0); const m = Game.getDaily(); eq(m.done.length, 2); eq(m.remaining, d.ids.slice(2)); eq(m.completed, false); d.ids.slice(2).forEach(id => Game.dailyAnswer(id, true, 0)); eq(Game.getDaily().completed, true); });
  t('完成每日挑戰（只答 5 題 daily）也算打卡', () => { fresh(); at('2026-10-19'); Game.getDaily().ids.forEach(id => Game.dailyAnswer(id, true, 0)); eq(Game.getStreak().current, 1); });
  t('今天到期的錯題優先（最多 2 題），畢業檢查最多 1 題', () => { fresh(); at('2026-10-19'); const [a, b, c, g] = [qs()[0].id, qs()[1].id, qs()[2].id, qs()[3].id]; [a, b, c].forEach(id => Store.recordAnswer(id, false)); Store.recordAnswer(g, false); Store.recordAnswer(g, true); Store.recordAnswer(g, true); at('2026-10-26'); const ids = Game.getDaily().ids; eq(ids.slice(0, 2), [a, b]); eq(ids[2], g); eq(ids.length, 5); });
  t('新題從累計答對率最低的小類挑未作答的', () => { fresh(); at('2026-10-19'); const subs = Data.getSubcategories(); const bad = subs[3], good = subs[1]; qs().filter(q => q.subcategory === bad).slice(0, 4).forEach(q => Store.recordAnswer(q.id, false)); qs().filter(q => q.subcategory === good).slice(0, 4).forEach(q => Store.recordAnswer(q.id, true)); at('2026-10-30'); const ids = Game.getDaily().ids; const newOnes = ids.filter(id => Store.getMistakeIds().indexOf(id) === -1); eq(newOnes.length >= 3, true); eq(newOnes.every(id => Data.getQuestion(id).subcategory === bad), true, '新題應該都在答對率最低的小類'); eq(newOnes.every(id => !Store.getAnswerLog().some(r => r.qid === id)), true, '新題應該是還沒作答過的'); });

  t('跨午夜繼續作答仍算開始那天（ISSUE-01）', () => { fresh(); at('2026-10-19', 23); const d = Game.getDaily(); Game.dailyAnswer(d.ids[0], true, 0); Game.dailyAnswer(d.ids[1], true, 0); at('2026-10-20', 0); const m = Game.getDaily(); eq(m.date, '2026-10-19'); eq(m.ids, d.ids); eq(m.done.length, 2); d.ids.slice(2).forEach(id => Game.dailyAnswer(id, true, 0)); const f = Game.getDaily(); eq(f.date, '2026-10-20', '做完後換成新的一天'); eq(f.ids.some(id => d.ids.indexOf(id) !== -1), false); at('2026-10-19', 12); eq(Game.getDaily().completed, true, '19 日挑戰算完成'); at('2026-10-20', 12); eq(Game.getStreak().current, 1); eq(Game.getStreak().week[0].status, 'checked'); });
  t('跨午夜太久（超過 2 小時沒作答）→ 改用新的一天', () => { fresh(); at('2026-10-19', 23); const d = Game.getDaily(); Game.dailyAnswer(d.ids[0], true, 0); at('2026-10-20', 2); eq(Game.getDaily().date, '2026-10-20'); });
  t('也可以明確指定挑戰日期', () => { fresh(); at('2026-10-19', 23); const d = Game.getDaily(); at('2026-10-20', 12); Game.dailyAnswer(d.ids[0], true, 0, '2026-10-19'); eq(Game.getDaily('2026-10-19').done, [d.ids[0]]); eq(Game.getDaily().date, '2026-10-19', '剛作答完，繼續那一天'); at('2026-10-20', 15); eq(Game.getDaily().date, '2026-10-20'); eq(Game.getDaily('2099-01-01').date, '2026-10-20', '未來日期不接受'); });
  t('每日挑戰、題庫與小類都不含影片題（ISSUE-03）', () => { fresh(); eq(qs().some(q => q.source === '影片'), false); eq(Data.getSubcategories().indexOf('影片題'), -1); for (let i = 0; i < 30; i++) { at('2026-11-' + String(1 + i % 28).padStart(2, '0'), 12 + (i >= 28 ? 1 : 0)); Game.getDaily().ids.forEach(id => { eq(Data.getQuestion(id).source === '影片', false, id); Game.dailyAnswer(id, i % 2 === 0, 0); }); } });

  console.log('徽章');
  t('完成第 1 關 → first-ride，只回傳一次', () => { fresh(); at('2026-10-19'); Store.addAttempt({ levelId: 'a', mode: 'level', answers: [], score: 70 }); eq(Game.checkBadges(), ['first-ride']); eq(Game.checkBadges(), []); });
  t('全對 → perfect', () => { fresh(); at('2026-10-19'); Store.addAttempt({ levelId: 'a', mode: 'level', answers: [], score: 100 }); eq(Game.checkBadges().sort(), ['first-ride', 'perfect']); });
  t('連續 3 天 → streak-3', () => { fresh(); answer('2026-10-19', 5); answer('2026-10-20', 5); answer('2026-10-21', 5); eq(Game.checkBadges().indexOf('streak-3') !== -1, true); });
  t('累計作答 100 題 → q-100', () => { fresh(); answer('2026-10-19', 100); eq(Game.checkBadges().indexOf('q-100') !== -1, true); });
  t('錯題庫從有題目清到 0 → clean-up', () => { fresh(); at('2026-10-19'); const id = qs()[0].id; Store.recordAnswer(id, false); eq(Game.checkBadges().indexOf('clean-up'), -1); Store.recordAnswer(id, true); Store.recordAnswer(id, true); eq(Game.checkBadges().indexOf('clean-up') !== -1, true); });
  t('反向題累計答對 20 題 → reverse-20', () => { fresh(); at('2026-10-19'); qs().filter(q => q.tags.indexOf('反向題') !== -1).slice(0, 20).forEach(q => Store.recordAnswer(q.id, true)); eq(Game.checkBadges().indexOf('reverse-20') !== -1, true); });
  t('有圖題累計答對 30 題 → sign-30', () => { fresh(); at('2026-10-19'); qs().filter(q => q.image).slice(0, 30).forEach(q => Store.recordAnswer(q.id, true)); eq(Game.checkBadges().indexOf('sign-30') !== -1, true); });
  t('完成每日挑戰 7 次（不用連續）→ daily-7', () => { fresh(); ['2026-10-19', '2026-10-21', '2026-10-23', '2026-10-25', '2026-10-27', '2026-10-29', '2026-11-03'].forEach(d => { at(d); Game.getDaily().ids.forEach(id => Game.dailyAnswer(id, true, 0)); }); eq(Game.checkBadges().indexOf('daily-7') !== -1, true); });
  t('一個路段的關卡全過關 → region', () => { fresh(); at('2026-10-19'); const seg = Game.getMap().segments[0]; seg.levels.forEach(l => Store.addAttempt({ levelId: l.id, mode: 'level', answers: [], score: 90 })); eq(Game.checkBadges().indexOf('region') !== -1, true); });
  t('徽章只增不減', () => { fresh(); answer('2026-10-19', 5); answer('2026-10-20', 5); answer('2026-10-21', 5); Game.checkBadges(); at('2026-11-30'); eq(Game.getStreak().current, 0); eq(Game.getBadges().find(b => b.code === 'streak-3').earned, true); });
  t('12 個徽章都有定義', () => { eq(Game.getBadges().length, 12); });

  console.log('地圖與角色');
  t('92 關分到 5 個路段、不重複不遺漏', () => { fresh(); const m = Game.getMap(); eq(m.segments.length, 5); const ids = [].concat(...m.segments.map(s => s.levels.map(l => l.id))); eq(ids.length, Data.getLevels().length); eq(ids.length, 92); eq(new Set(ids).size, 92); });
  t('關卡狀態：未練習／已練習／過關；主角停在最近練習的關卡', () => { fresh(); at('2026-10-19'); const m0 = Game.getMap(); const [a, b] = [m0.segments[0].levels[0].id, m0.segments[1].levels[0].id]; Store.addAttempt({ levelId: a, mode: 'level', answers: [], score: 90 }); Store.addAttempt({ levelId: b, mode: 'level', answers: [], score: 60 }); const m = Game.getMap(); eq(m.segments[0].levels[0].state, 'passed'); eq(m.segments[1].levels[0].state, 'practiced'); eq(m.segments[1].levels[0].best, 60); eq(m.segments[2].levels[0].state, 'untouched'); eq(m.currentLevelId, b); });
  t('沒練過 → currentLevelId 為 null', () => { fresh(); eq(Game.getMap().currentLevelId, null); });
  t('錯題重練不影響「最近練習的關卡」', () => { fresh(); const a = Game.getMap().segments[0].levels[0].id; Store.addAttempt({ levelId: a, mode: 'level', answers: [], score: 90 }); Store.addAttempt({ levelId: 'mistakes', mode: 'mistakes', answers: [], score: 100 }); eq(Game.getMap().currentLevelId, a); });
  t('角色：預設 rider-1；4 位開放，2 位要徽章', () => { fresh(); eq(Game.getAvatar(), 'rider-1'); eq(Game.getAvatars().filter(a => a.unlocked).length, 4); eq(Game.setAvatar('rider-5'), false); eq(Game.setAvatar('rider-3'), true); eq(Game.getAvatar(), 'rider-3'); });
  t('取得一週騎士 → rider-5 解鎖', () => { fresh(); ['19', '20', '21', '22', '23', '24', '25'].forEach(d => answer('2026-10-' + d, 5)); Game.checkBadges(); eq(Game.setAvatar('rider-5'), true); eq(Game.getAvatar(), 'rider-5'); eq(Game.setAvatar('rider-6'), false); });
  t('紀錄依學生分開', () => { fresh(); answer('2026-10-19', 5); const u1 = Store.getStudent(); Store.setStudent('other'); eq(Store.getAnswerLog().length, 0); Store.setStudent(u1); eq(Store.getAnswerLog().length, 5); });

  console.log('\n通過 ' + pass + '，失敗 ' + fail);
  process.exit(fail ? 1 : 0);
})();
