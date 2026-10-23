"""徽章後製：Gemini 產的圖是白底 JPEG（副檔名卻是 .png）。
1. 原檔備份到 assets-src/（不上 GitHub）
2. 從四個角落把外圍白色變透明（徽章放在任何底色上都不會有白框）
3. 依徽章外框裁切、留相同邊距、統一成 512×512 的真正 PNG（大小一致）"""
import glob, os, shutil, sys
from PIL import Image, ImageDraw
DIR='site/assets/illustrations'; SRC='assets-src'
files=sys.argv[1:] or sorted(glob.glob(f'{DIR}/badge-*.png'))
for f in files:
    name=os.path.basename(f); bak=f'{SRC}/{name}'
    if not os.path.exists(bak): shutil.copy(f,bak)
    im=Image.open(bak).convert('RGB')
    w,h=im.size; KEY=(255,0,255)
    for xy in [(0,0),(w-1,0),(0,h-1),(w-1,h-1)]:
        ImageDraw.floodfill(im,xy,KEY,thresh=40)
    rgba=im.convert('RGBA'); px=rgba.load()
    for y in range(h):
        for x in range(w):
            if px[x,y][:3]==KEY: px[x,y]=(0,0,0,0)
    box=rgba.getbbox(); rgba=rgba.crop(box)
    side=max(rgba.size); pad=int(side*0.04)
    canvas=Image.new('RGBA',(side+2*pad,side+2*pad),(0,0,0,0))
    canvas.paste(rgba,((canvas.width-rgba.width)//2,(canvas.height-rgba.height)//2))
    canvas.resize((512,512),Image.LANCZOS).save(f,'PNG',optimize=True)
    print(name,'→',os.path.getsize(f)//1024,'KB')
