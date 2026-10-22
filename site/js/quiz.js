/* 答題畫面。題目、選項、答案一律照題庫，不改字、不打亂順序。 */
(function () {
  var root = document.getElementById('quiz-root');
  var BLANK_PROMPT = '請看圖，選出正確的答案。';
  // 反向題關鍵字：只加標記，不改字
  var REVERSE_RE = /不正確|不適當|不包括|不屬於|不是|不利於|不可以|不須|不符|不當|有違|錯誤|非屬|為非|何者非|非/g;

  var level, mode, questions, index = 0, results = [], answered = false, startedAt = Date.now();

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
    top.appendChild(el('div', 'level-title-chip', mode === 'mistakes'
      ? '🔁 錯題重練'
      : '🎯 ' + level.category + ' · ' + level.subcategory + '（第 ' + level.index + ' 關）'));
    var pause = el('a', 'btn btn-outline quiz-pause-btn', '暫停離開');
    pause.href = 'index.html';
    top.appendChild(pause);
    return top;
  }

  function renderProgress() {
    var sec = el('div', 'quiz-progress-section');
    var head = el('div', 'progress-header');
    var done = results.length;
    head.appendChild(el('span', null, '關卡進度：第 ' + (index + 1) + ' 題 / 共 ' + questions.length + ' 題'));
    head.appendChild(el('span', null, '進行中（' + Math.round(done / questions.length * 100) + '%）'));
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
    root.textContent = '';
    root.appendChild(renderTop());
    root.appendChild(renderProgress());

    if (reverse) {
      var alertBox = el('div', 'alert-reverse');
      alertBox.appendChild(el('span', 'alert-reverse-icon', '⚠️'));
      var content = el('div', 'alert-reverse-content');
      content.appendChild(el('strong', null, '反向題提醒：'));
      content.appendChild(document.createTextNode('這題的題目裡有「不」「錯誤」這類字眼，請看清楚題目問的是什麼，再選答案。'));
      alertBox.appendChild(content);
      root.appendChild(alertBox);
    }

    var card = el('div', 'question-card');
    var meta = el('div', 'question-meta-row');
    var tags = el('div', 'tag-list');
    tags.appendChild(el('span', 'tag tag-category', q.category));
    tags.appendChild(el('span', 'tag tag-sub', q.subcategory));
    if (reverse) tags.appendChild(el('span', 'tag tag-reverse', '⚠️ 反向題'));
    meta.appendChild(tags);
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

    var list = el('div', 'options-list');
    q.options.forEach(function (opt, i) {
      var b = el('button', 'option-card');
      b.type = 'button';
      b.appendChild(el('span', 'option-badge', String(i + 1)));
      b.appendChild(el('span', 'option-label', opt));
      b.addEventListener('click', function () { choose(i, list, card); });
      list.appendChild(b);
    });
    card.appendChild(list);
    root.appendChild(card);
  }

  function setIndicator(btn, text) {
    btn.appendChild(el('span', 'option-indicator', text));
  }

  function choose(choice, list, card) {
    if (answered) return;
    answered = true;
    var q = questions[index];
    var correct = choice === q.answer;
    var mistake = Store.recordAnswer(q.id, correct);
    results.push({ qid: q.id, choice: choice, correct: correct, cleared: mistake.cleared });

    Array.prototype.forEach.call(list.children, function (btn, i) {
      btn.disabled = true;
      if (i === q.answer) { btn.classList.add('is-correct'); setIndicator(btn, '✔ 正確解答'); }
      else if (i === choice) { btn.classList.add('is-wrong'); setIndicator(btn, '✖ 你的選擇'); }
      else btn.classList.add('is-dimmed');
    });

    var fb = el('div', 'feedback-card ' + (correct ? 'is-success' : 'is-danger'));
    var head = el('div', 'feedback-header');
    head.appendChild(el('div', 'feedback-icon', correct ? '✔' : '✖'));
    var htext = el('div');
    htext.appendChild(el('div', 'feedback-title', correct ? '答對了！🎉' : '這題選錯囉，沒關係！💪'));
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
      last ? '完成本關練習 ➔ 前往結算' : '下一題 ➔（第 ' + (index + 2) + ' 題）');
    next.type = 'button';
    next.addEventListener('click', last ? finish : function () { index++; renderQuestion(); window.scrollTo(0, 0); });
    fb.appendChild(next);
    root.appendChild(fb);
    next.focus({ preventScroll: true });
    fb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function mistakeNotice(m, correct) {
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
    box.appendChild(document.createTextNode('🔁 '));
    box.appendChild(el('strong', null, text));
    return box;
  }

  function finish() {
    var correctCount = results.filter(function (r) { return r.correct; }).length;
    Store.addAttempt({
      levelId: level.id,
      mode: mode,
      clearedCount: results.filter(function (r) { return r.cleared; }).length,
      answers: results,
      correctCount: correctCount,
      total: questions.length,
      score: Math.round(correctCount / questions.length * 100),
      seconds: Math.round((Date.now() - startedAt) / 1000)
    });
    location.href = 'result.html?' + (mode === 'mistakes' ? 'mode=mistakes' : 'level=' + encodeURIComponent(level.id));
  }

  function startMistakes() {
    var m = Store.getMistakes();
    // 連續答對次數少的先練；同分照題庫順序
    var ids = Object.keys(m).filter(function (id) { return Data.getQuestion(id); });
    var only = new URLSearchParams(location.search).get('qid'); // 單獨複習某一題
    if (only) ids = ids.filter(function (id) { return id === only; });
    ids.sort(function (a, b) { return m[a] - m[b]; });
    ids = ids.slice(0, Store.MISTAKE_RETEST_SIZE);
    if (!ids.length) return message('錯題庫是空的，太棒了！', '回首頁', 'index.html');
    level = { id: 'mistakes', category: '錯題重練', subcategory: '錯題重練', index: 0 };
    questions = ids.map(function (id) { return Data.getQuestion(id); });
    renderQuestion();
  }

  function init() {
    if (!Store.getStudent()) Store.setStudent('訪客'); // 登入功能之後再做，先用預設代號
    document.getElementById('user-chip').textContent = '👤 ' + Store.getStudent();
    var params = new URLSearchParams(location.search);
    var levelId = params.get('level');
    mode = params.get('mode') === 'mistakes' ? 'mistakes' : 'level';
    Data.load().then(function () {
      if (mode === 'mistakes') return startMistakes();
      if (!levelId) return message('請從首頁選擇一個關卡。', '回首頁', 'index.html');
      level = Data.getLevel(levelId);
      if (!level) return message('找不到這個關卡。', '回首頁', 'index.html');
      questions = Data.getLevelQuestions(levelId);
      renderQuestion();
    }).catch(function () {
      message('題庫載入失敗，請用網址 http://localhost:8000/site/ 開啟（不要直接點檔案）。');
    });
  }
  init();
})();
