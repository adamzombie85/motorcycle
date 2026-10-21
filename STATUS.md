# 專案狀態

最後更新：2026-10-21（Claude）

## 目前進度：建立協作環境
- ⏳ Jim：在 Claude Code、Antigravity、Gemini 三邊完成設定（見 協作筆記.md 的檢查清單）

## 目前階段
**階段 0：資料化**，進行中（Claude）

### 階段 0 進度
- ✅ 筆試題庫：806 題 → `data/questions_main.json`，148 張圖 → `media/images/`
  - 程式交叉比對：答案不一致 0、文字不一致 0（`data/verify_main_report.json`）
  - 大類：正確觀念與態度 480／主動停讓文化 92／安全駕駛能力 234
  - 標籤：有圖 148、數字題 142、罰鍰題 103、反向題 54
  - ⏳ 等 Jim 抽查：`docs/階段0抽查.html`
- ⬜ 情境式題目 120 題
- ⬜ 危險感知影片 126 題＋影片壓縮
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
| 0 資料化 | 題庫轉 JSON、抽圖、影片壓縮、加標籤、程式交叉比對 | Claude → Jim 抽查 | 🔄 進行中 |
| 1a 視覺定調 | tokens.css、首頁和答題畫面樣板 | Antigravity（Gemini） | ⬜ |
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
