"""合併三份題庫 → data/questions.json（網站使用的唯一題庫檔）"""
import json, collections
allq=[]
for f in ['questions_main','questions_scenario','questions_video']:
    allq+=json.load(open(f'data/{f}.json',encoding='utf-8'))
ids=[x['id'] for x in allq]; assert len(ids)==len(set(ids)),'ID 重複'
for x in allq: assert len(x['options'])==3 and 0<=x['answer']<3, x['id']
json.dump(allq,open('data/questions.json','w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print('總題數',len(allq)); print(collections.Counter(x['category'] for x in allq))
