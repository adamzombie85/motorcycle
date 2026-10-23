"""情境插圖後製：原檔備份到 assets-src/，轉成真正的 PNG，最長邊縮到 800px（保留白底，畫面上一律放在白色卡片裡）"""
import glob, os, shutil, sys
from PIL import Image
DIR='site/assets/illustrations'; SRC='assets-src'
for f in sys.argv[1:]:
    name=os.path.basename(f); bak=f'{SRC}/{name}'
    if not os.path.exists(bak): shutil.copy(f,bak)
    im=Image.open(bak).convert('RGB'); im.thumbnail((800,800),Image.LANCZOS)
    im.save(f,'PNG',optimize=True); print(name,im.size,os.path.getsize(f)//1024,'KB')
