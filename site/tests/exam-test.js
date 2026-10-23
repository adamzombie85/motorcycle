/* 模擬考出題引擎測試：node site/tests/exam-test.js（在專案根目錄執行） */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..', '..');
const ctx = {
  fetch: async () => ({ ok: true, json: async () => JSON.parse(fs.readFileSync(path.join(root, 'data/questions.json'), 'utf8')) }),
  Promise, JSON, Date, Object, Error, Math, Array, String, Number, setTimeout
};
ctx.window = ctx; vm.createContext(ctx);
for (const f of ['data', 'exam']) vm.runInContext(fs.readFileSync(path.join(root, 'site/js/' + f + '.js'), 'utf8'), ctx);
const { Data, Exam } = ctx;
let pass = 0, fail = 0;
function t(name, fn) { try { fn(); pass++; console.log('  ✓ ' + name); } catch (e) { fail++; console.log('  ✗ ' + name + '\n      ' + e.message); } }
function eq(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((msg || '') + ' 期望 ' + JSON.stringify(b) + '，實際 ' + JSON.stringify(a)); }
function count(ids, fn) { return ids.filter(id => fn(Data.getAllQuestions().find(q => q.id === id))).length; }
const danger = q => q.category === '危險感知';

(async () => {
  await Data.load();
  console.log('預設設定（50 題、危險感知 15 題、不含影片）');
  t('50 題，其中危險感知 15 題', () => { const e = Exam.generate({ seed: 1 }); eq(e.ids.length, 50); eq(count(e.ids, danger), 15); eq(e.plan.shortfall, 0); });
  t('其餘三大類照題庫比例：21／10／4', () => { const e = Exam.generate({ seed: 2 }); eq(count(e.ids, q => q.category === '正確觀念與態度'), 21); eq(count(e.ids, q => q.category === '安全駕駛能力'), 10); eq(count(e.ids, q => q.category === '主動停讓文化'), 4); });
  t('預設不出影片題，危險感知全是情境題', () => { const e = Exam.generate({ seed: 3 }); eq(count(e.ids, q => q.source === '影片'), 0); eq(count(e.ids, q => q.source === '情境'), 15); });
  t('同一次考試不重複（跑 300 次）', () => { for (let i = 0; i < 300; i++) { const e = Exam.generate({ seed: i }); eq(new Set(e.ids).size, 50, 'seed ' + i); } });
  t('每次出的題目不一樣', () => { const a = Exam.generate({ seed: 10 }).ids, b = Exam.generate({ seed: 11 }).ids; eq(a.join() === b.join(), false); });
  t('同一個 seed 出一樣的題（可重現）', () => { eq(Exam.generate({ seed: 7 }).ids, Exam.generate({ seed: 7 }).ids); });
  t('不給 seed 也能出題', () => { eq(Exam.generate().ids.length, 50); });
  t('順序：先筆試題，再危險感知', () => { const ids = Exam.generate({ seed: 4 }).ids; const flags = ids.map(id => danger(Data.getQuestion(id))); eq(flags.slice(0, 35).every(f => !f), true); eq(flags.slice(35).every(f => f), true); });
  t('order: mixed 會打散', () => { const flags = Exam.generate({ seed: 4, order: 'mixed' }).ids.map(id => danger(Data.getQuestion(id))); eq(flags.slice(0, 35).some(f => f), true); });
  t('題目都存在於題庫', () => { Exam.generate({ seed: 5 }).ids.forEach(id => eq(!!Data.getQuestion(id), true, id)); });

  console.log('含影片題');
  t('includeVideo：危險感知 15 題按情境／影片比例分（7～8 題各半）', () => { const e = Exam.generate({ seed: 6, includeVideo: true }); eq(count(e.ids, danger), 15); const v = count(e.ids, q => q.source === '影片'), s = count(e.ids, q => q.source === '情境'); eq(v + s, 15); eq(v >= 7 && v <= 8, true, '影片 ' + v); });
  t('同一支影片（17 組共用）最多出一題（跑 200 次）', () => { for (let i = 0; i < 200; i++) { const vids = Exam.generate({ seed: i, includeVideo: true }).ids.map(id => Data.getAllQuestions().find(q => q.id === id).video).filter(Boolean); eq(new Set(vids).size, vids.length, 'seed ' + i); } });
  t('includeVideo 時整體仍 50 題、不重複', () => { for (let i = 0; i < 100; i++) { const e = Exam.generate({ seed: i, includeVideo: true }); eq(e.ids.length, 50); eq(new Set(e.ids).size, 50); } });

  console.log('可以調整的設定');
  t('改題數與危險感知題數', () => { const e = Exam.generate({ seed: 1, total: 20, dangerCount: 6 }); eq(e.ids.length, 20); eq(count(e.ids, danger), 6); });
  t('直接指定各類題數', () => { const e = Exam.generate({ seed: 1, total: 30, dangerCount: 10, categoryCounts: { '正確觀念與態度': 10, '安全駕駛能力': 5, '主動停讓文化': 5 } }); eq(e.ids.length, 30); eq(count(e.ids, q => q.category === '主動停讓文化'), 5); });
  t('改 Exam.CONFIG 預設值會生效', () => { const old = Exam.CONFIG.total; Exam.CONFIG.total = 40; try { eq(Exam.generate({ seed: 1 }).ids.length, 40); } finally { Exam.CONFIG.total = old; } });
  t('avoid：盡量避開上一次考過的題', () => { const first = Exam.generate({ seed: 1 }).ids, second = Exam.generate({ seed: 2, avoid: first }).ids; eq(second.filter(id => first.indexOf(id) !== -1).length, 0); });
  t('題庫不夠時用 avoid 的補，仍湊滿題數', () => { const small = Data.getQuestions().filter(q => q.category === '危險感知').slice(0, 20); const e = Exam.generate({ seed: 1, total: 15, dangerCount: 15, pool: small, avoid: small.slice(0, 10).map(q => q.id) }); eq(e.ids.length, 15); eq(new Set(e.ids).size, 15); });
  t('題庫真的不夠：回報 shortfall，不報錯', () => { const tiny = Data.getQuestions().slice(0, 12); const e = Exam.generate({ seed: 1, total: 50, dangerCount: 15, pool: tiny }); eq(e.ids.length <= 12, true); eq(e.plan.shortfall, 50 - e.ids.length); eq(new Set(e.ids).size, e.ids.length); });
  t('apportion 加總剛好等於題數', () => { for (let n = 0; n <= 60; n++) { const r = Exam.apportion(n, { a: 480, b: 234, c: 92 }); eq(r.a + r.b + r.c, n); } eq(Exam.apportion(35, { a: 480, b: 234, c: 92 }), { a: 21, b: 10, c: 4 }); });

  console.log('評分');
  t('全對 100 分及格；答錯 8 題 → 84 分不及格；9 題錯 → 82', () => { const ids = Exam.generate({ seed: 1 }).ids, all = {}; ids.forEach(id => all[id] = true); let r = Exam.grade(ids, all); eq(r.score, 100); eq(r.passed, true); ids.slice(0, 8).forEach(id => all[id] = false); r = Exam.grade(ids, all); eq(r.score, 84); eq(r.passed, false); eq(r.correct, 42); });
  t('85 分剛好及格（錯 7 題 = 86 分；50 題要錯 7 題才 86）', () => { const ids = Exam.generate({ seed: 1 }).ids, a = {}; ids.forEach((id, i) => a[id] = i >= 7); const r = Exam.grade(ids, a); eq(r.score, 86); eq(r.passed, true); });
  t('沒作答算答錯；各類別答對率', () => { const ids = Exam.generate({ seed: 1 }).ids; const r = Exam.grade(ids, {}); eq(r.score, 0); eq(r.byCategory['危險感知'].total, 15); eq(r.byCategory['危險感知'].rate, 0); });

  console.log('\n通過 ' + pass + '，失敗 ' + fail);
  process.exit(fail ? 1 : 0);
})();
