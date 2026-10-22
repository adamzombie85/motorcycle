# 機車駕照筆試題庫網站：共同規範

> 所有 AI（Claude、Claude Code、Antigravity）開工前都要先讀這份檔案和 STATUS.md。

## 專案目標
幫**全校高中生**準備機車駕照筆試新制：一次 50 題，其中 15 題是危險感知。
採**通用設計（Universal Design）**：每個學生都用同一套網站，朗讀、注音、字級、反向題提醒等功能是「每個人都能用的閱讀設定」，不是特別給某些學生的。
設計原則：小關卡、概念學習、彈性的呈現方式（文字／圖片／聲音／影片）、容錯、降低挫折。完整規格見 `docs/規格.md`。

## 角色分工
| 角色 | 工具 | 負責 | 不做 |
|---|---|---|---|
| 大腦／資料 | Claude（Cowork 對話） | 規劃、題庫資料化、概念卡內容、寫任務單 | 不寫網站程式 |
| 工程 | Claude Code | `site/` 裡的網站程式 | 不改題目內容與答案 |
| 視覺設計 | Antigravity（Gemini） | 依 `TASKS_AGY.md` 定視覺風格：`design/tokens.css` 和畫面樣板 | 不寫功能邏輯，不改 design/ 以外的檔案 |
| 美術 | Gemini App（Jim 手動操作） | 依 `assets-spec.md` 產圖 | 不畫交通標誌、標線 |
| 調度／決策 | Jim | 每階段確認、在 AI 之間交接 | — |

## 大腦只能有一個
- 這個專案的「大腦」是 claude.ai 專案「公開網站/工具」裡，2026-10-22 起由 Jim 指定的那一個 Claude 對話。
- 其他 Claude 對話不可以修改這個資料夾。要換新對話時，舊對話先收工，新對話從 STATUS.md 接手。

## 大腦只能有一個
- 這個專案同一時間只能有**一個** Claude 對話擔任「大腦」。目前是 Claude（Cowork）的「跨 AI 協作」對話。
- 換新對話時，舊對話要先收工；新對話從 STATUS.md 接手，不要兩個對話同時下指令。

## 一個檔案只有一個主人
| 檔案／資料夾 | 主人 | 其他人 |
|---|---|---|
| AGENTS.md | Jim | AI 可以提出修改建議，Jim 同意才改 |
| STATUS.md | Claude | Claude Code 只能在「交接紀錄」追加一行 |
| TASKS_AGY.md、TASKS_CODE.md、assets-spec.md、data/、docs/、scripts/ | Claude | 唯讀 |
| .agents/rules/ | Jim | Antigravity 的專用規則 |
| site/（不含 site/assets/illustrations/） | Claude Code | 唯讀 |
| site/assets/illustrations/ | Jim（放 Gemini 產的圖） | 唯讀 |
| design/ | Antigravity | Claude Code 唯讀，只能引用 |
| raw/（原始 PDF 與影片） | 不可修改 | 唯讀 |

## 技術規格
- 純靜態 HTML／CSS／JavaScript，不用建置工具；RWD，手機和平板優先
- 圖表用 Chart.js；部署到 GitHub Pages（repo：motorcycle）
- 後端：**Firebase**（免費 Spark 方案）
  - 登入：Firebase Authentication 的 Google 登入，**任何 Google 帳號都可以**（不限學校網域），但一定要登入才能練習
  - 資料：Firestore。學生只能讀寫自己的資料；**只有管理者（Jim，`adamzombie85@gmail.com`）可以讀全部學生的資料**。安全規則判斷管理者時，要同時檢查 email 和 `email_verified == true`
  - 為了省讀取次數，每位學生要有一份「摘要」文件，管理者頁讀摘要，不要讀每一筆作答
  - 只存必要資料：Google 帳號、班級座號（選填）、作答紀錄
  - 學生可以下載自己的「學習成果報告」圖片，分享給老師
- 影片轉成 480p，同一支影片只保留一份
- **樣式規則：** 顏色、字型、間距、元件樣式只能使用 `design/tokens.css` 裡定義的變數，不可以自己新增樣式風格。需要新元件時，寫進 STATUS.md 待決事項，請 Gemini 補設計。

## 內容規則
- 題目與答案以官方 PDF 為準。任何 AI 都不可以自行「修正」答案；有疑問就寫進 STATUS.md，交給 Jim 決定。
- 交通標誌、標線一律使用從 PDF 抽出的官方圖，不可以用 AI 生成。
- 介面文字使用台灣繁體中文，句子要短，一句只講一個重點。
- **介面不可以出現「特教」「資源班」「身心障礙」等字眼**；輔助功能統一叫「閱讀設定」。
- 無障礙：字級至少 18px，按鈕可點範圍至少 44px，不可以只靠顏色傳達資訊。

## 題目資料格式（草案，階段 0 定案）
```json
{
  "id": "Q0001",
  "source": "筆試 | 情境 | 影片",
  "category": "正確觀念與態度",
  "subcategory": "…",
  "tags": ["反向題", "數字題", "標誌標線"],
  "question": "…",
  "options": ["…", "…", "…"],
  "answer": 0,
  "image": "media/images/Q0001.png",
  "video": null,
  "concept_id": null
}
```

## 版本控制（Git）
- GitHub repo：`adamzombie85/motorcycle`
- **只有 Claude Code 會執行 git 指令**（commit、push）。其他 AI 改完檔案後，由 Jim 請 Claude Code 存檔。
- commit 訊息開頭標示是誰的工作：`[claude]` 資料與規劃、`[code]` 網站程式、`[agy]` 視覺設計、`[setup]` 環境設定
- 每次交接前都要 commit 一次。做壞了可以回到上一個存檔點。

## 交接規則
1. 開工前：讀 AGENTS.md 和 STATUS.md。
2. 收工時：更新自己負責的檔案，並在 STATUS.md 的「交接紀錄」寫一行，說明做了什麼、下一棒是誰。Antigravity 例外，它把說明寫在 design/README.md。
3. 遇到不確定的事：停下來寫進待決事項，不要自己猜。
