/* 網站設定。試玩期間 BACKEND = 'local'：紀錄只存在這台裝置的瀏覽器（現在的行為）。
 * 要上線 Firebase：照 docs/Firebase建置步驟.md 建好專案，把網頁設定貼進 FIREBASE，再把 BACKEND 改成 'firebase'。
 * Firebase 的網頁設定（apiKey 等）可以公開，資料安全靠 firestore.rules，不靠藏金鑰。 */
(function () {
  if (window.APP_CONFIG) return;   // 頁面已經載入過
  var cfg = window.APP_CONFIG = {
    BACKEND: 'local',              // 'local' | 'firebase'
    SDK_VERSION: '10.12.2',        // Firebase SDK 版本（鎖定，從官方 CDN 載入）
    ADMIN_EMAIL: 'adamzombie85@gmail.com',
    FIREBASE: {
      apiKey: '',
      authDomain: '',
      projectId: '',
      appId: ''
    }
  };
  // BACKEND 是 firebase 時，在頁面解析階段補載 store-firebase.js（這樣不用改每一頁的 HTML）
  if (cfg.BACKEND === 'firebase' && typeof document !== 'undefined' && document.readyState === 'loading') {
    var cs = document.currentScript, base = cs && cs.src ? cs.src.replace(/config\.js(\?.*)?$/, '') : 'js/';
    document.write('<script src="' + base + 'store-firebase.js"><\/script>');
  }
})();
