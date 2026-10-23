/**
 * 騎士角色選擇頁程式 (site/js/character.js)
 * 串接 Game.getAvatars(), Game.getAvatar(), Game.setAvatar()
 */
(function () {
  'use strict';

  var root = document.getElementById('character-root');
  if (!root) return;

  var ICONS = {
    check: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
    lock: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    back: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>'
  };

  var CHARACTERS_META = {
    'rider-1': { name: '淺藍安全帽男生', desc: '穩健出發的實力搭檔。' },
    'rider-2': { name: '黃色安全帽綁馬尾女生', desc: '充滿活力的專注搭檔。' },
    'rider-3': { name: '綠色安全帽短髮男生', desc: '沈著冷靜的敏銳搭檔。' },
    'rider-4': { name: '粉紅安全帽戴眼鏡女生', desc: '細心觀察的聰穎搭檔。' },
    'rider-5': { name: '紅色安全帽火焰', desc: '堅持一週不懈的騎士榮譽。', lockDesc: '取得「一週騎士」解鎖' },
    'rider-6': { name: '金色安全帽', desc: '象徵全方位精熟的最高榮譽。', lockDesc: '取得「月度車神」解鎖' }
  };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function link(cls, text, href) {
    var a = el('a', cls, text);
    a.href = href;
    return a;
  }

  function render(avatars, currentAvatar) {
    root.textContent = '';

    // 1. 頁面導航與標題
    var topBar = el('div');
    topBar.style.marginBottom = 'var(--space-6)';

    var nav = el('nav');
    nav.setAttribute('aria-label', '麵包屑導航');
    nav.style.marginBottom = 'var(--space-2)';
    var backLink = link('', '', 'index.html');
    backLink.style.cssText = 'color: var(--color-primary-700); font-size: var(--font-size-sm); text-decoration: none; font-weight: bold; display: inline-flex; align-items: center; gap: 4px;';
    backLink.innerHTML = ICONS.back + '<span>回首頁</span>';
    nav.appendChild(backLink);
    topBar.appendChild(nav);

    var h1 = el('h1', 'text-nowrap', '選擇你的騎士搭檔');
    h1.style.cssText = 'font-size: var(--font-size-2xl); font-weight: var(--font-weight-black); color: var(--color-slate-900);';
    topBar.appendChild(h1);

    var desc = el('p', '', '選擇你喜愛的騎士風格，將出現在學習首頁、地圖路段與成果報告中陪伴你！');
    desc.style.cssText = 'font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-top: 4px;';
    topBar.appendChild(desc);
    root.appendChild(topBar);

    // 2. 6 位角色網格
    var grid = el('section', 'character-grid');
    grid.setAttribute('aria-label', '騎士角色選擇清單');

    avatars.forEach(function (a) {
      var meta = CHARACTERS_META[a.id] || { name: '騎士搭檔', desc: '' };
      var isActive = (currentAvatar === a.id);
      var isLocked = !a.unlocked;

      var cardCls = 'character-card' + (isActive ? ' is-active' : '') + (isLocked ? ' is-locked' : '');
      var card = el('div', cardCls);
      card.setAttribute('role', 'radio');
      card.setAttribute('aria-checked', isActive ? 'true' : 'false');
      card.setAttribute('tabindex', isLocked ? '-1' : '0');
      card.style.cursor = isLocked ? 'not-allowed' : 'pointer';

      // 角色頭像圓框
      var avatarBox = el('div', 'character-avatar-box');
      var img = el('img');
      img.src = 'assets/illustrations/' + a.id + '.png';
      img.alt = meta.name;
      img.style.cssText = 'width: 80px; height: 80px; object-fit: contain;';
      avatarBox.appendChild(img);

      if (isLocked) {
        var mask = el('div', 'character-locked-mask');
        mask.innerHTML = ICONS.lock;
        avatarBox.appendChild(mask);
      }
      card.appendChild(avatarBox);

      // 角色名稱
      var nameEl = el('h2', 'character-name text-nowrap', meta.name);
      nameEl.style.cssText = 'font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); margin-top: var(--space-2);';
      card.appendChild(nameEl);

      // 角色說明
      var descEl = el('p', 'character-desc', meta.desc);
      descEl.style.cssText = 'font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-top: 4px; flex-grow: 1;';
      card.appendChild(descEl);

      // 狀態提示標籤
      if (isActive) {
        var activePill = el('div', 'badge-status-pill is-unlocked', '');
        activePill.innerHTML = ICONS.check + '<span class="text-nowrap" style="margin-left: 4px;">目前使用中</span>';
        activePill.style.marginTop = 'var(--space-3)';
        card.appendChild(activePill);
      } else if (isLocked) {
        var lockPill = el('div', 'character-unlock-badge');
        lockPill.innerHTML = ICONS.lock + '<span style="margin-left: 4px;">' + (meta.lockDesc || '尚未解鎖') + '</span>';
        lockPill.style.marginTop = 'var(--space-3)';
        card.appendChild(lockPill);
      } else {
        var selectBtn = el('button', 'btn btn-outline btn-sm', '選擇此角色');
        selectBtn.style.marginTop = 'var(--space-3)';
        selectBtn.style.pointerEvents = 'none';
        card.appendChild(selectBtn);
      }

      // 點擊切換角色
      if (!isLocked) {
        card.addEventListener('click', function () {
          if (a.id === currentAvatar) return;
          var ok = Game.setAvatar(a.id);
          if (ok) {
            if (window.Sound && Sound.correct) Sound.correct();
            render(Game.getAvatars(), a.id);
          }
        });
        card.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            card.click();
          }
        });
      }

      grid.appendChild(card);
    });

    root.appendChild(grid);

    // 底部返回按鈕
    var footerActions = el('div');
    footerActions.style.cssText = 'display: flex; justify-content: center; margin-top: var(--space-8);';
    var homeBtn = link('btn btn-primary btn-lg', '', 'index.html');
    homeBtn.innerHTML = ICONS.check + '<span style="margin-left: 6px;">確定並返回首頁</span>';
    footerActions.appendChild(homeBtn);
    root.appendChild(footerActions);
  }

  function init() {
    var studentCode = Store.getStudent();
    if (!studentCode) {
      studentCode = 'guest';
      Store.setStudent('guest');
    }
    var studentDisplay = studentCode === 'guest' ? '訪客' : studentCode;

    var userChip = document.getElementById('user-chip');
    if (userChip) userChip.textContent = studentDisplay;

    Data.load().then(function () {
      var avatars = (typeof Game !== 'undefined' && Game.getAvatars) ? Game.getAvatars() : [];
      var currentAvatar = (typeof Game !== 'undefined' && Game.getAvatar) ? Game.getAvatar() : 'rider-1';
      render(avatars, currentAvatar);
    }).catch(function (err) {
      console.error(err);
      root.textContent = '角色資料載入失敗，請確認網路連線。';
    });
  }

  init();
})();
