/* Firebase 後端同步邏輯測試（用假的 Firebase，不連網）：node site/tests/firebase-sync-test.js */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..', '..');
const store = {};
const data = {};   // 假 Firestore：路徑 → 文件
const fake = { offline: false };
function apply(p, patch, merge) {
  const cur = merge ? (data[p] || {}) : {};
  for (const k of Object.keys(patch)) {
    const v = patch[k];
    if (v && v.__union) cur[k] = Array.from(new Set([...(cur[k] || []), ...v.__union]));
    else cur[k] = v;
  }
  data[p] = cur;
}
const db = {
  doc: p => ({
    get: async () => ({ exists: p in data, data: () => data[p] }),
    set: async (v, o) => { if (fake.offline) throw new Error('offline'); apply(p, v, o && o.merge); }
  }),
  collection: p => ({
    get: async () => {
      if (fake.offline) throw new Error('offline');
      const docs = Object.keys(data).filter(k => k.startsWith(p + '/') && !k.slice(p.length + 1).includes('/')).map(k => ({ id: k.slice(p.length + 1), data: () => data[k] }));
      return { forEach: f => docs.forEach(f) };
    }
  })
};
let authCb = null, signedIn = null;
const authObj = { onAuthStateChanged: cb => { authCb = cb; }, signOut: async () => { signedIn = null; authCb(null); } };
const firebase = {
  apps: [], initializeApp() { this.apps.push(1); },
  auth: Object.assign(() => authObj, { GoogleAuthProvider: function () { this.setCustomParameters = () => {}; } }),
  firestore: Object.assign(() => db, { FieldValue: { arrayUnion: (...a) => ({ __union: a }), serverTimestamp: () => ({ __ts: true }) } })
};
const ctx = {
  fetch: async () => ({ ok: true, json: async () => JSON.parse(fs.readFileSync(path.join(root, 'data/questions.json'), 'utf8')) }),
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; }, key: i => Object.keys(store)[i] || null, get length() { return Object.keys(store).length; } },
  navigator: { onLine: true }, console,
  Promise, JSON, Date, Object, Error, Math, Array, String, Number, Set, setTimeout, clearTimeout
};
ctx.window = ctx;
ctx.APP_CONFIG = { BACKEND: 'firebase', ADMIN_EMAIL: 'adamzombie85@gmail.com', FIREBASE: {} };
vm.createContext(ctx);
for (const f of ['data', 'store', 'stats', 'game', 'store-firebase']) vm.runInContext(fs.readFileSync(path.join(root, 'site/js/' + f + '.js'), 'utf8'), ctx);
const { Data, Store, StoreFirebase: SF } = ctx;

let pass = 0, fail = 0;
async function t(name, fn) { try { await fn(); pass++; console.log('  ✓ ' + name); } catch (e) { fail++; console.log('  ✗ ' + name + '\n      ' + e.message); } }
function eq(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((msg || '') + ' 期望 ' + JSON.stringify(b) + '，實際 ' + JSON.stringify(a)); }
function at(date, h) { const p = date.split('-'); Store.setClock(() => new Date(+p[0], +p[1] - 1, +p[2], h || 12)); }
const wait = ms => new Promise(r => setTimeout(r, ms));
async function signIn(u) { signedIn = u; authCb(u); await wait(20); await SF.ready; await wait(20); }
function wipeLocal() { Object.keys(store).forEach(k => delete store[k]); }
const U1 = { uid: 'u1', email: 'a@example.com', emailVerified: true, displayName: 'A' };

(async () => {
  await Data.load();
  const qs = Data.getQuestions();
  console.log('預設是 local，現有行為不變');
  await t('沒有掛後端時是 local，寫入不會出錯', () => { Store.setStudent('x0'); eq(Store.getBackend().name, 'local'); Store.recordAnswer(qs[0].id, true); eq(Store.getAnswerLog().length, 1); });

  console.log('Firebase 後端（假的 Firebase）');
  SF.init(firebase);
  await t('init 之後後端是 firebase', () => eq(Store.getBackend().name, 'firebase'));
  await t('登入：學生代號換成 uid，建立 users/{uid}（含 email、createdAt）', async () => {
    await signIn(U1); eq(Store.getStudent(), 'u1'); eq(data['users/u1'].email, 'a@example.com'); eq(!!data['users/u1'].createdAt, true);
  });
  await t('作答後補傳：按月份分文件、有摘要、錯題與其他資料上雲', async () => {
    at('2026-10-19'); Store.recordAnswer(qs[0].id, false); Store.recordAnswer(qs[1].id, true); Store.addAttempt({ levelId: 'L1', mode: 'level', answers: [], score: 90, date: '2026-10-19T08:00:00.000Z' });
    Store.setDoc('avatar', 'rider-2');
    eq(SF.pendingCount() > 0, true); eq(await SF.flushNow(), true); eq(SF.pendingCount(), 0);
    eq(data['users/u1/answers/2026-10'].items.length, 2); eq(data['users/u1/attempts/2026-10'].items.length, 1);
    eq(JSON.parse(data['users/u1/data/mistakes'].json), { [qs[0].id]: 0 }); eq(JSON.parse(data['users/u1/data/doc_avatar'].json), 'rider-2');
    const s = data['users/u1'].summary; eq(s.answersTotal, 2); eq(s.questionsAnswered, 2); eq(s.accuracy, 50); eq(s.mistakes, 1); eq(s.levelsPassed, 1); eq(Array.isArray(s.byCategory), true);
  });
  await t('再補傳一次不會重複（只傳新增的）', async () => {
    at('2026-10-20'); Store.recordAnswer(qs[2].id, true); await SF.flushNow(); await SF.flushNow();
    eq(data['users/u1/answers/2026-10'].items.length, 3);
  });
  await t('斷線：先存本機，連線後補傳', async () => {
    fake.offline = true; ctx.navigator.onLine = false;
    at('2026-11-02'); Store.recordAnswer(qs[3].id, true); Store.recordAnswer(qs[4].id, false);
    eq(Store.getAnswerLog().length, 5, '本機照常存'); eq(await SF.flushNow(), false); eq(SF.pendingCount() > 0, true);
    eq(data['users/u1/answers/2026-11'], undefined);
    fake.offline = false; ctx.navigator.onLine = true;
    eq(await SF.flushNow(), true); eq(SF.pendingCount(), 0); eq(data['users/u1/answers/2026-11'].items.length, 2);
  });
  await t('斷線時網路失敗也不會丟資料（離線中途失敗，下次再試）', async () => {
    fake.offline = true; at('2026-11-03'); Store.recordAnswer(qs[5].id, true);
    eq(await SF.flushNow(), false); fake.offline = false; eq(await SF.flushNow(), true); eq(data['users/u1/answers/2026-11'].items.length, 3);
  });
  await t('換新裝置登入：雲端紀錄併回本機', async () => {
    await SF.signOut(); await wait(10); wipeLocal();
    await signIn(U1);
    eq(Store.getStudent(), 'u1'); eq(Store.getAnswerLog().length, 6); eq(Store.getAttempts().length, 1); eq(Store.getDoc('avatar', null), 'rider-2'); eq(Store.getMistakeIds().indexOf(qs[0].id) !== -1, true);
  });
  await t('登出後不留上一位的代號', async () => { await SF.signOut(); await wait(10); eq(Store.getStudent(), null); });
  await t('不同帳號的資料分開', async () => {
    await signIn({ uid: 'u2', email: 'b@example.com', emailVerified: true });
    eq(Store.getStudent(), 'u2'); eq(Store.getAnswerLog().length, 0); at('2026-11-04'); Store.recordAnswer(qs[0].id, true); await SF.flushNow();
    eq(data['users/u2/answers/2026-11'].items.length, 1); eq(data['users/u1/answers/2026-11'].items.length, 3);
  });
  await t('訪客紀錄匯入帳號，並補傳雲端；只問一次', async () => {
    await SF.signOut(); await wait(10); wipeLocal();
    Store.setStudent('guest'); at('2026-10-05'); [0, 1, 2].forEach(i => Store.recordAnswer(qs[i].id, i !== 1)); Store.addAttempt({ levelId: 'L9', mode: 'level', answers: [], score: 70, date: '2026-10-05T08:00:00.000Z' });
    await signIn({ uid: 'u3', email: 'c@example.com', emailVerified: true });
    eq(SF.hasGuestRecord(), true); const r = SF.importGuest(); eq(r.answers, 3); eq(r.attempts, 1);
    eq(Store.getAnswerLog().length, 3); eq(SF.hasGuestRecord(), false, '匯入過就不再問'); eq(Store.listLocalStudents().indexOf('guest') !== -1, true, '訪客紀錄還在');
    await SF.flushNow(); eq(data['users/u3/answers/2026-10'].items.length, 3); eq(data['users/u3/attempts/2026-10'].items.length, 1);
  });
  await t('重複匯入不會重複計算', () => { const r = Store.importLocalRecord('guest'); eq(r.answers, 0); eq(Store.getAnswerLog().length, 3); });
  await t('班級座號（選填）只存短字串', async () => { await SF.setProfile({ className: '301', seat: '12' }); eq(data['users/u3'].className, '301'); await SF.setProfile({ className: 'x'.repeat(50) }); eq(data['users/u3'].className.length, 10); eq((await SF.getProfile()).className.length, 10); });
  await t('管理者判斷：要 email 相符且 email 已驗證', async () => {
    await signIn({ uid: 'a1', email: 'adamzombie85@gmail.com', emailVerified: true }); eq(SF.isAdmin(), true);
    await signIn({ uid: 'a2', email: 'adamzombie85@gmail.com', emailVerified: false }); eq(SF.isAdmin(), false);
    await signIn({ uid: 'a3', email: 'other@example.com', emailVerified: true }); eq(SF.isAdmin(), false);
  });
  await t('重設我的紀錄只清本機，不動雲端', async () => {
    await signIn(U1); const before = JSON.stringify(data['users/u1/answers/2026-10']); Store.resetMe(); eq(Store.getAnswerLog(), []); eq(JSON.stringify(data['users/u1/answers/2026-10']), before);
  });

  console.log('\n通過 ' + pass + '，失敗 ' + fail);
  process.exit(fail ? 1 : 0);
})();
