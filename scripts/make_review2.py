"""docs/階段0抽查-2.html：情境題、影片題各抽 10 題"""
import json, random, html
e=html.escape; random.seed(22)
S=json.load(open('data/questions_scenario.json',encoding='utf-8')); V=json.load(open('data/questions_video.json',encoding='utf-8'))
dup=json.load(open('data/video_duplicates.json'))
pick=random.sample(S[:60],5)+random.sample(S[60:],5)+random.sample(V,7)
pick+=random.sample([v for v in V if v['video_id'] in dup and v not in pick],3)  # 加抽 3 題「共用影片」的題目
cards=[]
for x in pick:
    opts=''.join(f'<li class="{"ok" if i==x["answer"] else ""}">({i+1}) {e(o)}{" ✔" if i==x["answer"] else ""}</li>' for i,o in enumerate(x['options']))
    media=f'<img src="../{x["image"]}">' if x['image'] else f'<video src="../{x["video"]}" controls preload="metadata"></video>'
    note=f'・影片 {x["video_id"]}'+(f'（和 {dup[x["video_id"]]} 是同一支影片）' if x.get('video_id') in dup else '') if x['video'] else ''
    cards.append(f'<article><header><b>{x["id"]}</b>・{x["source"]}題・PDF 第 {x["page"]} 頁{note}</header>{media}<p>{e(x["question"]).replace(chr(10),"<br>")}</p><ol>{opts}</ol><label><input type="checkbox" data-id="{x["id"]}"> 這題有錯</label></article>')
page=f'''<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>階段 0 抽查（二）</title>
<style>body{{font-family:-apple-system,"PingFang TC",sans-serif;max-width:860px;margin:auto;padding:16px;background:#f6f7f9;line-height:1.6}}
article,.box{{background:#fff;border-radius:10px;padding:14px 16px;margin:12px 0}} header{{color:#555;font-size:.9em}}
img,video{{max-width:100%;border-radius:6px;margin:6px 0}} li.ok{{color:#0a7a3d;font-weight:700}}
#out{{position:sticky;bottom:0;background:#222;color:#fff;padding:10px;border-radius:10px}}</style>
<h1>階段 0 抽查（二）：情境題與影片題</h1>
<div class="box">程式交叉比對：情境題 120 題、影片題 126 題，答案、影片編號、文字皆<b>零不一致</b>。<br>
影片：126 支中有 17 支和別支內容完全相同，實際 109 支，轉成 480p 後共 173MB，長度都和原檔一致。<br>
請確認：題目和答案對照 PDF 是否正確、圖片有沒有裁切完整、影片能不能播放且和題目相符。</div>
{"".join(cards)}<div id="out">勾選的題號：<span id="ids">（無）</span></div>
<script>document.addEventListener('change',()=>{{const s=[...document.querySelectorAll('input:checked')].map(i=>i.dataset.id);document.getElementById('ids').textContent=s.length?s.join('、'):'（無）'}})</script></html>'''
open('docs/階段0抽查-2.html','w',encoding='utf-8').write(page); print('抽樣',len(pick))
