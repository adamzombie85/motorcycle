#!/usr/bin/env python3
"""C20：產生 data/concepts/numbers-draft.json 與 docs/數字卡審核.html。
每筆數字的出處題號，是在指定概念卡的題目裡，找「題目＋正確答案」符合 rx 的題。找不到的會列出來。"""
import json, glob, re, html
Q = {q['id']: q for q in json.load(open('data/questions.json'))}
cards = {}
for f in sorted(glob.glob('data/concepts/draft-*.json')):
    for c in json.load(open(f)):
        cards[c['id']] = c
        if c.get('split_from'):   # 拆開的卡：用原本的代號也找得到（題目合併）
            cards.setdefault(c['split_from'], dict(questions=[]))['questions'] += c['questions']
G = {}  # group -> entries
E = []
def n(group, value, meaning, rx, cs, forms=None):
    E.append(dict(group=group, value=value, meaning=meaning, rx=rx, cards=cs.split(), forms=forms or []))
F, D, W, S, T, A, P, O = '罰鍰金額', '距離與長度', '重量', '速度', '時間與年數', '酒精濃度', '點數', '其他'
# ---- 罰鍰金額
n(F,'300元～600元','附載人員或物品違規，罰駕駛人','300元','C-cargo-10')
n(F,'600～1,800元','紅燈右轉','600～1,800','C-jct-05')
n(F,'1,800～5,400元','機車闖紅燈（當場舉發），並記 3點','1,800 ?元至5,400|1,800～5,400','C-jct-04')
n(F,'3,600～10,800元','機車在捷運共用路口闖紅燈，並記點','3,600','C-ban-20 C-drv-25')
n(F,'1,800～3,000元','汽車併排停車','1,800元以上 3,000','C-ban-17')
n(F,'1,800元','無正當理由不接受道安講習（逾期 6個月以上再吊扣駕照）','1,800元罰鍰','C-misc-31')
n(F,'6,000～36,000元','超過規定最高時速 40公里以上（另吊扣牌照 6個月、上講習）','6,000元以上','C-misc-16')
n(F,'15,000元～90,000元','車主明知駕駛人酒駕卻不禁止（另吊扣牌照 2年）','15,000元以上 90,000|15,000~90,000','C-ban-10 C-misc-32e',['15,000~90,000'])
n(F,'30,000～90,000元','兩輛以上機車競駛（另當場禁止駕駛、吊銷駕照）','30, ?000~90','C-drv-25')
n(F,'18,000～36,000元','沒有駕照騎機車','18,000','C-misc-30')
n(F,'9萬元','機車酒駕：10年內第 2次；第一次最高也是 9萬元','9萬|90,000','C-ban-05 C-ban-07')
n(F,'12萬元','汽車（四輪以上）10年內酒駕第 2次','12 ?萬','C-ban-07')
n(F,'18萬元（180,000元）','拒絕酒測：另當場吊銷駕照','18 ?萬|180,000','C-ban-08',['18萬','180,000'])
# ---- 距離與長度
n(D,'10公分','載物寬度：不超過把手外緣','10 ?公分','C-cargo-02')
n(D,'半公尺（50公分）','載物伸出車尾：自後輪軸起不超過','半公尺|50 ?公分','C-cargo-03',['半公尺','50公分'])
n(D,'半公尺（50公分、0.5公尺）','兩車交會、與左右相鄰車輛的間隔','半公尺|50 ?公分|0\\.5 ?公尺','C-drv-21',['半公尺','50公分','0.5公尺'])
n(D,'50公分','機車與障礙物保持的最少橫向距離','50 ?公分','C-drv-05')
n(D,'1公尺（約1個車門）','經過路邊停放的車輛，保持的間隔','1 ?公尺','C-drv-21')
n(D,'30公尺','轉彎或變換車道，要在多遠前顯示方向燈','30 ?公尺','C-turn-03 C-jct-01')
n(D,'10公尺','交岔路口、公車招呼站多少公尺內不得臨時停車（巷道形成的路口也一樣）','10 ?公尺|十公尺','C-drv-28 C-misc-52')
n(D,'5公尺','沒有停止線的路口範圍：道路邊緣虛擬連接線外','5 ?公尺','C-jct-08')
n(D,'3至6公尺','無看守、無設備的平交道：在軌道外多遠停看聽','3至6公尺','C-misc-37')
n(D,'100～300公尺','超速舉發用科學儀器，一般道路要在多遠前明顯標示','100公尺','C-misc-16')
n(D,'2公尺','機車全高不得超過','2 ?公尺','C-chk-05')
n(D,'300～420公釐','小型輕型機車輪胎直徑','300公釐','C-chk-05')
n(D,'1～2公分','煞車拉桿輕抓時的間隙','1至2公分','C-chk-11')
n(D,'約1指縫','安全帽帽帶扣緊後保留的空間','1指','C-chk-21')
# ---- 重量
n(W,'80公斤','重型機車載物重量上限','80 ?公斤','C-cargo-05 C-misc-55')
n(W,'50公斤','普通輕型機車載物重量','50公斤','C-cargo-05')
n(W,'70公斤以下','小型輕型機車空重（含電池）','70公斤','C-chk-05')
# ---- 速度
n(S,'30公里','未劃設車道線或分向線的道路，時速不得超過','30 ?公里','C-drv-08')
n(S,'40公里','有快慢車道分隔線的慢車道，無速限時時速不得超過','40 ?公里','C-drv-09 C-ban-18')
n(S,'50公里','沒有速限標誌或標線的一般道路，時速不得超過','50 ?公里','C-drv-08')
n(S,'15公里以下','看到平交道標誌或標線，要把車速降到','15公里','C-drv-27 C-misc-37')
n(S,'25公里以下','微型電動二輪車最高時速','25 ?公里','C-jct-22')
n(S,'30→50公里','撞擊時速從 30公里升到 50公里，騎士死亡機率從 10％升到約 80％','30公里提高到時速50','C-light-13')
n(S,'1倍→4倍','速度增加 1倍，煞車距離變成','4倍','C-misc-01')
# ---- 時間與年數
n(T,'半秒','每次按喇叭不得超過','半秒','C-chk-02 C-drv-23')
n(T,'3分鐘','臨時停車不得超過','3分鐘','C-misc-57')
n(T,'10秒','檢查呼吸不超過；CPR 不可中斷超過','10 ?秒','C-acc-19 C-acc-20')
n(T,'4~6分鐘','心跳停止後多久內要做 CPR','4~6','C-acc-20')
n(T,'15~20分鐘','止血帶每隔多久鬆開一次','15~20','C-acc-16')
n(T,'30：2、100次/分','CPR 按壓與吹氣比例、按壓速度','30：2|100 ?次','C-acc-20')
n(T,'6分鐘','逕行舉發超速，連續舉發要相隔','6分鐘|6 分鐘','C-misc-16')
n(T,'2小時','違規停車駕駛不在場，每逾多久可連續舉發','2小時','C-misc-17')
n(T,'上午7時至晚間8時','禁止停車路段的禁止時間','上午7時','C-drv-28')
n(T,'1年','駕照被吊銷後，多久才能重新考領','應經1年','C-acc-12')
n(T,'1年','機車辦理停駛，期限最多','1年','C-chk-10')
n(T,'1年','闖越平交道：吊扣駕照','吊扣駕照 ?1年','C-misc-38')
n(T,'1～2年','機車酒駕第一次：吊扣駕照','1~2 ?年|1年至2年','C-ban-05')
n(T,'2年','車主明知酒駕不禁止：吊扣牌照','2年','C-ban-10')
n(T,'3年','10年內酒駕第 2次：吊銷駕照後；肇事致人受傷逃逸：不得考領','3 ?年','C-ban-07 C-misc-32b')
n(T,'12年','終身吊銷駕照者（肇事致死案件）逾幾年可申請考領','12年','C-misc-32b')
n(T,'5年','出廠滿幾年轉讓過戶要臨時檢驗；大型重型機車出廠未滿 5年免定期檢驗','5 ?年|五年','C-chk-10 C-misc-24')
n(T,'6年','輪胎建議製造後不超過','6年','C-chk-19')
n(T,'10年內','累計酒駕次數的計算期間','10 ?年','C-ban-07')
n(T,'3個月','吊扣駕照：借照或允許無照者駕車；事故車證據扣留不得超過','3 ?個月','C-misc-30 C-misc-23')
n(T,'3個月至6個月','肇事致人重傷：吊扣駕照','3 個月至6','C-misc-32d')
n(T,'6個月','吊扣牌照：迫使他車讓道；強制險逾期未投保可註銷牌照','6個月','C-ban-13 C-misc-15')
n(T,'30日','強制險保險證有效期間至少（換牌照、過戶時）','30日','C-misc-15')
n(T,'2個月','1年內記點滿 12點：吊扣駕照','2個月|2 個月','C-misc-31')
n(T,'7天','路考不合格，再考的間隔不得少於','7 天','C-misc-28')
n(T,'每週','長期停放，每週發動 1次，每次 3-5分鐘','每週','C-chk-16')
n(T,'每隔5秒','行進間看後照鏡的頻率','5秒','C-drv-01')
n(T,'30天（30日、7日）','違規通知單 30天內可繳納；不服裁決 30日內提訴；檢舉 7日內舉發','30天|30日','C-misc-33')
n(T,'18歲','考領輕型、普通重型機車駕照須年滿','18歲','C-misc-27')
n(T,'未滿12歲','酒駕且載未滿 12歲兒童','12歲','C-ban-06')
# ---- 酒精濃度
n(A,'0.15毫克（每公升吐氣）','吐氣酒精濃度達此數值，不得開車','0\\.15','C-ban-03')
n(A,'0.25毫克（每公升吐氣）','吐氣酒精濃度達此數值，或吸毒致不能安全駕駛：處 3年以下有期徒刑','0\\.25','C-ban-04')
# ---- 點數
n(P,'記3點','機車闖紅燈（當場舉發）','3點','C-jct-04')
n(P,'記1點','迴車違規；低於最低時速；不在規定車道行駛；佔用自行車專用道；起駛不讓行進中車人；不服從警察指揮','1點|1 點','C-turn-17 C-drv-12 C-drv-19 C-misc-58 C-misc-18')
n(P,'12點','1年內記點滿 12點','12點','C-misc-31')
# ---- 其他
n(O,'200萬元','強制險：死亡或全殘最高給付','200萬','C-misc-14')
n(O,'1人','重型、普通輕型機車後座有固定座位，最多附載','1人','C-cargo-07')
n(O,'二分之一','無照、酒醉駕車致傷亡，或不讓行人致傷亡：刑責加重至','二分之一','C-ban-11 C-jct-16')
n(O,'85分、70分','筆試及格 85分、路考及格 70分','85','C-misc-28')
n(O,'50cc、250cc','普通輕型 50cc以下；普通重型逾 50～250cc；大型重型逾 250cc','50cc|250','C-misc-25')
n(O,'110','事故報案電話','110','C-acc-03')
n(O,'1933','平交道故障車輛，鐵路緊急聯絡電話','1933','C-misc-39')
n(O,'100%氧氣','一氧化碳中毒給予','100%','C-acc-25')
CONF = [
 ('載物的寬和長','載物寬度和載物後方長度最容易搞混',['10公分','半公尺（50公分）']),
 ('載物與車重','重型、普通輕型載物重量；小型輕型空重不是載物重量',['80公斤','50公斤','70公斤以下']),
 ('路口附近的距離','方向燈 30公尺、臨時停車 10公尺、路口範圍 5公尺、平交道 3至6公尺',['30公尺','10公尺','5公尺','3至6公尺']),
 ('各種間隔','同樣是「間隔」，兩車交會半公尺、障礙物 50公分、路邊停車 1公尺（半公尺、50公分、0.5公尺是同一個長度的不同寫法）',['半公尺（50公分、0.5公尺）','50公分','1公尺（約1個車門）']),
 ('三種速限','30、40、50公里依道路不同；平交道是 15公里以下',['30公里','40公里','50公里','15公里以下']),
 ('兩種酒精濃度','0.15 是不得開車的標準；0.25 才有刑責',['0.15毫克（每公升吐氣）','0.25毫克（每公升吐氣）']),
 ('酒駕罰鍰','9萬、12萬（汽車）、18萬（拒測）',['9萬元','12萬元','18萬元（180,000元）']),
 ('闖紅燈的罰鍰','闖紅燈、捷運共用路口闖紅燈、紅燈右轉三個區間',['1,800～5,400元','3,600～10,800元','600～1,800元']),
 ('吊扣的期間','酒駕吊扣 1～2年；吊扣牌照 2年（車主）；吊扣牌照 6個月',['1～2年','2年','6個月']),
 ('幾年','1年、3年、5年、6年、10年、12年各代表不同事',['1年','3年','5年','6年','10年內','12年']),
 ('幾個月','2個月（記點）、3個月、6個月',['2個月','3個月','3個月至6個月','6個月']),
 ('CPR 的數字','比例 30：2、10秒、4~6分鐘、15~20分鐘',['30：2、100次/分','10秒','4~6分鐘','15~20分鐘']),
]
out = []
for i, e in enumerate(E, 1):
    rx = re.compile(e['rx']); qs = []
    for cid in e['cards']:
        for qid in cards[cid]['questions']:
            q = Q[qid]
            if rx.search(q['question'] + ' ' + q['options'][q['answer']]) and qid not in qs: qs.append(qid)
    weak, note = False, None
    if not qs:   # 反向題／「以上皆是」：數字在其他選項裡，改比對全部選項，並自動判斷出處是否有效
        weak = True
        for cid in e['cards']:
            for qid in cards[cid]['questions']:
                q = Q[qid]
                if rx.search(q['question'] + ' ' + ' '.join(q['options'])) and qid not in qs:
                    qs.append(qid)
                    ans = q['options'][q['answer']]
                    if '以上皆是' in ans: note = '出自「以上皆是」題：每個選項都是正確敘述'
                    elif '反向題' in q['tags'] or re.search(r'不正確|錯誤|何者「?非|不是|不包括|並非|不適當', q['question']): note = '出自反向題：答案以外的選項都是正確敘述'
                    else: note = None; break
        weak = bool(qs) and note is None
    out.append(dict(weak=weak, source_note=note, id=f'N-{i:03d}', group=e['group'], value=e['value'], meaning=e['meaning'], forms=e['forms'], qids=qs, cards=e['cards']))
miss = [o['id'] + ' ' + o['value'] for o in out if not o['qids']]
conf = []
byval = {}
for o in out: byval.setdefault(o['value'], []).append(o['id'])
for name, note, vals in CONF:
    ids = [i for v in vals for i in byval.get(v, [])]
    assert len(ids) >= len(vals), (name, vals)
    conf.append(dict(name=name, note=note, ids=ids))
json.dump(dict(entries=out, confusable=conf), open('data/concepts/numbers-draft.json', 'w'), ensure_ascii=False, indent=1)
e = html.escape; byid = {o['id']: o for o in out}
def row(o):
    f = ('　寫法：' + '、'.join(o['forms'])) if o['forms'] else ''
    qs = '、'.join(f"{q}（{e(Q[q]['options'][Q[q]['answer']][:22])}）" for q in o['qids']) + (('　※' + o['source_note']) if o.get('source_note') else '') + ('　※出處待確認' if o['weak'] else '')
    return f'''<section class="card" data-id="{o['id']}" data-name="{e(o['value'])}"><h3>{e(o['value'])} <small>{o['id']}</small></h3>
<p class="rule">{e(o['meaning'])}{e(f)}</p><p class="src">出處：{qs}</p>
<label><input type="radio" name="{o['id']}" value="ok" checked> ✓ 正確</label> <label><input type="radio" name="{o['id']}" value="no"> ✗ 要改</label>
<input class="note" placeholder="備註"></section>'''
body = '<h2>容易搞混的數字（放在一起看）</h2>'
for c in conf:
    body += f'<div class="grp"><h3>{e(c["name"])}</h3><p>{e(c["note"])}</p><ul>' + ''.join(f'<li><b>{e(byid[i]["value"])}</b>：{e(byid[i]["meaning"])}</li>' for i in c['ids']) + '</ul></div>'
for g in [F, D, W, S, T, A, P, O]:
    body += f'<h2>{g}</h2>' + ''.join(row(o) for o in out if o['group'] == g)
page = f'''<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>數字卡審核</title><style>
body{{font:18px/1.6 sans-serif;max-width:760px;margin:0 auto;padding:16px}}.card{{border:1px solid #ccc;border-radius:12px;padding:8px 16px;margin:12px 0}}
.rule{{font-size:19px;font-weight:700;margin:4px 0}}.src{{color:#555;font-size:15px;margin:4px 0}}small{{color:#888;font-weight:400}}h3{{margin:6px 0}}
.grp{{background:#fff7e0;border-radius:12px;padding:4px 16px;margin:12px 0}}label{{margin-right:16px;display:inline-block;min-height:44px}}
.note{{width:100%;font-size:18px;padding:8px;box-sizing:border-box}}textarea{{width:100%;height:180px;font-size:16px}}</style>
<h1>數字卡審核（{len(out)} 筆）</h1><p>每筆選「✓ 正確」或「✗ 要改」，要改的寫備註；最下方彙整，複製給 Claude。</p>{body}
<h2>要改的清單</h2><textarea id="out" readonly></textarea><script>
function upd(){{let t=[];document.querySelectorAll('.card').forEach(c=>{{if(c.querySelector('input[value=no]').checked)t.push(c.dataset.id+' '+c.dataset.name+'：'+(c.querySelector('.note').value||'（未寫備註）'))}});document.getElementById('out').value=t.length?t.join('\\n'):'全部正確'}}
document.addEventListener('input',upd);upd();</script></html>'''
open('docs/數字卡審核.html', 'w').write(page)
print(len(out), '筆；找不到出處題：', miss)
