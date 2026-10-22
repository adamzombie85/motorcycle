"""統一標記三份題庫的「反向題」（題目問的是錯誤／不正確／不包括…的選項）。
規則：題幹符合 NEG 關鍵字就標記，但排除人工確認過的誤判（EXCLUDE）。
2026-10-22 人工審查：以下題目的「不」「有違」只是句子的一部分，不是在問錯的選項。"""
import json, re
NEG=r'不正確|錯誤|有違規定|不利於|不須|何者非|不屬於|何者不是|不是|不包括|不符合|何者為非|為非|不適當|不應該|不可以'
EXCLUDE={
 'M0249':'切記不可以…並採取（問正確作法）',
 'M0328':'已不符合格標準，應（問正確作法）',
 'M0606':'不須兩段式左轉之路口…何者正確',
 'V057':'遇有違規車輛…何者正確',
 'V104':'有違停車輛…何者為是',
 'V105':'有違規停車…適當行為',
}
total=0
for f in ['data/questions_main.json','data/questions_scenario.json','data/questions_video.json']:
    q=json.load(open(f,encoding='utf-8'))
    for x in q:
        x['tags']=[t for t in x['tags'] if t!='反向題']
        if x['id'] not in EXCLUDE and re.search(NEG,x['question']): x['tags'].insert(0,'反向題')
    n=sum('反向題' in x['tags'] for x in q); total+=n
    json.dump(q,open(f,'w',encoding='utf-8'),ensure_ascii=False,indent=1); print(f,'反向題',n)
print('合計',total)
