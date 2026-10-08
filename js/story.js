/* ============================================================
 * 《问道长生》剧情数据
 * 节点结构：
 *   id:      唯一标识
 *   chapter: 章节名（可选）
 *   title:   场景标题
 *   text:    段落数组（文学化散文）
 *   onEnter: (s) => {} 进入节点时的钩子（可改状态 / 跳转用 return）
 *   choices: [{
 *     text: 选项文案（括号内注明代价与收获）
 *     show: (s) => bool   是否出现
 *     can:  (s) => bool   是否可选（不满足则置灰）
 *     fx:   (s) => void   效果
 *     next: 'id' | (s) => 'id'
 *   }]
 *   ending: { title, rank } 若为结局节点
 * ============================================================ */

const STORY = {

  /* ---------------- 序章 ---------------- */

  start: {
    chapter: '序章',
    title: '山神庙的雪夜',
    text: [
      '大荒历三千七百二十一年，冬。青州，青牛村。',
      '你爹娘死得早，给村里张财主放了十二年牛。这夜大雪封山，你躲进村口破败的山神庙，怀里揣着半个冻硬的馍。',
      '半夜，供桌上泥塑的山神忽然睁开了眼。',
      '"小娃娃，莫怕。"泥像开口，声音像远处的钟，"老道青阳子，渡劫不成，只剩这一缕残魂。坐化之前，想问你三个问题——你答什么，老道便给你留什么。"',
      '庙外的雪，忽然停了。'
    ],
    choices: [
      {
        text: '问："何为长生？"',
        fx: s => { s.flags.asked = '长生'; s.xinjing += 3; },
        next: 'root'
      },
      {
        text: '问："何为道？"',
        fx: s => { s.flags.asked = '道'; s.xiuwei += 3; },
        next: 'root'
      },
      {
        text: '不问，伏地叩首。',
        fx: s => { s.flags.asked = '叩首'; s.xinjing += 6; },
        next: 'root'
      }
    ]
  },

  root: {
    chapter: '序章',
    title: '灵根',
    text: [
      '青阳子残魂一指点在你眉心，一缕灵气顺经脉游走周天，最后沉入丹田。',
      '"唔……"老道的虚影淡了几分，"是块什么料，就看这一遭了。"',
      '灵气在你体内打了个转——你的灵根，是——'
    ],
    choices: [
      {
        text: '天灵根 · 单属性纯灵根，万中无一（修为+12）',
        fx: s => { s.flags.root = '天灵根'; s.xiuwei += 12; },
        next: 'legacy'
      },
      {
        text: '变异雷灵根 · 攻伐无双，心魔亦重（修为+7，心境+4）',
        fx: s => { s.flags.root = '雷灵根'; s.xiuwei += 7; s.xinjing += 4; s.flags.lei = true; },
        next: 'legacy'
      },
      {
        text: '五行杂灵根 · 驳杂不纯，被称"废灵根"（修为+2，心境+10）',
        fx: s => { s.flags.root = '杂灵根'; s.xiuwei += 2; s.xinjing += 10; s.flags.za = true; },
        next: 'legacy'
      }
    ]
  },

  legacy: {
    chapter: '序章',
    title: '遗物',
    text: [
      '虚影越来越淡。青阳子把三样东西推到你面前：半块温热的玉佩，一卷《引气诀》，和一句话。',
      '"玉佩抵死可护你一次心神。功法粗浅，够你入门。最后这句话——"老道笑了笑，"长生不是不死，是不忘。去吧。"',
      '泥像闭上了眼，庙外落雪无声。你对着供桌磕了三个头，起身走进了风雪里。',
      '多年以后你才明白：修仙界吃人，是从这一步开始的。'
    ],
    choices: [
      { text: '三年后，入修行界（岁月+3）', fx: s => { s.age += 3; s.shouyuan -= 3; }, next: 'road' }
    ]
  },

  /* ---------------- 第一章 · 炼气 ---------------- */

  road: {
    chapter: '第一章 · 炼气',
    title: '三条路',
    text: [
      '青云宗三年一度开山收徒，山门外的青石台阶从山脚排到云端。你挤在人群里，听见散修们唾沫横飞地谈论修行界的规矩。',
      '拜入宗门，按部就班，安全，也慢。做散修，刀口舔血，自由，也险。还有人说，西荒鬼市里，魔修收徒不问出身，只要敢把命押上赌桌。',
      '你站在岔路口，雪化了，春天来了。'
    ],
    choices: [
      {
        text: '拜入青云宗 · 正统之路（心境+5）',
        fx: s => { s.flags.path = '宗门'; s.xinjing += 5; },
        next: 'sect_early'
      },
      {
        text: '浪迹散修 · 不问出处（修为+5）',
        fx: s => { s.flags.path = '散修'; s.xiuwei += 5; },
        next: 'rogue_early'
      },
      {
        text: '西荒鬼市 · 富贵险中求（修为+8，心境−8）',
        fx: s => { s.flags.path = '鬼市'; s.xiuwei += 8; s.xinjing -= 8; s.flags.devil_pull = 1; },
        next: 'devil_early'
      }
    ]
  },

  sect_early: {
    chapter: '第一章 · 炼气',
    title: '外门岁月',
    text: [
      '你成了青云宗外门弟子，领了青布道袍、一柄铁剑、每月三枚灵石。外门八百弟子，灵田、矿洞、兽栏，人人都想挤进内门。',
      '日子像山间的溪，缓慢而清苦。你在灵田边引气，在演武场挥剑，夜里听传功长老讲法。',
      '第七年头上，内门大比的名额下来了。同时，后山有一处上古秘境将要开启，只许炼气期弟子入内。'
    ],
    choices: [
      {
        text: '闭关苦修，争大比名额（修为+10，岁月+5）',
        fx: s => { s.xiuwei += 10; s.age += 5; s.shouyuan -= 5; s.flags.dabi = true; },
        next: 'qi_peak'
      },
      {
        text: '入后山秘境，搏一场造化（岁月+2，或有机缘，或有凶险）',
        fx: s => { s.age += 2; s.shouyuan -= 2; },
        next: s => (Math.random() < 0.55 || s.flags.za) ? 'secret_realm' : 'secret_hurt'
      },
      {
        text: '安守灵田，细水长流（心境+8，修为+4，岁月+4）',
        fx: s => { s.xinjing += 8; s.xiuwei += 4; s.age += 4; s.shouyuan -= 4; },
        next: 'qi_peak'
      }
    ]
  },

  secret_realm: {
    chapter: '第一章 · 炼气',
    title: '后山秘境',
    text: [
      '秘境里灵气浓郁如酒。你在断壁残垣间寻了三日，于一座倒塌的丹房前，发现了一株三百年份的紫芝，芝旁盘着一条垂死的碧鳞小蛇。',
      '小蛇的眼睛看着你，像你放牛时见过的、被狼咬伤的鹿。',
      '紫芝可助修行。但小蛇守着它，显然也是在等它救命。'
    ],
    choices: [
      {
        text: '采下紫芝（修为+15）',
        fx: s => { s.xiuwei += 15; s.flags.karma = (s.flags.karma || 0) - 1; },
        next: 'qi_peak'
      },
      {
        text: '留下紫芝，为蛇疗伤（心境+12，得善缘）',
        fx: s => { s.xinjing += 12; s.flags.karma = (s.flags.karma || 0) + 1; s.flags.she = true; },
        next: 'qi_peak'
      },
      {
        text: '采一半，留一半（修为+7，心境+4）',
        fx: s => { s.xiuwei += 7; s.xinjing += 4; },
        next: 'qi_peak'
      }
    ]
  },

  secret_hurt: {
    chapter: '第一章 · 炼气',
    title: '秘境遇险',
    text: [
      '你在秘境深处撞上了一头二阶铁背猿，护身的符箓当场碎了三张。你断了两根肋骨逃出来，躺了半个月。',
      '宗门不负责，秘境本就生死自负。同屋的老弟子说：修仙路上，命是最不值钱的东西，你趁早习惯。',
      '你躺在床板上看着房梁，想了很久。'
    ],
    choices: [
      {
        text: '此仇记下，他日百倍奉还（修为+8，心境−6）',
        fx: s => { s.xiuwei += 8; s.xinjing -= 6; s.flags.grudge = true; },
        next: 'qi_peak'
      },
      {
        text: '生死有命，认栽，但路还要走（心境+8，修为+4）',
        fx: s => { s.xinjing += 8; s.xiuwei += 4; },
        next: 'qi_peak'
      }
    ]
  },

  rogue_early: {
    chapter: '第一章 · 炼气',
    title: '江湖散修',
    text: [
      '散修的日子是另一副模样：没有灵田，没有月俸，灵石要拿命换。你替商队押过镖，进妖兽山脉采过药，也跟人在黑市上抢过同一件货。',
      '三年下来，你学会了散修的第一课——天大地大，活着最大。第二课是：散修的信义，比宗门弟子的剑还快，说翻脸就翻脸。',
      '这天，黑风峡传出消息：有古修士洞府出世。'
    ],
    choices: [
      {
        text: '去黑风峡，凑这场热闹（岁月+1，搏命）',
        fx: s => { s.age += 1; s.shouyuan -= 1; },
        next: 'blackwind'
      },
      {
        text: '不去。命只有一条，接几单安稳的镖（修为+6，心境+4，岁月+3）',
        fx: s => { s.xiuwei += 6; s.xinjing += 4; s.age += 3; s.shouyuan -= 3; },
        next: 'qi_peak'
      }
    ]
  },

  blackwind: {
    chapter: '第一章 · 炼气',
    title: '黑风峡夺宝',
    text: [
      '黑风峡里乌泱泱挤了上百散修。洞府禁制破开的瞬间，人潮像决了堤。你被人流裹着冲进内府，眼前石台上供着一只玉盒。',
      '你的手刚碰到玉盒，一柄淬毒短刀就从斜刺里递了过来。是同你喝过三天酒的"赵兄"。',
      '"对不住了，兄弟。"他狞笑。'
    ],
    choices: [
      {
        text: '玉盒让给他，保命要紧（心境+6，得活命）',
        fx: s => { s.xinjing += 6; s.flags.karma = (s.flags.karma || 0) + 1; },
        next: s => s.flags.za ? 'blackwind_gift' : 'qi_peak'
      },
      {
        text: '以伤换命，死死抓住玉盒（修为+12，心境−8，寿元−2）',
        fx: s => { s.xiuwei += 12; s.xinjing -= 8; s.shouyuan -= 2; s.flags.grudge = true; s.flags.zhao = true; },
        next: 'qi_peak'
      },
      {
        text: '示警附近的散修："禁制有诈！"（心境+10，善缘+1）',
        fx: s => { s.xinjing += 10; s.flags.karma = (s.flags.karma || 0) + 1; s.flags.ming = true; },
        next: 'qi_peak'
      }
    ]
  },

  blackwind_gift: {
    chapter: '第一章 · 炼气',
    title: '峡谷深处',
    text: [
      '你退开三步，赵兄抓盒的刹那，脚下禁制轰然炸开——石台本就是陷阱。烟尘里，一位独臂老散修从暗处走出，把一枚真正的储物戒指抛给你。',
      '"能舍才能得。那玉盒是饵，这戒指才是真的传承。"老散修笑了笑，"老朽「独臂翁」，记住你了。"',
      '戒指里有一百灵石、一瓶养气丹，还有一张残缺的古地图。'
    ],
    choices: [
      {
        text: '收下传承，记此人情（修为+10，心境+8）',
        fx: s => { s.xiuwei += 10; s.xinjing += 8; s.flags.karma = (s.flags.karma || 0) + 1; s.flags.map = true; },
        next: 'qi_peak'
      }
    ]
  },

  devil_early: {
    chapter: '第一章 · 炼气',
    title: '鬼市沉浮',
    text: [
      '西荒鬼市，白日如夜。坊市里卖什么的都有：来路不明的法器、活人炼的丹、还有"炉鼎"。你的引荐人枯脸老妪只教了你一件事：在鬼市，善意比灵石贵。',
      '你替鬼市跑腿、销赃、护送"货物"。修为涨得飞快——因为不干就死。第三个月，老妪让你押送一口黑漆棺材去阴煞谷，酬劳是一块中品灵石。',
      '棺材里是什么，你没问。但路上，棺材板响了三声。'
    ],
    choices: [
      {
        text: '不管，押到便是（修为+10，心境−6）',
        fx: s => { s.xiuwei += 10; s.xinjing -= 6; s.flags.devil_pull = (s.flags.devil_pull || 0) + 1; },
        next: 'coffin'
      },
      {
        text: '开棺查看（心境+6，或有变故）',
        fx: s => { s.xinjing += 6; },
        next: 'coffin_open'
      }
    ]
  },

  coffin: {
    chapter: '第一章 · 炼气',
    title: '阴煞谷',
    text: [
      '你照常押送。到了阴煞谷，收货的魔修掀开棺盖——里面是个昏迷的少女，根骨极佳，是抓去炼炉鼎的。',
      '你垂着眼，领了灵石，转身离开。走出三十里，背后的山谷隐约传来一声短促的哭喊，然后没了声息。',
      '那天夜里你喝了很多酒。修为涨了，道心上多了一道头发丝细的裂纹。'
    ],
    choices: [
      {
        text: '记住这一天（修为+6，心境−4）',
        fx: s => { s.xiuwei += 6; s.xinjing -= 4; s.flags.devil_pull = (s.flags.devil_pull || 0) + 1; },
        next: 'qi_peak'
      }
    ]
  },

  coffin_open: {
    chapter: '第一章 · 炼气',
    title: '开棺',
    text: [
      '你撬开棺钉。里面是个面如金纸的少女，手腕上锁着禁灵环——炉鼎。她睁开眼，第一句话是："别送我去阴煞谷，我爹是丹霞谷的炼器师，他会报答你。"',
      '放了她，得罪整个鬼市；押过去，你这辈子忘不掉这双眼睛。'
    ],
    choices: [
      {
        text: '放她走，烧了棺材（心境+12，鬼市通缉）',
        fx: s => { s.xinjing += 12; s.flags.karma = (s.flags.karma || 0) + 2; s.flags.saved_girl = true; s.flags.devil_pull = Math.max(0, (s.flags.devil_pull || 0) - 1); },
        next: 'qi_peak'
      },
      {
        text: '押去阴煞谷，但暗中记下路线，日后报官（修为+8，心境−6）',
        fx: s => { s.xiuwei += 8; s.xinjing -= 6; s.flags.devil_pull = (s.flags.devil_pull || 0) + 1; },
        next: 'qi_peak'
      }
    ]
  },

  qi_peak: {
    chapter: '第一章 · 炼气',
    title: '炼气圆满',
    text: [
      '多年打磨，你的修为终于抵达炼气十三层圆满。灵气在丹田里积成一片小湖，湖心隐隐有光。',
      '下一步，是筑基。筑基丹、闭关地、护法之人，缺一不可。散修与宗门弟子，各有各的难处，但难关是一样的——十炼气，三筑基。剩下七个，死在这道坎上。'
    ],
    choices: [
      {
        text: '闭关，冲击筑基',
        fx: s => { s.realm = '筑基'; s.shouyuan += 100; },
        next: s => (s.xinjing >= 30) ? 'foundation_ok' : 'foundation_devil'
      }
    ]
  },

  foundation_ok: {
    chapter: '第二章 · 筑基',
    title: '道基初成',
    text: [
      '四十九日闭关。第四十九天的黎明，丹田气湖轰然塌陷、凝实，化作一方青色道基。',
      '筑基成。寿元添一百二十岁，五感通明，可御剑百里。你推开洞府石门的那一刻，山风扑面，天地都不一样了。',
      s => s.flags.path === '宗门' ? '宗门执事亲自来贺，内门名册上添了你的名字。' : s.flags.path === '散修' ? '独臂翁听闻消息，托人送来一坛灵酒。' : '鬼市老妪笑了笑："没死？那以后做更大的买卖。"'
    ],
    choices: [
      { text: '筑基之后，路在脚下（岁月+2）', fx: s => { s.age += 2; s.shouyuan -= 2; }, next: 'foundation_road' }
    ]
  },

  foundation_devil: {
    chapter: '第二章 · 筑基',
    title: '心魔劫',
    text: [
      '闭关到第三十日，心魔来了。',
      '它化作你放牛时冻死的爹娘、化作秘境里垂死的碧鳞蛇、化作黑漆棺材里的少女。它在你耳边说：放下，都放下，斩了这些，道基自成。',
      '你的道心布满裂纹，但青阳子的玉佩在胸口微微发烫。'
    ],
    choices: [
      {
        text: '死守本心，熬过去（心境+8，寿元−3）',
        fx: s => { s.xinjing += 8; s.shouyuan -= 3; s.realm = '筑基'; s.shouyuan += 100; },
        next: 'foundation_road'
      },
      {
        text: '斩！把心魔连同情愫一起斩掉（修为+12，心境−15）',
        fx: s => { s.xiuwei += 12; s.xinjing -= 15; s.realm = '筑基'; s.shouyuan += 100; s.flags.devil_pull = (s.flags.devil_pull || 0) + 1; },
        next: 'foundation_road'
      }
    ]
  },

  foundation_road: {
    chapter: '第二章 · 筑基',
    title: '择一道',
    text: [
      '筑基之后，要在万千道法里择一条主修。丹道绵长，剑道锋锐，阵道渊深。此选择关乎结丹品相，也关乎你往后百年的活法。',
      '传功长老/老江湖们都说：选你"不舍得"的那一条。'
    ],
    choices: [
      {
        text: '丹道 · 以天地为炉（心境+8，修为+6）',
        fx: s => { s.flags.dao = '丹'; s.xinjing += 8; s.xiuwei += 6; },
        next: 'grudge_knock'
      },
      {
        text: '剑道 · 一剑破万法（修为+12，心境−3）',
        fx: s => { s.flags.dao = '剑'; s.xiuwei += 12; s.xinjing -= 3; },
        next: 'grudge_knock'
      },
      {
        text: '阵道 · 以静制动（心境+5，修为+8）',
        fx: s => { s.flags.dao = '阵'; s.xinjing += 5; s.xiuwei += 8; },
        next: 'grudge_knock'
      }
    ]
  },

  grudge_knock: {
    chapter: '第二章 · 筑基',
    title: '旧账',
    text: [
      '修行到中境，旧账总会找上门。',
      s => s.flags.zhao ? '黑风峡的"赵兄"如今拜入了血河门，他放话：当年夺宝之恨，要你拿命来偿。' :
           s.flags.grudge ? '当年秘境里那头铁背猿成了三阶大妖，屡屡出山伤人——也是你的旧怨。' :
           s.flags.devil_pull >= 2 ? '鬼市的对头打听到了你的来历，把你的名字挂上了悬赏碑。' :
           '你的进境引来一位同门/同行的嫉恨，处处给你下绊子。',
      '修行人说：因果因果，躲是躲不掉的。'
    ],
    choices: [
      {
        text: '登门了结，恩怨两清（修为+8，心境+6）',
        fx: s => { s.xiuwei += 8; s.xinjing += 6; s.flags.grudge_done = true; },
        next: 'core_forming'
      },
      {
        text: '忍一时风平浪静（心境−8，修为+4）',
        fx: s => { s.xinjing -= 8; s.xiuwei += 4; },
        next: 'core_forming'
      },
      {
        text: '以杀止杀，斩草除根（修为+14，心境−12）',
        fx: s => { s.xiuwei += 14; s.xinjing -= 12; s.flags.devil_pull = (s.flags.devil_pull || 0) + 1; },
        next: 'core_forming'
      }
    ]
  },

  core_forming: {
    chapter: '第三章 · 金丹',
    title: '结丹',
    text: [
      '道基打磨圆满，灵液满溢，是结丹的时候了。',
      '金丹分九品。有人说品阶天定，有人说事在人为。你盘膝坐进闭关地，引动周身灵气向丹田汇聚——',
      s => (s.flags.karma || 0) >= 2 ? '冥冥之中，你曾种下的善缘化作一缕暖流，护住了丹火。' : s.flags.devil_pull >= 2 ? '丹火深处隐约有黑气缠绕，那是你欠下的债。' : '丹火平稳，一切看你自己。'
    ],
    choices: [
      {
        text: '顺其自然，能结几品是几品（修为+20）',
        fx: s => { s.xiuwei += 20; },
        next: 'core_done'
      },
      {
        text: '强行冲上品金丹，风险自担（修为+40，心境−10，寿元−5）',
        can: s => s.xinjing >= 35,
        fx: s => { s.xiuwei += 40; s.xinjing -= 10; s.shouyuan -= 5; },
        next: 'core_done'
      },
      {
        text: '碎丹重修，不留瑕疵（心境+10，岁月+5，寿元−5）',
        can: s => s.xinjing >= 50,
        fx: s => { s.xinjing += 10; s.age += 5; s.shouyuan -= 5; s.xiuwei += 25; },
        next: 'core_done'
      }
    ]
  },

  core_done: {
    chapter: '第三章 · 金丹',
    title: '金丹真人',
    onEnter: s => { s.realm = '金丹'; s.shouyuan += 200; },
    text: [
      '丹田里，一枚金丹缓缓旋转，光华内蕴。金丹真人，放在任何一国都是能开宗立派的人物。',
      '你的名号开始传开。有人称你"真人"，有人来投效，有人重金求你出手，也有人开始算计你。',
      '金丹之后，修的不只是法，还有"局"。'
    ],
    choices: [
      { text: '开府立派，收徒传道（心境+10，岁月+8，寿元−8）', fx: s => { s.xinjing += 10; s.age += 8; s.shouyuan -= 8; s.flags.sect_master = true; }, next: 'dao_heart' },
      { text: '云游四方，寻上古遗府（修为+25，岁月+6，寿元−6）', fx: s => { s.xiuwei += 25; s.age += 6; s.shouyuan -= 6; }, next: 'dao_heart' },
      { text: '闭关潜修，不问外事（修为+35，心境−8，岁月+10，寿元−10）', fx: s => { s.xiuwei += 35; s.xinjing -= 8; s.age += 10; s.shouyuan -= 10; }, next: 'dao_heart' }
    ]
  },

  dao_heart: {
    chapter: '第三章 · 金丹',
    title: '问道于情',
    text: [
      '这一夜你喝了酒，想起的人很多：冻死的爹娘、散道的老道、峡谷里的独臂翁、棺材里的少女。',
      '还有一个人——' + '这些年来始终站在你身侧的人。也许是同门的师姐，也许是鬼市上递给你一碗热汤的老妪的孙女，也许只是山下茶棚里替你收过尸的凡人姑娘。',
      '金丹修士寿五百，凡人不过百年。修仙界有句话：问世间情为何物，直教生死相许——然后双双道途尽毁。',
      '你握着酒杯，直到天亮。'
    ],
    choices: [
      {
        text: '结为道侣，不负此情（心境+15，因果+1，"情"之牵绊）',
        fx: s => { s.xinjing += 15; s.flags.karma = (s.flags.karma || 0) + 1; s.flags.love = '道侣'; },
        next: 'great_war'
      },
      {
        text: '送她一世富贵，仙凡两别（心境+5）',
        fx: s => { s.xinjing += 5; s.flags.love = '别'; },
        next: 'great_war'
      },
      {
        text: '大道无情，斩断红尘（修为+20，心境−15）',
        fx: s => { s.xiuwei += 20; s.xinjing -= 15; s.flags.love = '斩'; s.flags.devil_pull = (s.flags.devil_pull || 0) + 1; },
        next: 'great_war'
      }
    ]
  },

  great_war: {
    chapter: '第四章 ·元婴',
    title: '正魔大战',
    text: [
      '大荒历三千八百零三年，正魔两道积蓄百年的仇怨终于炸开。血河门联同西荒鬼市，举兵东进；青云宗广发英雄帖，召集天下修士共赴天断山。',
      '战线绵延千里，金丹修士也只是大一点的卒子。你站在天断山的营帐前，看着南方烧红半边天的火光。',
      '传讯玉简里传来命令：明日寅时，先锋营突袭魔修粮道。那是九死一生的差事。'
    ],
    choices: [
      {
        text: '领命，做这先锋（修为+40，心境−10，寿元−8）',
        fx: s => { s.xiuwei += 40; s.xinjing -= 10; s.shouyuan -= 8; s.flags.war_hero = true; },
        next: 'war_after'
      },
      {
        text: '镇守后方，救伤护民（心境+15，岁月+4，寿元−4）',
        fx: s => { s.xinjing += 15; s.age += 4; s.shouyuan -= 4; s.flags.karma = (s.flags.karma || 0) + 1; },
        next: 'war_after'
      },
      {
        text: '两不相帮，远遁海外（心境+8，修为−10，岁月+6，寿元−6）',
        fx: s => { s.xinjing += 8; s.xiuwei = Math.max(0, s.xiuwei - 10); s.age += 6; s.shouyuan -= 6; s.flags.exile = true; },
        next: 'war_after'
      }
    ]
  },

  war_after: {
    chapter: '第四章 · 元婴',
    title: '战火之后',
    text: [
      '大战打了七年。天断山塌了半截，正魔两道各自元气大伤，倒是凡间遭了殃——三十六座城池化为焦土。',
      '你从尸山血海里走出来，道袍上的血渍洗不掉，只能用丹火一点点炼去。同行的老兵说：别看咱们活下来了，其实每个人都已经死在里头一次了。',
      '夜里结婴的契机，就在这片焦土上，悄然降临。'
    ],
    choices: [
      {
        text: '以杀证道，凝婴（修为+50，心境−15）',
        fx: s => { s.xiuwei += 50; s.xinjing -= 15; s.realm = '元婴'; s.shouyuan += 400; s.flags.devil_pull = (s.flags.devil_pull || 0) + 1; },
        next: 'nascent_done'
      },
      {
        text: '以生证道，于焦土上播种（心境+20，修为+30，"生"之印记）',
        fx: s => { s.xinjing += 20; s.xiuwei += 30; s.realm = '元婴'; s.shouyuan += 400; s.flags.karma = (s.flags.karma || 0) + 1; s.flags.life_dao = true; },
        next: 'nascent_done'
      },
      {
        text: '以忘证道，把战争忘掉（修为+40，心境+5，岁月+3，寿元−3）',
        fx: s => { s.xiuwei += 40; s.xinjing += 5; s.age += 3; s.shouyuan -= 3; s.realm = '元婴'; s.shouyuan += 400; },
        next: 'nascent_done'
      }
    ]
  },

  nascent_done: {
    chapter: '第四章 · 元婴',
    title: '元婴老祖',
    text: [
      '元婴成。紫府之中，一个眉眼与你一般无二的小人盘膝而坐，呼吸之间灵气如潮。',
      '元婴老祖，寿八百，一怒可倾一城。你的名字从此写进了修行界的史册，小辈们谈起你，要称一声"老祖"。',
      '但你夜里开始做梦。梦见青阳子问你：何为长生？你答不上来。',
      '化神之境，近在眼前，却又像隔着一整条来路。'
    ],
    choices: [
      { text: '叩问本心，冲击化神', next: 'spirit_ask' }
    ]
  },

  spirit_ask: {
    chapter: '第五章 · 化神',
    title: '化神三问',
    onEnter: s => { s.realm = '化神'; s.shouyuan += 800; },
    text: [
      '化神无雷劫，只有三问。问仙、问人、问自己。',
      '你坐在闭死关的石室里，第一问落下时，整个修行界都安静了：',
      '"你修的是仙，还是"不死"？"',
      s => s.flags.love === '道侣' ? '石室之外，你的道侣已白发苍苍，仍每日在门外坐一个时辰。' :
           s.flags.love === '斩' ? '石室之外空无一物。你斩掉的红尘，干干净净。' :
           '石室之外，只剩山风。',
      '第二问："若长生要忘尽来路，你忘是不忘？"'
    ],
    choices: [
      {
        text: '不忘。爹娘的馍、老道的功法、她/他的汤，一样都不许忘。（心境+20，修为+30）',
        fx: s => { s.xinjing += 20; s.xiuwei += 30; s.flags.remember = true; },
        next: 'tribulation'
      },
      {
        text: '该忘的，忘了才走得远。（修为+60，心境−20）',
        fx: s => { s.xiuwei += 60; s.xinjing -= 20; s.flags.devil_pull = (s.flags.devil_pull || 0) + 1; },
        next: 'tribulation'
      },
      {
        text: '长生本就是逆天之魔道，何须作答。（修为+80，心境−30，堕入魔道）',
        can: s => (s.flags.devil_pull || 0) >= 2 || s.xinjing <= 20,
        fx: s => { s.xiuwei += 80; s.xinjing -= 30; s.flags.devil = true; },
        next: 'tribulation'
      }
    ]
  },

  tribulation: {
    chapter: '终章 · 渡劫',
    title: '九九天劫',
    text: [
      '化神圆满的那一日，天色变了。',
      '九重雷云在北海上空聚成漩涡，紫黑色的雷龙在云里游动，锁定的是你。整个修行界的大能都远远看着——有人盼你死，有人盼你成。',
      s => s.flags.devil ? '你周身黑气缭绕，魔道功法尽数展开。雷云之中，隐隐传来天道的怒意。' : '你周身清气流转，一甲子修行化作一道光柱，直插云霄。',
      '第一道天雷，落下来了。'
    ],
    choices: [
      {
        text: '迎上去。',
        next: s => {
          if (s.flags.devil) return 'end_devil';
          if (s.shouyuan <= 0) return 'end_shouyuan';
          if (s.xinjing <= 0) return 'end_heartdevil';
          if (s.flags.remember && (s.flags.karma || 0) >= 2 && s.xinjing >= 55) return 'end_ascend';
          if (s.flags.remember && s.flags.love === '道侣') return 'end_pair';
          if (s.xiuwei >= 300 && s.xinjing >= 40) return 'end_earthly';
          return 'end_earthly';
        }
      }
    ]
  },

  /* ---------------- 结局 ---------------- */

  end_ascend: {
    chapter: '终章 · 渡劫',
    title: '飞升',
    ending: '仙',
    text: [
      '九九八十一道天雷，你一道一道接了下来。道袍尽碎，道基崩了又合，合了又崩。',
      '第八十一道雷落下时，你没有挡。你张开手，想起青牛村的雪、山神庙的泥像、半个冻硬的馍。',
      '雷光穿身而过，没有伤你分毫。',
      '天门开。云上有人遥遥相迎。你回头望了一眼人间——这一眼，替所有被你记住的人看。',
      '长生不是不死，是不忘。你终于懂了。'
    ],
    choices: [ { text: '再入轮回，重来一次', restart: true } ]
  },

  end_pair: {
    chapter: '终章 · 渡劫',
    title: '散仙',
    ending: '缘',
    text: [
      '天雷落到第七十二道，你的心神终于出现了一丝裂痕。',
      '就在此时，山下传来一声熟悉的呼唤——道侣以百岁之身，燃尽修为，为你隔空渡来一缕心念。',
      '你接住那缕心念，也接住了最后九道雷。天门为你而开，但你摇了摇头。',
      '"我不上去了。"你说，"人间还有个人等我回去吃饭。"',
      '你散去半数修为，自封"散仙"，落回人间。史书上写你渡劫失败。只有她知道，你是天地间最自在的仙人。'
    ],
    choices: [ { text: '再入轮回，重来一次', restart: true } ]
  },

  end_earthly: {
    chapter: '终章 · 渡劫',
    title: '兵解',
    ending: '凡',
    text: [
      '第八十一道天雷落下之前，你算清了自己的斤两：差一线。',
      '差一线，就是差一世。你不怨天，也不硬撑，大笑着散去一身修为护住神魂，任雷光将肉身兵解。',
      '一缕残魂投入凡间。多年后，青牛村有个放牛的孩子，梦见一位老道问他三个问题……',
      '故事没有结束。故事从来没有结束。'
    ],
    choices: [ { text: '再入轮回，重来一次', restart: true } ]
  },

  end_devil: {
    chapter: '终章 · 渡劫',
    title: '魔',
    ending: '魔',
    text: [
      '你不是在渡劫，你是在弑天。',
      '魔功展开，北海之水倒灌三千丈。九九雷劫被你一口一口吞了下去，天道的怒意化作你修为的薪柴。',
      '雷云散尽时，你站在尸气与灵光交织的漩涡中心，周身十万冤魂啼哭。修行界给你起了新的名号：吞天真魔。',
      '你得到了长生。只是往后的每一个夜里，那口黑漆棺材，都会在你的梦里响上三声。',
      '这，也是长生。'
    ],
    choices: [ { text: '再入轮回，重来一次', restart: true } ]
  },

  end_shouyuan: {
    chapter: '终章 · 渡劫',
    title: '坐化',
    ending: '寿',
    text: [
      '雷云压顶，你抬手欲迎，忽然一阵从未有过的疲惫漫过四肢百骸。',
      '寿元，尽了。',
      '原来修行路上最锋利的刀，从来不是天劫，是时间。化神大能坐化于渡劫之前，史书也不过记了一笔"灯枯油尽"。',
      '你盘膝坐下，望着头顶的雷云笑了笑，像很多年前望着山神庙的雪。',
      '"老道，"你说，"我来问你第三个问题了。"'
    ],
    choices: [ { text: '再入轮回，重来一次', restart: true } ]
  },

  end_heartdevil: {
    chapter: '终章 · 渡劫',
    title: '心魔',
    ending: '劫',
    text: [
      '第一道天雷还没落下，你的心魔先一步落了。',
      '它不再化作爹娘、化作碧鳞蛇——它化作你自己。另一个"你"从影子里站起来，满身黑气，笑得温柔：',
      '"辛苦了。接下来，换我活。"',
      '你试图反抗，却发现自己早已把反抗的力气，在漫长的岁月一件件典当干净了。',
      '吞天真魔自此出世。而你的最后一缕清明，被永远封在雷云之上，看着"自己"走进人间。'
    ],
    choices: [ { text: '再入轮回，重来一次', restart: true } ]
  }

};
