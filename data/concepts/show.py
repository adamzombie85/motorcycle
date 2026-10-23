import json,sys
sub=sys.argv[1]
for x in json.load(open('data/questions.json')):
    if x['source']!='影片' and x['subcategory'].startswith(sub):
        print(x['id'],x['question'] or '(圖)','|',' / '.join(o for o in x['options']),'| 答:',x['options'][x['answer']],'(圖)' if x['image'] else '')
