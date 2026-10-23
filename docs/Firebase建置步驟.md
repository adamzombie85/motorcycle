# Firebase 建置步驟（給 Jim）

> 全程在瀏覽器做，不用裝任何東西。用 **adamzombie85@gmail.com** 登入。
> 做完之前，網站照常用「這台裝置的瀏覽器」存紀錄（`BACKEND = 'local'`），不受影響。
> 免費的 Spark 方案就夠：每天讀 5 萬次、寫 2 萬次、存 1 GB。每位學生每次練習大約寫 3～5 次（有合併補傳），全校一天同時練習也夠用。

## 1. 建專案
1. 打開 <https://console.firebase.google.com> →「建立專案（Create a project）」。
2. 專案名稱：`moto-quiz`（可以自己取，之後會變成網址的一部分）。
3. Google Analytics：**關閉**（不需要，也少收集資料）。
4. 按「建立專案」，等它跑完。

## 2. 加一個「網頁應用程式」，拿到設定
1. 專案首頁點「</>」（網頁）圖示。
2. 應用程式暱稱：`moto-web`。**不要**勾「Firebase Hosting」。按「註冊應用程式」。
3. 畫面會出現一段 `const firebaseConfig = { apiKey: "...", authDomain: "...", projectId: "...", appId: "...", ... }`。**先留著這個畫面**（第 7 步要用），或之後在「專案設定 → 一般 → 你的應用程式」再看一次。
   - 這些設定**可以公開**（會放在 GitHub 上）；資料安全靠第 6 步的規則，不靠藏金鑰。

## 3. 開 Google 登入
1. 左邊「建構（Build）」→「Authentication」→「開始使用（Get started）」。
2. 「登入方式（Sign-in method）」→「Google」→ 啟用。
3. 「專案的公開名稱」隨便填（學生登入時會看到），「專案支援電子郵件」選 adamzombie85@gmail.com。儲存。
4. 這樣**任何 Google 帳號**都能登入，不限學校網域。

## 4. 加授權網域
1. Authentication →「設定（Settings）」→「已授權的網域（Authorized domains）」。
2. 「新增網域」→ 輸入 `adamzombie85.github.io` → 新增。
3. （`localhost` 預設已經有，本機測試可用。）

## 5. 建 Firestore 資料庫
1. 左邊「建構」→「Firestore Database」→「建立資料庫」。
2. 版本選「標準版（Standard）」。位置選 **`asia-east1`（台灣）**（建好就不能改）。
3. 安全規則選「**以正式版模式啟動（Production mode）**」（預設全部拒絕，下一步會換成我們的規則）。

## 6. 貼上安全規則（最重要的一步）
1. Firestore Database →「規則（Rules）」分頁。
2. 把整個編輯框清空，貼上 repo 裡 **`firestore.rules`** 的全部內容。
3. 按「發布（Publish）」。
4. 照 `docs/Firestore規則測試清單.md` 用「規則遊樂場」測一次，**#7～#9、#17～#21 一定要確認**（學生之間互相看不到、只有你能讀全部）。

## 7. 把設定貼進網站
1. 打開 `site/js/config.js`，把第 2 步的四個值貼進 `FIREBASE`：
   ```js
   FIREBASE: {
     apiKey: '貼這裡',
     authDomain: '貼這裡',
     projectId: '貼這裡',
     appId: '貼這裡'
   }
   ```
2. 把 `BACKEND: 'local'` 改成 `BACKEND: 'firebase'`。
3. 存檔、commit、push，等 GitHub Pages 更新（約 1～2 分鐘）。

> 填錯或漏填時，網站會在主控台印警告並**自動維持 local 模式**，不會壞掉。

## 8. 登入頁和畫面（要請 Antigravity 做）
`store-firebase.js` 已經準備好 `window.StoreFirebase`（`signIn()`、`signOut()`、`getUser()`、`isAdmin()`、`setProfile({className, seat})`、`hasGuestRecord()`、`importGuest()`），但**登入畫面、班級座號輸入、「匯入這台裝置的訪客紀錄」詢問、管理者頁**都還沒有，這些是畫面，要等 Antigravity 做完才能真正讓學生使用（C10 的畫面部分）。

## 9. 上線後檢查
照 `docs/Firestore規則測試清單.md` 最後的「實機再測一次」。

## 出問題時退回
把 `config.js` 的 `BACKEND` 改回 `'local'`、push 即可。雲端資料不會消失；學生裝置上的本機紀錄也都還在。

## 注意
- 學生資料只存：Google 帳號 email、（選填）班級座號、作答紀錄。**不存姓名、照片。**
- 「重設我的紀錄」只清這台裝置的本機紀錄，**不會**清雲端。要清某位學生的雲端資料，到 Firestore 主控台手動刪除 `users/<uid>`。
- 免費額度用到 80% 時 Firebase 會寄信通知；若超過，當天超出的讀寫會被拒絕（網站仍可離線使用，隔天自動恢復）。
