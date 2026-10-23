#!/usr/bin/env node
/**
 * site/tests/e2e.mjs：流程測試（C23）。模擬學生從首頁「一路點下去」。
 *
 * 用法（在專案根目錄）：  node site/tests/e2e.mjs
 * 需要：Node 22+（內建 WebSocket）、電腦上的 Chrome（無頭模式 + CDP，跟 design/check-screens.mjs 一樣）。
 * 每個流程開始前先清空 localStorage；每一步都檢查：
 *   1. 畫面上有預期的東西
 *   2. 沒有 console error／未處理的例外
 *   3. 畫面上沒有「失敗」「找不到」「localhost」「undefined」「NaN」等字樣
 * 結束碼：全部通過 0，有失敗 1。標「等 A6」的步驟失敗時只警告，不算失敗（地圖還在改）。
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.mjs': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.mp4': 'video/mp4' };
const BAD_WORDS = ['失敗', '找不到', 'localhost', 'undefined', 'NaN', '[object', '發生錯誤', '系統錯誤', '載入時發生問題'];

/* ---------- 靜態伺服器與 Chrome ---------- */
function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(fs.readFileSync(p));
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
    server.on('error', reject);
  });
}
function chromePath() {
  for (const p of [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium']) {
    if (p && fs.existsSync(p)) return p;
  }
  return 'google-chrome';
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const { server, port } = await startServer();
  const base = `http://127.0.0.1:${port}`;
  const cdpPort = 9400 + Math.floor(Math.random() * 90);
  const userDir = path.join('/tmp', `e2e_chrome_${Date.now()}`);
  const chrome = spawn(chromePath(), ['--headless=new', `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${userDir}`, '--remote-allow-origins=*', '--disable-cache', '--hide-scrollbars', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  const cleanup = () => { try { chrome.kill(); } catch (e) {} try { fs.rmSync(userDir, { recursive: true, force: true }); } catch (e) {} try { server.close(); } catch (e) {} };
  process.on('SIGINT', () => { cleanup(); process.exit(130); });

  let tab = null;
  for (let i = 0; i < 40 && !tab; i++) {
    await sleep(200);
    try {
      const list = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
      tab = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
    } catch (e) {}
  }
  if (!tab) { cleanup(); console.error('❌ 連不上 Chrome（可以設定 CHROME_PATH）'); process.exit(1); }

  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 1, errors = [], loadWaiters = [];
  const pending = new Map();
  ws.onmessage = e => {
    const d = JSON.parse(e.data);
    if (d.id && pending.has(d.id)) { const { res, rej } = pending.get(d.id); pending.delete(d.id); d.error ? rej(new Error(d.error.message)) : res(d.result); return; }
    if (d.method === 'Page.loadEventFired') { loadWaiters.forEach(f => f()); loadWaiters = []; }
    else if (d.method === 'Page.javascriptDialogOpening') { send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {}); }
    else if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') {
      errors.push('console.error: ' + (d.params.args || []).map(a => a.value !== undefined ? String(a.value) : (a.description || '')).join(' '));
    } else if (d.method === 'Runtime.exceptionThrown') {
      const x = d.params.exceptionDetails; errors.push('例外: ' + (x.exception ? (x.exception.description || x.exception.value) : x.text));
    } else if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error' && !/favicon/.test(d.params.entry.url || '')) {
      errors.push('log error: ' + d.params.entry.text + ' ' + (d.params.entry.url || ''));
    }
  };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = id++; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  for (const m of ['Page.enable', 'Runtime.enable', 'Log.enable']) await send(m);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });

  // 在頁面裡執行（可以 await）。頁面剛好換頁時，回傳 { navigated: true }
  async function ev(expr) {
    let r;
    try { r = await send('Runtime.evaluate', { expression: `(async () => { ${expr} })()`, awaitPromise: true, returnByValue: true }); }
    catch (e) { if (/context|destroyed|navigat/i.test(e.message)) return { navigated: true }; throw e; }
    if (r.exceptionDetails) throw new Error('頁面內錯誤：' + (r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text));
    return r.result.value;
  }
  async function go(p) {
    const loaded = new Promise(res => { loadWaiters.push(res); setTimeout(res, 8000); });
    await send('Page.navigate', { url: base + '/' + p.replace(/^\//, '') });
    await loaded;
    await waitFor(`return !document.body.innerText.includes('載入中')`, 8000, '頁面一直顯示「載入中」');
  }
  async function waitFor(expr, ms = 8000, what = '條件') {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      try { const v = await ev(expr); if (v && !v.navigated) return v; } catch (e) { /* 換頁中，繼續等 */ }
      await sleep(120);
    }
    throw new Error('等不到：' + what);
  }
  const text = () => ev(`return document.body.innerText`);
  const here = () => ev(`return location.pathname.split('/').pop() + location.search`);
  async function resetStorage() { await go('site/index.html'); await ev(`localStorage.clear(); return 1`); }

  /* ---------- 在 quiz.html 答題：correct = 全答對；wrongFirst = 第一題故意答錯 ---------- */
  const ANSWER_LOOP = (opts) => `
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const opts = ${JSON.stringify(opts)};
    let n = 0, wrongDone = 0;
    for (let guard = 0; guard < 60; guard++) {
      let card = null;
      for (let i = 0; i < 50 && !card; i++) { card = document.querySelector('.question-card'); if (!card) await wait(100); }
      if (!card) return { n, error: '沒有出現題目' };
      const qid = card.dataset.qid, q = Data.getQuestion(qid);
      if (!q) return { n, error: '題庫沒有這一題 ' + qid };
      const wantWrong = opts.wrongFirst && wrongDone < opts.wrongFirst;
      const pick = wantWrong ? (q.answer + 1) % q.options.length : q.answer;
      if (wantWrong) wrongDone++;
      document.querySelectorAll('.option-card')[pick].click();
      let fb = null;
      for (let i = 0; i < 50 && !fb; i++) { fb = document.querySelector('.feedback-card'); if (!fb) await wait(100); }
      if (!fb) return { n, error: '點了選項，沒有出現答對／答錯回饋' };
      n++;
      const next = document.querySelector('.quiz-next-btn');
      if (!next) return { n, error: '沒有「下一題」按鈕' };
      const last = /完成|結算/.test(next.textContent);
      if (last) { setTimeout(() => next.click(), 0); return { n, last: true }; }
      const before = qid; next.click();
      for (let i = 0; i < 50; i++) { const c = document.querySelector('.question-card'); if (c && c.dataset.qid !== before) break; await wait(100); }
    }
    return { n, error: '題目一直答不完' };`;

  /* ---------- 流程定義 ---------- */
  const results = [];
  async function step(flow, name, fn, opts = {}) {
    errors = [];
    let ok = true, msg = '';
    try {
      await fn();
      const t = await text().catch(() => '');
      // 題目文字本身可能含有這些字（例如「錯誤」），所以只掃描題目卡以外的畫面
      const body = await ev(`const c = document.querySelector('.question-card, .mistake-card'); const clone = document.body.cloneNode(true); clone.querySelectorAll('.question-card, .mistake-card, .option-card, .feedback-card, script, style').forEach(x => x.remove()); return clone.innerText`).catch(() => t);
      const bad = BAD_WORDS.filter(w => (body || '').includes(w));
      if (bad.length) { ok = false; msg = '畫面上出現：' + bad.join('、'); }
      const errs = errors.filter(e => !/Failed to load resource.*(favicon|fonts\/)/.test(e));
      if (errs.length) { ok = false; msg = (msg ? msg + '；' : '') + errs[0]; }
    } catch (e) { ok = false; msg = e.message; }
    const soft = !ok && opts.softWait;
    results.push({ flow, name, ok, soft, msg });
    console.log(`${ok ? '✅' : soft ? '⏳' : '❌'} [${flow}] ${name}${ok ? '' : '  ➔ ' + (soft ? '（' + opts.softWait + '）' : '') + msg}`);
    return ok;
  }
  const must = (cond, msg) => { if (!cond) throw new Error(msg); };

  // ===== 流程 1：今日挑戰 =====
  console.log('\n流程 1：首頁 → 今日挑戰 → 答完 5 題 → 回首頁');
  await resetStorage();
  await step('今日挑戰', '首頁打得開，有「開始今日練習」', async () => {
    await go('site/index.html');
    must((await text()).includes('開始今日練習'), '首頁沒有「開始今日練習」');
  });
  await step('今日挑戰', '按下「開始今日練習」進到答題畫面（第 1 / 5 題）', async () => {
    await ev(`document.querySelector('a[href="quiz.html?mode=daily"]').click(); return 1`);
    await waitFor(`return location.search.includes('mode=daily') && !!document.querySelector('.question-card')`, 8000, '今日挑戰的題目');
    must(/1 \/ 5/.test(await text()), '進度不是 1 / 5');
  });
  await step('今日挑戰', '答完 5 題，看到「今日挑戰完成」', async () => {
    const r = await ev(ANSWER_LOOP({}));
    must(!r.error, r.error); must(r.n === 5 || r.last, '沒有答完 5 題（答了 ' + r.n + '）');
    await waitFor(`return document.body.innerText.includes('今日挑戰完成')`, 6000, '「今日挑戰完成」畫面');
  });
  await step('今日挑戰', '作答每題只記一次（不會重複計算）', async () => {
    const n = await ev(`return Store.getAnswerLog().length`);
    must(n === 5, '作答紀錄應該 5 筆，實際 ' + n);
  });
  await step('今日挑戰', '回首頁顯示「今日挑戰完成」', async () => {
    await go('site/index.html');
    must((await text()).includes('今日挑戰完成'), '首頁沒有顯示「今日挑戰完成」');
  });

  // ===== 流程 2：全部關卡 =====
  console.log('\n流程 2：首頁 → 全部關卡 → 一關 → 結算');
  await resetStorage();
  await step('全部關卡', '首頁「全部關卡」連到清單', async () => {
    await go('site/index.html');
    await ev(`const a = [...document.querySelectorAll('a')].find(x => /全部關卡/.test(x.textContent)); if (!a) throw new Error('首頁找不到「全部關卡」連結'); a.click(); return 1`);
    await waitFor(`return location.pathname.endsWith('levels.html')`, 6000, '關卡清單頁');
  });
  await step('全部關卡', '看得到 4 大類、11 個小類、92 關', async () => {
    await waitFor(`return document.querySelectorAll('.level-item-card').length > 0`, 6000, '關卡卡片');
    const r = await ev(`return { cards: document.querySelectorAll('.level-item-card').length, subs: document.querySelectorAll('[data-sub]').length, cats: document.querySelectorAll('details[data-category]').length }`);
    must(r.cards === 92, '關卡應該有 92 個，實際 ' + r.cards);
    must(r.subs === 11, '小類應該有 11 個，實際 ' + r.subs);
    must(r.cats === 4, '大類應該有 4 個，實際 ' + r.cats);
  });
  await step('全部關卡', '大類可以收合', async () => {
    const r = await ev(`const d = document.querySelector('details[data-category]'); const open = d.getBoundingClientRect().height; d.querySelector('summary').click(); await new Promise(r => setTimeout(r, 200)); const closed = d.getBoundingClientRect().height; const isOpen = d.open; d.querySelector('summary').click(); return !isOpen && closed < open / 3`);
    must(r, '收合後關卡仍然看得到');
  });
  await step('全部關卡', '關卡文字：不顯示「題號 M0001～」，也沒有「每關 10 題以內」', async () => {
    const t = await text();
    must(!/題號 M\d+/.test(t), '還顯示題號範圍');
    must(!t.includes('每關 10 題以內'), '還寫「每關 10 題以內」');
  });
  let levelHref = '';
  await step('全部關卡', '點最後一個小類的第一關 → 進到答題', async () => {
    levelHref = await ev(`const subs = [...document.querySelectorAll('[data-sub]')]; const last = subs[subs.length - 1]; const a = last.querySelector('a.level-item-card'); const h = a.getAttribute('href'); a.click(); return h`);
    await waitFor(`return location.pathname.endsWith('quiz.html') && !!document.querySelector('.question-card')`, 8000, '答題畫面');
  });
  await step('全部關卡', '答完這一關 → 結算頁有分數', async () => {
    const r = await ev(ANSWER_LOOP({}));
    must(!r.error, r.error);
    await waitFor(`return location.pathname.endsWith('result.html') && !!document.querySelector('.score-num')`, 8000, '結算頁的分數');
    const score = await ev(`return document.querySelector('.score-num').textContent`);
    must(score === '100', '全答對應該 100 分，實際 ' + score);
  });
  await step('全部關卡', '單一小類頁（levels.html?sub=）也正常', async () => {
    await go('site/levels.html?sub=' + encodeURIComponent('貨物裝載'));
    const n = await ev(`return document.querySelectorAll('.level-item-card').length`);
    must(n === 2, '貨物裝載應該 2 關，實際 ' + n);
  });

  // ===== 流程 3：地圖 =====
  console.log('\n流程 3：地圖 → 點一站 → 答題');
  await resetStorage();
  await step('地圖', '地圖 → 點一站 → 進到答題', async () => {
    await go('site/map.html');
    await ev(`const a = document.querySelector('a[href^="quiz.html?level="]'); if (!a) throw new Error('地圖上找不到可以點的關卡'); a.click(); return 1`);
    await waitFor(`return location.pathname.endsWith('quiz.html') && !!document.querySelector('.question-card')`, 8000, '從地圖進到答題畫面');
  }, { softWait: '等 A6' });

  // ===== 流程 4：錯題庫 =====
  console.log('\n流程 4：答錯 1 題 → 錯題庫 → 重練');
  await resetStorage();
  await step('錯題庫', '一開始錯題庫是空的', async () => {
    await go('site/mistakes.html');
    must((await text()).includes('沒有任何錯題'), '空的錯題庫沒有顯示「沒有任何錯題」');
  });
  await step('錯題庫', '做一關、故意答錯 1 題', async () => {
    await go('site/levels.html?sub=' + encodeURIComponent('貨物裝載'));
    await ev(`document.querySelector('a.level-item-card').click(); return 1`);
    await waitFor(`return !!document.querySelector('.question-card')`, 8000, '答題畫面');
    const r = await ev(ANSWER_LOOP({ wrongFirst: 1 }));
    must(!r.error, r.error);
    await waitFor(`return location.pathname.endsWith('result.html')`, 8000, '結算頁');
  });
  await step('錯題庫', '錯題庫有 1 題', async () => {
    await go('site/mistakes.html');
    const n = await ev(`return Store.getMistakeIds().length`);
    must(n === 1, '錯題庫應該 1 題，實際 ' + n);
    must(/1 題待複習/.test(await text()), '畫面沒有顯示「1 題待複習」');
  });
  await step('錯題庫', '重練：答對 → 完成', async () => {
    await ev(`const a = document.querySelector('a[href="quiz.html?mode=mistakes"]'); if (!a) throw new Error('沒有「開始練習錯題」按鈕'); a.click(); return 1`);
    await waitFor(`return !!document.querySelector('.question-card')`, 8000, '錯題重練的題目');
    const r = await ev(ANSWER_LOOP({}));
    must(!r.error, r.error);
    await waitFor(`return location.pathname.endsWith('result.html')`, 8000, '重練結算頁');
  });

  // ===== 流程 5：模擬考 =====
  console.log('\n流程 5：模擬考 → 交卷 → 分數');
  await resetStorage();
  await step('模擬考', '模擬考首頁 → 開始 → 50 題', async () => {
    await go('site/exam.html');
    await waitFor(`return [...document.querySelectorAll('button')].some(x => /開始模擬考/.test(x.textContent))`, 6000, '「開始模擬考」按鈕');
    await ev(`const b = [...document.querySelectorAll('button')].find(x => /開始模擬考/.test(x.textContent)); if (!b) throw new Error('找不到「開始模擬考」'); b.click(); return 1`);
    await waitFor(`return /1 \\/ 50/.test(document.body.innerText)`, 8000, '第 1 / 50 題');
  });
  await step('模擬考', '答完 50 題 → 交卷 → 看到分數', async () => {
    await ev(`
      const wait = ms => new Promise(r => setTimeout(r, ms));
      for (let i = 0; i < 50; i++) {
        document.querySelectorAll('.option-card')[0].click(); await wait(30);
        const next = [...document.querySelectorAll('button')].find(b => /下一題|檢查交卷/.test(b.textContent));
        next.click(); await wait(30);
      }
      return 1`);
    await waitFor(`return !!document.querySelector('.score-num')`, 8000, '模擬考分數');
    const score = await ev(`return Number(document.querySelector('.score-num').textContent)`);
    must(score >= 0 && score <= 100, '分數不合理：' + score);
  });

  // ===== 流程 6：閱讀設定 =====
  console.log('\n流程 6：閱讀設定 → 改字級 → 關閉');
  await resetStorage();
  await step('閱讀設定', '開啟 → 改字級「大」→ 背景立刻變大 → 關閉', async () => {
    await go('site/index.html');
    await ev(`document.getElementById('btn-reading-settings').click(); return 1`);
    await waitFor(`const d = document.getElementById('settings-drawer'); return d && d.classList.contains('is-open')`, 4000, '設定面板打開');
    await ev(`document.querySelector('[data-font="large"]').click(); return 1`);
    const big = await ev(`return document.documentElement.classList.contains('font-size-large')`);
    must(big, '選「大」之後頁面字級沒有立刻變');
    await ev(`document.getElementById('btn-done-settings').click(); return 1`);
    await waitFor(`return !document.getElementById('settings-drawer').classList.contains('is-open')`, 4000, '設定面板關閉');
    const saved = await ev(`return JSON.parse(localStorage.getItem('moto:reading-settings')).fontSize`);
    must(saved === 'large', '字級沒有存起來');
  });
  await step('閱讀設定', '換頁後字級仍是「大」', async () => {
    await go('site/levels.html');
    must(await ev(`return document.documentElement.classList.contains('font-size-large')`), '換頁後字級沒有保留');
  });

  /* ---------- 總結 ---------- */
  ws.close(); cleanup();
  const failed = results.filter(r => !r.ok && !r.soft), soft = results.filter(r => !r.ok && r.soft);
  console.log('\n==========================================================================');
  console.log(`流程測試：${results.length} 步，通過 ${results.filter(r => r.ok).length}，失敗 ${failed.length}` + (soft.length ? `，等 A6（地圖）${soft.length}` : ''));
  failed.forEach(r => console.log(`  ❌ [${r.flow}] ${r.name} ➔ ${r.msg}`));
  soft.forEach(r => console.log(`  ⏳ [${r.flow}] ${r.name} ➔ ${r.msg}`));
  process.exit(failed.length ? 1 : 0);
}

main().catch(err => { console.error('❌ 執行過程中發生未預期錯誤：', err); process.exit(1); });
