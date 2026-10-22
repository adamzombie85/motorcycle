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
- 關卡：依小類切，照題庫原順序每 10 題一關，共 97 關；影片題 126 題留到階段 4
- 不鎖關，學生可以自由選；一關 85 分以上算過關
- 錯題：答錯就進錯題庫，之後連續答對 2 次才移出
- 選項不打亂（有「以上皆是」選項）
- 回饋只顯示對錯和正確答案，**不顯示解析、口訣**：題庫沒有這些資料，不能讓 AI 自己編（法規內容要 Jim 審核，留到階段 3 概念卡）
- 學習紀錄先存在瀏覽器（localStorage），透過 store.js 統一存取，之後換 GAS 只改一個檔案

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
6. ⏳ 後端確定用 GAS ＋ Google 試算表嗎？（影響 C10；C3～C9 不受影響）
7. ⏳ 首頁頁尾寫著「國立玉井工商輔導室」，這是 Gemini 自己加的。要保留、改成其他文字，還是拿掉？
8. ⏳ 階段 1 規則（上方）有沒有要改的？

## 階段進度
| 階段 | 內容 | 主要負責 | 狀態 |
|---|---|---|---|
| 0 資料化 | 題庫轉 JSON、抽圖、影片壓縮、加標籤、程式交叉比對 | Claude → Jim 抽查 | ✅ 完成 |
| 1a 視覺定調 | tokens.css、首頁和答題畫面樣板 | Antigravity（Gemini） | ✅ D1 完成；D2 補畫面 ⏳ |
| 1 練習核心 | 小關卡、回饋、錯題重練、圖表 | Claude Code（照 design/ 實作，任務 C3～C10） | ⏳ C3 待執行 |
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
| 2026-10-22 | Claude | 審查 D1；開 D2（補畫面）；寫階段 1 任務單 C3～C10 | Claude Code：C3；Antigravity：D2 |
| 2026-10-22 | Claude Code | C3 完成：site/js/data.js（排除影片題、每 10 題一關，共 97 關）、site/js/store.js（localStorage，依代號分開存） | Jim：確認；Claude Code：C4 |

## 開工提示詞

**Claude Code（貼在 Claude Code 輸入框）：**
```
讀 AGENTS.md、STATUS.md、TASKS_CODE.md，執行狀態為「待執行」的第一個任務。做完就停下來回報，等我確認再做下一個。
```

**Antigravity（在 Antigravity IDE 開新對話）：**
```
讀 AGENTS.md、STATUS.md 和 TASKS_AGY.md，執行 D2。只能修改 design/ 資料夾。
```
