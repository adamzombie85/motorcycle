# 給 Claude Code 的任務單

**開工指令（Jim 在 Claude Code 輸入）：**
> 讀 TASKS_CODE.md，執行狀態為「待執行」的任務。

---

## C0｜建立版本控制
- 狀態：✅ 已完成（2026-10-21）
- 做什麼：
  1. 開工第一件事：用一句話回答「你的角色是什麼？可以修改哪些地方？」（握手測試，確認你有讀到 AGENTS.md）
  2. 在這個資料夾執行 `git init`，預設分支命名為 main
  3. 連到 GitHub repo `adamzombie85/motorcycle`。遠端目前只有 LICENSE，先 pull 下來再合併
  4. 確認 `.gitignore` 生效：raw/ 不能被加入
  5. 第一次 commit，訊息寫 `[setup] 建立協作環境與筆試題庫資料`，然後 push
  6. 在 STATUS.md 的「交接紀錄」追加一行
- 驗收條件：GitHub 上看得到 AGENTS.md、data/、media/，但看不到 raw/
- 不要做：不要修改 data/ 和 docs/ 的內容

## C2｜階段 0 存檔
- 狀態：**待執行**
- 做什麼：
  1. 確認 `_to_delete/` 和 `raw/` 不會被加入（看 .gitignore）
  2. commit 所有變更，訊息寫 `[claude] 階段 0 完成：1,052 題題庫、圖片、480p 影片`，然後 push
  3. 在 STATUS.md 的「交接紀錄」追加一行
- 驗收條件：GitHub 上看得到 data/questions.json、media/videos/（109 支）；看不到 _to_delete/
- 不要做：不要修改任何檔案內容

## C1｜網站部署設定
- 狀態：**未開放**（階段 1 才做）
- 預定內容：用 GitHub Actions 把 site/、data/、media/ 組合後部署到 GitHub Pages
