/* 答題畫面：題目、選項、答案一律照題庫，不改字、不打亂順序。對接 Settings 閱讀輔助與 D4 設計 */
(function () {
  'use strict';

  var root = document.getElementById('quiz-root');
  if (!root) return;

  var BLANK_PROMPT = '請看圖，選出正確的答案。';
  // 反向題關鍵字：只加標記，不改字
  var REVERSE_RE = /不正確|不適當|不包括|不屬於|不是|不利於|不可以|不須|不符|不當|有違|錯誤|非屬|為非|何者非|非/g;

  var ICONS = {
    target: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    repeat: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>',
    volume: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
    alert: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x1="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>',
    check: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
    x: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
  };

  var level, mode, dailyDate, questions, index = 0, results = [], answered = false, selectedOption = null, startedAt = Date.now();
  var CHINESE_NUMS = ['一', '二', '三', '四', '五'];
  var hasStartedSpeechSession = false;
  var justSpokeNextInClick = false;

  // 危險感知影片相關狀態
  var hazardMap = {};
  var hazardPromise = null;
  var currentVideo = null;
  var currentHazardOverlay = null;
  var currentSpeedBtn = null;

  function loadHazards() {
    if (hazardPromise) return hazardPromise;
    var url = (typeof Data !== 'undefined' && Data.assetUrl) ? Data.assetUrl('data/video_hazards.json') : '../data/video_hazards.json';
    if (!url) url = '../data/video_hazards.json';
    hazardPromise = fetch(url).then(function (res) {
      if (!res.ok) throw new Error(res.status);
      return res.json();
    }).then(function (list) {
      if (Array.isArray(list)) {
        list.forEach(function (h) {
          if (h && h.video_id) hazardMap[String(h.video_id)] = h;
        });
      }
      return hazardMap;
    }).catch(function (err) {
      console.warn('載入 video_hazards.json 失敗', err);
      return hazardMap;
    });
    return hazardPromise;
  }

  function formatTime(sec) {
    if (isNaN(sec) || sec < 0) sec = 0;
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function getQuestionSpeechText(q) {
    var raw = (q.question || '').trim();
    var qText = raw || '請看圖，選出正確的答案。';
    if (!/[。！？.!?]$/.test(qText)) qText += '。';
    var opts = q.options || [];
    var optTexts = opts.map(function (opt, idx) {
      var num = CHINESE_NUMS[idx] || (idx + 1);
      var clean = (opt || '').trim();
      if (!/[。！？.!?]$/.test(clean)) clean += '。';
      return '選項' + num + '，' + clean;
    });
    return qText + (optTexts.length ? ' ' + optTexts.join(' ') : '');
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function message(text, linkText, href) {
    root.textContent = '';
    var box = el('div', 'quiz-message');
    box.appendChild(el('p', null, text));
    if (href) {
      var a = el('a', 'btn btn-primary btn-lg', linkText);
      a.href = href;
      box.appendChild(a);
    }
    root.appendChild(box);
  }

  // 把關鍵字用 <mark> 包起來（用 DOM 建立，不拼 HTML）
  function appendMarked(parent, text, reverse) {
    if (!reverse) { parent.appendChild(document.createTextNode(text)); return; }
    var last = 0, m;
    REVERSE_RE.lastIndex = 0;
    while ((m = REVERSE_RE.exec(text))) {
      if (m.index > last) parent.appendChild(document.createTextNode(text.slice(last, m.index)));
      parent.appendChild(el('mark', 'highlight-reverse', m[0]));
      last = m.index + m[0].length;
    }
    if (last < text.length) parent.appendChild(document.createTextNode(text.slice(last)));
  }

  function renderTop() {
    var top = el('div', 'quiz-top-bar');
    var chip = el('div', 'level-title-chip');
    if (mode === 'mistakes') {
      chip.innerHTML = ICONS.repeat + '<span style="margin-left: 6px;">錯題重練</span>';
    } else if (mode === 'daily') {
      chip.innerHTML = ICONS.target + '<span style="margin-left: 6px;">每日 3 分鐘挑戰</span>';
    } else {
      chip.innerHTML = ICONS.target + '<span style="margin-left: 6px;">' + level.category + ' · ' + level.subcategory + '（第 ' + level.index + ' 關）</span>';
    }
    top.appendChild(chip);

    var pause = el('a', 'btn btn-outline quiz-pause-btn', '暫停離開');
    pause.href = 'index.html';
    top.appendChild(pause);
    return top;
  }

  function renderProgress() {
    var sec = el('div', 'quiz-progress-section');
    var head = el('div', 'progress-header');
    var done = results.length;

    var pText = el('span', 'text-nowrap', (mode === 'daily' ? '今日進度：' : '關卡進度：') + (index + 1) + ' / ' + questions.length);
    head.appendChild(pText);

    var pct = Math.round(done / questions.length * 100);
    var pRate = el('span', 'text-nowrap', '進行中（' + pct + '%）');
    head.appendChild(pRate);
    sec.appendChild(head);

    var dots = el('div', 'progress-dots');
    questions.forEach(function (q, i) {
      var cls = 'dot-item';
      var title = '第 ' + (i + 1) + ' 題';
      if (i < results.length) {
        cls += results[i].correct ? ' is-done' : ' is-wrong';
        title += results[i].correct ? '：答對' : '：答錯';
      } else if (i === index) {
        cls += ' is-current'; title += '：目前作答中';
      }
      var d = el('div', cls); d.title = title;
      dots.appendChild(d);
    });
    sec.appendChild(dots);
    return sec;
  }

  function renderQuestion() {
    var q = questions[index];
    var reverse = q.tags.indexOf('反向題') !== -1;
    answered = false;
    selectedOption = null;
    root.textContent = '';
    root.appendChild(renderTop());
    root.appendChild(renderProgress());

    // 反向題橫幅：照 C4 定案文字，無多餘字眼
    if (reverse) {
      var alertBox = el('div', 'alert-reverse');
      var alertIcon = el('span', 'alert-reverse-icon');
      alertIcon.innerHTML = ICONS.alert;
      alertBox.appendChild(alertIcon);

      var content = el('div', 'alert-reverse-content');
      content.appendChild(el('strong', null, '反向題提醒：'));
      content.appendChild(document.createTextNode('題目裡有「不」「錯誤」這類字眼，請看清楚題目問的是什麼，再選答案。'));
      alertBox.appendChild(content);
      root.appendChild(alertBox);
    }

    var card = el('div', 'question-card');
    card.setAttribute('data-qid', q.id);
    var meta = el('div', 'question-meta-row');
    var tags = el('div', 'tag-list');
    tags.appendChild(el('span', 'tag tag-category text-nowrap', q.category));
    tags.appendChild(el('span', 'tag tag-sub text-nowrap', q.subcategory));
    if (reverse) tags.appendChild(el('span', 'tag tag-reverse text-nowrap', '反向題'));
    meta.appendChild(tags);

    // 朗讀本題按鈕
    var speakBtn = el('button', 'btn btn-sm btn-outline btn-speak');
    speakBtn.type = 'button';
    speakBtn.setAttribute('aria-label', '朗讀本題');
    speakBtn.title = '朗讀本題';
    speakBtn.innerHTML = ICONS.volume + '<span style="margin-left: 4px;">朗讀本題</span>';
    speakBtn.addEventListener('click', function () {
      hasStartedSpeechSession = true;
      if (window.Settings && window.Settings.speak) {
        window.Settings.speak(getQuestionSpeechText(q));
      }
    });
    meta.appendChild(speakBtn);
    card.appendChild(meta);

    var wrap = el('div', 'question-title-wrapper');
    var title = el('h2', 'question-title');
    var text = q.question.trim();
    if (text) appendMarked(title, text, reverse); else title.textContent = BLANK_PROMPT;
    wrap.appendChild(title);
    card.appendChild(wrap);

    if (q.image) {
      var frame = el('div', 'question-image-frame');
      var img = el('img');
      img.src = Data.assetUrl(q.image);
      img.alt = '題目圖片';
      frame.appendChild(img);
      card.appendChild(frame);
    }

    if (q.video) {
      var vFrame = el('div', 'question-video-frame');
      var vContainer = el('div', 'video-container');

      var video = el('video', 'quiz-video');
      video.src = Data.assetUrl(q.video);
      video.controls = false;
      video.preload = 'none';
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      vContainer.appendChild(video);
      currentVideo = video;

      // 危險標記覆蓋層 (平時隱藏，答錯時顯示)
      var hazardOverlay = el('div', 'video-hazard-overlay');
      var hazardPointer = el('div', 'hazard-pointer');
      hazardOverlay.appendChild(hazardPointer);

      var hazardCaption = el('div', 'hazard-caption-bar');
      hazardOverlay.appendChild(hazardCaption);
      vContainer.appendChild(hazardOverlay);
      currentHazardOverlay = hazardOverlay;

      vFrame.appendChild(vContainer);

      // 自訂影片控制列
      var ctrlBar = el('div', 'video-controls-bar');
      var btnGroup = el('div', 'video-ctrl-group');

      // 播放 / 暫停按鈕
      var playBtn = el('button', 'video-btn btn-video-play');
      playBtn.type = 'button';
      playBtn.setAttribute('aria-label', '播放影片');
      playBtn.innerHTML = '<span>▶</span> <span>播放</span>';
      playBtn.addEventListener('click', function () {
        if (video.paused || video.ended) {
          video.play();
        } else {
          video.pause();
        }
      });
      btnGroup.appendChild(playBtn);

      // 重播按鈕
      var replayBtn = el('button', 'video-btn btn-video-replay');
      replayBtn.type = 'button';
      replayBtn.setAttribute('aria-label', '重播影片');
      replayBtn.innerHTML = '<span>↺</span> <span>重播</span>';
      replayBtn.addEventListener('click', function () {
        video.currentTime = 0;
        video.play();
      });
      btnGroup.appendChild(replayBtn);

      // 0.5 倍速切換按鈕
      var speedBtn = el('button', 'video-btn btn-video-speed');
      speedBtn.type = 'button';
      speedBtn.setAttribute('aria-label', '切換播放倍速');
      speedBtn.innerHTML = '<span>1.0x</span>';
      speedBtn.addEventListener('click', function () {
        if (video.playbackRate === 0.5) {
          video.playbackRate = 1.0;
          speedBtn.innerHTML = '<span>1.0x</span>';
          speedBtn.classList.remove('is-active');
        } else {
          video.playbackRate = 0.5;
          speedBtn.innerHTML = '<span>0.5x (慢速)</span>';
          speedBtn.classList.add('is-active');
        }
      });
      btnGroup.appendChild(speedBtn);
      currentSpeedBtn = speedBtn;

      ctrlBar.appendChild(btnGroup);

      // 進度條與時間指示
      var progWrap = el('div', 'video-progress-wrap');
      var progTrack = el('div', 'video-progress-track');
      var progFill = el('div', 'video-progress-fill');
      progTrack.appendChild(progFill);
      progWrap.appendChild(progTrack);

      var timeText = el('span', 'video-time-display', '0:00 / 0:00');
      progWrap.appendChild(timeText);
      ctrlBar.appendChild(progWrap);

      vFrame.appendChild(ctrlBar);
      card.appendChild(vFrame);

      // 監聽播放進度更新
      video.addEventListener('timeupdate', function () {
        var cur = video.currentTime || 0;
        var dur = video.duration || 0;
        var pct = dur > 0 ? (cur / dur * 100) : 0;
        progFill.style.width = pct + '%';
        timeText.textContent = formatTime(cur) + ' / ' + formatTime(dur);
      });

      video.addEventListener('play', function () {
        playBtn.innerHTML = '<span>⏸</span> <span>暫停</span>';
        playBtn.setAttribute('aria-label', '暫停影片');
      });

      video.addEventListener('pause', function () {
        playBtn.innerHTML = '<span>▶</span> <span>播放</span>';
        playBtn.setAttribute('aria-label', '播放影片');
      });

      // 播完前提示
      var lockedPrompt = el('div', 'video-locked-prompt');
      lockedPrompt.innerHTML = '<span>🎬</span> <span>請先觀看上方情境影片，影片播完後將出現作答選項</span>';
      card.appendChild(lockedPrompt);

      video.addEventListener('ended', function () {
        playBtn.innerHTML = '<span>▶</span> <span>播放</span>';
        lockedPrompt.style.display = 'none';
        list.style.display = '';

        // 若開啟自動朗讀且播完影片才出現選項，這時觸發朗讀
        if (settings.speechAuto && window.Settings && window.Settings.speak && !justSpokeNextInClick) {
          window.Settings.speak(getQuestionSpeechText(q));
        }
      });
    }

    var settings = window.Settings ? window.Settings.get() : { confirmAnswer: false, speechAuto: false };

    // 自動朗讀（非影片題時直接在題目載入時啟動）：
    if (!q.video && settings.speechAuto && window.Settings && window.Settings.speak) {
      if (index === 0 && !hasStartedSpeechSession) {
        var startSpeechBox = el('div', 'speech-start-banner');
        startSpeechBox.style.cssText = 'background: var(--color-primary-50); border: 2px solid var(--color-primary-300); border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); margin-bottom: var(--space-4); display: flex; align-items: center; justify-content: space-between; gap: var(--space-3);';
        var txtBox = el('div');
        txtBox.innerHTML = '<strong style="color: var(--color-primary-900);">🔊 已開啟自動朗讀</strong><p style="margin: 2px 0 0; font-size: var(--font-size-sm); color: var(--color-text-secondary);">點擊按鈕即可開始聆聽題目與選項</p>';
        startSpeechBox.appendChild(txtBox);
        var startSpeechBtn = el('button', 'btn btn-primary btn-sm btn-start-speech', '點一下開始');
        startSpeechBtn.type = 'button';
        startSpeechBtn.addEventListener('click', function () {
          hasStartedSpeechSession = true;
          startSpeechBox.remove();
          if (window.Settings && window.Settings.speak) {
            window.Settings.speak(getQuestionSpeechText(q));
          }
        });
        startSpeechBox.appendChild(startSpeechBtn);
        card.insertBefore(startSpeechBox, wrap);
      } else if (!justSpokeNextInClick) {
        window.Settings.speak(getQuestionSpeechText(q));
      }
    }
    justSpokeNextInClick = false;

    var list = el('div', 'options-list');
    if (q.video) {
      list.style.display = 'none'; // 影片播完才出現選項
    }
    var confirmBtn = null;

    if (settings.confirmAnswer) {
      confirmBtn = el('button', 'btn btn-primary btn-lg btn-confirm-answer', '請先選擇一個答案');
      confirmBtn.type = 'button';
      confirmBtn.disabled = true;
      confirmBtn.style.cssText = 'width: 100%; margin-top: var(--space-4); display: none;';
      confirmBtn.addEventListener('click', function () {
        if (selectedOption !== null) {
          choose(selectedOption, list, card);
        }
      });
    }

    q.options.forEach(function (opt, i) {
      var b = el('button', 'option-card');
      b.type = 'button';
      b.appendChild(el('span', 'option-badge', String(i + 1)));
      b.appendChild(el('span', 'option-label', opt));
      b.addEventListener('click', function () {
        if (settings.confirmAnswer) {
          selectedOption = i;
          Array.prototype.forEach.call(list.children, function (btn) {
            btn.classList.remove('is-selected');
          });
          b.classList.add('is-selected');
          confirmBtn.disabled = false;
          confirmBtn.style.display = 'block';
          confirmBtn.textContent = '確認送出答案（第 ' + (i + 1) + ' 個選項）';
        } else {
          choose(i, list, card);
        }
      });
      list.appendChild(b);
    });

    card.appendChild(list);
    if (confirmBtn) card.appendChild(confirmBtn);
    root.appendChild(card);
  }

  function setIndicator(btn, text) {
    btn.appendChild(el('span', 'option-indicator', text));
  }

  function choose(choice, list, card) {
    if (answered) return;
    answered = true;

    // 停止朗讀
    if (window.Settings && window.Settings.stopSpeaking) {
      window.Settings.stopSpeaking();
    }

    var confirmBtn = card.querySelector('.btn-confirm-answer');
    if (confirmBtn) confirmBtn.style.display = 'none';

    var q = questions[index];
    var correct = choice === q.answer;

    // 播放音效
    if (window.Sound) {
      if (correct && Sound.correct) Sound.correct();
      else if (!correct && Sound.wrong) Sound.wrong();
    }

    var mistake;
    if (mode === 'daily' && typeof Game !== 'undefined' && Game.dailyAnswer) {
      // dailyAnswer 已經把這題記進作答紀錄（含錯題庫），不要再記一次
      mistake = Game.dailyAnswer(q.id, correct, choice, dailyDate).result;
    } else {
      mistake = Store.recordAnswer(q.id, correct, { choice: choice, src: mode });
    }

    // 檢查是否有新徽章解鎖
    var unlockedBadges = (typeof Game !== 'undefined' && Game.checkBadges) ? Game.checkBadges() : [];
    if (unlockedBadges.length > 0 && window.Sound && Sound.badge) {
      setTimeout(function () { Sound.badge(); }, 350);
    }

    results.push({ qid: q.id, choice: choice, correct: correct, cleared: mistake ? mistake.cleared : false });

    Array.prototype.forEach.call(list.children, function (btn, i) {
      btn.disabled = true;
      btn.classList.remove('is-selected');
      if (i === q.answer) {
        btn.classList.add('is-correct');
        if (correct) btn.classList.add('animate-correct-pop');
        setIndicator(btn, '正確解答');
      }
      else if (i === choice) { btn.classList.add('is-wrong'); setIndicator(btn, '你的選擇'); }
      else btn.classList.add('is-dimmed');
    });

    var fb = el('div', 'feedback-card ' + (correct ? 'is-success' : 'is-danger'));
    var head = el('div', 'feedback-header');
    var iconWrap = el('div', 'feedback-icon');
    iconWrap.innerHTML = correct ? ICONS.check : ICONS.x;
    head.appendChild(iconWrap);

    var htext = el('div');
    htext.appendChild(el('div', 'feedback-title', correct ? '答對了！' : '這題選錯囉，沒關係！'));
    head.appendChild(htext);
    fb.appendChild(head);

    if (!correct) {
      var body = el('div', 'feedback-body');
      body.appendChild(document.createTextNode('正確答案是第 '));
      body.appendChild(el('strong', null, String(q.answer + 1)));
      body.appendChild(document.createTextNode(' 個選項：'));
      body.appendChild(el('strong', null, q.options[q.answer]));
      fb.appendChild(body);

      // 影片題答錯時：影片跳到 start 前 1 秒，用 0.5 倍速播放，並在畫面上用文字＋箭頭標出 area 與 what
      if (q.video && currentVideo) {
        var vid = q.video_id || (q.video ? q.video.replace(/.*\/([0-9a-zA-Z_-]+)\.mp4$/, '$1') : null);
        var hazard = hazardMap[String(vid)];
        if (hazard) {
          var startSec = typeof hazard.start === 'number' ? hazard.start : (parseFloat(hazard.start) || 0);
          var rewindTime = Math.max(0, startSec - 1.0);
          currentVideo.currentTime = rewindTime;
          currentVideo.playbackRate = 0.5;
          if (currentSpeedBtn) {
            currentSpeedBtn.innerHTML = '<span>0.5x (慢速)</span>';
            currentSpeedBtn.classList.add('is-active');
          }
          try {
            var playPromise = currentVideo.play();
            if (playPromise && playPromise.catch) playPromise.catch(function () {});
          } catch (e) {}

          if (currentHazardOverlay) {
            var pointer = currentHazardOverlay.querySelector('.hazard-pointer');
            var caption = currentHazardOverlay.querySelector('.hazard-caption-bar');
            var area = hazard.area || '前方';
            pointer.className = 'hazard-pointer';

            var arrow = '⬇';
            if (area.indexOf('左') !== -1) {
              pointer.classList.add('hazard-pointer-left');
              arrow = '⬅';
              pointer.innerHTML = '<span class="hazard-arrow-icon">' + arrow + '</span> <span>左側危險</span>';
            } else if (area.indexOf('右') !== -1) {
              pointer.classList.add('hazard-pointer-right');
              arrow = '➡';
              pointer.innerHTML = '<span>右側危險</span> <span class="hazard-arrow-icon">' + arrow + '</span>';
            } else if (area.indexOf('後') !== -1) {
              pointer.classList.add('hazard-pointer-back');
              arrow = '⬆';
              pointer.innerHTML = '<span class="hazard-arrow-icon">' + arrow + '</span> <span>後方危險</span>';
            } else {
              pointer.classList.add('hazard-pointer-front');
              arrow = '⬇';
              pointer.innerHTML = '<span class="hazard-arrow-icon">' + arrow + '</span> <span>前方危險</span>';
            }

            if (caption) {
              caption.innerHTML = '<span>⚠️ 危險發生時間：約第 ' + startSec + ' 秒（0.5 倍速慢速重播中）</span><span>重點：' + (hazard.what || '') + '</span>';
            }
            currentHazardOverlay.classList.add('is-visible');
          }

          // 在 feedback-card 裡加入危害說明方塊
          var hCard = el('div', 'hazard-feedback-card');
          var hHead = el('div', 'hazard-feedback-head');
          hHead.innerHTML = ICONS.alert + '<strong style="margin-left: 4px;">危險感知重點解析（上方已為您以 0.5 倍速慢速重播）：</strong>';
          hCard.appendChild(hHead);

          var hBody = el('div', 'hazard-feedback-body');
          hBody.innerHTML = '<strong>【' + hazard.area + '危險】</strong>發生於約第 <strong>' + startSec + '</strong> 秒：' + hazard.what;
          hCard.appendChild(hBody);
          fb.appendChild(hCard);

          // 滾動讓學生看清影片與標記
          try {
            currentVideo.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } catch (e) {}
        }
      }
    }

    var notice = mistakeNotice(mistake, correct);
    if (notice) fb.appendChild(notice);

    // 作答後回饋朗讀（只在自動朗讀開啟時，答錯時朗讀正確答案）
    var settings = window.Settings ? window.Settings.get() : { speechAuto: false };
    if (!correct && settings.speechAuto && window.Settings && window.Settings.speak) {
      var ansNum = CHINESE_NUMS[q.answer] || (q.answer + 1);
      var ansText = (q.options[q.answer] || '').trim();
      var fbSpeech = '正確答案是第' + ansNum + '個選項，' + ansText + '。';
      window.Settings.speak(fbSpeech);
    }

    var last = index === questions.length - 1;
    var next = el('button', 'btn btn-lg quiz-next-btn ' + (correct ? 'btn-primary' : 'btn-secondary'),
      last ? '完成本關練習 ➔ 前往結算' : '下一題 ➔（' + (index + 2) + ' / ' + questions.length + '）');
    next.type = 'button';
    next.addEventListener('click', last ? finish : function () {
      var nextQ = questions[index + 1];
      index++;
      hasStartedSpeechSession = true;
      // iPhone Safari 友善設計：在使用者按下「下一題」的點擊事件內直接呼叫 speak() 朗讀下一題
      if (settings.speechAuto && window.Settings && window.Settings.speak && nextQ) {
        window.Settings.speak(getQuestionSpeechText(nextQ));
        justSpokeNextInClick = true;
      }
      renderQuestion();
      window.scrollTo(0, 0);
    });
    fb.appendChild(next);
    root.appendChild(fb);
    next.focus({ preventScroll: true });
    fb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function mistakeNotice(m, correct) {
    if (!m) return null;
    var need = Store.MISTAKE_CLEAR_STREAK;
    var text;
    if (!correct) {
      text = (m.added ? '已加入錯題庫：' : '這題還在錯題庫：') + '連續答對 ' + need + ' 次這題就會過關，安心練習不用擔心！';
    } else if (m.cleared) {
      text = '這題已經過關，從錯題庫移出了！';
    } else if (m.inMistakes) {
      text = '錯題庫進度：連續答對 ' + m.streak + ' 次，再答對 ' + (need - m.streak) + ' 次就過關！';
    } else return null;

    var box = el('div', 'mistake-retest-notice');
    box.innerHTML = ICONS.repeat + '<strong style="margin-left: 6px;">' + text + '</strong>';
    return box;
  }

  // 每日挑戰：不用結算頁，直接在這裡顯示完成畫面（作答已經記在 Game.dailyAnswer 裡）
  function finishDaily() {
    var correctCount = results.filter(function (r) { return r.correct; }).length;
    var wrong = results.length - correctCount;
    if (window.Game && Game.checkBadges) Game.checkBadges();
    root.textContent = '';
    var box = el('div', 'quiz-message');
    box.appendChild(el('h1', 'quiz-done-title', '今日挑戰完成！'));
    box.appendChild(el('p', null, '答對 ' + correctCount + ' / ' + results.length + ' 題。' +
      (wrong ? '答錯的題目已經放進錯題庫，之後會再出現。' : '全部答對，太棒了！')));
    var acts = el('div', 'quiz-done-actions');
    var home = el('a', 'btn btn-primary btn-lg', '回首頁'); home.href = 'index.html'; acts.appendChild(home);
    if (wrong) { var mk = el('a', 'btn btn-outline btn-lg', '看錯題庫'); mk.href = 'mistakes.html'; acts.appendChild(mk); }
    box.appendChild(acts);
    root.appendChild(box);
    window.scrollTo(0, 0);
  }

  function finish() {
    if (mode === 'daily') return finishDaily();
    var correctCount = results.filter(function (r) { return r.correct; }).length;
    var score = Math.round(correctCount / questions.length * 100);

    Store.addAttempt({
      levelId: level ? level.id : mode,
      mode: mode,
      clearedCount: results.filter(function (r) { return r.cleared; }).length,
      answers: results,
      correctCount: correctCount,
      total: questions.length,
      score: score,
      seconds: Math.round((Date.now() - startedAt) / 1000)
    });

    if (mode === 'mistakes') {
      location.href = 'result.html?mode=mistakes';
    } else if (mode === 'daily') {
      location.href = 'result.html?mode=daily';
    } else {
      location.href = 'result.html?level=' + encodeURIComponent(level.id);
    }
  }

  function startMistakes() {
    var m = Store.getMistakes();
    var ids = Object.keys(m).filter(function (id) { return Data.getQuestion(id); });
    var only = new URLSearchParams(location.search).get('qid');
    if (only) ids = ids.filter(function (id) { return id === only; });
    ids.sort(function (a, b) { return m[a] - m[b]; });
    ids = ids.slice(0, Store.MISTAKE_RETEST_SIZE);
    if (!ids.length) return message('錯題庫是空的，太棒了！', '回首頁', 'index.html');
    level = { id: 'mistakes', category: '錯題重練', subcategory: '錯題重練', index: 0 };
    questions = ids.map(function (id) { return Data.getQuestion(id); });
    renderQuestion();
  }

  function startDaily() {
    if (typeof Game === 'undefined' || !Game.getDaily) {
      return message('載入時發生問題，請重新整理頁面。', '回首頁', 'index.html');
    }
    var d = Game.getDaily();
    dailyDate = d.date;
    level = { id: 'daily', category: '每日挑戰', subcategory: '3 分鐘挑戰', index: 1 };
    // 做到一半回來，只出還沒做的；已經全部做完還想再練，就把同一組再做一次
    var ids = d.remaining.length ? d.remaining : d.ids;
    questions = ids.map(function (id) { return Data.getQuestion(id); }).filter(Boolean);
    if (!questions.length) return message('今天的挑戰題目準備不起來，請回首頁再試一次。', '回首頁', 'index.html');
    renderQuestion();
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

    var params = new URLSearchParams(location.search);
    var levelId = params.get('level');
    var rawMode = params.get('mode');

    if (rawMode === 'mistakes') mode = 'mistakes';
    else if (rawMode === 'daily') mode = 'daily';
    else mode = 'level';

    Data.load().then(function () {
      return loadHazards();
    }).then(function () {
      if (mode === 'mistakes') return startMistakes();
      if (mode === 'daily') return startDaily();
      if (!levelId) return message('請從首頁選擇一個關卡。', '回首頁', 'index.html');

      level = Data.getLevel(levelId);
      // 若引擎尚未原生包含影片題關卡，從 getAllQuestions 建立 fallback 關卡
      if (!level && levelId && levelId.indexOf('影片題-') === 0) {
        var all = Data.getAllQuestions ? Data.getAllQuestions() : [];
        var videoQs = all.filter(function (q) { return q.source === '影片' || q.subcategory === '影片題'; });
        var idx = parseInt(levelId.replace('影片題-', ''), 10);
        if (idx >= 1) {
          var chunks = [];
          for (var i = 0; i < videoQs.length; i += Data.LEVEL_SIZE) chunks.push(videoQs.slice(i, i + Data.LEVEL_SIZE));
          if (chunks.length > 1 && chunks[chunks.length - 1].length < 5) {
            var tail = chunks.pop();
            chunks[chunks.length - 1] = chunks[chunks.length - 1].concat(tail);
          }
          if (idx <= chunks.length) {
            var c = chunks[idx - 1];
            level = {
              id: levelId,
              category: '危險感知',
              subcategory: '影片題',
              index: idx,
              questionIds: c.map(function (q) { return q.id; })
            };
            questions = c;
          }
        }
      }

      if (!level) return message('找不到這個關卡。', '回首頁', 'index.html');
      if (!questions) questions = Data.getLevelQuestions(levelId);
      renderQuestion();
    }).catch(function (err) {
      console.error('quiz 載入或顯示題目時出錯', err);   // 真正的錯誤只寫到 console，學生看到的是白話訊息
      message('載入時發生問題，請重新整理頁面。', '回首頁', 'index.html');
    });
  }

  init();
})();
