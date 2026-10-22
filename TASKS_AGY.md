# 給 Antigravity（Gemini）的任務單

**開工指令（Jim 複製貼給 Antigravity）：**
> 讀 AGENTS.md 和 TASKS_AGY.md，執行狀態為「待執行」的任務。只能修改 design/ 資料夾。

---

## D1｜視覺定調（階段 1 開始前）
- 狀態：**待執行**（等 Claude Code 完成 C2 存檔後再開工）
- 使用者：資源班高中生，在手機和平板上練習。需要清楚、友善、不幼稚、不會讓人有考試壓力的介面。
- 參考素材：
  - 主視覺 `site/assets/illustrations/hero.jpg`：扁平向量插畫、淺藍色速克達。配色要和這張圖協調
  - 題目範例：`data/questions.json`（樣板的假資料請從這裡挑真實題目，包含一題反向題、一題有圖題）
- 要交出：
  1. `design/tokens.css`：用 CSS 變數定義配色（主色、答對、答錯、提醒、背景、文字）、字型、字級（最小 18px）、間距、圓角、陰影
  2. `design/components.html`：按鈕、選項卡、進度條、回饋卡（答對／答錯／反向題提醒）、成績圖表區塊
  3. `design/screen-home.html`、`design/screen-quiz.html`、`design/screen-result.html`：三個關鍵畫面的靜態樣板，只用 tokens.css 的變數，資料先用假資料
  4. `design/README.md`：說明設計理念，以及每個元件什麼時候使用
- 驗收條件：寬度 375px 和 1024px 都可以正常顯示；對比度符合 WCAG AA；不可以只靠顏色區分答對和答錯
- 不要做：不要寫功能邏輯，不要用外部 CSS 框架
