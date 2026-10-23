# Firestore 安全規則：手動測試清單

> 自動測試在 `firebase-tests/`（需要 Java 與 Firebase 模擬器，見該資料夾的 `rules.test.js`）。
> 這份清單是**沒辦法裝 Java** 時的備案：Jim 建好 Firebase 專案、部署規則後，照著測。
> 全部在 Firebase 主控台 →「Firestore Database」→「規則」→ 右上「規則遊樂場（Rules Playground）」做，不用寫程式，也不會動到真實資料。

## 怎麼用規則遊樂場
1. 左邊選「get」（讀一份）、「list」（列出一個集合）、「create / update / delete」（寫）。
2. 「Location」填路徑，例如 `/users/alice`。
3. 「Authenticated」打開，填 Provider 選 `google.com`，Firebase UID 填 `alice`；右邊「Auth token」填 email 和 email_verified（見下表）。
4. 按「Run」，看結果是「Allowed」還是「Denied」。

## 要測的項目（每項都要和「預期」一致）

| # | 情境 | 操作 | 登入身分 | 預期 |
|---|---|---|---|---|
| 1 | 沒登入讀 | get `/users/alice` | 不登入（Authenticated 關閉） | **Denied** |
| 2 | 沒登入寫 | create `/users/alice`，資料 `{uid:"alice"}` | 不登入 | **Denied** |
| 3 | 學生讀自己 | get `/users/alice` | uid=alice，email=alice@example.com | Allowed |
| 4 | 學生寫自己的個人資料 | update `/users/alice`，`{uid:"alice", email:"alice@example.com", className:"301", seat:"12"}` | uid=alice，email=alice@example.com | Allowed |
| 5 | 學生寫自己的作答紀錄 | create `/users/alice/answers/2026-11`，`{items:["x"]}` | uid=alice | Allowed |
| 6 | 學生寫自己的設定資料 | create `/users/alice/data/mistakes`，`{json:"{}"}` | uid=alice | Allowed |
| 7 | **A 讀 B** | get `/users/bob` | uid=alice | **Denied** |
| 8 | **A 讀 B 的紀錄** | get `/users/bob/data/mistakes` | uid=alice | **Denied** |
| 9 | **A 寫 B** | update `/users/bob`，`{className:"1"}` | uid=alice | **Denied** |
| 10 | 學生列出所有學生 | list `/users` | uid=alice | **Denied** |
| 11 | 冒用別人的 uid | update `/users/alice`，`{uid:"bob"}` | uid=alice | **Denied** |
| 12 | 冒用別人的 email | update `/users/alice`，`{email:"x@y.com"}` | uid=alice，email=alice@example.com | **Denied** |
| 13 | 亂塞欄位 | update `/users/alice`，`{role:"admin"}` | uid=alice | **Denied** |
| 14 | 班級太長 | update `/users/alice`，`{className:"12345678901"}`（11 個字） | uid=alice | **Denied** |
| 15 | 刪除自己的資料 | delete `/users/alice` | uid=alice | **Denied** |
| 16 | 沒定義的路徑 | create `/secrets/x`，`{a:1}` | uid=alice | **Denied** |
| 17 | **管理者讀全部** | list `/users` | uid=admin，email=adamzombie85@gmail.com，**email_verified=true** | Allowed |
| 18 | 管理者讀某位學生的紀錄 | get `/users/bob/data/mistakes` | 同上 | Allowed |
| 19 | **管理者不能寫** | update `/users/alice`，`{className:"999"}` | 同上 | **Denied** |
| 20 | **email 對但沒驗證** | list `/users` | uid=fake，email=adamzombie85@gmail.com，**email_verified=false** | **Denied** |
| 21 | email 不對 | list `/users` | uid=fake，email=adamzombie86@gmail.com，email_verified=true | **Denied** |

加粗的項目最重要：#7～#9（學生之間互相看不到）、#17～#21（只有 Jim 能讀全部）。

## 實機再測一次（網站上線後）
1. 用兩個不同的 Google 帳號 A、B 各答幾題。
2. 在 A 的瀏覽器開發者工具 Console 執行 `firebase.firestore().doc('users/<B 的 uid>').get()`，要看到「permission-denied」。
3. 用 Jim 的帳號登入（`adamzombie85@gmail.com`），管理者頁要能看到 A、B 的摘要。
4. 斷網（飛航模式）答 3 題，再開網路，過幾秒到 Firestore 主控台確認紀錄有補上。
