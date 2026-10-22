"""方法 B：pdftotext 獨立抽取，比對 questions_video.json 的答案、影片編號、文字"""
import subprocess, re, json
SRC='raw/危險感知影片題庫.pdf'
q=json.load(open('data/questions_video.json',encoding='utf-8'))
lay=subprocess.run(['pdftotext','-layout',SRC,'-'],capture_output=True,text=True).stdout
B={}
for l in lay.split('\n'):
    m=re.match(r'^\s*(\d{3})\s+([123])\s+.*?\s(4\d{3})\s*$',l)
    if m: B[int(m.group(1))]=(int(m.group(2)),m.group(3))
miss=[x['num'] for x in q if x['num'] not in B]
diff=[(x['id'],(x['answer']+1,x['video']),B[x['num']]) for x in q if x['num'] in B and B[x['num']]!=(x['answer']+1,x['video'])]
raw=subprocess.run(['pdftotext','-raw',SRC,'-'],capture_output=True,text=True).stdout
raw=re.sub(r'\n4\d{3}\n\x0c\d+\n題號 答案 題目 影片編號\n','',raw)  # 去掉跨頁的頁碼與表頭
norm=lambda s: re.sub(r'[\s　，,。.、：:？?！!（）()「」『』；;~～\-—→�]','',s)
full=norm(raw)
# 每行都可能被『題號 答案 … 影片編號』插斷，所以去掉這些數字後再比
full2=re.sub(r'\d{3}[123]|4\d{3}','',full)
txtbad=[(x['id'],p) for x in q for p in [x['question']]+x['options'] if norm(p) not in full and norm(p) not in full2]
rep={'總題數':len(q),'B法缺題號':miss,'答案或影片不一致':diff,'文字不一致':txtbad}
json.dump(rep,open('data/verify_video_report.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
print('總題數',len(q),'| B缺',len(miss),miss,'| 答案/影片不一致',len(diff),diff[:5],'| 文字不一致',len(txtbad))
for t in txtbad[:15]: print(' ',t)
