# 專案狀態

最後更新：2026-10-22（Claude）

## 目前進度：建立協作環境
- ✅ Claude Code：握手測試通過、git 連上 GitHub
- ✅ Antigravity IDE：握手測試通過
- ✅ Gemini App：建立「機車題庫美術」Skill，hero.png 第 2 版通過
- **協作環境建置完成（2026-10-22）**

## 目前階段
**階段 1：練習核心**，任務單已開（2026-10-22）
- 階段 0 ✅、D1 視覺定調 ✅（commit 1f4129a）
- 可以同時進行：Claude Code 做 C3→C4→C5→C6（一次一個）；Antigravity 做 D2（只改 design/，不衝突）

### 階段 1 規則（Claude 建議，Jim 可推翻）
- 關卡：依小類切，照題庫原順序每 10 題一關；最後一關少於 5 題就併進前一關，共 92 關（2026-10-22 改）；影片題 126 題留到階段 4
- 不鎖關，學生可以自由選；一關 85 分以上算過關
- 錯題：答錯就進錯題庫，之後連續答對 2 次才移出（任何練習都算）
- 關卡名稱：只顯示「第 N 關」；逐關標題等階段 3 概念卡完成後由 Claude 提供
- 累計答對率：每題只看最近一次作答，答對率 ＝ 最近答對題數 ÷ 作答過的題數（2026-10-22 Claude 訂，Jim 可推翻）
- 選項不打亂（有「以上皆是」選項）
- 回饋只顯示對錯和正確答案，**不顯示解析、口訣**：題庫沒有這些資料，不能讓 AI 自己編（法規內容要 Jim 審核，留到階段 3 概念卡）
- 學習紀錄先存在瀏覽器（localStorage），透過 store.js 統一存取，之後接 Firebase 只改這個檔案

### D1 審查結果（Claude，2026-10-22）
- ✅ 色彩、元件、答題與結算畫面足夠開始做 C3～C6
- ⚠️ 樣板裡的「正確解析」「口訣」「記憶秘訣」是 Gemini 自己寫的示意文字，不是題庫內容，實作時不能照抄
- ⚠️ M0067 樣板的題目文字和「標誌標線」分類是示意；實際題幹是空的，小類是「事故預防及處理」
- ❌ 缺：代號登入、小類關卡清單、錯題庫頁、無題幹題目樣式 → 已開 D2
- ❌ 字級小於 18px：`.pass-mark-label` 14px、首頁徽章 14px；Chart.js 預設 12px → D2 修正、C6 設定

### 階段 0 進度
- ✅ 筆試題庫：806 題 → `data/questions_main.json`，148 張圖 → `media/images/`
  - 程式交叉比對：答案不一致 0、文字不一致 0（`data/verify_main_report.json`）
  - 大類：正確觀念與態度 480／主動停讓文化 92／安全駕駛能力 234
  - 標籤：有圖 148、數字題 142、罰鍰題 103、反向題 52（2026-10-22 人工審查後修正）
  - ✅ Jim 抽查 50 題全部正確（2026-10-22）
- ✅ 情境式題目 120 題 → `data/questions_scenario.json`，圖 → `media/images/S001～S120.jpg`；交叉比對零不一致；反向題 6 題
  - 另一個 Claude 對話也獨立做了一份，逐題比對完全一致（第三次驗證）。重複檔案已移到 `_to_delete/`
- ✅ 危險感知影片 126 題 → `data/questions_video.json`；交叉比對零不一致
- ✅ 影片：126 支中 17 支重複，實際 109 支，轉 480p 共 173MB → `media/videos/`（對照表 `data/video_duplicates.json`）
- ✅ 合併題庫 → `data/questions.json` 共 1,052 題（正確觀念與態度 480／主動停讓文化 92／安全駕駛能力 234／危險感知 246）
- ✅ Jim 抽查（二）20 題全部正確（2026-10-22）
- 📝 修正先前分析：筆試題庫是 806 題（不是 804），反向題約 54 題（先前估計 148 題偏高）

## 待決事項（Jim 決定 / 給 Claude Code 引擎調整）
1. ✅ 學習紀錄：(b) 學生用代號登入，教師頁可以看全班分析（2026-10-21 決定）。後端暫定 GAS ＋ Google 試算表，階段 1 再確認
2. ✅ 及格分數 85 分（題庫 M0329 也寫「交通規則 85 分」）；上線前再查證新制標準
3. ✅ 概念卡等核心功能穩定後再做
4. ✅ 原始資料已移進 raw/
5. ✅ 分工調整：Gemini 負責視覺定調和插圖；題庫正確性改用程式交叉比對加 Jim 抽查
6. ✅ **範圍變更（2026-10-22）：給全校學生使用，採通用設計**。已改 AGENTS.md、任務單
   - 後端：Firebase；登入：**任何 Google 帳號**（2026-10-22 改為不限學校網域），一定要登入才能練習；只有管理者能看全部資料
   - 首次登入可填班級、座號（選填）
   - 學生可以下載自己的學習成果報告圖片分享給老師（C12、D2）
9. ✅ 管理者帳號：`adamzombie85@gmail.com`
10. ⏳ 上線前請向教務處／資訊組確認：學生用 Google 帳號登入、作答紀錄存在 Firebase，是否符合學校個資規定
11. ✅ 公開範圍（C9 回報）：題庫是監理機關公開資料，網站公開沒問題；**repo 本身是公開的**，所以 AGENTS.md、STATUS.md、docs/ 在 github.com 上本來就看得到（Pages 不放只是網址上打不開）。學生資料會存在 Firebase，不在 repo 裡。是否加 noindex（不讓 Google 搜尋到）留到正式推廣前再決定
12. 📌 網址：https://adamzombie85.github.io/motorcycle/
7. ✅ 拿掉校名，頁尾改成「© 2026 41 研究室｜版權所有」。✅ 頁首保留網站名稱和使用者，閱讀輔助改成一個「⚙️ 閱讀設定」按鈕（Jim 2026-10-22 同意）→ D3
8. ⏳ 階段 1 規則（上方）有沒有要改的？
13. ⏳ **（A8 待決事項／給 Claude Code 引擎調整）**：
    - `site/js/data.js`：目前 `EXCLUDED_SOURCES = ['影片']` 預設排除影片題。建議移除 `'影片'` 排除或提供原生影片題分關支援，使 `Data.getLevels()` 原生輸出 105 關（含 13 個影片關卡）。
    - `site/js/game.js`：`SEGMENTS[4].subs` 目前為 `['情境式題目']`，請將 `'影片題'` 加入第 5 路段子類別，使全地圖站點統一為 105 站。
    - `site/js/exam.js`：模擬考預設設定建議調整為 `includeVideo: true`，讓 15 題危險感知自然含情境題與影片題。

## 階段進度
| 階段 | 內容 | 主要負責 | 狀態 |
|---|---|---|---|
| 0 資料化 | 題庫轉 JSON、抽圖、影片壓縮、加標籤、程式交叉比對 | Claude → Jim 抽查 | ✅ 完成 |
| 1a 視覺定調 | tokens.css、首頁和答題畫面樣板 | Antigravity（Gemini） | ✅ D1、D2、D2b 完成 |
| 1 練習核心 | 小關卡、回饋、錯題重練、圖表 | Claude Code（照 design/ 實作，任務 C3～C12） | 🔄 C3～C9 ✅（已上線），等 Jim 手機實測 → C10 |
| 1.5 質感與遊戲化 | 專業視覺、每日挑戰、連續天數、地圖、徽章、間隔複習、動畫音效、角色（規格 `docs/遊戲化設計.md`） | Antigravity D4→A1→A2＋R1 審查、Gemini 插圖、Claude Code C13、C16 | 🔄 C13 ✅；D4 進行中 → R1 → A1 → A2 |
| ★ 學生試玩 | 3～5 位學生（含資源班學生）試玩，Claude 準備觀察表 | Jim | ⬜ |
| 2 閱讀與學習設定 | 朗讀、注音、字級、反向題提醒、音效、動畫、確認作答 | Antigravity D3 ✅ → Claude Code C14 | ⏳ |
| 3 概念卡 | 概念歸類、概念卡、數字記憶卡 | Claude（內容）＋ Claude Code（介面） | ⬜ |
| 4 危險感知與模擬考 | 影片模式、50 題模擬考、趨勢分析 | 引擎 Claude Code ✅（截圖表、exam.js）；Antigravity V2 標註、A5 畫面 | 🔄 |

## 交接紀錄
| 日期 | 誰 | 做了什麼 | 下一棒 |
|---|---|---|---|
| 2026-10-21 | Claude | 建立協作骨架與規格書 | Jim：回答待決事項 |
| 2026-10-21 | Claude | 記錄決定、調整分工、原始資料移入 raw/ | Claude：階段 0 |
| 2026-10-21 | Claude | 筆試題庫轉 JSON、交叉比對、產生抽查頁 | Jim：抽查 |
| 2026-10-21 | Claude | 建立 .gitignore、Antigravity 規則、TASKS_CODE.md | Jim：三邊環境設定 |
| 2026-10-21 | Claude Code | C0 完成：git init、連到 adamzombie85/motorcycle、合併 LICENSE、首次 commit 並 push（raw/ 已排除） | Jim：確認 GitHub 內容；Antigravity：視覺定調 |
| 2026-10-22 | Claude | 筆試題庫抽查通過；情境式題目 120 題轉 JSON、抽圖、交叉比對、產生抽查頁 | Jim：抽查情境題 |
| 2026-10-22 | Claude | 記錄 Antigravity 握手測試通過 | Jim：建 Gem、抽查題庫 |
| 2026-10-22 | Claude | 協作環境完成；hero.png 通過 | Jim：存 hero.png、抽查題庫 |
| 2026-10-22 | Claude | 情境題、影片題轉檔與比對，影片壓縮，合併題庫 | Jim：抽查（二） |
| 2026-10-22 | Claude | 發現兩個 Claude 對話同時當大腦；重複檔案移到 _to_delete/、修正 STATUS.md | Jim：決定只保留一個大腦對話 |
| 2026-10-22 | Claude | 階段 0 完成；AGENTS.md 加入「大腦只能有一個」；開放 C2、D1 | Jim：請 Claude Code 執行 C2 |
| 2026-10-22 | Claude Code | C2 完成：階段 0 全部 commit 並 push（題庫 1,052 題、圖片、109 支影片；_to_delete/、raw/ 已排除） | Antigravity：D1 視覺定調 |
| 2026-10-22 | Claude Code | 代為存檔 Antigravity 的 D1 中途成果（design/tokens.css、components.css）；D1 尚缺 components.html、三個畫面樣板、README.md | Antigravity：完成 D1 剩餘項目 |
| 2026-10-22 | Claude | 審查 D1；開 D2（補畫面）；寫階段 1 任務單 C3～C10 | Claude Code：C3；Antigravity：D2 |
| 2026-10-22 | Claude Code | C3 完成：site/js/data.js（排除影片題、每 10 題一關，共 97 關）、site/js/store.js（localStorage，依代號分開存） | Jim：確認；Claude Code：C4 |
| 2026-10-22 | Claude | 範圍改為全校＋通用設計；後端改 Firebase、學校 Google 登入；更新 AGENTS.md、C8/C10/C11、D2 | Claude Code：C3；Antigravity：D2 |
| 2026-10-22 | Claude | 登入改為不限網域的 Google 帳號；新增 C12 學習成果報告、D2 報告樣板 | Claude Code：C3；Antigravity：D2 |
| 2026-10-22 | Claude | 管理者帳號確定，寫入 AGENTS.md、C10 | Claude Code：C3；Antigravity：D2 |
| 2026-10-22 | Claude | 審查 C3 通過（97 關、926 題、代號分開存，Node 實測）；整理交接紀錄位置 | Claude Code：C4 |
| 2026-10-22 | Claude | C4 加入「少於 5 題併入前一關」（92 關）；放寬 Claude Code 存檔範圍為 design/ 以外 | Claude Code：C4 |
| 2026-10-22 | Claude Code | C4 完成：關卡規則改為 92 關（最後一關少於 5 題併入前一關，最大 14 題）；做出 site/quiz.html（進度圓點、反向題橫幅與標記、空題幹提示句、即時對錯回饋）。結算頁 result.html 尚未做（C6），答完會跳到它 | Jim：確認；Claude Code：C5 |
| 2026-10-22 | Claude | 審查 C4 通過；反向題標籤修正（去除 6 題誤判、補 M0247，共 64 題，`scripts/tag_reverse.py`）；C9、C10 補上路徑與訪客處理 | Claude Code：C5 |
| 2026-10-22 | Claude Code | C5 完成：store.js 加 recordAnswer（答錯入庫、連續答對 2 次移出）；quiz.html?mode=mistakes 錯題重練（最多 10 題）；回饋卡顯示 mistake-retest-notice。重練的作答紀錄 levelId 為 mistakes、mode 為 mistakes，C6 結算頁要處理 result.html?mode=mistakes | Jim：確認；Claude Code：C6 |
| 2026-10-22 | Claude | 審查 C5 通過；C6 補上錯題重練結算與累計答對率算法；確認 commit 內的 data/ 標籤正確 | Claude Code：C6 |
| 2026-10-22 | Claude | 審查 D2：Antigravity 照舊版任務單做，登入、報告頁、通用設計字眼、頁尾未完成 → 開 D2b | Claude Code：存檔 design/；Antigravity：D2b |
| 2026-10-22 | Claude Code | C6 完成：site/result.html（成績、85 分判定、雷達／長條／折線圖、下一步建議、本次錯題、匯出 PNG）、site/js/stats.js（累計答對率：每題只看最近一次）；?mode=mistakes 結算無過關判定與折線圖，顯示移出題數與錯題庫剩餘。quiz.js 的作答紀錄新增 clearedCount | Jim：確認；Claude Code：C9（C7、C8 等 D2） |
| 2026-10-22 | Claude | 確認 design 存檔 882f655；審查 C6 通過；開放 C7、C8（順序 C7→C8→C9） | Claude Code：C7；Antigravity：D2b |
| 2026-10-22 | Claude Code | C7 完成：site/index.html（首頁）、site/levels.html?sub=小類（關卡清單）、site/css/pages.css、home.js、levels.js；Stats 新增 bestScores。反向題專區、數字翻卡、模擬考顯示「即將推出」；錯題庫入口連到 mistakes.html（C8 才有）；頁尾「© 2026 41 研究室｜版權所有」 | Jim：確認；Claude Code：C8 |
| 2026-10-22 | Claude | 審查 C7 通過；C9 補快取版本號；頁首建議改為單一「閱讀設定」按鈕（待 Jim） | Claude Code：C8 |
| 2026-10-22 | Claude | 審查 D2b 通過（遺留 1 處 IEP）；AGENTS.md 禁用字加入 IEP；.agents/rules 新增第 6 條待 Jim 確認 | Claude Code：C8 後存檔 design/ |
| 2026-10-22 | Claude Code | C8 完成：site/mistakes.html（有錯題清單、連續答對進度、單獨複習；沒錯題鼓勵畫面）、mistakes.js、mistakes.css；quiz.html 新增 ?mode=mistakes&qid=題號 單題複習 | Jim：確認；Claude Code：C9 |
| 2026-10-22 | Claude | 審查 C8 通過；錯題重練按鈕維持 btn-primary；C9 補上 Jim 要做的 GitHub 設定 | Claude Code：存檔 D2b → C9 |
| 2026-10-22 | Claude | 開 D3 閱讀設定面板（單一按鈕、字級／注音／朗讀／反向題提醒） | Antigravity：D3 |
| 2026-10-22 | Claude Code | C9 進行中：data.js 加 DATA_VERSION（題庫網址加 ?v=）；新增 .github/workflows/pages.yml（只部署 site/、tokens.css、components.css、questions.json、media/；部署時自動在 js/css 連結加 commit 版本號；根目錄轉址到 site/index.html） | Jim：GitHub 設定 Pages；手機測試 |
| 2026-10-22 | Claude Code | C9 完成：已部署 https://adamzombie85.github.io/motorcycle/ （頁面、題庫、圖片、影片都 200；STATUS.md、docs/、TASKS_*.md、scripts/、raw/ 為 404，沒有公開）。快取版本號：題庫 DATA_VERSION，js/css 自動加 commit 版本 | Jim：用手機做完一關測試 |
| 2026-10-22 | Claude | 審查 C9 通過（workflow 只部署必要檔案、版本號機制正確）；記錄公開範圍說明 | Jim：手機實測；之後建 Firebase 專案 → C10 |
| 2026-10-22 | Claude | Jim 手機實測回饋；決定 1～7 遊戲化全做、順序：精修＋遊戲化 → 試玩 → 登入。寫 docs/遊戲化設計.md、D4、插圖 4 組、C13～C16；D3 審查通過（注音字型未載入，C14 處理） | Antigravity：D4；Claude Code：C13；Jim：Gemini 第 1 組徽章 |
| 2026-10-22 | Claude | 依 Jim 要求重新分配額度：畫面工程、測試、交叉審查改由 Antigravity（A1、A2、R1）；Claude Code 只做引擎；兩邊各自存檔；更新 AGENTS.md、.agents/rules | Claude Code：C13；Antigravity：D4 |
| 2026-10-22 | Claude Code | C13 完成：D3 已存檔（80cbe38）；site/js/game.js（每日挑戰、連續天數＋休息卡、間隔複習、12 徽章、角色、地圖）；store.js 新增 Store.now/setClock、作答紀錄（每答一題就存）、複習到期日、通用文件 getDoc/setDoc；stats.js 改讀作答紀錄；測試 node site/tests/game-test.js 42 項全過；部署時排除 tests/ | Antigravity：D4 畫面（呼叫 Game.* 與 Store.recordAnswer(qid, correct, {choice, src})） |
| 2026-10-22 | Claude | 抽查 C13（42 項測試通過）；採用 a～e 判斷；開放 R1；A2 寫入引擎呼叫方式 | Antigravity：D4 → R1 |
| 2026-10-23 | Claude | Gemini 插圖 5 組全部審查通過（41 張，含女生版與雙人圖），完成後製 | Antigravity：D4 → R1 → A1 |
| 2026-10-23 | Claude | 開 C17 概念分類初稿（提前做階段 3，用 Claude 本週剩餘額度；逐小類、只根據題目歸納） | Claude Code：C17 第一個小類 |
| 2026-10-23 | Claude Code | C17 第 1 個小類「貨物裝載」初稿完成（17 題→10 個概念、覆蓋 100%、無矛盾）；data/concepts/draft-01-貨物裝載.json、docs/概念卡審核-01.html；產生器 data/concepts/make-review.py | Jim：審核 docs/概念卡審核-01.html，確認格式後才做下一小類 |
| 2026-10-23 | Claude | 審查 D4：質感大幅進步；360px 頁首重疊、文案 AI 腔、反向題橫幅文字、換行、插圖未接上 → 併入 A1 | Antigravity：R1 → A1 |
| 2026-10-23 | Claude Code | C17 全部 11 個小類完成：926 題→287 個概念（覆蓋 100%、無重複）；初稿 data/concepts/draft-01~11-*.json，審核頁 docs/概念卡審核-01~11.html；有疑似矛盾 7 處（見審核頁⚠） | Jim：審核 02～11；Claude：抽查規則、裁決矛盾 |
| 2026-10-23 | Claude | 審查 C17：規則皆來自題目；7 處矛盾 5 處裁定為不同情況、2 處待 Jim；看圖題改一題一卡 → C17b | Claude Code：C17b；Jim：等 C17b 後審核 |
| 2026-10-23 | Claude Code | C17b 完成：照 5 項裁決拆分／合併；看圖題改一題一張圖卡（268 張）；共 490 張卡（文字概念 222）；剩 3 個 ⚠（C-jct-06b、S060、S099）；審核頁 01～11 已重產 | Jim：審核；Claude：抽查 |
| 2026-10-23 | Claude | 抽查 C17b 通過 | Jim：審核概念卡 01～11（先看 3 個 ⚠ 和文字概念） |
| 2026-10-23 | Claude | Jim 審 3 個 ⚠ 完成（記在 docs/概念卡-Jim審核紀錄.md）；看圖題改為比較卡，原則可引用有條號的官方法規 → 開 V1 給 Antigravity | Antigravity：A1 → V1；Jim：審文字概念卡 |
| 2026-10-23 | Claude | 審查 A1（ea5225c）與 R1：假資料外漏、字型 7.4MB、截圖不是真畫面 → A1b；引擎 ISSUE-01/03/05 → C18；順序 A1b→A2→V1 | Antigravity：A1b；Claude Code：C18 |
| 2026-10-23 | Claude Code | C18 完成：ISSUE-05（getStreak week 新增 'before'）、ISSUE-01（每日挑戰跨午夜算開始那天，dailyDate）、ISSUE-03（確認無影片題）；game-test 49/49 | Antigravity：週打卡格要處理 'before'；每日挑戰畫面可沿用 getDaily() 自動接續 |
| 2026-10-23 | Claude | C18 通過（49/49）；A1b 第 5 點開放 | Antigravity：A1b、A2 |
| 2026-10-23 | Claude Code | C16 引擎完成：Store.resetMe / exportMe / importRecord、Game.summary、site/tests/sample-record.json；game-test 58/58 | Antigravity：設定頁「重設我的紀錄」「匯出紀錄」按鈕、老師檢視頁（讀檔→Game.summary） |
| 2026-10-23 | Claude | C16 通過（58/58）；A3 開放；完成 docs/試玩觀察表.html | Antigravity：A1b → A2 → A3 → V1 |
| 2026-10-23 | Claude | A1b（字型 505KB）、A2、A3 完成；截圖發現地圖頁載入失敗、題目欄過窄、原字型檔未刪 → A2b；自動檢查要加功能檢查 | Antigravity：A2b → V1 |
| 2026-10-23 | Claude Code | C19 完成：149 張文字卡改短／加白話（revised、before；審核頁顯示修改前後）；C20 完成：數字卡 80 筆、12 組易混淆（data/concepts/numbers-draft.json、docs/數字卡審核.html，產生器 make-numbers.py） | Jim：審核；Claude：抽查 |
| 2026-10-23 | Claude | C19（149 張改寫）、C20（80 筆數字卡）抽查通過；5 筆弱出處其實有效；7 張超長卡要拆 → C19b | Claude Code：C19b；Jim：審文字概念卡 |
| 2026-10-23 | Claude Code | C19b 完成：7 張超長卡拆成 34 張（題目跟著分，覆蓋 926 題 100%）；數字卡 5 筆弱出處改為有效並加 source_note，之後由程式自動判斷 | Jim：審核 |
| 2026-10-23 | Claude Code | C10a 完成（預設 local、未啟用）：Store.setBackend／applyRemote／訪客匯入、config.js、store-firebase.js、firestore.rules、firebase-tests（需 Java，沒跑）、docs/Firebase建置步驟.md、docs/Firestore規則測試清單.md；game-test 58/58、firebase-sync-test 15/15 | Jim：試玩後照建置步驟建專案；Antigravity：登入頁、班級座號、訪客匯入詢問（C10 畫面） |
| 2026-10-23 | Claude | C10a 通過（Firebase 預備，預設 local）；Claude Code 誤存 Antigravity 半成品（c49a5dd），不改歷史，CLAUDE.md 加規則禁止 git add -A；開 A4（試玩後） | Antigravity：A2b → V1 |
| 2026-10-23 | Claude Code | 階段 4 引擎前置：scripts/make_contact_sheets.py（109 張截圖表在 assets-src/contact-sheets/，不上 GitHub；data/video_tasks.json 109 支影片／126 題）；site/js/exam.js 模擬考出題引擎（50 題、危險感知 15、其餘 21／10／4、不重複、同影片一題；exam-test 23/23）；Data.getAllQuestions | Claude：用截圖表請 Gemini 標危險秒數；Antigravity：模擬考畫面 |
| 2026-10-23 | Claude | 階段 4 引擎完成（109 張截圖表、video_tasks.json、exam.js 23/23）；開 V2 危險標註、A5 模擬考畫面 | Antigravity：A2b → V1 → V2 → A5 |
| 2026-10-23 | Claude | A2b 通過；V1 抽查發現法規條號編造（第 7 條≠手勢）→ C21 下載法規全文＋驗證程式、V1b 補逐字引用；V2 先做 | Claude Code：C21；Antigravity：V2 → A5 → V1b |
| 2026-10-23 | Claude Code | C21 完成：兩部法規全文（全國法規資料庫，設置規則 273 條／安全規則 185 條）存 assets-src/laws/（不上 GitHub）；scripts/parse_laws.py、scripts/verify_citations.py；對 compare-draft.json 跑：90 條外部依據 0 通過（89 條缺 quote、1 條條號不存在：安全規則第 88-2 條）；25 條疑似張冠李戴（--hint） | Claude：請 Gemini 補 quote 後重跑；Antigravity：比較卡 |
| 2026-10-23 | Claude | C21 通過：驗證程式確認 1 條條號編造、25 條疑似張冠李戴；V1b 開放 | Antigravity：V2 → A5 → V1b |
| 2026-10-24 | Claude | 閱讀設定面板沒有樣式（settings.js 自創 class、CSS 未定義）→ C22，Jim 指定 Claude Code 修 | Claude Code：C22 |
| 2026-10-24 | Claude Code | C22 完成：閱讀設定面板改用設計系統 class（drawer-*、setting-card、toggle-wrapper、segmented-group），新增 site/css/settings.css 並加到 10 個頁面；手機底部滑出（85vh）／電腦右側 420px、固定標題列與按鈕列、分 3 組、進階區（重設需二次確認）、焦點管理與 Esc；check-screens.mjs 新增設定面板檢查（--only-settings）；全部 90 項通過；截圖 design/screenshots/settings_{360,1024}[_bottom].png | Antigravity：可恢復修改 settings.js／css；Claude：驗收 |
| 2026-10-24 | Claude | C22 通過；Jim 真機發現今日挑戰打不開、全部關卡只有 2 關、地圖不是路線 → C23 流程測試＋修正（Claude Code）、A6 重做地圖（Antigravity）；以後回報前都要跑 e2e | Claude Code：C23；Antigravity：A6 |
| 2026-10-24 | Claude Code | C23 完成：新增 site/tests/e2e.mjs（6 個流程 21 步，含地圖）；修好今日挑戰（startDaily 用錯 d.questions、daily 作答重複記錄；完成畫面改在 quiz 內）、全部關卡（levels.html 無 ?sub= 顯示 4 大類／11 小類／92 關，可收合，levels-all.css）、關卡文字（每關 7～14 題、移除題號範圍）、錯誤訊息不再出現 localhost（quiz／levels／home／mistakes／result／exam-page，真正錯誤寫 console）；另修模擬考：沒有學生代號時顯示「尚未設定」、題目圖片路徑 404（exam-page.js）；AGENTS.md 交接規則加第 4 條「回報前跑 e2e」 | Antigravity：回報前跑 node site/tests/e2e.mjs；Claude：驗收 |
| 2026-10-24 | Claude | Jim 真機：朗讀不讀選項、自動朗讀 iPhone 無效；學習成果報告頁從未實作（首頁連到不存在的關卡）→ A7 | Antigravity：A7 |
| 2026-10-24 | Claude | Jim 審完 109 支影片標註（修正 33 支，Gemini 多數標太晚）→ 定稿 data/video_hazards.json；開 A8 影片模式 | Antigravity：A8 |
| 2026-10-24 | Claude | 審查 A8 通過（解析內容來自 Jim 審核的標註）；畫面端自拼 13 關 → C24 引擎支援影片題（105 關） | Claude Code：C24＋push |
| 2026-10-24 | Claude Code | C24 完成：data.js 納入影片題（105 關，影片題 13 關）；game.js 第 5 路段加影片題、每日挑戰最多 1 題影片題（含到期錯題）；exam.js includeVideo 預設 true；刪除 levels.js／map.js 臨時補關卡；home／report／map 的「92」改成引擎的關數；deploy workflow 補複製 data/video_hazards.json（否則線上讀不到危險秒數）；e2e 34 步全過（新增「總關卡數一致」流程）、game-test 59、exam-test 23、check-screens 94 項 | Claude：驗收 |

## 開工提示詞

**Claude Code（貼在 Claude Code 輸入框）：**
```
讀 AGENTS.md、STATUS.md、TASKS_CODE.md，執行狀態為「待執行」的第一個任務。做完就停下來回報，等我確認再做下一個。
```

**Antigravity（在 Antigravity IDE 開新對話）：**
```
讀 AGENTS.md、STATUS.md 和 TASKS_AGY.md，執行 D2。只能修改 design/ 資料夾。
```
