"""為 questions_main.json 加標籤：反向題、罰鍰題、數字題、有圖"""
import json, re
p='data/questions_main.json'
q=json.load(open(p,encoding='utf-8'))
NEG=r'不正確|錯誤|有違|不利於|不須|何者非|不屬於|何者不是|不包括|不符合|何者為非|不適當|不應該|不可以'
UNIT=r'\d[\d,.]*\s*(公分|公尺|公斤|元|秒|年|日|天|公里|毫克|%|點|個月|小時|萬|分鐘|cc|CC)'
for x in q:
    t=x['question']; allt=t+' '.join(x['options']); tags=[]
    if re.search(NEG,t): tags.append('反向題')
    if '罰鍰' in allt or re.search(r'\d\s*(元|萬)',allt): tags.append('罰鍰題')
    if re.search(UNIT,allt): tags.append('數字題')
    if x['image']: tags.append('有圖')
    x['tags']=tags
json.dump(q,open(p,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
from collections import Counter
print(Counter(t for x in q for t in x['tags']))
