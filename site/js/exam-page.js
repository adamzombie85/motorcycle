/**
 * 50 題全真模擬考前端互動模組 (exam-page.js)
 * 嚴格遵循新制機車駕照筆試規範：
 * - 總題數 50 題，85 分合格（需答對 43 題以上）
 * - 通用設計 (Universal Design)：不計時，低考試焦慮，支援注音、字級縮放與語音朗讀
 * - 出題與評分全面呼叫 Exam.generate() 與 Exam.grade()
 * - 作答紀錄全面寫入 Store.recordAnswer(qid, correct, { choice, src: 'exam' })
 */
(function () {
  'use strict';

  var root = document.getElementById('exam-root');
  if (!root) return;

  var BLANK_PROMPT = '請看圖，選出正確的答案。';
  var REVERSE_RE = /不正確|不適當|不包括|不屬於|不是|不利於|不可以|不須|不符|不當|有違|錯誤|非屬|為非|何者非|非/g;

  var ICONS = {
    award: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
    check: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
    x: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    volume: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
    alert: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x1="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>',
    list: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    chevronDown: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>',
    chevronUp: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>',
    chart: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    repeat: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>',
    home: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    target: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>'
  };

  // 狀態變數
  var examData = null;
  var questions = [];
  var CHINESE_NUMS = ['一', '二', '三', '四', '五'];

  function getExamQuestionSpeechText(q) {
    var raw = (q.question || '').trim();
    var qText = raw || BLANK_PROMPT;
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
  var userAnswers = {}; // { [qid]: optionIndex }
  var currentIndex = 0;
  var showGrid = false;
  var isSubmitting = false;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }

  function appendMarked(parent, text, reverse) {
    if (!reverse) {
      parent.appendChild(document.createTextNode(text));
      return;
    }
    var last = 0;
    var m;
    REVERSE_RE.lastIndex = 0;
    while ((m = REVERSE_RE.exec(text))) {
      if (m.index > last) {
        parent.appendChild(document.createTextNode(text.slice(last, m.index)));
      }
      parent.appendChild(el('mark', 'highlight-reverse', m[0]));
      last = m.index + m[0].length;
    }
    if (last < text.length) {
      parent.appendChild(document.createTextNode(text.slice(last)));
    }
  }

  // 1. 測驗入口說明畫面
  function renderIntroScreen() {
    root.textContent = '';

    var card = el('div', 'exam-intro-card');

    var avatar = (typeof Game !== 'undefined' && Game.getAvatar) ? Game.getAvatar() : 'rider-1';
    var img = el('img');
    img.src = 'assets/illustrations/' + avatar + '.png';
    img.alt = '騎士角色';
    img.style.cssText = 'width: 108px; height: 108px; object-fit: contain; margin-bottom: var(--space-4);';
    card.appendChild(img);

    card.appendChild(el('h1', 'exam-intro-title', '50 題全真模擬考'));
    card.appendChild(el('p', 'exam-intro-desc', '比照正式新制機車筆試規格，50 題全面檢驗學習成果。依你的節奏安心作答，無倒數計時壓力。'));

    var list = el('div', 'exam-features-list');

    var f1 = el('div', 'exam-feature-item');
    f1.innerHTML = '<div class="exam-feature-icon">' + ICONS.list + '</div><div><div class="exam-feature-label">50 題單選題</div><div class="exam-feature-sub">含 35 題法規觀念與 15 題情境題</div></div>';
    list.appendChild(f1);

    var f2 = el('div', 'exam-feature-item');
    f2.innerHTML = '<div class="exam-feature-icon">' + ICONS.award + '</div><div><div class="exam-feature-label">85 分及格標準</div><div class="exam-feature-sub">滿分 100 分，答對 43 題以上合格</div></div>';
    list.appendChild(f2);

    var f3 = el('div', 'exam-feature-item');
    f3.innerHTML = '<div class="exam-feature-icon">' + ICONS.target + '</div><div><div class="exam-feature-label">通用設計不限時</div><div class="exam-feature-sub">無計時器倒數，隨時可回頭檢查更正</div></div>';
    list.appendChild(f3);

    var f4 = el('div', 'exam-feature-item');
    f4.innerHTML = '<div class="exam-feature-icon">' + ICONS.chart + '</div><div><div class="exam-feature-label">四大類詳細分析</div><div class="exam-feature-sub">結算提供各領域答對率與錯題檢視</div></div>';
    list.appendChild(f4);

    card.appendChild(list);

    var btnStart = el('button', 'btn btn-primary btn-lg', '開始模擬考');
    btnStart.id = 'btn-start-exam';
    btnStart.style.cssText = 'min-width: 200px; font-size: 1.125rem; padding: 14px 28px;';
    btnStart.onclick = startExam;
    card.appendChild(btnStart);

    root.appendChild(card);
  }

  // 2. 開始模擬考
  function startExam() {
    root.textContent = '';
    var loadingP = el('p', null, '模擬考出題中…');
    loadingP.style.cssText = 'text-align:center; padding: 48px 0; font-size: 1.125rem;';
    root.appendChild(loadingP);

    try {
      // 依規範 includeVideo: false，等影片模式做好才開啟
      examData = Exam.generate({ includeVideo: false });
      questions = examData.ids.map(function (id) {
        return Data.getQuestion(id);
      }).filter(Boolean);

      if (questions.length < 50) {
        throw new Error('題庫題目不足 50 題');
      }

      userAnswers = {};
      currentIndex = 0;
      showGrid = false;
      isSubmitting = false;

      renderExamQuestion();
    } catch (err) {
      root.textContent = '';
      var errBox = el('div', 'empty-state-card');
      console.error('模擬考建立失敗', err);   // 真正的錯誤寫到 console
      errBox.appendChild(el('div', 'empty-state-title', '載入時發生問題，請重新整理頁面。'));
      var btnBack = el('button', 'btn btn-primary', '回模擬考首頁');
      btnBack.onclick = renderIntroScreen;
      errBox.appendChild(btnBack);
      root.appendChild(errBox);
    }
  }

  // 3. 渲染當前作答題目
  function renderExamQuestion() {
    root.textContent = '';

    var q = questions[currentIndex];
    var answeredCount = Object.keys(userAnswers).length;
    var isCurrentAnswered = userAnswers[q.id] !== undefined;

    // A. 頂部操作列
    var topBar = el('div', 'quiz-top-bar');
    var chip = el('div', 'level-title-chip');
    chip.innerHTML = ICONS.target + '<span style="margin-left: 6px;">50 題全真模擬考</span>';
    topBar.appendChild(chip);

    var btnLeave = el('button', 'btn btn-outline quiz-pause-btn', '中途離開');
    btnLeave.onclick = function () {
      if (confirm('確定要離開本次模擬考嗎？未完成的作答將不會計分。')) {
        renderIntroScreen();
      }
    };
    topBar.appendChild(btnLeave);
    root.appendChild(topBar);

    // B. 進度與題號導覽區
    var progSec = el('div', 'quiz-progress-section');
    var pHead = el('div', 'progress-header');
    pHead.appendChild(el('span', 'text-nowrap', '題目進度：' + (currentIndex + 1) + ' / ' + questions.length));
    pHead.appendChild(el('span', 'text-nowrap', '已作答 ' + answeredCount + ' 題 (' + Math.round(answeredCount / questions.length * 100) + '%)'));
    progSec.appendChild(pHead);

    var barWrap = el('div', 'progress-bar-wrap');
    var barFill = el('div', 'progress-bar-fill');
    barFill.style.width = (answeredCount / questions.length * 100) + '%';
    barWrap.appendChild(barFill);
    progSec.appendChild(barWrap);

    // 50 題跳轉網格摺疊按鈕
    var toggleGridBtn = el('button', 'exam-grid-toggle');
    toggleGridBtn.type = 'button';
    toggleGridBtn.innerHTML = (showGrid ? ICONS.chevronUp : ICONS.chevronDown) +
      '<span>' + (showGrid ? '收合題號列表' : '展開 50 題號列表（已答 ' + answeredCount + ' / 50）') + '</span>';
    toggleGridBtn.onclick = function () {
      showGrid = !showGrid;
      renderExamQuestion();
    };
    progSec.appendChild(toggleGridBtn);

    // 展開時渲染 50 格
    if (showGrid) {
      var grid = el('div', 'exam-question-grid');
      questions.forEach(function (tq, idx) {
        var cell = el('button', 'exam-grid-cell');
        cell.type = 'button';
        cell.textContent = String(idx + 1);
        if (userAnswers[tq.id] !== undefined) {
          cell.className += ' is-answered';
        }
        if (idx === currentIndex) {
          cell.className += ' is-current';
        }
        cell.onclick = function () {
          currentIndex = idx;
          renderExamQuestion();
        };
        grid.appendChild(cell);
      });
      progSec.appendChild(grid);
    }

    root.appendChild(progSec);

    // C. 題目卡片
    var card = el('div', 'question-card');
    card.setAttribute('data-qid', q.id);

    // 題目分類標籤
    var catBadge = el('div', 'badge');
    catBadge.style.cssText = 'background-color: var(--color-primary-50); color: var(--color-primary-800); font-weight: 700; margin-bottom: var(--space-3); display: inline-flex; align-items: center; gap: 4px;';
    catBadge.textContent = q.category + (q.subcategory ? ' · ' + q.subcategory : '');
    card.appendChild(catBadge);

    // 反向題醒目標籤
    var isReverse = (q.tags || []).indexOf('反向題') !== -1 || REVERSE_RE.test(q.question);
    if (isReverse) {
      var alert = el('div', 'alert-reverse');
      alert.innerHTML = ICONS.alert + '<span>題目裡有「不」「錯誤」這類字眼，請看清楚題目問的是什麼，再選答案。</span>';
      card.appendChild(alert);
    }

    // 題目文字與朗讀按鈕
    var titleWrap = el('div', 'question-title-wrapper');
    var h2 = el('h2', 'question-title');
    var rawText = q.question.trim() || BLANK_PROMPT;
    appendMarked(h2, rawText, isReverse);
    titleWrap.appendChild(h2);

    var speakBtn = el('button', 'btn btn-outline reading-speak-btn');
    speakBtn.type = 'button';
    speakBtn.setAttribute('aria-label', '朗讀本題題目');
    speakBtn.title = '朗讀本題題目';
    speakBtn.innerHTML = ICONS.volume;
    speakBtn.onclick = function () {
      if (window.Settings && Settings.speak) {
        Settings.speak(getExamQuestionSpeechText(q));
      }
    };
    titleWrap.appendChild(speakBtn);
    card.appendChild(titleWrap);

    // 圖片
    if (q.image) {
      var imgWrap = el('div', 'question-image-wrapper');
      var qImg = el('img');
      qImg.src = Data.assetUrl(q.image);
      qImg.alt = '題目配圖';
      imgWrap.appendChild(qImg);
      card.appendChild(imgWrap);
    }

    // 選項列表
    var optionsList = el('div', 'options-list');
    var optLabels = ['1', '2', '3'];

    q.options.forEach(function (optText, optIdx) {
      var optCard = el('div', 'option-card');
      optCard.setAttribute('role', 'button');
      optCard.setAttribute('tabindex', '0');

      var isSelected = (userAnswers[q.id] === optIdx);
      if (isSelected) {
        optCard.className += ' is-selected';
      }

      var key = el('div', 'option-key', optLabels[optIdx] || String(optIdx + 1));
      optCard.appendChild(key);

      var txt = el('div', 'option-text');
      txt.textContent = optText;
      optCard.appendChild(txt);

      var statePill = el('div', 'option-state-pill');
      if (isSelected) {
        statePill.innerHTML = ICONS.check + '<span style="margin-left: 4px;">已選擇</span>';
      }
      optCard.appendChild(statePill);

      optCard.onclick = function () {
        userAnswers[q.id] = optIdx;
        if (window.Sound && Sound.correct) {
          Sound.correct();
        }
        renderExamQuestion();
      };

      optCard.onkeydown = function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          optCard.click();
        }
      };

      optionsList.appendChild(optCard);
    });

    card.appendChild(optionsList);
    root.appendChild(card);

    // D. 底部導覽按鈕
    var actBar = el('div', 'exam-actions-bar');

    var btnPrev = el('button', 'btn btn-outline', '← 上一題');
    btnPrev.type = 'button';
    btnPrev.disabled = (currentIndex === 0);
    btnPrev.onclick = function () {
      if (currentIndex > 0) {
        currentIndex--;
        renderExamQuestion();
      }
    };
    actBar.appendChild(btnPrev);

    var btnNext = el('button', 'btn btn-primary', currentIndex === questions.length - 1 ? '檢查交卷' : '下一題 →');
    btnNext.type = 'button';
    btnNext.onclick = function () {
      if (currentIndex < questions.length - 1) {
        currentIndex++;
        renderExamQuestion();
      } else {
        submitExam();
      }
    };
    actBar.appendChild(btnNext);

    var btnSubmit = el('button', 'btn btn-accent exam-submit-btn', '交卷結算成績');
    btnSubmit.type = 'button';
    btnSubmit.onclick = submitExam;
    actBar.appendChild(btnSubmit);

    root.appendChild(actBar);

    // 捲動到視窗頂部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 4. 交卷結算
  function submitExam() {
    if (isSubmitting) return;

    var answeredCount = Object.keys(userAnswers).length;
    var unanswered = questions.length - answeredCount;

    if (unanswered > 0) {
      var msg = '尚有 ' + unanswered + ' 題尚未作答！\n未作答的題目將視為答錯。確定要現在交卷結算嗎？';
      if (!confirm(msg)) {
        return;
      }
    }

    isSubmitting = true;

    // A. 建立評分用的答案對照表
    var answersMap = {};
    questions.forEach(function (q) {
      var userChoice = userAnswers[q.id];
      var isCorrect = (userChoice !== undefined && userChoice === q.answer);
      answersMap[q.id] = isCorrect;

      // B. 寫入 Store.recordAnswer
      if (window.Store && Store.recordAnswer) {
        Store.recordAnswer(q.id, isCorrect, { choice: userChoice, src: 'exam' });
      }
    });

    // C. 檢查徽章成就
    if (typeof Game !== 'undefined' && Game.checkBadges) {
      Game.checkBadges();
    }

    // D. 呼叫 Exam.grade 計算成績與四大類比例
    var gradeResult = Exam.grade(examData.ids, answersMap);

    // E. 渲染結算畫面
    renderResultScreen(gradeResult);
  }

  // 5. 渲染模擬考結算畫面
  function renderResultScreen(grade) {
    root.textContent = '';

    var sec = el('div', 'exam-result-section');

    // 成績卡片
    var heroCard = el('section', 'result-hero-card');
    heroCard.appendChild(el('div', 'result-subtitle text-nowrap', '50 題全真模擬考 · 測驗結果'));

    // 過關慶祝插圖與音效
    var currentAvatar = (typeof Game !== 'undefined' && Game.getAvatar) ? Game.getAvatar() : 'rider-1';
    var isFemale = (currentAvatar === 'rider-2' || currentAvatar === 'rider-4');

    if (grade.passed) {
      var ill = el('div', 'result-celebration-ill');
      ill.style.cssText = 'display: flex; justify-content: center; margin: var(--space-2) 0 var(--space-4) 0;';
      var img = el('img');
      img.src = isFemale ? 'assets/illustrations/celebrate-level-f.png' : 'assets/illustrations/celebrate-level.png';
      img.alt = '合格通過慶祝插畫';
      img.style.cssText = 'max-width: 220px; height: auto; object-fit: contain;';
      ill.appendChild(img);
      heroCard.appendChild(ill);

      if (window.Sound && Sound.pass) {
        Sound.pass();
      }
    } else {
      if (window.Sound && Sound.wrong) {
        Sound.wrong();
      }
    }

    // 分數圓環
    var circle = el('div', 'score-badge-circle');
    circle.appendChild(el('span', 'score-num', String(grade.score)));
    circle.appendChild(el('span', 'score-unit', '分 / 滿分 100'));
    heroCard.appendChild(circle);

    // 及格狀態
    var pill = el('div', 'pass-status-pill ' + (grade.passed ? 'is-pass' : 'is-fail'),
      grade.passed
        ? '🎉 模擬考合格通過！（及格標準 85 分）'
        : '差一點就及格了，再接再厲！（及格標準 85 分）');
    heroCard.appendChild(pill);

    var summaryText = el('p', 'result-summary-text');
    summaryText.appendChild(document.createTextNode('本次 50 題中答對 '));
    summaryText.appendChild(el('strong', null, grade.correct + ' 題'));
    summaryText.appendChild(document.createTextNode('，答錯 '));
    summaryText.appendChild(el('strong', null, (50 - grade.correct) + ' 題'));
    summaryText.appendChild(document.createTextNode('。'));
    heroCard.appendChild(summaryText);

    sec.appendChild(heroCard);

    // 四大類別答對率分析 (Breakdown by 4 categories)
    var catSection = el('section', 'page-block');
    var catHead = el('div', 'section-heading');
    var catH2 = el('h2', 'section-heading-title');
    catH2.innerHTML = ICONS.chart + '<span>四大類別診斷分析</span>';
    catHead.appendChild(catH2);
    catSection.appendChild(catHead);

    var catGrid = el('div', 'exam-category-breakdown');
    var catNames = Object.keys(grade.byCategory);

    catNames.forEach(function (cat) {
      var item = grade.byCategory[cat];
      var catCard = el('div', 'exam-cat-card');

      var head = el('div', 'exam-cat-head');
      head.appendChild(el('div', 'exam-cat-title', cat));
      head.appendChild(el('div', 'exam-cat-score', item.rate + '%'));
      catCard.appendChild(head);

      var barBg = el('div', 'exam-cat-bar-bg');
      var barFill = el('div', 'exam-cat-bar-fill');
      barFill.style.width = item.rate + '%';
      if (item.rate >= 85) {
        barFill.className += ' is-high';
      } else if (item.rate >= 60) {
        barFill.className += ' is-mid';
      } else {
        barFill.className += ' is-low';
      }
      barBg.appendChild(barFill);
      catCard.appendChild(barBg);

      var meta = el('div', 'exam-cat-meta');
      meta.appendChild(el('span', null, '答對 ' + item.correct + ' / ' + item.total + ' 題'));
      meta.appendChild(el('span', null, item.rate >= 85 ? '✓ 熟練' : '待加強'));
      catCard.appendChild(meta);

      catGrid.appendChild(catCard);
    });

    catSection.appendChild(catGrid);
    sec.appendChild(catSection);

    // 本次錯題檢視
    var wrongQuestions = questions.filter(function (q) {
      return userAnswers[q.id] === undefined || userAnswers[q.id] !== q.answer;
    });

    var wrongSection = el('section', 'page-block');
    var wrongHead = el('div', 'section-heading');
    var wrongH2 = el('h2', 'section-heading-title');
    wrongH2.innerHTML = ICONS.repeat + '<span>本次錯題檢視（' + wrongQuestions.length + ' 題）</span>';
    wrongHead.appendChild(wrongH2);
    wrongSection.appendChild(wrongHead);

    if (wrongQuestions.length === 0) {
      var emptyBox = el('div', 'empty-state-card');
      var eImg = el('img');
      eImg.src = isFemale ? 'assets/illustrations/empty-mistakes-f.png' : 'assets/illustrations/empty-mistakes.png';
      eImg.alt = '全數答對';
      eImg.style.cssText = 'max-width: 140px; margin: 0 auto var(--space-3); display: block;';
      emptyBox.appendChild(eImg);
      emptyBox.appendChild(el('div', 'empty-state-title', '太厲害了！全數答對，零錯題！'));
      emptyBox.appendChild(el('p', null, '保持這個實力，正式筆試一定穩過關！'));
      wrongSection.appendChild(emptyBox);
    } else {
      var listWrap = el('div', 'mistakes-list');
      wrongQuestions.forEach(function (q, idx) {
        var mCard = el('div', 'mistake-item-card');

        var mTop = el('div', 'mistake-card-header');
        mTop.appendChild(el('span', 'badge', '#' + (idx + 1) + ' · ' + q.category));
        mCard.appendChild(mTop);

        var mTitle = el('h3', 'mistake-title', q.question.trim() || BLANK_PROMPT);
        mCard.appendChild(mTitle);

        if (q.image) {
          var mImg = el('img');
          mImg.src = Data.assetUrl(q.image);
          mImg.alt = '題目圖示';
          mImg.style.cssText = 'max-width: 240px; border-radius: var(--radius-md); margin-bottom: var(--space-3);';
          mCard.appendChild(mImg);
        }

        var reviewBox = el('div', 'mistake-review-box');
        var userChoiceIdx = userAnswers[q.id];
        var userChoiceText = userChoiceIdx !== undefined ? q.options[userChoiceIdx] : '（未作答）';
        var correctChoiceText = q.options[q.answer];

        var lineWrong = el('div', 'choice-line is-wrong');
        lineWrong.innerHTML = ICONS.x + '<span style="margin-left: 6px;">你的作答：' + userChoiceText + '</span>';
        reviewBox.appendChild(lineWrong);

        var lineCorrect = el('div', 'choice-line is-correct');
        lineCorrect.innerHTML = ICONS.check + '<span style="margin-left: 6px;">正確答案：' + correctChoiceText + '</span>';
        reviewBox.appendChild(lineCorrect);

        mCard.appendChild(reviewBox);
        listWrap.appendChild(mCard);
      });
      wrongSection.appendChild(listWrap);
    }

    sec.appendChild(wrongSection);

    // 下一步行動按鈕
    var actSec = el('div', 'result-actions-grid');
    actSec.style.cssText = 'display: flex; flex-wrap: wrap; gap: var(--space-3); justify-content: center; margin-top: var(--space-6);';

    var btnRetry = el('button', 'btn btn-primary btn-lg', '再測驗一次');
    btnRetry.onclick = startExam;
    actSec.appendChild(btnRetry);

    var btnHome = el('a', 'btn btn-outline btn-lg', '回首頁');
    btnHome.href = 'index.html';
    actSec.appendChild(btnHome);

    var btnMistakes = el('a', 'btn btn-outline btn-lg', '前往錯題庫特訓');
    btnMistakes.href = 'mistakes.html';
    actSec.appendChild(btnMistakes);

    sec.appendChild(actSec);

    root.appendChild(sec);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 6. 初始化
  function init() {
    // 其他頁面都會在沒有學生代號時先用「訪客」；模擬考也一樣，不然第一次進來會顯示「尚未設定學生代號」
    if (!Store.getStudent()) Store.setStudent('guest');
    var chip = document.getElementById('user-chip');
    if (chip) chip.textContent = Store.getStudent() === 'guest' ? '訪客' : Store.getStudent();
    if (typeof Data !== 'undefined' && Data.load) {
      Data.load().then(function () {
        renderIntroScreen();
      }).catch(function (err) {
        console.error('模擬考載入失敗', err);
        root.textContent = '';
        var errBox = el('div', 'empty-state-card');
        errBox.appendChild(el('div', 'empty-state-title', '載入時發生問題，請重新整理頁面。'));
        root.appendChild(errBox);
      });
    } else {
      renderIntroScreen();
    }
  }

  init();
})();
