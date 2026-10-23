#!/usr/bin/env python3
"""C21：把全國法規資料庫下載的網頁（assets-src/laws/raw-*.html）解析成
  assets-src/laws/{名稱}.txt   全文（檔頭寫來源網址、修正日期、生效狀態、下載日期）
  assets-src/laws/{名稱}.json  { 條號: 條文 }（條號例如 "7"、"3-1"）
下載網址：https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=K0040014 （設置規則）、K0040013（安全規則）
用法：python3 -I scripts/parse_laws.py        （-I 是不讓 Python 載入資料夾裡的程式，下載來的檔案要當資料看）"""
import os, re, json, datetime, html
from html.parser import HTMLParser

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
LAWS = os.path.join(ROOT, 'assets-src', 'laws')
SOURCES = [  # (原始檔, 簡稱, pcode)
    ('raw-K0040014.html', '設置規則', 'K0040014'),
    ('raw-K0040013.html', '安全規則', 'K0040013'),
]


class Article(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.arts, self.cur, self.line = {}, None, None
        self.in_no = self.in_line = False
        self.no_text = ''
        self.depth_line = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = a.get('class') or ''
        if tag == 'div' and 'col-no' in cls.split():
            self.in_no = True; self.no_text = ''; self.cur_name = None
        elif tag == 'a' and self.in_no and a.get('name'):
            self.cur_name = a['name']
        elif tag == 'div' and cls.startswith('line-'):
            self.in_line = True; self.line = ''

    def handle_endtag(self, tag):
        if tag == 'div' and self.in_no:
            self.in_no = False
            if self.cur_name:
                self.cur = self.cur_name
                self.arts[self.cur] = []
        elif tag == 'div' and self.in_line:
            self.in_line = False
            if self.cur is not None and self.line is not None:
                self.arts[self.cur].append(self.line.strip())
            self.line = None

    def handle_data(self, data):
        if self.in_line:
            self.line += data


def meta(h):
    def cell(label):
        m = re.search(label + r'[：:]\s*</th>\s*<td[^>]*>(.*?)</td>', h, re.S)
        return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', m.group(1)))).strip() if m else ''
    title = re.search(r'<title>\s*(.*?)\s*</title>', h, re.S).group(1).replace('-全國法規資料庫', '').strip()
    state = cell('生效狀態') or ('部分條文尚未生效（頁面有標示）' if '尚未生效' in h else '現行有效（頁面沒有「尚未生效」標示）')
    return title, cell('修正日期'), state, cell('法規名稱')


def main():
    today = datetime.date.today().isoformat()
    for fn, short, pcode in SOURCES:
        h = open(os.path.join(LAWS, fn), encoding='utf-8').read()
        p = Article(); p.feed(h)
        arts = {k: '\n'.join(l for l in v if l) for k, v in p.arts.items()}
        title, amended, state, name = meta(h)
        empty = [k for k, v in arts.items() if not v]   # 資料庫上是圖表、附件，網頁沒有逐字文字
        head = {'法規名稱': name or title, '簡稱': short, '來源網址': f'https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode={pcode}',
                '修正日期': amended, '生效狀態': state, '下載日期': today, '條數': len(arts), '無法解析的條': empty}
        with open(os.path.join(LAWS, short + '.txt'), 'w', encoding='utf-8') as f:
            for k, v in head.items():
                f.write(f'{k}：{v}\n')
            f.write('\n')
            for k, v in arts.items():
                f.write(f'第 {k.replace("-", "之")} 條\n{v or "（資料庫上是圖表或附件，沒有逐字文字）"}\n\n')
        with open(os.path.join(LAWS, short + '.json'), 'w', encoding='utf-8') as f:
            json.dump({'meta': head, 'articles': arts}, f, ensure_ascii=False, indent=1)
        print(short, head['法規名稱'], '|', amended, '|', state[:20], '|', len(arts), '條｜無法逐字比對：', len(empty), '條', empty[:12])


if __name__ == '__main__':
    main()
