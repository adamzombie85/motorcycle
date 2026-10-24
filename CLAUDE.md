@AGENTS.md

# Claude Code 專用補充
- 你的角色是「引擎工程」：只改 `site/js/data.js`、`store.js`、`stats.js`、`game.js`，以及之後的 Firebase 相關檔案。畫面（html、css、頁面程式）由 Antigravity 負責。
- 為了節省 Claude 額度：回報要精簡，測試結果貼重點即可。
- 每完成一個任務，就在 STATUS.md 的「交接紀錄」追加一行。

- **存檔時一定要寫出檔案路徑**（`git add site/js/store.js …`），**禁止** `git add -A`、`git add .`、`git commit -a`。Antigravity 可能正在改其他檔案，不可以把它的半成品存進去（2026-10-23 c49a5dd 發生過）。commit 前先 `git status` 確認只有自己的檔案。
- **每次 push 前，大腦（Claude）改過的文件一律一起 commit**，不用問：`STATUS.md`、`AGENTS.md`、`TASKS_CODE.md`、`TASKS_AGY.md`、`assets-spec.md`、`協作筆記.md`、`CLAUDE.md`、`docs/`（不含 design/ 和 site/ 的其他檔案）。commit 訊息用 `[claude] 文件更新`
