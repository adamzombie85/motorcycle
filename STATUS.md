# 專案狀態

最後更新：2026-10-22（Claude）

## 目前進度：建立協作環境
- ✅ Claude Code：握手測試通過、git 連上 GitHub
- ✅ Antigravity IDE：握手測試通過
- ✅ Gemini App：建立「機車題庫美術」Skill，hero.png 第 2 版通過
- **協作環境建置完成（2026-10-22）**

## 目前階段
**階段 0：資料化**，✅ 完成（2026-10-22）
**下一步：** Claude Code 存檔（C2）→ Antigravity 視覺定調（D1）

### 階段 0 進度
- ✅ 筆試題庫：806 題 → `data/questions_main.json`，148 張圖 → `media/images/`
  - 程式交叉比對：答案不一致 0、文字不一致 0（`data/verify_main_report.json`）
  - 大類：正確觀念與態度 480／主動停讓文化 92／安全駕駛能力 234
  - 標籤：有圖 148、數字題 142、罰鍰題 103、反向題 54
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

## 階段進度
| 階段 | 內容 | 主要負責 | 狀態 |
|---|---|---|---|
| 0 資料化 | 題庫轉 JSON、抽圖、影片壓縮、加標籤、程式交叉比對 | Claude → Jim 抽查 | ✅ 完成 |
| 1a 視覺定調 | tokens.css、首頁和答題畫面樣板 | Antigravity（Gemini） | ⏳ 已開放 |
| 1 練習核心 | 小關卡、回饋、錯題重練、圖表 | Claude Code（照 design/ 實作） | ⬜ |
| 2 特教輔助 | 朗讀、注音、字級、反向題提醒 | Claude Code | ⬜ |
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
