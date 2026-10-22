"""危險感知影片題庫.pdf → data/questions_video.json（pdfplumber 表格）"""
import pdfplumber, re, json, sys
pdf=pdfplumber.open('raw/危險感知影片題庫.pdf')
qs=[]; cur=None
for pi,p in enumerate(pdf.pages):
    for t in p.extract_tables():
        for row in t[1:]:
            cells=[(c or '').strip() for c in row]
            # 依內容判斷欄位（後幾頁表格欄位位置會錯開）
            num=next((c for c in cells[:3] if re.fullmatch(r'\d{3}',c)),'')
            ans=next((c for c in cells if re.fullmatch(r'[123]',c)),'')
            vid=next((c for c in cells if re.fullmatch(r'4\d{3}',c)),'')
            txt=max(cells,key=len) if cells else ''
            if txt in (num,ans,vid): txt=''
            if num:
                cur={'num':int(num),'ans':ans,'text':txt,'vid':vid,'page':pi+1}; qs.append(cur)
            elif cur:
                if txt: cur['text']+='\n'+txt
                if vid and not cur['vid']: cur['vid']=vid
                if ans and not cur['ans']: cur['ans']=ans
out=[]
for q in qs:
    t=q['text'].replace('\n','')
    parts=re.split(r'[（(]\s*(\d)\s*[）)]',t)
    stem=re.sub(r'\s+','',parts[0]); opts=[re.sub(r'[。.]$','',parts[k+1].strip()) for k in range(1,len(parts)-1,2)]
    qid=f'V{q["num"]:03d}'
    out.append({'id':qid,'source':'影片','num':q['num'],'category':'危險感知','subcategory':'影片題','tags':['影片'],
        'question':stem,'options':opts,'answer':int(q['ans'])-1 if q['ans'].isdigit() else None,'image':None,'video':q['vid'],'concept_id':None,'page':q['page']})
json.dump(out,open('data/questions_video.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
from collections import Counter
print('題數',len(out),'選項數',Counter(len(x['options']) for x in out),'答案越界',[x['num'] for x in out if x['answer'] is None or x['answer']>=len(x['options'])])
print('題號連續',[x['num'] for x in out]==list(range(1,len(out)+1)),'影片編號',Counter(bool(re.fullmatch(r'\d{4}',x['video'])) for x in out))
print('亂碼',[(x['id'],x['question'][:15]) for x in out if '�' in json.dumps(x,ensure_ascii=False)])
