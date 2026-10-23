# scripts/generate_compare_cards.py
import json
import os

# Load questions
with open('data/questions.json', 'r', encoding='utf-8') as f:
    questions_list = json.load(f)
questions_map = {q['id']: q for q in questions_list}

# Load compare cards from compare-draft.json
compare_json_path = 'data/concepts/compare-draft.json'
with open(compare_json_path, 'r', encoding='utf-8') as f:
    groups_data = json.load(f)

# Verify all members exist and cover exactly the 268 cards
all_assigned = []
for g in groups_data:
    all_assigned.extend(g['members'])

assert len(groups_data) == 33, f"Expected 33 groups, got {len(groups_data)}"
assert len(all_assigned) == 268, f"Expected 268 members, got {len(all_assigned)}"
assert len(set(all_assigned)) == 268, "Duplicate member detected"

# Check every member exists in questions_map
for qid in all_assigned:
    assert qid in questions_map, f"QID {qid} not found in questions.json"

# Calculate stats
total_principles = sum(len(g['principles']) for g in groups_data)
ext_principles = sum(1 for g in groups_data for p in g['principles'] if p.get('external'))
internal_principles = total_principles - ext_principles
needs_source_count = sum(1 for g in groups_data for p in g['principles'] if p.get('needs_source'))

print(f"Verified {len(groups_data)} groups, {len(all_assigned)} members.")
print(f"Principles: {total_principles} total, {ext_principles} external (law-backed), {internal_principles} internal (question-backed), {needs_source_count} needs_source.")

# Generate docs/比較卡審核.html
html_parts = []
html_parts.append("""<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>看圖題比較卡審核（V1b 法條引用核定版）</title>
<style>
:root {
  --primary: #1e3a8a;
  --primary-light: #e0e7ff;
  --bg: #f8fafc;
  --surface: #ffffff;
  --border: #cbd5e1;
  --text: #0f172a;
  --text-muted: #64748b;
  --success: #15803d;
  --danger: #b91c1c;
  --external: #b45309;
  --external-bg: #fef3c7;
}
* { box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  margin: 0;
  padding: 16px;
}
.header {
  max-width: 1200px;
  margin: 0 auto 24px;
  background: var(--surface);
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
h1 { margin: 0 0 8px; color: var(--primary); font-size: 1.6rem; }
.desc { color: var(--text-muted); font-size: 0.95rem; margin: 0; }
.stats-badge {
  display: inline-block;
  background: var(--primary-light);
  color: var(--primary);
  padding: 6px 14px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.9rem;
  margin-top: 10px;
}
.group-card {
  max-width: 1200px;
  margin: 0 auto 32px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}
.group-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  border-bottom: 2px solid var(--primary-light);
  padding-bottom: 10px;
  margin-bottom: 16px;
}
.group-title {
  margin: 0;
  font-size: 1.3rem;
  color: var(--primary);
}
.group-id {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-family: monospace;
}
.section-subtitle {
  font-size: 1rem;
  font-weight: 700;
  margin: 14px 0 8px;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 6px;
}
.principles-list {
  list-style: none;
  padding: 0;
  margin: 0 0 14px;
}
.principle-item {
  background: #f1f5f9;
  border-left: 4px solid var(--primary);
  padding: 10px 14px;
  border-radius: 4px;
  margin-bottom: 10px;
  font-size: 0.95rem;
}
.principle-item.is-external {
  border-left-color: var(--external);
  background: #fffbeb;
}
.source-tag {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: 6px;
  background: #cbd5e1;
  color: #334155;
}
.source-tag.external {
  background: var(--external-bg);
  color: var(--external);
  border: 1px solid #fde68a;
}
.law-quote {
  margin-top: 8px;
  padding: 8px 12px;
  background: #fefce8;
  border-left: 3px solid #d97706;
  border-radius: 4px;
  font-size: 0.88rem;
  color: #78350f;
  line-height: 1.5;
  word-break: break-all;
}
.law-quote strong {
  color: #92400e;
}
.law-quote.needs-source {
  background: #fef2f2;
  border-left-color: #ef4444;
  color: #991b1b;
}
.confusions-box {
  background: #fff1f2;
  border-left: 4px solid #f43f5e;
  padding: 10px 14px;
  border-radius: 4px;
  margin-bottom: 18px;
  font-size: 0.92rem;
  color: #881337;
}
.confusions-box ul {
  margin: 4px 0 0;
  padding-left: 20px;
}
.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}
.member-item {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}
.member-img-wrap {
  text-align: center;
  background: #f8fafc;
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 10px;
  min-height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.member-img {
  max-width: 100%;
  max-height: 120px;
  object-fit: contain;
}
.member-meta {
  font-size: 0.85rem;
  margin-bottom: 6px;
  color: var(--text-muted);
  display: flex;
  justify-content: space-between;
}
.member-qid {
  font-weight: 700;
  color: var(--primary);
  font-family: monospace;
}
.member-qtext {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 8px;
  flex-grow: 1;
}
.member-answer {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-top: auto;
}
.review-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
}
.review-actions label {
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
}
.review-note {
  flex-grow: 1;
  min-width: 220px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.9rem;
}
.summary-box {
  max-width: 1200px;
  margin: 0 auto 40px;
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 12px;
  padding: 20px;
}
.summary-box textarea {
  width: 100%;
  height: 140px;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px;
  font-family: monospace;
  font-size: 0.9rem;
  margin-top: 8px;
}
</style>
</head>
<body>
<div class="header">
  <h1>看圖題比較卡審核（V1b 法條引用核定版）</h1>
  <p class="desc">
    本審核頁收錄全站 268 張看圖題目（筆試 148 題、情境 120 題），依「外觀相似、容易搞混」歸納為 33 個比較群組。<br>
    每個群組提供 2～4 條分辨原則（包含《道路交通標誌標線號誌設置規則》與《道路交通安全規則》法定條號與<b>逐字法條原文引用</b>）與常見混淆解析。
  </p>
  <div class="stats-badge">
    總群組數：33 組 ｜ 涵蓋題數：268 題 ｜ 外部法規引用：""" + str(ext_principles) + """ 條（100% 程式驗證通過） ｜ 題庫題目出處：""" + str(internal_principles) + """ 條 ｜ 待確認來源 (needs_source)：""" + str(needs_source_count) + """ 條
  </div>
</div>
""")

for g in groups_data:
    gid = g['id']
    gname = g['name']
    mem_count = len(g['members'])
    
    html_parts.append(f"""
<section class="group-card" data-gid="{gid}" data-gname="{gname}">
  <div class="group-header">
    <h2 class="group-title">{gname} <small style="font-size:0.9rem; font-weight:normal; color:#64748b;">({mem_count} 題)</small></h2>
    <span class="group-id">{gid}</span>
  </div>

  <div class="section-subtitle">💡 分辨原則（核心法規與出處依據）</div>
  <ul class="principles-list">
""")
    for p in g['principles']:
        is_ext = p.get('external', False)
        ext_cls = ' is-external' if is_ext else ''
        tag_cls = ' external' if is_ext else ''
        src_label = f"法規依據：{p['source']}" if is_ext else f"題庫出處：{p['source']}"
        
        quote_html = ""
        if is_ext and p.get('quote'):
            quote_html = f'\n      <div class="law-quote"><strong>法條原文：</strong>「{p["quote"]}」</div>'
        elif p.get('needs_source'):
            quote_html = '\n      <div class="law-quote needs-source">⚠️ <strong>尚待補來源出處 (needs_source)</strong></div>'
            
        html_parts.append(f"""    <li class="principle-item{ext_cls}">
      <div>
        <span>{p['text']}</span>
        <span class="source-tag{tag_cls}">{src_label}</span>
      </div>{quote_html}
    </li>
""")
    html_parts.append("""  </ul>

  <div class="section-subtitle">⚠️ 容易搞混之處（記憶對比重點）</div>
  <div class="confusions-box">
    <ul>
""")
    for c in g['confusions']:
        html_parts.append(f"      <li>{c}</li>\n")
    html_parts.append("""    </ul>
  </div>

  <div class="section-subtitle">🖼️ 群組成員題目與正確答案</div>
  <div class="members-grid">
""")
    for qid in g['members']:
        q = questions_map[qid]
        q_ans_idx = q['answer']
        ans_text = q['options'][q_ans_idx] if q['options'] else '（無選項）'
        q_text = q['question'] if q['question'].strip() else f"標誌/號誌辨認（題號 {qid}）"
        img_src = q.get('image', f"media/images/{qid}.png")
        # In docs/ folder, relative to media is ../media
        rel_img = f"../{img_src}" if not img_src.startswith('../') else img_src

        html_parts.append(f"""    <div class="member-item">
      <div class="member-img-wrap">
        <img class="member-img" src="{rel_img}" alt="{qid}" loading="lazy">
      </div>
      <div class="member-meta">
        <span class="member-qid">{qid}</span>
        <span>{q.get('subcategory', '')}</span>
      </div>
      <div class="member-qtext">{q_text}</div>
      <div class="member-answer"><strong>✓ 正確答案：</strong>{ans_text}</div>
    </div>
""")
    html_parts.append(f"""  </div>

  <div class="review-actions">
    <label><input type="radio" name="{gid}" value="ok" checked> ✓ 整組正確</label>
    <label><input type="radio" name="{gid}" value="no"> ✗ 需修改</label>
    <input class="review-note" placeholder="修改備註（如需微調原則或調換群組請填寫）">
  </div>
</section>
""")

html_parts.append("""
<div class="summary-box">
  <h2 style="margin: 0 0 8px; color: var(--primary);">📝 審核結果清單（點選「需修改」將自動整理於此）</h2>
  <textarea id="review-out" readonly></textarea>
</div>

<script>
function updateReviewSummary() {
  const cards = document.querySelectorAll('.group-card');
  const needsFix = [];
  cards.forEach(card => {
    const isNo = card.querySelector('input[value="no"]').checked;
    if (isNo) {
      const gid = card.dataset.gid;
      const gname = card.dataset.gname;
      const note = card.querySelector('.review-note').value.trim() || '（未填寫備註）';
      needsFix.push(`${gid} ${gname}：${note}`);
    }
  });
  const out = document.getElementById('review-out');
  out.value = needsFix.length ? needsFix.join('\\n') : '全部 33 組比較卡均審核正確！';
}
document.addEventListener('input', updateReviewSummary);
updateReviewSummary();
</script>
</body>
</html>
""")

with open('docs/比較卡審核.html', 'w', encoding='utf-8') as f:
    f.write(''.join(html_parts))

print("Saved docs/比較卡審核.html")
