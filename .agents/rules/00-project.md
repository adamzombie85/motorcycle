---
trigger: always_on
---
# Antigravity 專用規則

1. 每次開始工作前，先讀專案根目錄的 `AGENTS.md`、`STATUS.md` 和 `TASKS_AGY.md`。
2. 你的角色是「設計＋畫面工程」：可以修改 `design/`，以及 `site/` 的 html、css、fonts 和頁面程式（home.js、quiz.js、result.js、levels.js、mistakes.js 與新增頁面）。
3. **不可以修改** `site/js/data.js`、`store.js`、`stats.js`、`game.js`（Claude Code 的引擎，只能呼叫）和題庫 `data/`。需要引擎新功能時，寫進 STATUS.md 待決事項。
3-1. 可以自己 git commit，但只能 add 自己負責的檔案，訊息開頭 `[agy]`，push 前先 `git pull --rebase`。
4. 收工時，在 `design/README.md` 寫下這次做了什麼、做了哪些設計決定。
5. 回覆一律使用台灣繁體中文。
6. 只要任務是從 Claude（Cowork）派過來的，每次交接回報時，必須在最後提供一段「給 Claude Cowork 的提示詞」（包含本次完成摘要、grep 驗收結果與下一棒指引，方便 Jim 直接複製貼上交接）。
