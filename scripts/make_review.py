"""產生 docs/階段0抽查.html：分層抽樣，給 Jim 對照 PDF 抽查"""
import json, random, html, collections
q=json.load(open('data/questions_main.json',encoding='utf-8'))
rep=json.load(open('data/verify_main_report.json',encoding='utf-8'))
random.seed(21)
pick=[]
by=collections.defaultdict(list)
for x in q: by[x['subcategory']].append(x)
for s,xs in by.items(): pick+=random.sample(xs,3)
rest=[x for x in q if x not in pick]
for tag,n in [('有圖',10),('反向題',5),('罰鍰題',5)]:
    pick+=random.sample([x for x in rest if tag in x['tags'] and x not in pick],n)
pick.sort(key=lambda x:x['num'])
cat=collections.Counter(x['category'] for x in q); sub=collections.Counter(x['subcategory'] for x in q)
tags=collections.Counter(t for x in q for t in x['tags'])
e=html.escape
cards=[]
for x in pick:
    opts=''.join(f'<li class="{"ok" if i==x["answer"] else ""}">({i+1}) {e(o)}{" ✔" if i==x["answer"] else ""}</li>' for i,o in enumerate(x['options']))
    img=f'<img src="../{x["image"]}" alt="">' if x['image'] else ''
    tg=''.join(f'<span class="tag">{t}</span>' for t in x['tags'])
    cards.append(f'''<article><header><b>{x["id"]}</b>・PDF 第 {x["page"]} 頁・原題號 {x["num"]}<br><small>{e(x["category"])} ／ {e(x["subcategory"])}</small> {tg}</header>
{img}<p>{e(x["question"]) or "（題目為圖片）"}</p><ol>{opts}</ol>
<label><input type="checkbox" data-id="{x["id"]}"> 這題有錯</label></article>''')
rows=lambda c:''.join(f'<tr><td>{e(k)}</td><td>{v}</td></tr>' for k,v in c.most_common())
page=f'''<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>階段 0 抽查</title><style>
body{{font-family:-apple-system,"PingFang TC","Noto Sans TC",sans-serif;max-width:860px;margin:auto;padding:16px;background:#f6f7f9;color:#222;line-height:1.6}}
h1{{font-size:1.5em}} table{{border-collapse:collapse;margin:8px 0 20px;background:#fff}} td{{border:1px solid #ddd;padding:4px 10px}}
.box{{background:#fff;border-radius:10px;padding:12px 16px;margin-bottom:16px}}
article{{background:#fff;border-radius:10px;padding:14px 16px;margin:12px 0;box-shadow:0 1px 3px #0001}}
article header{{color:#555;font-size:.9em;margin-bottom:6px}} img{{max-width:160px;display:block;margin:6px 0}}
li.ok{{color:#0a7a3d;font-weight:700}} .tag{{background:#eef;border-radius:6px;padding:1px 6px;margin-left:4px;font-size:.8em}}
#out{{position:sticky;bottom:0;background:#222;color:#fff;padding:10px;border-radius:10px}}
</style><h1>階段 0 抽查：機車駕照筆試題庫（{len(q)} 題）</h1>
<div class="box"><b>程式交叉比對結果</b>：兩種方法獨立抽取，
答案不一致 <b>{len(rep["答案不一致"])}</b> 題，文字不一致 <b>{len(rep["文字不一致"])}</b> 題，缺題號 <b>{len(rep["B法缺題號"])}</b> 題。</div>
<div class="box"><b>大類</b><table>{rows(cat)}</table><b>小類</b><table>{rows(sub)}</table><b>標籤（程式自動判斷）</b><table>{rows(tags)}</table></div>
<div class="box">以下抽出 {len(pick)} 題：每個小類 3 題，加上有圖題 10 題、反向題 5 題、罰鍰題 5 題。綠色 ✔ 是答案。請對照 PDF，有錯就勾選，最下方會列出題號，複製給 Claude。</div>
{"".join(cards)}
<div id="out">勾選的題號：<span id="ids">（無）</span></div>
<script>document.addEventListener('change',()=>{{const s=[...document.querySelectorAll('input:checked')].map(i=>i.dataset.id);document.getElementById('ids').textContent=s.length?s.join('、'):'（無）'}})</script></html>'''
open('docs/階段0抽查.html','w',encoding='utf-8').write(page)
print('抽樣',len(pick))
