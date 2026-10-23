#!/usr/bin/env python3
"""階段 4：危險秒數標註的準備工作（docs/遊戲化設計.md 附錄）。

1. 用 ffmpeg 把 media/videos/ 每支影片「每 0.5 秒截一張」，排成一張連續截圖表，每格標秒數，
   存到 assets-src/contact-sheets/{影片編號}.jpg（assets-src/ 不上 GitHub）。
2. 產生 data/video_tasks.json：每支影片對應的題號、題目、選項、正確答案，給 Gemini 標註用。

用法（在專案根目錄）：
  python3 scripts/make_contact_sheets.py            # 全部 109 支
  python3 scripts/make_contact_sheets.py 4142 4143  # 只做指定影片
  python3 scripts/make_contact_sheets.py --tasks-only   # 只重產 video_tasks.json
需要 ffmpeg／ffprobe 和 Pillow。
"""
import json, os, subprocess, sys, tempfile, glob
from multiprocessing import Pool
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
VIDEOS = os.path.join(ROOT, 'media', 'videos')
OUT = os.path.join(ROOT, 'assets-src', 'contact-sheets')
STEP = 0.5          # 每幾秒截一張
CELL_W = 320        # 每格寬度（高度依影片比例）
COLS = 5
FONT_PATHS = ['/System/Library/Fonts/Helvetica.ttc', '/System/Library/Fonts/Supplemental/Arial.ttf', '/Library/Fonts/Arial.ttf']


def font(size):
    for p in FONT_PATHS:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


def duration(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], capture_output=True, text=True)
    return float(r.stdout.strip())


def make_sheet(vid):
    src = os.path.join(VIDEOS, vid + '.mp4')
    dur = duration(src)
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', f'fps={1 / STEP},scale={CELL_W}:-2', '-q:v', '3', os.path.join(tmp, 'f%03d.jpg')], check=True)
        files = sorted(glob.glob(os.path.join(tmp, 'f*.jpg')))
        imgs = [Image.open(f).convert('RGB') for f in files]
    w, h = imgs[0].size
    rows = (len(imgs) + COLS - 1) // COLS
    head = 36
    sheet = Image.new('RGB', (COLS * w, head + rows * h), (20, 20, 20))
    d = ImageDraw.Draw(sheet)
    d.text((8, 6), f'video {vid}   {dur:.1f}s   one frame every {STEP}s (label = seconds)', fill=(255, 255, 255), font=font(22))
    f = font(26)
    for i, im in enumerate(imgs):
        x, y = (i % COLS) * w, head + (i // COLS) * h
        sheet.paste(im, (x, y))
        label = f'{i * STEP:.1f}s'
        tw = d.textlength(label, font=f)
        d.rectangle([x, y, x + tw + 14, y + 32], fill=(0, 0, 0))
        d.text((x + 7, y + 2), label, fill=(255, 220, 0), font=f)
        d.rectangle([x, y, x + w - 1, y + h - 1], outline=(90, 90, 90))
    os.makedirs(OUT, exist_ok=True)
    out = os.path.join(OUT, vid + '.jpg')
    sheet.save(out, quality=85)
    return vid, len(imgs), dur


def make_tasks():
    qs = json.load(open(os.path.join(ROOT, 'data', 'questions.json')))
    by = {}
    for q in qs:
        if q['source'] != '影片':
            continue
        vid = os.path.splitext(os.path.basename(q['video']))[0]   # 重複的影片共用同一份檔案（109 支）
        t = by.setdefault(vid, {'video_id': vid, 'video': q['video'], 'contact_sheet': f'assets-src/contact-sheets/{vid}.jpg', 'questions': []})
        t['questions'].append({'id': q['id'], 'question': q['question'], 'options': q['options'], 'answer': q['answer'], 'answer_text': q['options'][q['answer']]})
    tasks = [by[k] for k in sorted(by)]
    with open(os.path.join(ROOT, 'data', 'video_tasks.json'), 'w') as f:
        json.dump(tasks, f, ensure_ascii=False, indent=1)
    return tasks


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    tasks = make_tasks()
    print(f'video_tasks.json：{len(tasks)} 支影片、{sum(len(t["questions"]) for t in tasks)} 題')
    if '--tasks-only' in sys.argv:
        sys.exit(0)
    ids = args or sorted(os.path.splitext(f)[0] for f in os.listdir(VIDEOS) if f.endswith('.mp4'))
    with Pool(4) as p:
        for vid, n, dur in p.imap_unordered(make_sheet, ids):
            print(f'{vid}: {n} 格（{dur:.1f}s）')
    print(f'完成 {len(ids)} 張 → {os.path.relpath(OUT, ROOT)}/')
