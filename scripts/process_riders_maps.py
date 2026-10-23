"""第 3 組後製：
- 場景圖 map-*.jpeg → map-*.jpg，寬 1600px（原圖 2752px、每張 2MB 太大）
- 角色圖 rider-*.jpeg → rider-*.png，去白底（地圖上要疊在場景上）、統一 512px、**統一朝右**（原圖 3～6 朝左）
原檔備份到 assets-src/"""
import glob, os, shutil
from PIL import Image, ImageDraw, ImageOps
D='site/assets/illustrations'; S='assets-src'
for f in sorted(glob.glob(f'{D}/map-*.jpeg')):
    n=os.path.basename(f); shutil.copy(f,f'{S}/{n}')
    im=Image.open(f).convert('RGB'); im.thumbnail((1600,1600),Image.LANCZOS)
    out=f[:-5]+'.jpg'; im.save(out,'JPEG',quality=82,optimize=True); os.remove(f) if False else None
    print(os.path.basename(out),im.size,os.path.getsize(out)//1024,'KB')
FLIP={'rider-3','rider-4','rider-5','rider-6'}
for f in sorted(glob.glob(f'{D}/rider-*.jpeg')):
    n=os.path.basename(f); stem=n[:-5]; shutil.copy(f,f'{S}/{n}')
    im=Image.open(f).convert('RGB'); im.thumbnail((1024,1024),Image.LANCZOS)
    w,h=im.size; KEY=(255,0,255)
    for xy in [(0,0),(w-1,0),(0,h-1),(w-1,h-1)]: ImageDraw.floodfill(im,xy,KEY,thresh=28)
    rgba=im.convert('RGBA'); px=rgba.load()
    for y in range(h):
        for x in range(w):
            if px[x,y][:3]==KEY: px[x,y]=(0,0,0,0)
    if stem in FLIP: rgba=ImageOps.mirror(rgba)
    rgba=rgba.crop(rgba.getbbox()); side=max(rgba.size); pad=int(side*.04)
    c=Image.new('RGBA',(side+2*pad,)*2,(0,0,0,0)); c.paste(rgba,((c.width-rgba.width)//2,(c.height-rgba.height)//2))
    c=c.resize((512,512),Image.LANCZOS); out=f'{D}/{stem}.png'; c.save(out,'PNG',optimize=True)
    print(os.path.basename(out),os.path.getsize(out)//1024,'KB')
