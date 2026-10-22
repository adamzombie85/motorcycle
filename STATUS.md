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

## 待決事項（Jim 決定）
1. ✅ 學習紀錄：(b) 學生用代號登入，教師頁可以看全班分析（2026-10-21 決定）。後端暫定 GAS ＋ Google 試算表，階段 1 再確認
2. ✅ 及格分數先設 85 分，上線前再查證新制標準
3. ✅ 概念卡等核心功能穩定後再做
4. ✅ 原始資料已移進 raw/
5. ✅ 分工調整：Gemini 負責視覺定調和插圖；題庫正確性改用程式交叉比對加 Jim 抽查
6. ✅ **範圍變更（2026-10-22）：給全校學生使用，採通用設計**。已改 AGENTS.md、任務單
   - 後端：Firebase；登入：**任何 Google 帳號**（2026-10-22 改為不限學校網域），一定要登入才能練習；只有管理者能看全部資料
   - 首次登入可填班級、座號（選填）
   - 學生可以下載自己的學習成果報告圖片分享給老師（C12、D2）
9. ✅ 管理者帳號：`adamzombie85@gmail.com`
10. ⏳ 上線前請向教務處／資訊組確認：學生用 Google 帳號登入、作答紀錄存在 Firebase，是否符合學校個資規定
7. ✅ 拿掉校名，頁尾改成「© 2026 41 研究室｜版權所有」。✅ 頁首保留網站名稱和使用者，閱讀輔助改成一個「⚙️ 閱讀設定」按鈕（Jim 2026-10-22 同意）→ D3
8. ⏳ 階段 1 規則（上方）有沒有要改的？

## 階段進度
| 階段 | 內容 | 主要負責 | 狀態 |
|---|---|---|---|
| 0 資料化 | 題庫轉 JSON、抽圖、影片壓縮、加標籤、程式交叉比對 | Claude → Jim 抽查 | ✅ 完成 |
| 1a 視覺定調 | tokens.css、首頁和答題畫面樣板 | Antigravity（Gemini） | ✅ D1、D2、D2b 完成 |
| 1 練習核心 | 小關卡、回饋、錯題重練、圖表 | Claude Code（照 design/ 實作，任務 C3～C12） | 🔄 C3～C8 ✅，C9 待執行 |
| 2 閱讀與學習設定 | 朗讀、注音、字級、反向題提醒（通用設計，每個人都可開關） | Antigravity D3 → Claude Code | ⏳ D3 待執行 |
| 3 概念卡 | 概念歸類、概念卡、數字記憶卡 | Claude（內容）＋ Claude Code（介面） | ⬜ |
| 4 危險感知與模擬考 | 影片模式、50 題模擬考、趨勢分析 | Claude Code | ⬜ |

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

## 開工提示詞

**Claude Code（貼在 Claude Code 輸入框）：**
```
讀 AGENTS.md、STATUS.md、TASKS_CODE.md，執行狀態為「待執行」的第一個任務。做完就停下來回報，等我確認再做下一個。
```

**Antigravity（在 Antigravity IDE 開新對話）：**
```
讀 AGENTS.md、STATUS.md 和 TASKS_AGY.md，執行 D2。只能修改 design/ 資料夾。
```
