"""機車情境式題目.pdf → data/questions_scenario.json
前 60 頁：『( 答 ) 題目』格式；後 60 頁：投影片格式，『答案：N』在下方。每頁一題一圖。"""
import pdfplumber, subprocess, re, json
SRC='raw/機車情境式題目.pdf'
pdf=pdfplumber.open(SRC)
def opts_split(t):
    parts=re.split(r'[（(]\s*(\d)\s*[）)]',t)
    return parts[0], [re.sub(r'[。.]$','',parts[k+1].strip().replace('\n','').replace(' ','')) for k in range(1,len(parts)-1,2)]
out=[]
for i,pg in enumerate(pdf.pages):
    t=subprocess.run(['pdftotext','-layout','-f',str(i+1),'-l',str(i+1),SRC,'-'],capture_output=True,text=True).stdout
    t='\n'.join(l.strip() for l in t.split('\n') if l.strip())
    if i<60:
        t=re.sub(r'【情境式題目】\d+\n?','',t)
        m=re.match(r'[（(]\s*(\d)\s*[）)]\s*(.*)',t,re.S); ans=int(m.group(1)); body=m.group(2)
    else:
        m=re.search(r'答案[：:]\s*(\d)',t); ans=int(m.group(1)); body=t[:m.start()]
        body=re.sub(r'^\d+\s*[.．]\s*','',body)
    stem,opts=opts_split(body)
    stem=re.sub(r'\s+','',stem)
    stem=re.sub(r'(?<!^)([A-D][.．])',r'\n\1',stem)
    # 圖片：取面積最大的非整頁背景圖
    ims=[im for im in pg.images if not (im['x0']<=1 and im['top']<=1 and im['x1']>=pg.width-1)]
    im=max(ims,key=lambda m:(m['x1']-m['x0'])*(m['bottom']-m['top']))
    qid=f'S{i+1:03d}'; fn=f'media/images/{qid}.jpg'
    b=(max(im['x0'],0),max(im['top'],0),min(im['x1'],pg.width),min(im['bottom'],pg.height))
    if i<60:
        pg.crop(b).to_image(resolution=150).save(fn,quality=82)
    else:
        # 投影片頁：直接取出內嵌的最高解析度原圖，避免裁到題目文字和底部字幕
        import tempfile, glob, os
        from PIL import Image
        d=tempfile.mkdtemp()
        subprocess.run(['pdfimages','-j','-f',str(i+1),'-l',str(i+1),SRC,d+'/x'],check=True)
        cands=[f for f in glob.glob(d+'/x-*') if f.endswith('.jpg')]
        best=max(cands,key=lambda f:Image.open(f).size[0]*Image.open(f).size[1] if Image.open(f).size[0]<pg.width*3 or True else 0)
        # 排除整頁背景（723x542）：取寬度最大的那張
        best=max(cands,key=lambda f:Image.open(f).size[0])
        im2=Image.open(best).convert('RGB')
        if im2.width>1000: im2=im2.resize((1000,round(im2.height*1000/im2.width)))
        im2.save(fn,quality=82)
    out.append({'id':qid,'source':'情境','num':i+1,'category':'危險感知','subcategory':'情境題','tags':['有圖'],
        'question':stem,'options':opts,'answer':ans-1,'image':fn,'video':None,'concept_id':None,'page':i+1})
json.dump(out,open('data/questions_scenario.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
from collections import Counter
print('題數',len(out),'選項數',Counter(len(x['options']) for x in out),'答案越界',[x['num'] for x in out if x['answer']>=len(x['options'])])
