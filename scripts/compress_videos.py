"""影片去重複＋轉 480p。重複影片（內容完全相同）只保留編號最小的一份。
已轉好的會跳過，可分段執行。最後更新 questions_video.json 的 video 欄位。"""
import hashlib, glob, os, subprocess, json, time, sys
SRC='raw/機車筆試測驗危險感知題目影片'; DST='media/videos'
os.makedirs(DST,exist_ok=True)
files=sorted(glob.glob(f'{SRC}/*.mp4'))
canon={}; seen={}
for f in files:
    h=hashlib.md5(open(f,'rb').read()).hexdigest(); vid=os.path.basename(f)[:-4]
    seen.setdefault(h,vid); canon[vid]=seen[h]
uniq=sorted(set(canon.values()))
t0=time.time(); done=0
for v in uniq:
    out=f'{DST}/{v}.mp4'
    if os.path.exists(out): continue
    if time.time()-t0>150: break   # 每次執行最多約 150 秒
    subprocess.run(['ffmpeg','-v','error','-y','-i',f'{SRC}/{v}.mp4','-vf','scale=-2:480,fps=30','-c:v','libx264','-preset','medium',
                    '-crf','27','-c:a','aac','-b:a','64k','-movflags','+faststart',out+'.part.mp4'],check=True)
    os.rename(out+'.part.mp4',out); done+=1
left=[v for v in uniq if not os.path.exists(f'{DST}/{v}.mp4')]
print('不重複影片',len(uniq),'本次轉檔',done,'剩餘',len(left))
if not left:
    p='data/questions_video.json'; q=json.load(open(p,encoding='utf-8'))
    for x in q:
        orig=x.get('video_id') or x['video']
        x['video_id']=orig; x['video']=f'{DST}/{canon[orig]}.mp4'
    json.dump(q,open(p,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
    json.dump({k:v for k,v in canon.items() if k!=v},open('data/video_duplicates.json','w'),indent=1)
    print('已更新 questions_video.json；重複對照表 → data/video_duplicates.json')
