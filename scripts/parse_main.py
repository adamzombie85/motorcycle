"""機車駕照筆試題庫.pdf → data/questions_main.json（方法 A：pdfplumber 表格）"""
import pdfplumber, re, json, sys
SRC='raw/機車駕照筆試題庫.pdf'
CATS=['正確觀念與態度','主動停讓文化','安全駕駛能力']
SUBS=['貨物裝載','事故預防及處理','禁止不當行為（酒駕、不使用手機、危險駕駛）','行車檢查（設備、燈光）',
 '平交道、強制險、環保駕駛、特殊天候、駕駛道德','路口安全（有號誌路口、無號誌路口、停讓行人）',
 '注意大型車行駛及轉彎（內輪差、視野死角、不並行）','轉彎（左右轉、迴轉）',
 '行駛中應注意事項（保持安全車距、注意前車狀況）','正確使用燈光（頭燈、霧燈、方向燈）']
pdf=pdfplumber.open(SRC)
qs=[]; cur=None; cat=sub=None
for pi,p in enumerate(pdf.pages):
    tables=p.find_tables()
    events=[]
    bbs=[t.bbox for t in tables]
    chars=[c for c in p.chars if not any(b[0]<=c['x0']<=b[2] and b[1]<=c['top']<=b[3] for b in bbs)]
    lines={}
    for c in chars: lines.setdefault(round(c['top']),[]).append(c)
    for top,cs in lines.items():
        t=''.join(c['text'] for c in sorted(cs,key=lambda c:c['x0'])).strip()
        if pi==0 and top<300 and t in CATS: continue  # 索引
        if t in CATS: events.append((top,'cat',t))
        elif t in SUBS: events.append((top,'sub',t))
    for t in tables:
        rows=t.extract()
        for r,row in zip(t.rows,rows):
            events.append((r.bbox[1],'row',(row,r.bbox)))
    imgs=[(im['top'],im['bottom'],im) for im in p.images]
    for top,kind,val in sorted(events,key=lambda e:e[0]):
        if kind=='cat': cat=val
        elif kind=='sub': sub=val
        else:
            row,bb=val
            if row==['題號','答案','題目內容'] or row[0]=='分類' or (len(row)==1): continue
            num=(row[0] or '').strip(); ans=(row[1] or '').strip() if len(row)>1 else ''
            txt=(row[2] or '').strip() if len(row)>2 else ''
            if num.isdigit():
                cur={'num':int(num),'category':cat,'subcategory':sub,'ans':ans,'text':txt,'page':pi+1,'rows':[(pi,bb)]}
                qs.append(cur)
            elif cur:
                if ans and not cur['ans']: cur['ans']=ans
                elif ans and cur['ans']!=ans: print('WARN ans conflict',cur['num'],cur['ans'],ans,file=sys.stderr)
                if txt: cur['text']+='\n'+txt
                cur['rows'].append((pi,bb))
    # 圖片歸屬：圖片中心點落在哪一題的列範圍
    for top,bot,im in imgs:
        mid=(top+bot)/2; hit=None
        for q in qs:
            for (ppi,bb) in q['rows']:
                if ppi==pi and bb[1]-2<=mid<=bb[3]+2: hit=q
        if hit: hit.setdefault('imgs',[]).append((pi,im))
        else: print('WARN 無歸屬圖片 page',pi+1,file=sys.stderr)
out=[]
for i,q in enumerate(qs,1):
    t=re.sub(r'[ 　]+',' ',q['text'])
    parts=re.split(r'[（(]\s*(\d)\s*[）)]',t)
    stem=parts[0].strip().replace('\n','')
    opts=[parts[k+1].strip().replace('\n','') for k in range(1,len(parts)-1,2)]
    opts=[re.sub(r'[。.]$','',o) for o in opts]
    qid=f'M{i:04d}'
    rec={'id':qid,'source':'筆試','num':q['num'],'category':q['category'],'subcategory':q['subcategory'],
         'tags':[],'question':stem,'options':opts,'answer':int(q['ans'])-1 if q['ans'].isdigit() else None,
         'image':None,'video':None,'concept_id':None,'page':q['page']}
    for k,(ppi,im) in enumerate(q.get('imgs',[])):
        pg=pdf.pages[ppi]
        b=(max(im['x0'],0),max(im['top'],0),min(im['x1'],pg.width),min(im['bottom'],pg.height))
        fn=f'media/images/{qid}' + (f'_{k}' if k else '') + '.png'
        pg.crop(b).to_image(resolution=200).save(fn)
        if k==0: rec['image']=fn
    out.append(rec)
json.dump(out,open('data/questions_main.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
print('題數',len(out))
