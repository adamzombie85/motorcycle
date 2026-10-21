"""方法 B：用 pdftotext 獨立抽取，和 questions_main.json 交叉比對（題號、答案、文字）"""
import subprocess, re, json
SRC='raw/機車駕照筆試題庫.pdf'
q=json.load(open('data/questions_main.json',encoding='utf-8'))
# 1) 答案：layout 模式中「題號 答案」在行首
layout=subprocess.run(['pdftotext','-layout',SRC,'-'],capture_output=True,text=True).stdout
pairs={}
for l in layout.split('\n'):
    m=re.match(r'^\s{0,3}(\d{1,3})\s+([123])(\s|$)',l)
    if m: pairs.setdefault(int(m.group(1)),int(m.group(2)))
missing=[x['num'] for x in q if x['num'] not in pairs]
diff=[(x['num'],x['answer']+1,pairs[x['num']]) for x in q if x['num'] in pairs and pairs[x['num']]!=x['answer']+1]
# 2) 文字：raw 模式去掉頁首頁尾後，題幹與每個選項都要出現在全文
raw=subprocess.run(['pdftotext','-raw',SRC,'-'],capture_output=True,text=True).stdout
raw=re.sub(r'\x0c機車駕照筆試題庫 115\.1\n— \d+ —\n(題號 答案 題目內容\n)?','',raw)
norm=lambda s: re.sub(r'[\s　，,。.、：:？?！!（）()「」『』；;~～\-—→]','',s)
full=norm(raw)
txtbad=[(x['num'],part) for x in q for part in [x['question']]+x['options'] if norm(part) and norm(part) not in full]
rep={'總題數':len(q),'B法缺題號':missing,'答案不一致':diff,'文字不一致':txtbad}
json.dump(rep,open('data/verify_main_report.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
print('總題數',len(q),'| B法缺題號',len(missing),'| 答案不一致',len(diff),'| 文字不一致',len(txtbad))
for t in txtbad: print(' ',t)
