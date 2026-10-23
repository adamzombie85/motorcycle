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
      if (window.Settings && window.Settings.speak) {
        window.Settings.speak(q.question.trim() || BLANK_PROMPT);
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
      var video = el('video');
      video.src = Data.assetUrl(q.video);
      video.controls = true;
      video.preload = 'metadata';
      video.style.cssText = 'width: 100%; max-height: 320px; border-radius: var(--radius-md); background: #000;';
      vFrame.appendChild(video);
      card.appendChild(vFrame);
    }

    var settings = window.Settings ? window.Settings.get() : { confirmAnswer: false, speechAuto: false };

    // 自動朗讀
    if (settings.speechAuto && window.Settings && window.Settings.speak) {
      window.Settings.speak(text || BLANK_PROMPT);
    }

    var list = el('div', 'options-list');
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
    }

    var notice = mistakeNotice(mistake, correct);
    if (notice) fb.appendChild(notice);

    var last = index === questions.length - 1;
    var next = el('button', 'btn btn-lg quiz-next-btn ' + (correct ? 'btn-primary' : 'btn-secondary'),
      last ? '完成本關練習 ➔ 前往結算' : '下一題 ➔（' + (index + 2) + ' / ' + questions.length + '）');
    next.type = 'button';
    next.addEventListener('click', last ? finish : function () {
      index++;
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
      if (mode === 'mistakes') return startMistakes();
      if (mode === 'daily') return startDaily();
      if (!levelId) return message('請從首頁選擇一個關卡。', '回首頁', 'index.html');
      level = Data.getLevel(levelId);
      if (!level) return message('找不到這個關卡。', '回首頁', 'index.html');
      questions = Data.getLevelQuestions(levelId);
      renderQuestion();
    }).catch(function (err) {
      console.error('quiz 載入或顯示題目時出錯', err);   // 真正的錯誤只寫到 console，學生看到的是白話訊息
      message('載入時發生問題，請重新整理頁面。', '回首頁', 'index.html');
    });
  }

  init();
})();
