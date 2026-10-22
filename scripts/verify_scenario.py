"""方法 B：pdfplumber 逐頁抽文字，比對 questions_scenario.json 的答案與文字"""
import pdfplumber, re, json
q=json.load(open('data/questions_scenario.json',encoding='utf-8'))
pdf=pdfplumber.open('raw/機車情境式題目.pdf')
norm=lambda s: re.sub(r'[\s　，,。.．、：:？?！!（）()「」『』；;~～\-—→]','',s)
ansbad=[]; txtbad=[]
for x in q:
    t=pdf.pages[x['page']-1].extract_text() or ''
    m=re.search(r'答案[：:]\s*(\d)',t) if x['page']>60 else re.search(r'[（(]\s*(\d)\s*[）)]',t)
    a=int(m.group(1)) if m else None
    if a!=x['answer']+1: ansbad.append((x['id'],x['answer']+1,a))
    full=norm(t)
    for part in [x['question']]+x['options']:
        if norm(part) not in full: txtbad.append((x['id'],part))
rep={'總題數':len(q),'答案不一致':ansbad,'文字不一致':txtbad}
json.dump(rep,open('data/verify_scenario_report.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
print('總題數',len(q),'| 答案不一致',len(ansbad),ansbad,'| 文字不一致',len(txtbad)); [print(' ',t) for t in txtbad[:20]]
