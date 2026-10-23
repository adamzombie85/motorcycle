/* Firestore 安全規則自動測試。
 * 需要：Java 11+、Node 18+。在 firebase-tests/ 資料夾：  npm install && npm test
 * （測試用 demo-moto 專案和本機模擬器，不會碰到真正的 Firebase 專案。）
 * 沒辦法裝 Java 的話，改照 docs/Firestore規則測試清單.md 手動測。 */
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc, deleteDoc, getDocs, collection, serverTimestamp, arrayUnion } = require('firebase/firestore');

const ADMIN = { email: 'adamzombie85@gmail.com', email_verified: true };
let env;
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-moto', firestore: { rules: fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8') } });
});
after(async () => { await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/alice'), { uid: 'alice', email: 'alice@example.com', summary: { accuracy: 80 } });
    await setDoc(doc(db, 'users/alice/answers/2026-10'), { items: ['{"qid":"M0001"}'] });
    await setDoc(doc(db, 'users/bob'), { uid: 'bob', email: 'bob@example.com' });
    await setDoc(doc(db, 'users/bob/data/mistakes'), { json: '{}' });
  });
});
const as = (uid, claims) => env.authenticatedContext(uid, claims || {}).firestore();

test('沒登入：讀、寫都拒絕', async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, 'users/alice')));
  await assertFails(setDoc(doc(db, 'users/alice'), { uid: 'alice' }));
  await assertFails(getDocs(collection(db, 'users')));
});
test('學生可以讀寫自己的資料', async () => {
  const db = as('alice', { email: 'alice@example.com' });
  await assertSucceeds(getDoc(doc(db, 'users/alice')));
  await assertSucceeds(setDoc(doc(db, 'users/alice'), { uid: 'alice', email: 'alice@example.com', className: '301', seat: '12', lastSeen: serverTimestamp() }, { merge: true }));
  await assertSucceeds(setDoc(doc(db, 'users/alice/answers/2026-11'), { items: arrayUnion('{"qid":"M0002"}') }, { merge: true }));
  await assertSucceeds(setDoc(doc(db, 'users/alice/data/mistakes'), { json: '{}', updatedAt: serverTimestamp() }));
  await assertSucceeds(setDoc(doc(db, 'users/alice/attempts/2026-11'), { items: ['{}'] }));
});
test('A 讀不到、寫不進 B 的資料', async () => {
  const db = as('alice', { email: 'alice@example.com' });
  await assertFails(getDoc(doc(db, 'users/bob')));
  await assertFails(getDoc(doc(db, 'users/bob/data/mistakes')));
  await assertFails(getDocs(collection(db, 'users/bob/answers')));
  await assertFails(setDoc(doc(db, 'users/bob'), { uid: 'bob' }, { merge: true }));
  await assertFails(setDoc(doc(db, 'users/bob/answers/2026-11'), { items: ['x'] }));
});
test('學生不能列出所有學生', async () => {
  await assertFails(getDocs(collection(as('alice', { email: 'alice@example.com' }), 'users')));
});
test('不能冒用別人的 uid 或 email', async () => {
  const db = as('alice', { email: 'alice@example.com' });
  await assertFails(setDoc(doc(db, 'users/alice'), { uid: 'bob' }, { merge: true }));
  await assertFails(setDoc(doc(db, 'users/alice'), { email: 'someone@else.com' }, { merge: true }));
});
test('個人資料不能亂塞欄位、班級座號太長會拒絕', async () => {
  const db = as('alice', { email: 'alice@example.com' });
  await assertFails(setDoc(doc(db, 'users/alice'), { role: 'admin' }, { merge: true }));
  await assertFails(setDoc(doc(db, 'users/alice'), { className: 'x'.repeat(11) }, { merge: true }));
  await assertFails(setDoc(doc(db, 'users/alice'), { seat: 12 }, { merge: true }));
});
test('不能刪除資料', async () => {
  const db = as('alice', { email: 'alice@example.com' });
  await assertFails(deleteDoc(doc(db, 'users/alice')));
  await assertFails(deleteDoc(doc(db, 'users/alice/answers/2026-10')));
});
test('沒定義的路徑一律拒絕（就算是自己的）', async () => {
  const db = as('alice', { email: 'alice@example.com' });
  await assertFails(setDoc(doc(db, 'secrets/x'), { a: 1 }));
  await assertFails(setDoc(doc(db, 'users/alice/other/x'), { a: 1 }));
  await assertFails(getDoc(doc(db, 'secrets/x')));
});
test('管理者（email 相符且已驗證）可以讀全部學生', async () => {
  const db = as('adminuid', ADMIN);
  await assertSucceeds(getDocs(collection(db, 'users')));
  await assertSucceeds(getDoc(doc(db, 'users/bob/data/mistakes')));
  await assertSucceeds(getDocs(collection(db, 'users/alice/answers')));
});
test('管理者只能讀，不能寫別人的資料', async () => {
  const db = as('adminuid', ADMIN);
  await assertFails(setDoc(doc(db, 'users/alice'), { className: '999' }, { merge: true }));
  await assertFails(deleteDoc(doc(db, 'users/alice')));
});
test('email 相符但沒驗證：不是管理者', async () => {
  const db = as('fake1', { email: 'adamzombie85@gmail.com', email_verified: false });
  await assertFails(getDocs(collection(db, 'users')));
  await assertFails(getDoc(doc(db, 'users/alice')));
});
test('email 不符（就算已驗證）：不是管理者', async () => {
  const db = as('fake2', { email: 'adamzombie86@gmail.com', email_verified: true });
  await assertFails(getDocs(collection(db, 'users')));
});
test('沒有 email 的帳號：不是管理者', async () => {
  await assertFails(getDocs(collection(as('anon1', {}), 'users')));
});
