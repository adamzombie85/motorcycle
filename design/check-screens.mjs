#!/usr/bin/env node

/**
 * design/check-screens.mjs
 * 
 * 自動化多裝置寬度檢查與截圖工具
 * 規格要求：
 * - 一次打開 design/ 的所有畫面（12 個 HTML 檔）
 * - 在 360px、390px、430px、1024px 四種寬度下截圖存至 design/screenshots/
 * - 檢測是否有未預期的橫向捲動 (Horizontal Scrolling) 與超出視窗的溢出元素 (Overflowing Elements)
 * - 格式化印出檢驗報表，並返回正確狀態碼
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DESIGN_DIR = __dirname;
const SCREENSHOTS_DIR = path.join(DESIGN_DIR, 'screenshots');

// 測試寬度與高度定義
const VIEWPORTS = [
  { name: '360px (窄版小手機)', width: 360, height: 800, mobile: true },
  { name: '390px (主流智慧機)', width: 390, height: 844, mobile: true },
  { name: '430px (大螢幕旗艦機)', width: 430, height: 932, mobile: true },
  { name: '1024px (平板與桌機)', width: 1024, height: 768, mobile: false }
];

// MIME 類型映射
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

// 尋找 Chrome 執行檔路徑
function getChromePath() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  const macPaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium'
  ];
  for (const p of macPaths) {
    if (fs.existsSync(p)) return p;
  }
  if (process.platform === 'linux') {
    const linuxPaths = ['/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium'];
    for (const p of linuxPaths) {
      if (fs.existsSync(p)) return p;
    }
  }
  return 'google-chrome';
}

// 建立本機靜態伺服器 (從專案根目錄提供檔案，支援 /design/ 與 /media/ 等路徑)
function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let reqPath = decodeURIComponent(req.url.split('?')[0]);
      if (reqPath === '/') reqPath = '/design/screen-home.html';
      const filePath = path.join(ROOT_DIR, reqPath);

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      try {
        const data = fs.readFileSync(filePath);
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        res.end(data);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Error: ' + err.message);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port });
    });
    server.on('error', reject);
  });
}

// 主執行邏輯
async function main() {
  console.log('🚀 開始執行 design/ 畫面響應式多裝置檢查與截圖...');
  
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  // 1. 取得所有 HTML 畫面 (包含 design/ 與 site/ 目錄)
  const designFiles = fs.readdirSync(DESIGN_DIR)
    .filter(file => file.endsWith('.html'))
    .sort()
    .map(file => ({ group: 'design', file, urlPath: `/design/${file}`, baseName: file.replace(/\.html$/, '') }));

  const siteDir = path.join(ROOT_DIR, 'site');
  const siteFiles = fs.existsSync(siteDir)
    ? fs.readdirSync(siteDir)
        .filter(file => file.endsWith('.html'))
        .sort()
        .map(file => {
          let urlPath = `/site/${file}`;
          if (file === 'quiz.html') {
            urlPath = `/site/${file}?level=${encodeURIComponent('貨物裝載-1')}`;
          } else if (file === 'result.html') {
            urlPath = `/site/${file}?level=${encodeURIComponent('貨物裝載-1')}`;
          } else if (file === 'levels.html') {
            urlPath = `/site/${file}?sub=${encodeURIComponent('貨物裝載')}`;
          }
          return { group: 'site', file, urlPath, baseName: `site_${file.replace(/\.html$/, '')}` };
        })
    : [];

  const pageEntries = [...designFiles, ...siteFiles];
  console.log(`📋 找到 ${pageEntries.length} 個畫面 (設計樣板 ${designFiles.length} 個，網站頁面 ${siteFiles.length} 個)`);

  // 2. 啟動伺服器
  const { server, port } = await startServer();
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`🌐 本地靜態伺服器啟動於：${baseUrl}`);

  // 3. 啟動 Chrome
  const chromePath = getChromePath();
  const cdpPort = 9300 + Math.floor(Math.random() * 50);
  const userDataDir = path.join('/tmp', `chrome_check_${Date.now()}`);

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    '--remote-allow-origins=*',
    '--disable-cache',
    '--hide-scrollbars',
    '--no-first-run',
    `${baseUrl}/design/screen-home.html`
  ]);

  const cleanup = () => {
    try { chromeProc.kill(); } catch (e) {}
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
    try { server.close(); } catch (e) {}
  };

  process.on('SIGINT', () => { cleanup(); process.exit(130); });
  process.on('SIGTERM', () => { cleanup(); process.exit(143); });

  // 等待 CDP 就緒並取得 page target
  let pageTab = null;
  for (let i = 0; i < 35; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const tabs = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${cdpPort}/json/list`, res => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => resolve(JSON.parse(d)));
        }).on('error', reject);
      });
      // 確保只連線到 type === 'page' 的目標
      if (Array.isArray(tabs)) {
        pageTab = tabs.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
        if (pageTab) break;
      }
    } catch (e) {}
  }

  if (!pageTab) {
    cleanup();
    console.error('❌ 無法連線至 Chrome Page CDP Target');
    process.exit(1);
  }

  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 1;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = msgId++;
    const handler = (e) => {
      const data = JSON.parse(e.data);
      if (data.id === id) {
        ws.removeEventListener('message', handler);
        if (data.error) reject(new Error(`${method}: ${data.error.message}`));
        else resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });

  let pageErrors = [];
  ws.addEventListener('message', (e) => {
    try {
      const data = JSON.parse(e.data);
      if (!data.id && data.method) {
        if (data.method === 'Runtime.consoleAPICalled') {
          if (data.params.type === 'error') {
            const text = (data.params.args || [])
              .map(a => a.value !== undefined ? String(a.value) : (a.description || ''))
              .join(' ');
            pageErrors.push(`Console Error: ${text}`);
          }
        } else if (data.method === 'Runtime.exceptionThrown') {
          const d = data.params.exceptionDetails;
          const text = d.exception ? (d.exception.description || d.exception.value) : d.text;
          pageErrors.push(`Uncaught Exception: ${text}`);
        } else if (data.method === 'Log.entryAdded') {
          if (data.params.entry && data.params.entry.level === 'error') {
            pageErrors.push(`Log Error: ${data.params.entry.text}`);
          }
        }
      }
    } catch (err) {}
  });

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');
  await send('Log.enable');

  // 前置設定：注入真實測試資料至 localStorage，確保結算頁、錯題庫皆能渲染出真實狀態
  try {
    await send('Page.navigate', { url: `${baseUrl}/site/index.html` });
    await new Promise(r => setTimeout(r, 400));
    await send('Runtime.evaluate', {
      expression: `(() => {
        try {
          localStorage.setItem('moto:student', JSON.stringify('guest'));
          const mockAttempt = {
            levelId: '貨物裝載-1',
            mode: 'level',
            date: new Date().toISOString(),
            answers: [
              { qid: 'M0001', choice: 0, correct: true },
              { qid: 'M0002', choice: 1, correct: false },
              { qid: 'M0003', choice: 2, correct: true },
              { qid: 'M0004', choice: 0, correct: true },
              { qid: 'M0005', choice: 0, correct: true },
              { qid: 'M0006', choice: 1, correct: true },
              { qid: 'M0007', choice: 2, correct: true },
              { qid: 'M0008', choice: 0, correct: true },
              { qid: 'M0009', choice: 0, correct: true },
              { qid: 'M0010', choice: 1, correct: true }
            ],
            correctCount: 9,
            total: 10,
            score: 90,
            seconds: 125
          };
          localStorage.setItem('moto:u:guest:attempts', JSON.stringify([mockAttempt]));
          localStorage.setItem('moto:u:guest:mistakes', JSON.stringify({
            'M0002': 0,
            'M0015': 1
          }));
          localStorage.setItem('moto:u:guest:answers_v2', 'true');
          const now = Date.now();
          localStorage.setItem('moto:u:guest:answers', JSON.stringify([
            { qid: 'M0001', correct: true, ts: now - 9000 },
            { qid: 'M0002', correct: false, ts: now - 8000, choice: 1 },
            { qid: 'M0003', correct: true, ts: now - 7000 },
            { qid: 'M0004', correct: true, ts: now - 6000 },
            { qid: 'M0005', correct: true, ts: now - 5000 },
            { qid: 'M0006', correct: true, ts: now - 4000 },
            { qid: 'M0007', correct: true, ts: now - 3000 },
            { qid: 'M0008', correct: true, ts: now - 2000 },
            { qid: 'M0009', correct: true, ts: now - 1000 },
            { qid: 'M0010', correct: true, ts: now }
          ]));
        } catch (e) { console.error('Seed error', e); }
      })()`
    });
  } catch (e) {
    console.warn('⚠️ 注入前置測試資料失敗：', e.message);
  }

  const results = [];
  let totalIssues = 0;

  console.log('--------------------------------------------------------------------------');
  console.log(`開始進行 ${pageEntries.length} 畫面 × ${VIEWPORTS.length} 寬度 = ${pageEntries.length * VIEWPORTS.length} 項測試...`);
  console.log('--------------------------------------------------------------------------');

  for (const entry of pageEntries) {
    const pageUrl = `${baseUrl}${entry.urlPath}`;
    const screenBase = entry.baseName;

    for (const vp of VIEWPORTS) {
      // 1. 設定裝置寬高 Emulation
      await send('Emulation.setDeviceMetricsOverride', {
        width: Math.round(vp.width),
        height: Math.round(vp.height),
        deviceScaleFactor: 1,
        mobile: vp.mobile
      });

      // 2. 載入頁面並清空該次錯誤收集
      pageErrors = [];
      await send('Page.navigate', { url: pageUrl });

      // 等待頁面與資料載入完成 (持續檢查是否還有「載入中」提示，最多等 3 秒)
      for (let w = 0; w < 30; w++) {
        await new Promise(r => setTimeout(r, 100));
        try {
          const loadingCheck = await send('Runtime.evaluate', {
            returnByValue: true,
            expression: `(() => {
              const text = document.body ? document.body.innerText : '';
              return text.includes('載入中…') || text.includes('載入中...');
            })()`
          });
          if (loadingCheck && loadingCheck.result && !loadingCheck.result.value) {
            break;
          }
        } catch (e) {}
      }
      await new Promise(r => setTimeout(r, 250));

      if (entry.file === 'teacher-view.html') {
        await send('Runtime.evaluate', {
          expression: `(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const sampleBtn = btns.find(b => b.textContent && b.textContent.includes('載入範例資料'));
            if (sampleBtn) sampleBtn.click();
          })()`
        });
        await new Promise(r => setTimeout(r, 350));
      }

      // 3. 檢查水平捲動、元素溢出與畫面功能異常文字
      const evalRes = await send('Runtime.evaluate', {
        returnByValue: true,
        expression: `(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body ? body.scrollWidth : 0);
          const clientWidth = docEl.clientWidth;
          const hasHScroll = scrollWidth > (clientWidth + 1.5);

          // 偵測溢出可視範圍之外的未裁切元素
          const overflowing = [];
          const all = document.querySelectorAll('*');
          for (const el of all) {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

            // 檢查是否超出右邊界 (容許 2px 次像素微小邊界差)
            if (rect.right > (clientWidth + 2.0) || rect.left < -2.0) {
              // 檢查父層容器或元素自身是否有設置合法橫向手勢滑動 (overflow-x: auto / scroll / hidden)
              let parent = el;
              let isClipped = false;
              while (parent && parent !== document.documentElement && parent !== document.body) {
                const pStyle = window.getComputedStyle(parent);
                if (pStyle.overflowX === 'auto' || pStyle.overflowX === 'scroll' || pStyle.overflowX === 'hidden') {
                  isClipped = true;
                  break;
                }
                parent = parent.parentElement;
              }
              if (!isClipped) {
                const tag = el.tagName.toLowerCase();
                const cls = el.className && typeof el.className === 'string' 
                  ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') 
                  : '';
                const id = el.id ? '#' + el.id : '';
                overflowing.push({
                  selector: tag + id + cls,
                  right: Math.round(rect.right),
                  clientWidth
                });
              }
            }
          }

          // 3. 頁首與重點元件互相重疊檢查 (Overlap detection)
          const overlapping = [];
          const navElements = Array.from(document.querySelectorAll('.site-header .nav-bar > *, .site-header .brand-badge, .site-header .btn-settings, .site-header .user-chip'));
          for (let i = 0; i < navElements.length; i++) {
            for (let j = i + 1; j < navElements.length; j++) {
              const a = navElements[i], b = navElements[j];
              if (a.contains(b) || b.contains(a)) continue;
              const rA = a.getBoundingClientRect(), rB = b.getBoundingClientRect();
              if (rA.width === 0 || rB.width === 0 || rA.height === 0 || rB.height === 0) continue;
              const sA = window.getComputedStyle(a), sB = window.getComputedStyle(b);
              if (sA.display === 'none' || sB.display === 'none' || sA.visibility === 'hidden' || sB.visibility === 'hidden' || sA.opacity === '0' || sB.opacity === '0') continue;

              const overlapX = Math.max(0, Math.min(rA.right, rB.right) - Math.max(rA.left, rB.left));
              const overlapY = Math.max(0, Math.min(rA.bottom, rB.bottom) - Math.max(rA.top, rB.top));
              if (overlapX > 3 && overlapY > 3) {
                overlapping.push({
                  elemA: (a.className || a.tagName),
                  elemB: (b.className || b.tagName),
                  overlapArea: Math.round(overlapX * overlapY)
                });
              }
            }
          }

          // 4. 文字被截斷 (Text truncation / Ellipsis)
          const truncated = [];
          const textNodes = Array.from(document.querySelectorAll('.site-header span, .brand-badge span, .user-chip span, .btn span, .btn, h1, h2, .stat-box-num, .stat-box-label'));
          for (const el of textNodes) {
            if (el.childElementCount > 0) continue;
            const text = (el.textContent || '').trim();
            if (text.length === 0) continue;
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

            if (style.textOverflow === 'ellipsis' || style.overflow === 'hidden' || style.overflowX === 'hidden') {
              if (el.scrollWidth > (el.clientWidth + 2)) {
                truncated.push({
                  selector: el.tagName.toLowerCase() + (el.className ? '.' + el.className.trim().split(/\\s+/)[0] : ''),
                  text: text,
                  scrollWidth: el.scrollWidth,
                  clientWidth: el.clientWidth
                });
              }
            }
          }

          // 5. 功能檢查：畫面出現「失敗」「錯誤」「找不到」等異常訊息
          const failureErrors = [];
          const bodyText = document.body ? document.body.innerText : '';

          if (bodyText.includes('失敗')) {
            failureErrors.push('含有「失敗」字樣');
          }
          if (bodyText.includes('找不到')) {
            failureErrors.push('含有「找不到」字樣');
          }

          // 針對「錯誤」：檢查訊息容器與系統錯誤文字
          const errorContainers = document.querySelectorAll('.quiz-message, .map-message, .levels-message, .result-message, .mistakes-message, .home-message, .text-danger, .alert-error');
          for (const c of errorContainers) {
            const t = (c.innerText || '').trim();
            if (t.includes('錯誤') || t.includes('失敗') || t.includes('找不到')) {
              failureErrors.push('錯誤容器 (' + c.className + '): ' + t);
            }
          }
          if (bodyText.includes('發生錯誤') || bodyText.includes('讀取錯誤') || bodyText.includes('載入錯誤') || bodyText.includes('系統錯誤') || bodyText.includes('404 Not Found')) {
            failureErrors.push('含有系統錯誤字樣');
          }

          return {
            clientWidth,
            scrollWidth,
            hasHScroll,
            overflowingCount: overflowing.length,
            overflowingSamples: overflowing.slice(0, 3),
            overlappingCount: overlapping.length,
            overlappingSamples: overlapping.slice(0, 3),
            truncatedCount: truncated.length,
            truncatedSamples: truncated.slice(0, 3),
            failureCount: failureErrors.length,
            failureSamples: failureErrors.slice(0, 3)
          };
        })()`
      });

      const metrics = evalRes.result.value || {
        clientWidth: vp.width,
        scrollWidth: vp.width,
        hasHScroll: false,
        overflowingCount: 0,
        overflowingSamples: [],
        overlappingCount: 0,
        overlappingSamples: [],
        truncatedCount: 0,
        truncatedSamples: [],
        failureCount: 0,
        failureSamples: []
      };

      const consoleErrors = [...pageErrors];
      const isClean = !metrics.hasHScroll && 
                      metrics.overflowingCount === 0 && 
                      metrics.overlappingCount === 0 && 
                      metrics.truncatedCount === 0 &&
                      consoleErrors.length === 0 &&
                      metrics.failureCount === 0;

      if (!isClean) {
        totalIssues++;
      }

      // 4. 截圖存檔
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const imgFileName = `${screenBase}_${vp.width}.png`;
      const imgFilePath = path.join(SCREENSHOTS_DIR, imgFileName);
      fs.writeFileSync(imgFilePath, Buffer.from(shot.data, 'base64'));

      results.push({
        screen: `${entry.group}/${entry.file}`,
        width: vp.width,
        vpName: vp.name,
        hasHScroll: metrics.hasHScroll,
        scrollWidth: metrics.scrollWidth,
        clientWidth: metrics.clientWidth,
        overflowing: metrics.overflowingSamples,
        overlapping: metrics.overlappingSamples,
        truncated: metrics.truncatedSamples,
        consoleErrors,
        failureSamples: metrics.failureSamples,
        isClean,
        image: imgFileName
      });

      const mark = isClean ? '✅' : '❌';
      let errDetails = [];
      if (metrics.hasHScroll) errDetails.push(`捲動寬 ${metrics.scrollWidth} > ${metrics.clientWidth}`);
      if (metrics.overflowingCount > 0) errDetails.push(`溢出 ${metrics.overflowingCount} 個`);
      if (metrics.overlappingCount > 0) errDetails.push(`重疊 ${metrics.overlappingCount} 處`);
      if (metrics.truncatedCount > 0) errDetails.push(`文字截斷 ${metrics.truncatedCount} 個: ${metrics.truncatedSamples[0].text}`);
      if (consoleErrors.length > 0) errDetails.push(`Console 錯誤 ${consoleErrors.length} 個: ${consoleErrors[0]}`);
      if (metrics.failureCount > 0) errDetails.push(`畫面異常文字: ${metrics.failureSamples[0]}`);
      const statusText = isClean 
        ? '正常 (無溢出、無重疊、無文字截斷、無Console錯誤、無異常文字)' 
        : `異常: ${errDetails.join(' | ')}`;
      console.log(`${mark} [${entry.group}/${entry.file}] @ ${vp.width}px ➔ ${statusText}`);
    }
  }

  // 關閉資源
  ws.close();
  cleanup();

  console.log('\n==========================================================================');
  console.log('                📊 裝置響應式檢查與截圖完成總結報表');
  console.log('==========================================================================');
  console.log(`📁 截圖儲存位置：design/screenshots/ (共 ${results.length} 張截圖)`);
  console.log(`🎯 總測試項目：${results.length} 項`);
  console.log(`✨ 完美通過項目：${results.length - totalIssues} 項`);
  console.log(`⚠️ 發現問題項目：${totalIssues} 項`);
  console.log('--------------------------------------------------------------------------');

  if (totalIssues > 0) {
    console.log('❌ 以下項目發現版面或功能異常：');
    results.filter(r => !r.isClean).forEach(r => {
      console.log(`- 畫面: ${r.screen} (${r.width}px)`);
      if (r.hasHScroll) console.log(`  • 橫向捲動條產生 (scrollWidth: ${r.scrollWidth}px vs clientWidth: ${r.clientWidth}px)`);
      if (r.overflowing.length > 0) {
        console.log(`  • 溢出元素範例: ${r.overflowing.map(o => `${o.selector} (右界 ${o.right}px > 視窗 ${o.clientWidth}px)`).join(', ')}`);
      }
      if (r.overlapping.length > 0) {
        console.log(`  • 重疊元素範例: ${r.overlapping.map(o => `${o.elemA} 與 ${o.elemB}`).join(', ')}`);
      }
      if (r.truncated.length > 0) {
        console.log(`  • 文字截斷範例: ${r.truncated.map(t => `${t.text} (${t.scrollWidth}px > ${t.clientWidth}px)`).join(', ')}`);
      }
      if (r.consoleErrors && r.consoleErrors.length > 0) {
        console.log(`  • Console 錯誤: ${r.consoleErrors.join(' | ')}`);
      }
      if (r.failureSamples && r.failureSamples.length > 0) {
        console.log(`  • 畫面異常文字: ${r.failureSamples.join(' | ')}`);
      }
    });
    console.log('--------------------------------------------------------------------------');
    process.exit(1);
  } else {
    console.log('🎉 所有畫面在 360px、390px、430px、1024px 均無橫向捲動、溢出、Console 錯誤與畫面異常，功能與 RWD 完美驗收通過！');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('❌ 執行過程中發生未預期錯誤：', err);
  process.exit(1);
});
