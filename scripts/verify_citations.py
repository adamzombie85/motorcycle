#!/usr/bin/env python3
"""C21：驗證比較卡引用的法規（防止 AI 編造條號）。不靠 AI 自我檢查，用程式比對。

讀 data/concepts/compare-draft.json，每條 external: true 的原則都必須有：
  source：法規名稱＋條號，例如「道路交通安全規則第 99 條」（可以寫多條：「第 99 條、第 100 條」）
  quote ：法條原文，逐字引用
檢查：(a) 法規有下載、條號存在；(b) quote 去掉空白和標點後，真的出現在「所列條號之一」的條文裡。

法規全文：assets-src/laws/*.json（先跑 python3 -I scripts/parse_laws.py）。
用法：python3 scripts/verify_citations.py [檔案，預設 data/concepts/compare-draft.json] [--list]
  --list：連通過的也一條一條列出（預設只列不通過的，加上統計）
  --hint：另外列出「原則文字和所列條文幾乎沒有共同用字」的引用（可能張冠李戴；只是提示，不影響通過與否）
結束碼：全部通過 0，有不通過 1。"""
import json, os, re, sys, unicodedata

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
LAWS = os.path.join(ROOT, 'assets-src', 'laws')
LAW_FILES = [  # (法規全名, 簡稱, json 檔)
    ('道路交通標誌標線號誌設置規則', '設置規則', '設置規則.json'),
    ('道路交通安全規則', '安全規則', '安全規則.json'),
]
ART = re.compile(r'第\s*(\d+)\s*(?:[-－]\s*(\d+)\s*)?條(?:\s*之\s*(\d+))?')   # 第7條、第88條之2、第88-2條


def norm(s):
    """去掉空白、標點、符號，全形半形統一，只留文字和數字"""
    s = unicodedata.normalize('NFKC', s)
    return ''.join(c for c in s if unicodedata.category(c)[0] in 'LN')


def load_laws():
    laws = {}
    for full, short, fn in LAW_FILES:
        p = os.path.join(LAWS, fn)
        if os.path.exists(p):
            laws[full] = json.load(open(p, encoding='utf-8'))
    return laws


def find_law(source):
    for full, short, fn in LAW_FILES:
        if full in source or short in source:
            return full
    return None


def check(pr, laws):
    """回傳 (通過?, 原因)。先查法規和條號存在，再查 quote（這樣沒有 quote 時，也能先抓到編造的條號）"""
    src, quote = (pr.get('source') or '').strip(), (pr.get('quote') or '').strip()
    if not src:
        return False, '缺 source（法規名稱＋條號）'
    law = find_law(src)
    if not law:
        return False, f'不是已下載的法規：{src}'
    if law not in laws:
        return False, f'{law} 的全文還沒解析（先跑 scripts/parse_laws.py）'
    nos = [m.group(1) + ('-' + (m.group(2) or m.group(3)) if (m.group(2) or m.group(3)) else '') for m in ART.finditer(src)]
    if not nos:
        return False, f'source 沒有寫條號：{src}'
    arts = laws[law]['articles']
    missing = [n for n in nos if n not in arts]
    if missing:
        return False, f'條號不存在：{law}沒有第 {"、".join(missing)} 條'
    empty = [n for n in nos if not arts[n]]
    if empty and len(empty) == len(nos):
        return False, f'第 {"、".join(empty)} 條在資料庫是圖表或附件，沒有逐字文字，無法程式比對，請人工確認'
    if not quote:
        # 條號存在，但還沒有 quote：附上該條開頭，方便人工一眼看出是不是張冠李戴
        snip = ' ／ '.join(f'第{n}條「{arts[n][:22].replace(chr(10), "")}…」' for n in nos)
        return False, f'缺 quote（法條原文）；條號存在，該條開頭：{snip}'
    q = norm(quote)
    if not q:
        return False, 'quote 去掉標點後是空的'
    if any(q in norm(arts[n]) for n in nos):
        return True, '通過'
    # 找不到時，看看是不是在別的條：幫忙指出，方便修正
    hint = [k for k, v in arts.items() if q in norm(v)]
    return False, 'quote 沒有出現在所列條文裡' + (f'（但出現在第 {"、".join(hint[:3])} 條）' if hint else '（整部法規都找不到這段文字）')


def bigrams(s):
    return {s[i:i + 2] for i in range(len(s) - 1)}


def overlap(text, src, laws):
    law = find_law(src)
    nos = [m.group(1) + ('-' + (m.group(2) or m.group(3)) if (m.group(2) or m.group(3)) else '') for m in ART.finditer(src)]
    if law not in laws or not nos:
        return None
    arts = laws[law]['articles']
    art = norm(' '.join(arts[n] for n in nos if n in arts))
    tb = bigrams(norm(text))
    return len(tb & bigrams(art)) / max(1, len(tb)) if art else None


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    path = args[0] if args else os.path.join(ROOT, 'data', 'concepts', 'compare-draft.json')
    show_all = '--list' in sys.argv
    laws = load_laws()
    for full in [f[0] for f in LAW_FILES]:
        if full in laws:
            m = laws[full]['meta']
            print(f'法規：{full}（{m["修正日期"]}，{m["條數"]} 條，{m["來源網址"]}）')
        else:
            print(f'法規：{full}　※沒有全文，引用它的都會不通過')
    cards = json.load(open(path, encoding='utf-8'))
    ok = bad = 0
    hints = []
    bad_lines, cards_bad = [], set()
    for card in cards:
        for i, pr in enumerate(card.get('principles', []), 1):
            if not pr.get('external'):
                continue
            passed, why = check(pr, laws)
            if '--hint' in sys.argv:
                ov = overlap(pr['text'], pr.get('source') or '', laws)
                if ov is not None and ov < 0.05: hints.append(f'? {card["id"]} 原則{i}｜{pr["source"]}｜用字重疊 {ov:.2f}｜{pr["text"][:30]}…')
            line = f'{card["id"]} 原則{i}｜{pr.get("source") or "（無出處）"}｜{why}｜{pr["text"][:28]}…'
            if passed:
                ok += 1
                if show_all: print('✓ ' + line)
            else:
                bad += 1; cards_bad.add(card['id']); bad_lines.append('✗ ' + line)
    for l in bad_lines: print(l)
    reasons = {}
    for l in bad_lines:
        r = re.sub(r'[；：].*', '', l.split('｜')[2])
        r = re.sub(r'（但出現在.*?）', '', r)
        reasons[r] = reasons.get(r, 0) + 1
    if hints:
        print('\n疑似張冠李戴（原則文字和條文幾乎沒有共同用字，請人工看一下）：'); print('\n'.join(hints))
    print(f'\n外部依據共 {ok + bad} 條：通過 {ok}，不通過 {bad}（涉及 {len(cards_bad)}／{len(cards)} 張卡）')
    for r, n in sorted(reasons.items(), key=lambda x: -x[1]): print(f'  {n} 條：{r}')
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
