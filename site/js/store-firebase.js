/* Firebase 儲存後端（config.js 的 BACKEND = 'firebase' 時才會載入）。
 *
 * 做法：本機（localStorage）永遠先寫、先讀，這個檔案只負責「把變更補傳到雲端」和「登入後把雲端紀錄併回本機」
 * （write-behind）。所以斷線時照常使用，連線後自動補傳；程式其他地方不用知道有沒有雲端。
 *
 * 雲端資料結構（每位學生 uid 一份，安全規則見 firestore.rules）：
 *   users/{uid}                    個人資料＋「摘要」summary（管理者頁只要讀這份，省讀取次數）
 *   users/{uid}/data/{name}        mistakes、srs、doc_xxx（每日挑戰、徽章、角色…），內容是 { json: '...' }
 *   users/{uid}/answers/{YYYY-MM}  每月的作答紀錄 { items: ['{"qid":...}', ...] }，用 arrayUnion 追加
 *   users/{uid}/attempts/{YYYY-MM} 每月的練習紀錄，同上
 *
 * 公開 API：window.StoreFirebase
 *   signIn() / signOut() / onAuthChange(fn) / getUser() / isAdmin() / ready（Promise）
 *   getProfile() / setProfile({ className, seat })     班級、座號（選填）
 *   importGuest()                                      登入後把這台裝置的「訪客」紀錄併進帳號
 *   flushNow() / pendingCount()                        立刻補傳／還有幾項沒傳
 */
(function () {
  'use strict';
  var CFG = window.APP_CONFIG || {};
  var PREFIX = 'moto:';
  var FLUSH_DELAY = 2000;
  var NET_TIMEOUT = 15000;

  var fb = null, auth = null, db = null, user = null;
  var lastUid = null;
  var dirty = {};                 // 還沒傳上去的項目 { 'answers': true, 'mistakes': true, 'doc:daily': true, ... }
  var timer = null, flushing = false, authCbs = [];
  var readyResolve, ready = new Promise(function (r) { readyResolve = r; });

  /* ---------- 小工具 ---------- */
  function lsGet(k, d) { try { var r = localStorage.getItem(k); return r === null ? d : JSON.parse(r); } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function withTimeout(p) {
    return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, NET_TIMEOUT); })]);
  }
  function month(ts) { return Store.dateStr(ts).slice(0, 7); }
  function docId(name) { return name.replace(/[:\/]/g, '_'); }
  function nameOf(id) { return id.indexOf('doc_') === 0 ? 'doc:' + id.slice(4) : id; }
  function dirtyKey() { return PREFIX + 'fb-dirty:' + user.uid; }
  function syncedKey() { return PREFIX + 'fb-synced:' + user.uid; }
  function saveDirty() { lsSet(dirtyKey(), Object.keys(dirty)); }
  function fire() { authCbs.forEach(function (f) { try { f(user); } catch (e) {} }); }
  function userPath(sub) { return 'users/' + user.uid + (sub ? '/' + sub : ''); }

  /* ---------- 後端掛鉤（Store 每次寫入本機後呼叫）---------- */
  var backend = {
    name: 'firebase',
    onWrite: function (student, name) {
      if (!user || student !== user.uid) return;
      if (name === 'answers_v2') return;
      dirty[name] = true;
      saveDirty();
      schedule();
    },
    onReset: function (student) {
      // 「重設我的紀錄」只清本機這份；雲端紀錄不動（要清雲端請管理者處理）
      if (user && student === user.uid) { dirty = {}; saveDirty(); lsSet(syncedKey(), 0); }
    }
  };

  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () { timer = null; flush(); }, FLUSH_DELAY);
  }

  /* ---------- 補傳 ---------- */
  function online() { return typeof navigator === 'undefined' || navigator.onLine !== false; }

  function flush() {
    if (!user || flushing || !online() || !Object.keys(dirty).length) return Promise.resolve(false);
    flushing = true;
    var names = Object.keys(dirty), jobs = [];
    var FV = fb.firestore.FieldValue;
    names.forEach(function (name) {
      if (name === 'answers' || name === 'attempts') jobs.push(pushChunks(name, FV));
      else jobs.push(pushValue(name));
    });
    return Promise.all(jobs.concat([pushSummary(FV)])).then(function () {
      names.forEach(function (n) { delete dirty[n]; });
      saveDirty(); flushing = false; return true;
    }).catch(function (e) {
      flushing = false;   // 失敗就保留 dirty，下次（連線、重新開啟、再作答）再試
      if (typeof console !== 'undefined') console.warn('補傳失敗，稍後再試', e && e.message);
      return false;
    });
  }

  function pushValue(name) {
    var value = lsGet(PREFIX + 'u:' + user.uid + ':' + name, null);
    return withTimeout(db.doc(userPath('data/' + docId(name))).set({ json: JSON.stringify(value), updatedAt: fb.firestore.FieldValue.serverTimestamp() }));
  }

  // 作答／練習紀錄：只傳「上次補傳之後新增」的，依月份分成不同文件，用 arrayUnion 追加（兩台裝置同時用也不會互蓋）
  function pushChunks(kind, FV) {
    var list = kind === 'answers' ? Store.getAnswerLog() : Store.getAttempts();
    var tsOf = kind === 'answers' ? function (r) { return r.ts; } : function (a) { return Date.parse(a.date) || 0; };
    var sk = syncedKey() + ':' + kind, since = lsGet(sk, 0), by = {}, maxTs = since;
    list.forEach(function (r) {
      var t = tsOf(r);
      if (t > since) { (by[month(t)] = by[month(t)] || []).push(JSON.stringify(r)); if (t > maxTs) maxTs = t; }
    });
    var months = Object.keys(by);
    return Promise.all(months.map(function (m) {
      return withTimeout(db.doc(userPath(kind + '/' + m)).set({ items: FV.arrayUnion.apply(FV, by[m]) }, { merge: true }));
    })).then(function () { lsSet(sk, maxTs); });
  }

  // 摘要：管理者頁讀這一份就夠（不用讀每一筆作答）
  function buildSummary() {
    var log = Store.getAnswerLog(), latest = Stats.latestByQuestion(), att = Store.getAttempts();
    var answered = Object.keys(latest), correct = answered.filter(function (q) { return latest[q]; }).length;
    function arr(map) { return Object.keys(map).map(function (k) { return { name: k, answered: map[k].answered, correct: map[k].correct, rate: map[k].rate }; }); }
    var levels = typeof Data !== 'undefined' && Data.getLevels ? Data.getLevels() : [];
    var passed = levels.filter(function (l) { return Stats.levelPassed(l.id); }).length;
    var streak = typeof Game !== 'undefined' && Game.getStreak ? Game.getStreak() : { current: 0, best: 0 };
    return {
      answersTotal: log.length, questionsAnswered: answered.length, questionsCorrect: correct,
      accuracy: answered.length ? Math.round(correct / answered.length * 100) : 0,
      levelsPassed: passed, levelsTotal: levels.length, attempts: att.length,
      mistakes: Store.getMistakeIds().length,
      lastPractice: log.length ? log[log.length - 1].ts : null,
      streakCurrent: streak.current, streakBest: streak.best,
      byCategory: arr(Stats.byCategory()), bySubcategory: arr(Stats.bySubcategory())
    };
  }
  function pushSummary(FV) {
    var s = buildSummary(); s.updatedAt = FV.serverTimestamp();
    return withTimeout(db.doc(userPath()).set({ summary: s, lastSeen: FV.serverTimestamp() }, { merge: true }));
  }

  /* ---------- 登入後：把雲端紀錄併回本機 ---------- */
  function pull() {
    var rec = { answers: [], attempts: [], mistakes: {}, srs: {}, docs: {} };
    var ps = [
      withTimeout(db.collection(userPath('answers')).get()).then(function (snap) {
        snap.forEach(function (d) { (d.data().items || []).forEach(function (j) { try { rec.answers.push(JSON.parse(j)); } catch (e) {} }); });
      }),
      withTimeout(db.collection(userPath('attempts')).get()).then(function (snap) {
        snap.forEach(function (d) { (d.data().items || []).forEach(function (j) { try { rec.attempts.push(JSON.parse(j)); } catch (e) {} }); });
      }),
      withTimeout(db.collection(userPath('data')).get()).then(function (snap) {
        snap.forEach(function (d) {
          var name = nameOf(d.id), v; try { v = JSON.parse(d.data().json); } catch (e) { return; }
          if (name === 'mistakes' || name === 'srs') rec[name] = v || {};
          else if (name.indexOf('doc:') === 0) rec.docs[name.slice(4)] = v;
        });
      })
    ];
    return Promise.all(ps).then(function () {
      // 本機是這台裝置上最新的工作狀態，合併時以本機為準；雲端沒有的才補進來
      Store.applyRemote(rec);
      // 本機有、雲端沒有的（離線時做的），標成待補傳
      var cloudTs = {}; rec.answers.forEach(function (r) { cloudTs[r.qid + '@' + r.ts] = true; });
      if (Store.getAnswerLog().some(function (r) { return !cloudTs[r.qid + '@' + r.ts]; })) { lsSet(syncedKey() + ':answers', 0); dirty.answers = true; }
      var cloudAt = {}; rec.attempts.forEach(function (a) { cloudAt[a.levelId + '@' + a.date] = true; });
      if (Store.getAttempts().some(function (a) { return !cloudAt[a.levelId + '@' + a.date]; })) { lsSet(syncedKey() + ':attempts', 0); dirty.attempts = true; }
      ['mistakes', 'srs'].forEach(function (n) { dirty[n] = true; });
      saveDirty();
    });
  }

  function onUser(u) {
    if (!u) {
      user = null;
      if (lastUid && Store.getStudent() === lastUid) Store.logout();   // 登出後不要留著上一位的代號
      lastUid = null; dirty = {}; fire(); readyResolve(true); return;
    }
    lastUid = u.uid;
    user = { uid: u.uid, email: u.email || '', emailVerified: !!u.emailVerified, name: u.displayName || '' };
    Store.setStudent(user.uid);   // 以 uid 當學生代號，本機紀錄也依帳號分開
    (lsGet(dirtyKey(), []) || []).forEach(function (n) { dirty[n] = true; });
    var ref = db.doc(userPath());
    withTimeout(ref.get()).then(function (snap) {
      var base = { uid: user.uid, email: user.email, lastSeen: fb.firestore.FieldValue.serverTimestamp() };
      if (!snap.exists) base.createdAt = fb.firestore.FieldValue.serverTimestamp();
      return withTimeout(ref.set(base, { merge: true }));
    }).then(pull).then(function () { return flush(); }).catch(function (e) {
      if (typeof console !== 'undefined') console.warn('登入後同步失敗（離線？），稍後再試', e && e.message);
    }).then(function () { fire(); readyResolve(true); });
  }

  /* ---------- 公開 API ---------- */
  var API = {
    ready: ready,
    getUser: function () { return user; },
    isAdmin: function () { return !!user && user.emailVerified && user.email === CFG.ADMIN_EMAIL; },
    onAuthChange: function (fn) { authCbs.push(fn); if (user !== null) { try { fn(user); } catch (e) {} } },
    signIn: function () {
      var provider = new fb.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      return auth.signInWithPopup(provider);
    },
    signOut: function () { return flush().then(function () { return auth.signOut(); }); },
    getProfile: function () {
      return withTimeout(db.doc(userPath()).get()).then(function (s) {
        var d = s.exists ? s.data() : {};
        return { className: d.className || '', seat: d.seat || '' };
      });
    },
    // 班級、座號（選填，字數有限）
    setProfile: function (p) {
      var className = String((p && p.className) || '').trim().slice(0, 10), seat = String((p && p.seat) || '').trim().slice(0, 10);
      return withTimeout(db.doc(userPath()).set({ className: className, seat: seat }, { merge: true }));
    },
    // 合併時 Store 的寫入掛鉤會把各項標成待補傳；舊的作答時間比較早，所以補傳起點要歸 0
    importGuest: function () {
      var res = Store.importLocalRecord('guest');
      lsSet(syncedKey() + ':answers', 0); lsSet(syncedKey() + ':attempts', 0);
      dirty.answers = true; dirty.attempts = true; saveDirty(); schedule();
      return res;
    },
    hasGuestRecord: function () { return Store.hasImportable('guest'); },
    flushNow: flush,
    pendingCount: function () { return Object.keys(dirty).length; },
    _backend: backend
  };

  /* ---------- 啟動 ---------- */
  function init(firebaseNs) {
    fb = firebaseNs;
    if (!fb.apps || !fb.apps.length) fb.initializeApp(CFG.FIREBASE);
    auth = fb.auth(); db = fb.firestore();
    Store.setBackend(backend);
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('online', function () { flush(); });
      window.addEventListener('pagehide', function () { flush(); });
      if (typeof document !== 'undefined') document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); });
    }
    auth.onAuthStateChanged(onUser);
    return API;
  }
  API.init = init;

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = function () { rej(new Error('載入失敗 ' + src)); };
      document.head.appendChild(s);
    });
  }

  function autoStart() {
    var c = CFG.FIREBASE || {};
    if (!c.apiKey || !c.projectId) {
      if (typeof console !== 'undefined') console.warn('Firebase 設定還沒填（config.js），維持 local 模式');
      readyResolve(false); return;
    }
    var base = 'https://www.gstatic.com/firebasejs/' + CFG.SDK_VERSION + '/firebase-';
    loadScript(base + 'app-compat.js')
      .then(function () { return Promise.all([loadScript(base + 'auth-compat.js'), loadScript(base + 'firestore-compat.js')]); })
      .then(function () { init(window.firebase); })
      .catch(function (e) { if (typeof console !== 'undefined') console.warn('Firebase 載入失敗，維持 local 模式', e && e.message); readyResolve(false); });
  }

  window.StoreFirebase = API;
  if (typeof document !== 'undefined' && !window.__FIREBASE_TEST__) autoStart();
})();
