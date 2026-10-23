/**
 * 純程式合成 Web Audio 音效模組 (Sound.js)
 * 依照 docs/遊戲化設計.md 規格：純瀏覽器 Web Audio 即時產生，不放任何外部音檔。
 * 遵循閱讀設定之 soundEffects 開關。
 */
(function () {
  'use strict';

  var audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(function () {});
    }
    return audioCtx;
  }

  function isEnabled() {
    return (window.Settings && window.Settings.get) 
      ? window.Settings.get().soundEffects !== false 
      : true;
  }

  // 1. 答對提示音：短促清脆雙音 (C5 -> E5)
  function playCorrect() {
    if (!isEnabled()) return;
    var ctx = getAudioContext();
    if (!ctx) return;
    try {
      var t = ctx.currentTime;
      var osc1 = ctx.createOscillator();
      var osc2 = ctx.createOscillator();
      var gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, t);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, t + 0.07);

      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(t);
      osc1.stop(t + 0.09);
      osc2.start(t + 0.07);
      osc2.stop(t + 0.25);
    } catch (e) {}
  }

  // 2. 答錯溫和低音 (220Hz 三角波，不刺耳)
  function playWrong() {
    if (!isEnabled()) return;
    var ctx = getAudioContext();
    if (!ctx) return;
    try {
      var t = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(174.6, t + 0.18);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.22);
    } catch (e) {}
  }

  // 3. 過關慶祝和弦 (C5 -> E5 -> G5 -> C6)
  function playPass() {
    if (!isEnabled()) return;
    var ctx = getAudioContext();
    if (!ctx) return;
    try {
      var notes = [523.25, 659.25, 783.99, 1046.50];
      var t = ctx.currentTime;
      notes.forEach(function (freq, i) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + i * 0.09);
        gain.gain.setValueAtTime(0.16, t + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + i * 0.09);
        osc.stop(t + i * 0.09 + 0.35);
      });
    } catch (e) {}
  }

  // 4. 徽章解鎖閃亮琶音 (E5 -> G#5 -> B5 -> E6)
  function playBadge() {
    if (!isEnabled()) return;
    var ctx = getAudioContext();
    if (!ctx) return;
    try {
      var notes = [659.25, 830.61, 987.77, 1318.51];
      var t = ctx.currentTime;
      notes.forEach(function (freq, i) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + i * 0.08);
        gain.gain.setValueAtTime(0.18, t + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + i * 0.08);
        osc.stop(t + i * 0.08 + 0.4);
      });
    } catch (e) {}
  }

  window.Sound = {
    correct: playCorrect,
    wrong: playWrong,
    pass: playPass,
    badge: playBadge
  };
})();
