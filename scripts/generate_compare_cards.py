# scripts/generate_compare_cards.py
import json
import os

# Load questions
with open('data/questions.json', 'r', encoding='utf-8') as f:
    questions_list = json.load(f)
questions_map = {q['id']: q for q in questions_list}

groups_data = [
    # 1. 警察指揮手勢
    {
        "id": "CMP-police-gesture",
        "name": "警察指揮手勢",
        "principles": [
            {
                "text": "手臂水平伸直時，該手臂方向（或正面對面）之車輛應依指示停止或通行。",
                "source": "道路交通標誌標線號誌設置規則第7條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "手掌掌心立起朝向來車為「停止」；手臂平伸擺動或前屈為「速行」或「轉彎」。",
                "source": "道路交通標誌標線號誌設置規則第7條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "右手平伸掌心向前為右方來車停止（M0530）；左右手均平伸為前後來車停止、左右來車通行（M0527）。",
                "source": "M0527",
                "external": False,
                "needs_source": False
            }
        ],
        "confusions": [
            "手臂平伸是叫該方向車輛「停止」還是「通行」，關鍵在掌心是否正對來車以及有無揮動招引動作。",
            "前後來車停止（M0527）與全部車輛停止（M0528 右手高舉過頭掌心向前）的手臂高度不同。"
        ],
        "members": ["M0527", "M0528", "M0529", "M0530", "M0531", "M0532", "M0533", "M0534", "S112"]
    },

    # 2. 駕駛人與自行車手勢
    {
        "id": "CMP-driver-signals",
        "name": "駕駛人與自行車轉向減速手勢",
        "principles": [
            {
                "text": "左臂平伸、手掌向下為「左轉彎」信號。",
                "source": "道路交通安全規則第91條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "左臂向上屈曲、手掌向右微曲為「右轉彎」信號（自行車亦得以右臂平伸表示右轉）。",
                "source": "道路交通安全規則第91條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "左臂向下垂伸、手掌向後為「減速暫停」；左臂向下垂伸、手掌向前微動為「允讓後車超越」。",
                "source": "道路交通安全規則第91條",
                "external": True,
                "needs_source": False
            }
        ],
        "confusions": [
            "左臂「向上屈曲」是右轉，左臂「水平平伸」才是左轉，容易左右混淆。",
            "手掌「向後下垂不動」是減速暫停（M0433、M0743），「掌心向前微動」是允讓後車超越（M0434）。"
        ],
        "members": ["M0433", "M0434", "M0435", "M0436", "M0444", "M0445", "M0741", "M0742", "M0743"]
    },

    # 3. 禁制標誌：車種禁止進入
    {
        "id": "CMP-prohibitory-entry",
        "name": "禁制標誌：車種與對象禁止進入",
        "principles": [
            {
                "text": "圓形白底紅邊加紅色反斜線表示「禁止進入」；牌面黑色圖案代表受禁止之車種或對象。",
                "source": "道路交通標誌標線號誌設置規則第58條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "白底紅圈無圖案為「禁止任何車輛進入」；內畫汽車為四輪以上汽車，機車有分普通機車、大重機與550cc以上大重機。",
                "source": "道路交通標誌標線號誌設置規則第63條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "紅色圓圈內黃底機車圖案專指「大型重型機車」，紅色圓圈內機車圖案加註黃底550字樣為「550cc以上大重機」。",
                "source": "M0712",
                "external": False,
                "needs_source": False
            }
        ],
        "confusions": [
            "空心紅圈（M0408）是禁止「任何車輛」進入，不是只有汽車。",
            "「禁止大型重型機車以外之機車進入」（M0411）表示大重機可以進、普通機車不能進，易反向理解。"
        ],
        "members": ["M0408", "M0409", "M0410", "M0411", "M0438", "M0441", "M0517", "M0564", "M0711", "M0712", "M0713", "M0714"]
    },

    # 4. 禁制標誌：動作禁止與管制
    {
        "id": "CMP-prohibitory-action",
        "name": "禁制標誌：動作禁止與管制",
        "principles": [
            {
                "text": "圓形白底紅邊加紅斜線覆蓋動作圖案，表示禁止該項動作（禁止迴車、禁止左轉、禁止超車等）。",
                "source": "道路交通標誌標線號誌設置規則第64條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "八角形紅底白字「停」表示車輛必須停止於停止線前，確認安全後再開。",
                "source": "道路交通標誌標線號誌設置規則第59條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "「禁止超車」標誌內為並行之兩輛車加紅色斜線（M0715）；「停車檢查」為白底紅圈內寫檢查類別（M0219、M0220）。",
                "source": "道路交通標誌標線號誌設置規則第70條",
                "external": True,
                "needs_source": False
            }
        ],
        "confusions": [
            "「禁止停車」（藍底紅圈紅單斜線，M0407）與「禁止臨時停車」（紅十字斜線）之線條區分。",
            "「禁止左轉」（M0583）與「禁止左轉及直行」（M0584，箭頭一分為二）之動作組合差別。"
        ],
        "members": ["M0219", "M0220", "M0407", "M0583", "M0584", "M0715", "M0716", "M0719"]
    },

    # 5. 限制標誌：規格與速限
    {
        "id": "CMP-limits-spec",
        "name": "限制標誌：車重、寬長與最高速限",
        "principles": [
            {
                "text": "圓形白底紅邊內黑色數字加單位（t 或無單位）表示車輛總重限制或最高速限。",
                "source": "道路交通標誌標線號誌設置規則第72條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "數字左右有向外箭頭為「車輛寬度限制」（M0217）；一輛車圖案前後有箭頭標數字為「車輛長度限制」（M0218）。",
                "source": "道路交通標誌標線號誌設置規則第75條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "圓形紅圈純數字（例如 40、50）為最高速限，單位為公里/小時（M0710、M0717）。",
                "source": "道路交通標誌標線號誌設置規則第77條",
                "external": True,
                "needs_source": False
            }
        ],
        "confusions": [
            "「寬度限制」（箭頭向左右兩側水平指）與「長度限制」（整部車側影前後有箭頭標尺寸）的箭頭位置容易看漏。",
            "總重限制標有「t」（公噸，M0009），最高速限純為數字（M0710）無單位標記。"
        ],
        "members": ["M0009", "M0217", "M0218", "M0710", "M0717"]
    },

    # 6. 遵行標誌：動向與轉彎
    {
        "id": "CMP-mandatory-turn",
        "name": "遵行標誌：行車動向與兩段轉彎",
        "principles": [
            {
                "text": "圓形藍底白色箭頭表示遵行行車方向（直行、轉彎、單行或靠右）。",
                "source": "道路交通標誌標線號誌設置規則第40條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "藍底方形白圖之機車加轉折箭頭為「機慢車兩段左轉」（M0587）或「兩段右轉」（M0588）。",
                "source": "道路交通標誌標線號誌設置規則第65條之一",
                "external": True,
                "needs_source": False
            },
            {
                "text": "箭頭斜向右下指向地面為「靠右行駛」（M0718）；長方形藍底白箭頭為「單行道」（M0594）。",
                "source": "道路交通標誌標線號誌設置規則第41條",
                "external": True,
                "needs_source": False
            }
        ],
        "confusions": [
            "「單行道」（長方形藍底）與「直行遵行方向」（圓形藍底）外框形狀不同但都是白箭頭。",
            "「機慢車兩段左轉」（M0587）與「機慢車兩段右轉」（M0588）的箭頭折角方向相反。"
        ],
        "members": ["M0587", "M0588", "M0593", "M0594", "M0718", "M0744"]
    },

    # 7. 遵行標誌：專用車道
    {
        "id": "CMP-dedicated-lane",
        "name": "遵行標誌：專用車道與專用道路",
        "principles": [
            {
                "text": "圓形或長方形藍底白色圖案，指示該車道或道路僅准特定車種通行。",
                "source": "道路交通標誌標線號誌設置規則第48條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "標示「四輪以上汽車及大型重型機車」表示該路段排除普通機車與慢車（M0439、M0735）。",
                "source": "道路交通標誌標線號誌設置規則第55條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "「開亮頭燈」標誌為圓形藍底白圖（大燈光束照射狀），指示行駛該路段必須開啟頭燈（M0792）。",
                "source": "道路交通標誌標線號誌設置規則第139條",
                "external": True,
                "needs_source": False
            }
        ],
        "confusions": [
            "牌面加註「550cc以上大型重型機車」（M0734、M0736）與未註明550（所有大重機均可，M0735）的適用車種差異。",
            "車道「專行」（僅准特定車種）與道路「指定」（整條道路限制）的管制範圍不同。"
        ],
        "members": ["M0437", "M0439", "M0440", "M0518", "M0733", "M0734", "M0735", "M0736", "M0737", "M0738", "M0792"]
    },

    # 8. 警告標誌：彎道
    {
        "id": "CMP-warning-curves",
        "name": "警告標誌：彎道與連續彎路",
        "principles": [
            {
                "text": "正等邊三角形黃底黑邊黑圖案為警告標誌；折線曲線形狀代表前方路形走向。",
                "source": "道路交通標誌標線號誌設置規則第14條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "單一弧度折向右為「右彎」（M0699），折向左為「左彎」（M0700）。",
                "source": "道路交通標誌標線號誌設置規則第14條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "連續S形折線以「第一個彎轉向」命名：第一折向右為「連續彎路先向右」（M0701），反之先向左（M0702）。",
                "source": "道路交通標誌標線號誌設置規則第15條",
                "external": True,
                "needs_source": False
            }
        ],
        "confusions": [
            "連續彎路（M0701、M0702）的名稱看「最下方起點的第一個彎」折向哪邊，而不是看終點頂端。",
            "警告「圓環」標誌（黃底三角黑環，M0706）與遵行「圓環」標誌（藍底圓形白箭頭環）的顏色與功能完全不同。"
        ],
        "members": ["M0699", "M0700", "M0701", "M0702", "M0706"]
    },

    # 9. 警告標誌：險阻與路況
    {
        "id": "CMP-warning-hazards",
        "name": "警告標誌：路況險阻與路面狀況",
        "principles": [
            {
                "text": "正三角形黃底黑圖用以促使駕駛人提高警覺，採取減速或防護措施。",
                "source": "道路交通標誌標線號誌設置規則第12條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "黑色驚嘆號「！」表示「注意危險」，附牌通常說明危險性質（M0071）；波浪輪胎痕表示「路滑」（M0067）。",
                "source": "道路交通標誌標線號誌設置規則第38條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "斜坡標示%數為「險升坡/險降坡」（M0512）；落石碎塊在左為「注意左側落石」（M0068），在右為右側（M0069）。",
                "source": "道路交通標誌標線號誌設置規則第27條",
                "external": True,
                "needs_source": False
            }
        ],
        "confusions": [
            "落石標誌（M0068、M0069）之左右側判定依據懸崖山壁位在圖案左邊或右邊。",
            "路面「高突」（單個小山丘突起，M0708）與路面「顛簸」（兩個起伏波峰，M0707）外觀極為相似。"
        ],
        "members": ["M0067", "M0068", "M0069", "M0070", "M0071", "M0405", "M0406", "M0422", "M0423", "M0512", "M0707", "M0708", "M0709"]
    },

    # 10. 警告標誌：路寬縮減與狹路
    {
        "id": "CMP-warning-narrow",
        "name": "警告標誌：路寬縮減與狹橋狹路",
        "principles": [
            {
                "text": "道路兩側線條同時向內對稱內縮為「狹路」（M0703）；單側內縮代表該側車道縮減（M0704、M0705）。",
                "source": "道路交通標誌標線號誌設置規則第20條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "兩條平行線於中間突然凹入如工字形代表「狹橋」（M0739）。",
                "source": "道路交通標誌標線號誌設置規則第21條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "左邊直線右邊向內斜為「右側車道縮減」（M0705）；右邊直線左邊向內斜為「左側車道縮減」（M0704）。",
                "source": "道路交通標誌標線號誌設置規則第22條",
                "external": True,
                "needs_source": False
            }
        ],
        "confusions": [
            "「狹路」（M0703，路面漸次變窄）與「狹橋」（M0739，橋樑結構使寬度驟減）圖案線條轉折不同。",
            "車道縮減的左右側看的是「傾斜靠攏的那一條邊線」位在左側還是右側。"
        ],
        "members": ["M0703", "M0704", "M0705", "M0739"]
    },

    # 11. 警告標誌：路口與用路人
    {
        "id": "CMP-warning-crossing-users",
        "name": "警告標誌：交岔路口與用路人注意",
        "principles": [
            {
                "text": "十字、丁字、丫字交叉黑線表示交岔路口形式（岔路標誌，M0509、M0510、M0511）。",
                "source": "道路交通標誌標線號誌設置規則第17條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "大人牽小孩背包圖案為「當心兒童」（M0514）；單人手持提袋走斑馬線為「當心行人」（M0515）。",
                "source": "道路交通標誌標線號誌設置規則第34條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "兩人上下平行單車為「雙向道」（M0582）；紅黃綠三色圓燈排列為「注意號誌」（M0516）。",
                "source": "道路交通標誌標線號誌設置規則第23條",
                "external": True,
                "needs_source": False
            }
        ],
        "confusions": [
            "「當心兒童」（M0514，大人牽背書包學童）與「當心行人」（M0515，單一成人大步走）易混淆。",
            "「雙向道」（黃底三角內黑箭頭一上一下，M0582）與遵行之分流箭頭意義相異。"
        ],
        "members": ["M0429", "M0509", "M0510", "M0511", "M0513", "M0514", "M0515", "M0516", "M0582"]
    },

    # 12. 施工與改道管制標誌
    {
        "id": "CMP-construction-detour",
        "name": "施工與改道管制標誌",
        "principles": [
            {
                "text": "施工標誌以橙色（橘色）或黃色為底色，搭配工人和路面封閉符號。",
                "source": "道路交通標誌標線號誌設置規則第138條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "長方形白底黑字紅反光邊或橘底黑字，標示「道路施工」（M0731）或「道路封閉」（M0586）。",
                "source": "道路交通標誌標線號誌設置規則第142條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "斜向紅白或黑黃斑馬斜紋箭頭指示「車輛改道」（M0732）或左右道封閉（M0729、M0730）。",
                "source": "道路交通標誌標線號誌設置規則第141條",
                "external": True,
                "needs_source": False
            }
        ],
        "confusions": [
            "「道路封閉」（全路段禁止通行，M0586）與單一車道封閉（左道封閉 M0729 / 右道封閉 M0730）通行權限不同。",
            "「指示改道方向」（M0585，藍底白字箭頭）與臨時工地之「車輛改道」（M0732，紅黑箭頭牌）適用場景不同。"
        ],
        "members": ["M0585", "M0586", "M0729", "M0730", "M0731", "M0732"]
    },

    # 13. 鐵路平交道
    {
        "id": "CMP-railway-crossings",
        "name": "鐵路平交道警告與設備標誌",
        "principles": [
            {
                "text": "柵欄柵門圖案為「有柵門鐵路平交道」（M0447）；蒸氣火車頭圖案為「無柵門鐵路平交道」（M0446）。",
                "source": "道路交通標誌標線號誌設置規則第13條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "交叉叉形標誌下方加一閃電符號為「單線電化鐵路平交道」（M0442），加二道倒V線為「雙線以上」（M0417）。",
                "source": "道路交通標誌標線號誌設置規則第13條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "遇平交道警鈴響起、閃光號誌閃爍或遮斷器放下，一律必須停止於停止線前，故障應按「推、按、跑」應變。",
                "source": "道路交通安全規則第104條",
                "external": True,
                "needs_source": False
            }
        ],
        "confusions": [
            "畫有柵門圖案（M0447）是「有」柵門，畫蒸氣火車頭（M0446）是「無」柵門，常被直覺誤認。",
            "電化鐵路平交道交叉牌下方的標線：一道尖角橫線為單線（M0442），二道尖角橫線為雙線以上（M0417）。"
        ],
        "members": ["M0417", "M0442", "M0446", "M0447", "S055", "S089"]
    },

    # 14. 行車號誌與特種號誌
    {
        "id": "CMP-traffic-signals",
        "name": "行車號誌與特種號誌",
        "principles": [
            {
                "text": "行車管制號誌為紅、黃、綠三色；圓形綠燈得直行、左右轉，箭頭綠燈僅准依箭頭所指方向行駛。",
                "source": "道路交通標誌標線號誌設置規則第207條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "特種閃光紅燈表示「停車再開」，車輛應停止於停止線前確認安全後開；閃光黃燈表示「減速接近，小心通過」。",
                "source": "道路交通標誌標線號誌設置規則第211條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "站立紅人為禁止行人通行（M0522），行走綠人為准許行人通行；車輛遇黃燈未過停止線應減速煞停（S021）。",
                "source": "道路交通標誌標線號誌設置規則第212條",
                "external": True,
                "needs_source": False
            }
        ],
        "confusions": [
            "閃光紅燈（M0428）與閃光黃燈（M0521）在路口處的停讓義務不同：紅燈必須「煞停再開」，黃燈僅需「減速小心」。",
            "圓形綠燈亮起時可左右轉（需讓直行車），但專用箭頭綠燈亮時不可違背箭頭動向（S090、S091）。"
        ],
        "members": ["M0428", "M0520", "M0521", "M0522", "M0523", "M0592", "S021", "S090", "S091", "S092", "S106"]
    },

    # 15. 道路標線：縱向分向線
    {
        "id": "CMP-road-longitudinal-lines",
        "name": "道路標線：縱向分向線與邊線（實線 vs 虛線、黃線 vs 紅線）",
        "principles": [
            {
                "text": "黃色標線分隔對向車流（分向線），白色標線分隔同向車道或指示路面邊線。",
                "source": "道路交通標誌標線號誌設置規則第149條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "雙黃實線（分向限制線，M0724）絕對禁止跨越、迴車或超車；黃虛線（行車分向線，M0721）得超車但應注意安全。",
                "source": "道路交通標誌標線號誌設置規則第165條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "路面邊緣黃實線為禁止停車線（夜間可臨時停車，M0720）；紅實線為禁止臨時停車線（全天禁止停放與臨停，M0725）。",
                "source": "道路交通標誌標線號誌設置規則第168條",
                "external": True,
                "needs_source": False
            }
        ],
        "confusions": [
            "「路面邊線」（15公分寬白實線，外側為路肩）與「車道分界線」（10公分白實線）寬度不同但外觀相似（M0425）。",
            "黃虛線可暫時超車跨越，單黃實線（禁止超車線）與雙黃實線（分向限制線）均絕對不得跨越。"
        ],
        "members": ["M0119", "M0120", "M0425", "M0589", "M0720", "M0721", "M0723", "M0724", "M0725"]
    },

    # 16. 道路標線：橫向停止線與路面標記
    {
        "id": "CMP-road-markings-transverse",
        "name": "道路標線：橫向停止線、斑馬紋與路面標記",
        "principles": [
            {
                "text": "路口橫向白色粗實線為「停止線」，車輛紅燈或遇停標字時應停止於線後（M0526）。",
                "source": "道路交通標誌標線號誌設置規則第174條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "枕木紋（平行於道路行向粗白實線條）為行人穿越道線（M0728）；白色倒三角形為「讓路標線」（M0726）。",
                "source": "道路交通標誌標線號誌設置規則第186條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "黃色網狀線指示路口或特殊出入口禁止臨時停車保持淨空（M0426）；斜紋線為槽化線（M0525）。",
                "source": "道路交通標誌標線號誌設置規則第173條",
                "external": True,
                "needs_source": False
            }
        ],
        "confusions": [
            "「讓路標線」（白色倒三角形，M0726）與「停止線」（白色長條粗實線）的停等強制程度與路權順位不同。",
            "路口白色方框內有機車圖案為「機車停等區」（S022）或「機慢車左轉待轉區」（M0727），停等位置有別。"
        ],
        "members": ["M0418", "M0424", "M0426", "M0427", "M0524", "M0525", "M0526", "M0722", "M0726", "M0727", "M0728", "S022"]
    },

    # 17. 指示標誌：公路編號系統
    {
        "id": "CMP-route-numbers",
        "name": "指示標誌：公路編號與系統識別",
        "principles": [
            {
                "text": "綠底梅花形內標數字為「國道路線編號」（M0413）。",
                "source": "道路交通標誌標線號誌設置規則第85條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "藍底盾形為「一般省道」（M0412）；紅底藍框盾形為「快速公路之省道路線」（M0414）。",
                "source": "道路交通標誌標線號誌設置規則第86條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "白底長方形黑框為「市道、縣道路線編號」（M0415）；白底長方形黑字標示地名簡稱加數字為「區道、鄉道」（M0416）。",
                "source": "道路交通標誌標線號誌設置規則第88條",
                "external": True,
                "needs_source": False
            }
        ],
        "confusions": [
            "一般省道（純藍盾牌，M0412）與省道快速公路（紅底藍框盾牌，M0414）牌面色彩不同、路權規定不同。",
            "市縣道（白底純數字方牌，M0415）與區鄉道（方牌上方有中文地名簡稱如『中市41』，M0416）外框辨認。"
        ],
        "members": ["M0412", "M0413", "M0414", "M0415", "M0416", "M0747"]
    },

    # 18. 指示標誌：方向里程與車道
    {
        "id": "CMP-guide-signs",
        "name": "指示標誌：方向、里程與車道指引",
        "principles": [
            {
                "text": "綠底白字指示標誌用以指引行車動向、地名與剩餘公里數（M0591、M0745）。",
                "source": "道路交通標誌標線號誌設置規則第118條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "車道預告標誌上方標示不同車道指引之地名或公路路線（M0421、M0443）。",
                "source": "道路交通標誌標線號誌設置規則第121條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "藍底白圖紅色長條橫槓置於路口末端為「此路不通」（M0519）。",
                "source": "道路交通標誌標線號誌設置規則第134條",
                "external": True,
                "needs_source": False
            }
        ],
        "confusions": [
            "「地名里程指示」（綠底標示前方各地名與公里數，M0591）與路口轉彎處之「方向里程」（帶有箭頭指向，M0745）。",
            "「車道預告」（M0421）係於接近路口前提示各車道未來行向，應提早打方向燈變換車道。"
        ],
        "members": ["M0421", "M0443", "M0519", "M0590", "M0591", "M0745", "M0746"]
    },

    # 19. 指示標誌：服務設施與車站
    {
        "id": "CMP-public-facilities",
        "name": "指示標誌：服務設施與車站人行設施",
        "principles": [
            {
                "text": "藍底正方形白色圖案指示各項公共運輸與旅客服務設施。",
                "source": "道路交通標誌標線號誌設置規則第125條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "正方形藍底白「P」為停車處（M0419）；白底紅十字為救護站（M0072）。",
                "source": "道路交通標誌標線號誌設置規則第127條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "火車頭圖案為鐵路車站（M0431）；子彈型列車圖案為高鐵車站（M0748）；捷運標誌為捷運車站（M0740）。",
                "source": "道路交通標誌標線號誌設置規則第126條",
                "external": True,
                "needs_source": False
            }
        ],
        "confusions": [
            "台鐵車站（傳統車廂/蒸汽圖案，M0431）與高鐵車站（流線型車頭，M0748）圖案車型外觀差異。",
            "人行天橋（走在階梯橋上，M0749）與人行地下道（走在階梯往下，M0420）之行走方向箭頭。"
        ],
        "members": ["M0072", "M0419", "M0420", "M0430", "M0431", "M0432", "M0740", "M0748", "M0749"]
    },

    # 20. 情境題：安全防護裝備與乘載
    {
        "id": "CMP-scenario-safety-gear",
        "name": "情境題：安全裝備、穿著規範與乘載規定",
        "principles": [
            {
                "text": "機車駕駛人及附載座人均應配戴合格安全帽，繫緊頤帶且帽體不可鬆脫遮蔽視線。",
                "source": "道路交通安全規則第88-2條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "機車後座乘客必須跨坐並抓緊駕駛人或握把，不得側坐或站立踏板；普通輕型與重型機車最多附載1人。",
                "source": "道路交通安全規則第88條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "騎車時應穿著長袖長褲、包覆鞋款與防滑手套，切勿穿拖鞋、高跟鞋以防操作失靈及受傷（S003、S004）。",
                "source": "S003",
                "external": False,
                "needs_source": False
            }
        ],
        "confusions": [
            "安全帽「頤帶未扣緊」視同未戴安全帽，摔倒時安全帽易脫落失去保護（S001、S002）。",
            "機車腳踏板不得載運寵物或堆疊過高貨物以致影響轉向手把靈活性（S065、S066）。"
        ],
        "members": ["S001", "S002", "S003", "S004", "S064", "S065", "S066", "S079", "S102"]
    },

    # 21. 情境題：出發前檢查與輪胎
    {
        "id": "CMP-scenario-pretrip-tires",
        "name": "情境題：出發前檢查、胎壓胎紋與燈光設備",
        "principles": [
            {
                "text": "行車前應檢查機車煞車、方向燈、尾燈、照後鏡及胎紋深度（法定胎紋深度不得低於0.8mm）。",
                "source": "道路交通安全規則第39-2條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "胎面磨耗指示點（對齊胎壁小三角形凸起點）若磨平應立即更換輪胎以防雨天打滑水漂（S061）。",
                "source": "S061",
                "external": False,
                "needs_source": False
            },
            {
                "text": "胎壓過低易耗油磨損胎邊，胎壓過高著地面積減小易滑倒，應維持原廠標準胎壓（S120）。",
                "source": "S120",
                "external": False,
                "needs_source": False
            }
        ],
        "confusions": [
            "胎紋磨損到「磨耗指示標誌」（凸起平齊處）就是法定更換時限，並非等輪胎全光才能換。",
            "方向燈必須為橙色/黃色，尾燈與煞車燈必須為紅色，不得擅自改裝其他顏色（S067、S068）。"
        ],
        "members": ["S061", "S062", "S063", "S067", "S068", "S119", "S120"]
    },

    # 22. 情境題：大型車死角與內輪差
    {
        "id": "CMP-scenario-blindspots-inner-wheel",
        "name": "情境題：大型車視野死角與內輪差防禦",
        "principles": [
            {
                "text": "大型車轉彎時後輪軌跡較前輪更向內偏移，形成「內輪差」危險區域，機車切勿在轉彎內側鑽縫或併行。",
                "source": "道路交通安全規則第102條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "大型車車身四周（尤其是右前側及正後方）存在龐大視野死角，機車駕駛應與大型車保持足夠安全間隔。",
                "source": "道路交通安全規則第94條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "大型車行駛中產生強大側向氣流氣壓，機車在旁易受強風吸附或吹翻，應避免與其長時間併行（S016）。",
                "source": "S016",
                "external": False,
                "needs_source": False
            }
        ],
        "confusions": [
            "車輛越長、軸距越大，其內輪差範圍越大，即使大型車前輪已過，後輪仍可能輾壓路肩。",
            "機車在大型車照後鏡死角內時駕駛完全看不見，切勿誤以為對方看到自己而硬衝（S008～S015）。"
        ],
        "members": ["S008", "S009", "S010", "S011", "S012", "S013", "S014", "S015", "S016", "S017", "S117"]
    },

    # 23. 情境題：斑馬線停讓行人
    {
        "id": "CMP-scenario-pedestrian-crosswalk",
        "name": "情境題：斑馬線停讓行人與安全距離",
        "principles": [
            {
                "text": "汽車行經行人穿越道有行人穿越時，無論有無號誌，均應暫停讓行人先行通過。",
                "source": "道路交通安全規則第103條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "車輛行近行人穿越道時，應距離行人行進方向 3 公尺（約 1 個車道寬或約 3 條枕木紋）以上完全煞停。",
                "source": "道路交通安全規則第103條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "遇攜帶白手杖之視障者或導盲犬穿越道路時，應全面停讓並保持耐心，不得鳴按喇叭催促（S035）。",
                "source": "道路交通安全規則第103條",
                "external": True,
                "needs_source": False
            }
        ],
        "confusions": [
            "綠燈轉彎車輛即使號誌允許通行，面對斑馬線上的行人仍處於絕對從屬地位，必須完全停讓（S018、S019）。",
            "停讓行人必須「完全停車」等候通過，不得以慢速滑行逼近行人試圖搶先穿過。"
        ],
        "members": ["S018", "S019", "S030", "S031", "S032", "S033", "S034", "S035", "S036", "S037", "S038"]
    },

    # 24. 情境題：安全超車與禁止超車
    {
        "id": "CMP-scenario-overtaking-safety",
        "name": "情境題：安全超車原則與禁止超車地點",
        "principles": [
            {
                "text": "超車應一律由「左側」超越，並於超車前保持安全距離打左方向燈、鳴喇叭或變換燈光預告。",
                "source": "道路交通安全規則第101條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "超車時與前車左側應保持半公尺（50公分）以上間隔，超越後確認安全距離再行打右方向燈駛回原車道。",
                "source": "道路交通安全規則第101條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "在彎道、險坡、狹橋、隧道、交岔路口及設有禁止超車標誌標線（雙黃線/單黃實線）處，絕對禁止超車。",
                "source": "道路交通安全規則第101條",
                "external": True,
                "needs_source": False
            }
        ],
        "confusions": [
            "右側路肩或外側鑽縫超車屬於嚴重違規行為，超車法定途徑一律僅限左側（S040、S082）。",
            "前方車輛已打方向燈顯示左轉或正在超車時，後行車輛不得強行超越（S044、S045）。"
        ],
        "members": ["S029", "S039", "S040", "S041", "S042", "S043", "S044", "S045", "S046", "S059", "S082", "S083"]
    },

    # 25. 情境題：車道選擇與禁行機車
    {
        "id": "CMP-scenario-lane-restrictions",
        "name": "情境題：車道選擇與禁行機車路段",
        "principles": [
            {
                "text": "機車行駛時應遵守車道管制規定，路面劃有「禁行機車」字樣之車道絕對禁止進入行駛。",
                "source": "道路交通安全規則第99條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "未劃分快慢車道之單行道，機車應在最外側車道或慢車道行駛，不得佔用內側快車道。",
                "source": "道路交通安全規則第98條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "同向劃有三車道以上之道路，最內側車道除另有規定外通常劃設禁行機車，機車應行駛於外側或中側車道。",
                "source": "道路交通安全規則第99條",
                "external": True,
                "needs_source": False
            }
        ],
        "confusions": [
            "看路面字樣（禁行機車）判定車道權限（S023、S024、S025），不可因前方車多而騎上禁行機車道。",
            "跨越雙白實線或分向限制線進入禁行車道超車屬於連續違規行為（S073、S074）。"
        ],
        "members": ["S023", "S024", "S025", "S073", "S074", "S075", "S076", "S086"]
    },

    # 26. 情境題：轉彎車道與兩段式左轉
    {
        "id": "CMP-scenario-turning-two-stage",
        "name": "情境題：轉彎車道、方向燈預告與兩段式左轉",
        "principles": [
            {
                "text": "路口設有兩段左轉標誌或最內側為禁行機車道路口，機車左轉必須依兩段式規定於待轉區待轉。",
                "source": "道路交通安全規則第99條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "汽車轉彎或變換車道前，應至少於交岔路口 30 公尺前顯示方向燈預告。",
                "source": "道路交通安全規則第102條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "在無禁行機車及兩段轉彎規定之雙向兩車道路口，機車欲左轉應提早換入內側車道至路口中心處再左轉（S027）。",
                "source": "道路交通安全規則第102條",
                "external": True,
                "needs_source": False
            }
        ],
        "confusions": [
            "前往兩段式待轉區時，應顯示「右方向燈」順行靠外側減速進入待轉格，切勿直接從內側鬼切切入（S026）。",
            "在待轉格內需轉向端正等待橫向綠燈再通行，待轉期間不可擅自左轉衝出（S049、S050）。"
        ],
        "members": ["S026", "S027", "S028", "S047", "S048", "S049", "S050", "S051", "S077"]
    },

    # 27. 情境題：路口路權順位與淨空
    {
        "id": "CMP-scenario-intersection-priority",
        "name": "情境題：路口路權順位與路口淨空",
        "principles": [
            {
                "text": "路權判定順序：支線道車讓幹線道車先行；少線道車讓多線道車先行；轉彎車讓直行車先行。",
                "source": "道路交通安全規則第102條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "未劃分幹支線且車道數相同之路口，同為直行車或轉彎車時，左方車應讓右方車先行。",
                "source": "道路交通安全規則第102條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "前方路口車流壅塞或號誌即將變換時，即使本車道為綠燈，車輛仍不得強行駛入路口，應保持路口淨空（S020）。",
                "source": "道路交通安全規則第102條",
                "external": True,
                "needs_source": False
            }
        ],
        "confusions": [
            "「轉彎車讓直行車」是通用鐵律，但若直行車在「支線道」面對閃紅燈/停讓標誌，則支道直行車必須讓幹道轉彎車先行。",
            "路口壅塞時綠燈直行車不得進路口停在黃網線或路口中央，避免阻礙橫向通行（S020）。"
        ],
        "members": ["S020", "S107", "S108", "S109", "S110", "S111"]
    },

    # 28. 情境題：彎道與坡道技巧
    {
        "id": "CMP-scenario-curves-speed-slopes",
        "name": "情境題：彎道與坡道行駛安全技巧",
        "principles": [
            {
                "text": "行經彎道、坡道應於「入彎前」提早減速，在彎道中切忌緊急猛煞車或劇烈傾斜以免輪胎打滑失控。",
                "source": "道路交通安全規則第93條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "在狹窄坡道會車時，下坡車應暫停讓上坡車先行；但下坡車已到中途而上坡車尚未上坡者，上坡車應讓下坡車先行。",
                "source": "道路交通安全規則第100條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "彎道行駛視線受阻，對向可能隨時有車輛侵入，應隨時靠右行駛、保持車距、禁止超車（S072、S087）。",
                "source": "道路交通安全規則第101條",
                "external": True,
                "needs_source": False
            }
        ],
        "confusions": [
            "坡道會車「原則上上坡車優先」，但例外是「下坡車已開到中途」時上坡車應先讓行。",
            "進彎前減速（慢進快出），切勿於彎中高速時才抓前煞車造成側摔（S053）。"
        ],
        "members": ["S053", "S072", "S087", "S088", "S104", "S105"]
    },

    # 29. 情境題：低摩擦路面防滑
    {
        "id": "CMP-scenario-slippery-surfaces",
        "name": "情境題：低摩擦路面防滑（人孔蓋、鐵板、油污、雨天標線）",
        "principles": [
            {
                "text": "人孔蓋、金屬鐵板、路面油污及潮濕標線之摩擦係數極低，輪胎極易打滑失去抓地力。",
                "source": "道路交通安全規則第93條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "行經低摩擦特殊路面時，應「保持車身正直、鬆開油門順向滑過」，切忌緊急煞車、劇烈壓車或急催油門。",
                "source": "道路交通安全規則第94條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "雨天行車應加大跟車安全距離一倍以上，提早減速預警，避免積水水漂現象（S057、S094）。",
                "source": "S057",
                "external": False,
                "needs_source": False
            }
        ],
        "confusions": [
            "看見鐵板或人孔蓋，許多人直覺在蓋上大力煞車，這反而正是摔車最主要主因，應在接觸前完成減速。",
            "雨天標線（斑馬線、車道線）潮濕時抓地力減半，轉彎時輪胎應盡量避開油漆標線表面（S056、S058）。"
        ],
        "members": ["S056", "S057", "S058", "S094", "S095", "S096", "S097"]
    },

    # 30. 情境題：緊急煞車與車門防禦
    {
        "id": "CMP-scenario-braking-door-safety",
        "name": "情境題：緊急煞車與路邊車輛開門防禦（一公尺間隔）",
        "principles": [
            {
                "text": "機車煞車操作應前後輪同時均勻施力（前煞約7成、後煞約3成），維持車身穩定，避免單鎖死前輪後摔。",
                "source": "道路交通安全規則第94條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "行經路邊停放之汽車旁時，應隨時注意車內有無乘員，並保持 1 公尺以上安全間隔，以防突開車門肇事。",
                "source": "道路交通安全規則第112條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "前方突遇緊急障礙物煞車之反應順序：鬆油門 -> 前後輪同時煞車 -> 抓緊龍頭保持直線平衡（S078）。",
                "source": "S078",
                "external": False,
                "needs_source": False
            }
        ],
        "confusions": [
            "單用前輪煞車易導致翻車（翹後輪或側滑），單用後輪煞車煞車距離過長且後輪易甩尾打滑。",
            "路邊汽車即使未發動，乘員開車門盲區極大，機車保持一公尺距離可完全免於被車門撞擊（S005～S007）。"
        ],
        "members": ["S005", "S006", "S007", "S054", "S078"]
    },

    # 31. 情境題：夜間燈光使用
    {
        "id": "CMP-scenario-night-headlights",
        "name": "情境題：夜間行駛、燈光切換與視線不良應對",
        "principles": [
            {
                "text": "夜間、行經隧道、濃霧、雨雪或視線不清時，機車行駛應開亮頭燈。",
                "source": "道路交通安全規則第109條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "市區照明充足路段或與對向來車會車、跟隨前車時，應使用「近光燈」，嚴禁使用遠光燈造成眩光危險。",
                "source": "道路交通安全規則第109條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "遠光燈僅限於郊區無路燈或照明嚴重不足且前方無車輛時使用，遇來車應立即切換回近光燈（S085）。",
                "source": "道路交通安全規則第109條",
                "external": True,
                "needs_source": False
            }
        ],
        "confusions": [
            "白晝正常天氣原則上不用強制開霧燈；但進入隧道或天候不良時必須強制開亮頭燈（S060、S099）。",
            "夜間對向來車若開遠光燈造成眩光，切勿以遠光燈互照報復，應將視線移向右前方路面邊線並減速。"
        ],
        "members": ["S060", "S085", "S099", "S100", "S101"]
    },

    # 32. 情境題：起駛觀察與安全停車
    {
        "id": "CMP-scenario-starting-parking",
        "name": "情境題：起駛觀察、安全停車與視野車速",
        "principles": [
            {
                "text": "路邊起駛前應先打方向燈預告，轉頭觀察後方與左右來車狀況，確認安全後方可緩步起駛。",
                "source": "道路交通安全規則第89條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "臨時停車與停車應緊靠路邊停放，不得併排停車或在紅線、交岔路口 10 公尺內違規停放。",
                "source": "道路交通安全規則第111條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "車速越快駕駛人之視野角度越狹窄（高速隧道效應），行經複雜路段應主動降低車速以擴大有效視野（S084）。",
                "source": "S084",
                "external": False,
                "needs_source": False
            }
        ],
        "confusions": [
            "起駛單看後照鏡存在盲區死角，必須配合「擺頭查看」才能確保無死角後方來車（S069）。",
            "行車中手持使用行動電話通話或查看訊息屬違規行為且嚴重分心，應停妥於安全處再處理（S080、S081）。"
        ],
        "members": ["S069", "S070", "S071", "S080", "S081", "S084", "S093"]
    },

    # 33. 情境題：突發危險防禦駕駛
    {
        "id": "CMP-scenario-defensive-hazards",
        "name": "情境題：突發路況、公車盲區與緊急避讓",
        "principles": [
            {
                "text": "聞消防車、救護車、警備車等特種緊急車輛警號，應立即避讓，向路側減速或停讓先行。",
                "source": "道路交通安全規則第101條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "行經無號誌盲點巷口或公車靠站時，應預判盲區可能突竄行人或車輛，減速慢行並備煞（S052、S113）。",
                "source": "道路交通安全規則第93條",
                "external": True,
                "needs_source": False
            },
            {
                "text": "遇前方施工路段或障礙物，應提前減速循指示導引車道行駛，不強行爭道超車（S114、S118）。",
                "source": "道路交通安全規則第94條",
                "external": True,
                "needs_source": False
            }
        ],
        "confusions": [
            "公車剛停靠上下客時，後方機車硬從公車右側鑽車縫極度危險，易撞擊下車乘客或遭公車起步夾擊（S052）。",
            "避讓救護車時應注意四周其他車流動向，切勿因緊急避讓反而與相鄰車輛發生碰撞。"
        ],
        "members": ["S052", "S098", "S103", "S113", "S114", "S115", "S116", "S118"]
    }
]

# Verify all members exist and cover exactly the 268 cards
all_assigned = []
for g in groups_data:
    all_assigned.extend(g['members'])

assert len(all_assigned) == 268, f"Expected 268 members, got {len(all_assigned)}"
assert len(set(all_assigned)) == 268, "Duplicate member detected"

# Check every member exists in questions_map
for qid in all_assigned:
    assert qid in questions_map, f"QID {qid} not found in questions.json"

# Write data/concepts/compare-draft.json
os.makedirs('data/concepts', exist_ok=True)
with open('data/concepts/compare-draft.json', 'w', encoding='utf-8') as f:
    json.dump(groups_data, f, ensure_ascii=False, indent=2)
print("Saved data/concepts/compare-draft.json")

# Generate docs/比較卡審核.html
html_parts = []
html_parts.append("""<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>看圖題比較卡審核（V1 初稿）</title>
<style>
:root {
  --primary: #1e3a8a;
  --primary-light: #e0e7ff;
  --bg: #f8fafc;
  --surface: #ffffff;
  --border: #cbd5e1;
  --text: #0f172a;
  --text-muted: #64748b;
  --success: #15803d;
  --danger: #b91c1c;
  --external: #b45309;
  --external-bg: #fef3c7;
}
* { box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  margin: 0;
  padding: 16px;
}
.header {
  max-width: 1200px;
  margin: 0 auto 24px;
  background: var(--surface);
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
h1 { margin: 0 0 8px; color: var(--primary); font-size: 1.6rem; }
.desc { color: var(--text-muted); font-size: 0.95rem; margin: 0; }
.stats-badge {
  display: inline-block;
  background: var(--primary-light);
  color: var(--primary);
  padding: 4px 12px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.9rem;
  margin-top: 8px;
}
.group-card {
  max-width: 1200px;
  margin: 0 auto 32px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}
.group-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  border-bottom: 2px solid var(--primary-light);
  padding-bottom: 10px;
  margin-bottom: 16px;
}
.group-title {
  margin: 0;
  font-size: 1.3rem;
  color: var(--primary);
}
.group-id {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-family: monospace;
}
.section-subtitle {
  font-size: 1rem;
  font-weight: 700;
  margin: 14px 0 8px;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 6px;
}
.principles-list {
  list-style: none;
  padding: 0;
  margin: 0 0 14px;
}
.principle-item {
  background: #f1f5f9;
  border-left: 4px solid var(--primary);
  padding: 10px 14px;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 0.95rem;
}
.principle-item.is-external {
  border-left-color: var(--external);
  background: #fffbeb;
}
.source-tag {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: 6px;
  background: #cbd5e1;
  color: #334155;
}
.source-tag.external {
  background: var(--external-bg);
  color: var(--external);
  border: 1px solid #fde68a;
}
.confusions-box {
  background: #fff1f2;
  border-left: 4px solid #f43f5e;
  padding: 10px 14px;
  border-radius: 4px;
  margin-bottom: 18px;
  font-size: 0.92rem;
  color: #881337;
}
.confusions-box ul {
  margin: 4px 0 0;
  padding-left: 20px;
}
.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}
.member-item {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}
.member-img-wrap {
  text-align: center;
  background: #f8fafc;
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 10px;
  min-height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.member-img {
  max-width: 100%;
  max-height: 120px;
  object-fit: contain;
}
.member-meta {
  font-size: 0.85rem;
  margin-bottom: 6px;
  color: var(--text-muted);
  display: flex;
  justify-content: space-between;
}
.member-qid {
  font-weight: 700;
  color: var(--primary);
  font-family: monospace;
}
.member-qtext {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 8px;
  flex-grow: 1;
}
.member-answer {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-top: auto;
}
.review-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
}
.review-actions label {
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
}
.review-note {
  flex-grow: 1;
  min-width: 220px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.9rem;
}
.summary-box {
  max-width: 1200px;
  margin: 0 auto 40px;
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 12px;
  padding: 20px;
}
.summary-box textarea {
  width: 100%;
  height: 140px;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px;
  font-family: monospace;
  font-size: 0.9rem;
  margin-top: 8px;
}
</style>
</head>
<body>
<div class="header">
  <h1>看圖題比較卡審核（V1 初稿）</h1>
  <p class="desc">
    本審核頁收錄全站 268 張看圖題目（筆試 148 題、情境 120 題），依「外觀相似、容易搞混」歸納為 33 個比較群組。<br>
    每個群組提供 2～4 條分辨原則（包含《道路交通標誌標線號誌設置規則》與《道路交通安全規則》法定條號）與常見混淆解析。
  </p>
  <div class="stats-badge">總群組數：33 組 ｜ 涵蓋題數：268 題 ｜ 覆蓋率：100% ｜ 「其他」組：0 題</div>
</div>
""")

for g in groups_data:
    gid = g['id']
    gname = g['name']
    mem_count = len(g['members'])
    
    html_parts.append(f"""
<section class="group-card" data-gid="{gid}" data-gname="{gname}">
  <div class="group-header">
    <h2 class="group-title">{gname} <small style="font-size:0.9rem; font-weight:normal; color:#64748b;">({mem_count} 題)</small></h2>
    <span class="group-id">{gid}</span>
  </div>

  <div class="section-subtitle">💡 分辨原則（核心法規與出處依據）</div>
  <ul class="principles-list">
""")
    for p in g['principles']:
        is_ext = p.get('external', False)
        ext_cls = ' is-external' if is_ext else ''
        tag_cls = ' external' if is_ext else ''
        src_label = f"法規依據：{p['source']}" if is_ext else f"題庫出處：{p['source']}"
        html_parts.append(f"""    <li class="principle-item{ext_cls}">
      <span>{p['text']}</span>
      <span class="source-tag{tag_cls}">{src_label}</span>
    </li>
""")
    html_parts.append("""  </ul>

  <div class="section-subtitle">⚠️ 容易搞混之處（記憶對比重點）</div>
  <div class="confusions-box">
    <ul>
""")
    for c in g['confusions']:
        html_parts.append(f"      <li>{c}</li>\n")
    html_parts.append("""    </ul>
  </div>

  <div class="section-subtitle">🖼️ 群組成員題目與正確答案</div>
  <div class="members-grid">
""")
    for qid in g['members']:
        q = questions_map[qid]
        q_ans_idx = q['answer']
        ans_text = q['options'][q_ans_idx] if q['options'] else '（無選項）'
        q_text = q['question'] if q['question'].strip() else f"標誌/號誌辨認（題號 {qid}）"
        img_src = q.get('image', f"media/images/{qid}.png")
        # In docs/ folder, relative to media is ../media
        rel_img = f"../{img_src}" if not img_src.startswith('../') else img_src

        html_parts.append(f"""    <div class="member-item">
      <div class="member-img-wrap">
        <img class="member-img" src="{rel_img}" alt="{qid}" loading="lazy">
      </div>
      <div class="member-meta">
        <span class="member-qid">{qid}</span>
        <span>{q.get('subcategory', '')}</span>
      </div>
      <div class="member-qtext">{q_text}</div>
      <div class="member-answer"><strong>✓ 正確答案：</strong>{ans_text}</div>
    </div>
""")
    html_parts.append(f"""  </div>

  <div class="review-actions">
    <label><input type="radio" name="{gid}" value="ok" checked> ✓ 整組正確</label>
    <label><input type="radio" name="{gid}" value="no"> ✗ 需修改</label>
    <input class="review-note" placeholder="修改備註（如需微調原則或調換群組請填寫）">
  </div>
</section>
""")

html_parts.append("""
<div class="summary-box">
  <h2 style="margin: 0 0 8px; color: var(--primary);">📝 審核結果清單（點選「需修改」將自動整理於此）</h2>
  <textarea id="review-out" readonly></textarea>
</div>

<script>
function updateReviewSummary() {
  const cards = document.querySelectorAll('.group-card');
  const needsFix = [];
  cards.forEach(card => {
    const isNo = card.querySelector('input[value="no"]').checked;
    if (isNo) {
      const gid = card.dataset.gid;
      const gname = card.dataset.gname;
      const note = card.querySelector('.review-note').value.trim() || '（未填寫備註）';
      needsFix.push(`${gid} ${gname}：${note}`);
    }
  });
  const out = document.getElementById('review-out');
  out.value = needsFix.length ? needsFix.join('\\n') : '全部 33 組比較卡均審核正確！';
}
document.addEventListener('input', updateReviewSummary);
updateReviewSummary();
</script>
</body>
</html>
""")

with open('docs/比較卡審核.html', 'w', encoding='utf-8') as f:
    f.write(''.join(html_parts))

print("Saved docs/比較卡審核.html")
