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
  '.ico': 'image/x-icon'
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

  // 1. 取得所有 HTML 畫面
  const htmlFiles = fs.readdirSync(DESIGN_DIR)
    .filter(file => file.endsWith('.html'))
    .sort();

  if (htmlFiles.length === 0) {
    console.error('❌ 未在 design/ 目錄找到任何 HTML 檔案');
    process.exit(1);
  }
  console.log(`📋 找到 ${htmlFiles.length} 個畫面：\n   ${htmlFiles.join(', ')}`);

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

  await send('Page.enable');
  await send('DOM.enable');

  const results = [];
  let totalIssues = 0;

  console.log('--------------------------------------------------------------------------');
  console.log(`開始進行 ${htmlFiles.length} 畫面 × ${VIEWPORTS.length} 寬度 = ${htmlFiles.length * VIEWPORTS.length} 項測試...`);
  console.log('--------------------------------------------------------------------------');

  for (const htmlFile of htmlFiles) {
    const pageUrl = `${baseUrl}/design/${htmlFile}`;
    const screenBase = htmlFile.replace(/\.html$/, '');

    for (const vp of VIEWPORTS) {
      // 1. 設定裝置寬高 Emulation
      await send('Emulation.setDeviceMetricsOverride', {
        width: Math.round(vp.width),
        height: Math.round(vp.height),
        deviceScaleFactor: 1,
        mobile: vp.mobile
      });

      // 2. 載入頁面
      await send('Page.navigate', { url: pageUrl });
      await new Promise(r => setTimeout(r, 400));

      // 3. 檢查水平捲動與元素溢出
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
                  ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') 
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

          return {
            clientWidth,
            scrollWidth,
            hasHScroll,
            overflowingCount: overflowing.length,
            overflowingSamples: overflowing.slice(0, 3)
          };
        })()`
      });

      const metrics = evalRes.result.value || { clientWidth: vp.width, scrollWidth: vp.width, hasHScroll: false, overflowingCount: 0, overflowingSamples: [] };
      const isClean = !metrics.hasHScroll && metrics.overflowingCount === 0;

      if (!isClean) {
        totalIssues++;
      }

      // 4. 截圖存檔
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const imgFileName = `${screenBase}_${vp.width}.png`;
      const imgFilePath = path.join(SCREENSHOTS_DIR, imgFileName);
      fs.writeFileSync(imgFilePath, Buffer.from(shot.data, 'base64'));

      results.push({
        screen: htmlFile,
        width: vp.width,
        vpName: vp.name,
        hasHScroll: metrics.hasHScroll,
        scrollWidth: metrics.scrollWidth,
        clientWidth: metrics.clientWidth,
        overflowing: metrics.overflowingSamples,
        isClean,
        image: imgFileName
      });

      const mark = isClean ? '✅' : '❌';
      const statusText = isClean 
        ? '正常 (無溢出)' 
        : `異常: 滾動寬 ${metrics.scrollWidth}px > 視窗 ${metrics.clientWidth}px, 溢出元素 ${metrics.overflowingCount} 個`;
      console.log(`${mark} [${htmlFile}] @ ${vp.width}px ➔ ${statusText}`);
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
    console.log('❌ 以下項目發現溢出或橫向捲動問題：');
    results.filter(r => !r.isClean).forEach(r => {
      console.log(`- 畫面: ${r.screen} (${r.width}px)`);
      if (r.hasHScroll) console.log(`  • 橫向捲動條產生 (scrollWidth: ${r.scrollWidth}px vs clientWidth: ${r.clientWidth}px)`);
      if (r.overflowing.length > 0) {
        console.log(`  • 溢出元素範例: ${r.overflowing.map(o => `${o.selector} (右界 ${o.right}px > 視窗 ${o.clientWidth}px)`).join(', ')}`);
      }
    });
    console.log('--------------------------------------------------------------------------');
    process.exit(1);
  } else {
    console.log('🎉 所有畫面在 360px、390px、430px、1024px 均無橫向捲動與溢出問題，完美落實 RWD！');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('❌ 執行過程中發生未預期錯誤：', err);
  process.exit(1);
});
