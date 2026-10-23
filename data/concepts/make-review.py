#!/usr/bin/env python3
"""用法: python3 data/concepts/make-review.py 01 貨物裝載
讀 data/concepts/draft-{序號}-{小類}.json，產生 docs/概念卡審核-{序號}.html，並檢查覆蓋率。"""
import json, sys, html
seq, sub = sys.argv[1], sys.argv[2]
Q = {q['id']: q for q in json.load(open('data/questions.json'))}
want = [i for i, q in Q.items() if q['subcategory'].startswith(sub) and q['source'] != '影片']
import glob
cs = json.load(open(glob.glob(f'data/concepts/draft-{seq}-*.json')[0]))
got = [i for c in cs for i in c['questions']]
assert sorted(got) == sorted(want), (set(want) - set(got), set(got) - set(want), '重複' if len(got) != len(set(got)) else '')
e = html.escape
cards = ''
for c in cs:
    rows = ''
    for i in c['questions']:
        q = Q[i]
        img = f'<br><img src="../{q["image"]}" style="max-height:80px">' if q['image'] else ''
        rows += f'<li><b>{i}</b> {e(q["question"])}{img}<br>✔ 答案：{e(q["options"][q["answer"]])}</li>'
    conf = f'<p class="cf">⚠ 矛盾：{e(c["conflict"])}</p>' if c['conflict'] else ''
    nums = '、'.join(c['numbers']) or '—'
    cards += f'''<section class="card" data-id="{c['id']}" data-name="{e(c['name'])}">
<h2>{e(c['name'])} <small>{c['id']}</small></h2><p class="rule">{e(c['rule'])}</p>
<p>數字：{e(nums)}</p>{conf}<ul>{rows}</ul>
<label><input type="radio" name="{c['id']}" value="ok" checked> ✓ 正確</label>
<label><input type="radio" name="{c['id']}" value="no"> ✗ 要改</label>
<input class="note" placeholder="備註">
</section>'''
page = f'''<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>概念卡審核 {seq}｜{sub}</title><style>
body{{font:18px/1.6 sans-serif;max-width:760px;margin:0 auto;padding:16px}}
.card{{border:1px solid #ccc;border-radius:12px;padding:12px 16px;margin:16px 0}}
.rule{{font-size:20px;font-weight:700}} small{{color:#888;font-weight:400}} .cf{{color:#b00}}
li{{margin:8px 0}} label{{margin-right:16px;display:inline-block;min-height:44px}}
.note{{width:100%;font-size:18px;padding:8px;box-sizing:border-box}} textarea{{width:100%;height:180px;font-size:16px}}
</style><h1>概念卡審核 {seq}｜{sub}（{len(want)} 題、{len(cs)} 個概念）</h1>
<p>每張卡選「✓ 正確」或「✗ 要改」，要改的寫備註。最下方會彙整，複製給 Claude。</p>
{cards}<h2>要改的清單</h2><textarea id="out" readonly></textarea>
<script>
function upd(){{let t=[];document.querySelectorAll('.card').forEach(c=>{{
if(c.querySelector('input[value=no]').checked)t.push(c.dataset.id+' '+c.dataset.name+'：'+(c.querySelector('.note').value||'（未寫備註）'))}});
document.getElementById('out').value=t.length?t.join('\\n'):'全部正確'}}
document.addEventListener('input',upd);upd();
</script></html>'''
open(f'docs/概念卡審核-{seq}.html', 'w').write(page)
print('OK', len(want), '題 100% 覆蓋，', len(cs), '個概念')
