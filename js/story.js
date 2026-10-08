/* ============================================================
 * 《问道长生》剧情数据 v3
 * 网文笔法重写：对话密集、节奏明快、名场面拉满
 * 节点结构：
 *   id:      唯一标识
 *   chapter: 章节名（可选）
 *   title:   场景标题
 *   portrait: 立绘路径（可选）  npc: 立绘下的人名（可选）
 *   text:    段落数组（可为函数，运行时求值）
 *   onEnter: (s) => {} 进入节点时的钩子
 *   choices: [{ text, show(s), can(s), fx(s), next: 'id'|fn(s), restart }]
 *   ending: '仙'|'缘'|... 若为结局节点
 * ============================================================ */

/* ---------- NPC 好感度 ---------- */
const NPCS = {
  duBiWeng: { name: '独臂翁',   desc: '黑风峡的独臂老散修，嘴毒心热，来历成谜', portrait: 'assets/portraits/dubiweng.jpg' },
  yunShu:   { name: '云姝',     desc: '青云宗内门师姐，剑法冠绝同代，冷得像月', portrait: 'assets/portraits/yunshu.jpg' },
  qingLing: { name: '青翎',     desc: '秘境中救下的碧鳞小蛇，金瞳灵性渐开', portrait: 'assets/portraits/qingling.jpg' },
  laoYu:    { name: '鬼市老妪', desc: '西荒鬼市的引荐人，善恶难辨，只认买卖', portrait: 'assets/portraits/laoyu.jpg' },
  acha:     { name: '阿茶',     desc: '青山镇茶棚的少女，一碗热汤面暖了半条仙路', portrait: 'assets/portraits/acha.jpg' },
  daoLv:    { name: '道侣',     desc: '红尘之中，始终站在你身侧的人', portrait: 'assets/portraits/acha.jpg' }
};

function like(s, npc, n) {
  if (!s.aff) s.aff = {};
  s.aff[npc] = Math.max(-50, Math.min(100, (s.aff[npc] || 0) + n));
}

const AFF_LEVELS = [[80, '生死之交'], [60, '挚友'], [40, '熟识'], [20, '相识'], [-999, '陌路']];
function affLevel(v) {
  v = v || 0;
  for (const [min, name] of AFF_LEVELS) if (v >= min) return name;
  return '陌路';
}

/* ---------- 境界突破成功率 ---------- */
function breakthroughChance(s, base) {
  let c = base + s.xinjing / 250 + s.xiuwei / 400;
  if (s.flags.root === '天灵根') c += 0.12;
  if (s.flags.root === '杂灵根') c -= 0.06;
  return Math.min(0.95, c);
}

/* 心上人名字（用于自适应文本） */
function beloved(s) {
  if (s.flags.loveWho === 'yunshu') return '云姝';
  if (s.flags.loveWho === 'acha') return '阿茶';
  return '那个人';
}

const STORY = {

  /* ---------------- 序章 ---------------- */

  start: {
    chapter: '序章',
    title: '山神庙的雪夜',
    portrait: 'assets/portraits/qingyangzi.jpg',
    npc: '青阳子 · 残魂',
    onEnter: s => {
      let bonus = 0;
      try {
        const meta = JSON.parse(localStorage.getItem('wendao_meta') || '{}');
        bonus = Object.keys(meta.endings || {}).length;
      } catch (e) {}
      if (bonus > 0) {
        s.flags.yinji = bonus;
        s.xiuwei += bonus * 3;
        s.xinjing = Math.min(100, s.xinjing + bonus * 2);
      }
    },
    text: [
      '大荒历三千七百二十一年，冬，青州青牛村。',
      '你叫陈牛。爹娘死得早，给村里张财主放了十二年牛，全身上下最值钱的东西，是怀里半个冻硬的馍。',
      '这夜大雪封山，你缩在村口破山神庙里烤火。睡到半夜，忽然觉得有人盯着你。',
      '你睁开眼——供桌上那尊缺了半边脸的泥塑山神，正垂着眼看你。',
      '"醒了？"泥像开口，声音像隔着一口钟，"莫怕。老道青阳子，三百年前在这山里渡劫，没渡过去，剩一缕残魂附在这泥胎里，一睡就是三百年。"',
      '"三百年，你是头一个雪夜里给老道烧火的人。"泥像笑了笑，泥塑的嘴角簌簌掉渣，"坐化之前，老道想问你三个问题。你答什么，老道便给你留什么。"',
      s => s.flags.yinji ? '冥冥之中，你带着 ' + s.flags.yinji + ' 道轮回印记转世而来。前尘旧事如烟，唯有道心上的刻痕，岁岁不灭。' : '庙外的雪，不知什么时候停了。'
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
        text: '不问，伏地叩首："请仙长赐我一条活路。"',
        fx: s => { s.flags.asked = '叩首'; s.xinjing += 6; },
        next: 'root'
      }
    ]
  },

  root: {
    chapter: '序章',
    title: '灵根',
    onEnter: s => {
      if (!s.flags.root) {
        const roll = Math.random();
        if (roll < 0.18)      { s.flags.root = '天灵根'; s.xiuwei += 12; }
        else if (roll < 0.45) { s.flags.root = '雷灵根'; s.xiuwei += 7; s.xinjing += 4; s.flags.lei = true; }
        else                  { s.flags.root = '杂灵根'; s.xiuwei += 2; s.xinjing += 10; s.flags.za = true; }
      }
    },
    text: [
      '青阳子残魂并指一引，一缕灵气顺你眉心灌入，在经脉里横冲直撞游走周天，最后沉入丹田。',
      '"唔——"老道的虚影淡了几分，像是用尽了力气，"是块什么料，就看这一遭了。"',
      '灵气在你气海里翻腾，忽然某一刻，安静了下来——',
      s => s.flags.root === '天灵根' ? '一道纯青灵光自你天灵冲天而起，映得满庙生辉！单属性纯灵根，万中无一的天灵根！青阳子的残魂都晃了三晃，半晌才笑出声："好，好，好啊！天不绝老道这一脉！"'
        : s.flags.root === '雷灵根' ? '你的指尖"噼啪"窜起一簇紫电，细小的雷蛇绕着指节游走。变异雷灵根——攻伐无双，世所罕见。青阳子眯起眼："雷灵根是柄快刀。可惜啊，刀快，也容易伤着自己。"'
        : '灵气散了又聚，聚了又散，五色混杂，不成章法。五行杂灵根。修仙界管这个叫——废灵根。庙里安静了很久，青阳子才缓缓开口："灵根差，不代表道差。想当年，有个叫韩……唉，不说了。"',
      '"从今日起，你就算踏上这条路了。"老道的声音低下去，"记住了，修仙界吃人，不吐骨头。别信天上掉馅饼，掉下来的多半是铁饼。"'
    ],
    choices: [
      {
        text: '立誓：大道朝天，我心为刃（心境+5）',
        fx: s => { s.xinjing += 5; },
        next: 'legacy'
      },
      {
        text: '立誓：宁可尸骨无存，也要问鼎长生（修为+5）',
        fx: s => { s.xiuwei += 5; },
        next: 'legacy'
      },
      {
        text: '立誓：仙道漫漫长，初心不可忘（心境+3，善缘+1）',
        fx: s => { s.xinjing += 3; s.flags.karma = (s.flags.karma || 0) + 1; },
        next: 'legacy'
      }
    ]
  },

  legacy: {
    chapter: '序章',
    title: '遗物',
    text: [
      '老道的虚影越来越淡，像一滴墨化在清水里。他推过来三样东西：半块温润的旧玉佩，一卷《引气诀》，和一句话。',
      '"玉佩里封着老道半式神通，抵死能护你一次心神。功法粗浅，但够你入门。"青阳子顿了顿，"最后这句话，你记好——"',
      '"长生不是不死，是不忘。"',
      '"去吧。"泥像缓缓闭上了眼，"庙外风雪大，把火带上。"',
      '你对着供桌磕了三个响头，把那半个冻馍留在了香案上，起身走进风雪里。',
      '很多年后你才明白：修仙界吃人，就是从这一步开始的。'
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
      '青云宗三年一度开山收徒，山门前的青石台阶从山脚排到云里。你挤在乌泱泱的人群里，听散修们唾沫横飞地讲修行界的规矩。',
      '拜宗门，按部就班，安全，也慢；做散修，刀口舔血，自由，也险。还有人压低了声音说：西荒鬼市里，魔修收徒不问出身——只要敢把命押上赌桌。',
      '三条路，三种死法，也三种活法。',
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
        text: '西荒鬼市 · 富贵险中求（修为+8，心境−8，老妪好感+5）',
        fx: s => { s.flags.path = '鬼市'; s.xiuwei += 8; s.xinjing -= 8; s.flags.devil_pull = 1; like(s, 'laoYu', 5); },
        next: 'devil_early'
      }
    ]
  },

  sect_early: {
    chapter: '第一章 · 炼气',
    title: '外门岁月',
    text: [
      '青云宗外门，八百弟子。你领了一身青布道袍、一柄铁剑、每月三枚灵石，被分到灵田七号岗。',
      '日子清苦得像山里的溪水。白天引气锄田，晚上在油灯下练剑，传功长老讲法时，八百人挤在广场上，呼出的白气连成一片云。',
      '第七年头上，三件事同时砸到你面前：内门大比开榜；后山上古秘境将启，只许炼气期入内；还有——外门一霸赵亢，盯上了你攒了三年的灵石。',
      '"陈牛！"赵亢带着两个跟班堵在田埂上，练气八层的灵压肆无忌惮地碾过来，"听说你攒了九枚灵石？交出来，哥哥罩你。"'
    ],
    choices: [
      {
        text: '忍。灵石给他，去争内门大比（心境−4，修为+10，岁月+5）',
        fx: s => { s.xinjing -= 4; s.xiuwei += 10; s.age += 5; s.shouyuan -= 5; s.flags.dabi = true; s.flags.zhaoKan = true; },
        next: 'sect_dabi'
      },
      {
        text: '忍什么忍，拔剑！（打他一顿，结怨赵家）',
        fx: s => { s.xiuwei += 6; s.flags.zhao = true; s.flags.zhaoKan = true; },
        next: 'sect_bully'
      },
      {
        text: '入后山秘境，搏一场造化（岁月+2，或机缘，或凶险）',
        fx: s => { s.age += 2; s.shouyuan -= 2; },
        next: s => (Math.random() < 0.55 || s.flags.za) ? 'secret_realm' : 'secret_hurt'
      },
      {
        text: '与云姝师姐一同巡山历练（岁月+3，好感度+）',
        fx: s => { s.age += 3; s.shouyuan -= 3; like(s, 'yunShu', 18); s.xiuwei += 5; s.flags.metYunShu = true; },
        next: 'sect_yunshu'
      }
    ]
  },

  sect_bully: {
    chapter: '第一章 · 炼气',
    title: '田埂之战',
    text: [
      '你拔剑的速度比脑子快。',
      '三招。赵亢被你一脚踹进灵田的泥水里，两颗门牙贡献给了大地。他的跟班撒腿就跑，边跑边喊"你完了"。',
      '当晚，外门执事把你拎去问话。你梗着脖子刚要认罚，巡夜的云姝师姐恰好经过，只淡淡说了一句："赵亢先动的手。我看见了。"',
      '执事的脸色变了三变，最后各打五十大板了事。赵亢从此见你就绕道，但那双阴冷的眼睛告诉你——这事没完。',
      '云姝走前多看了你一眼："剑法一般，胆子不小。大比上，别丢人。"'
    ],
    choices: [
      {
        text: '谢过师姐，闭关备战大比（修为+8，岁月+4）',
        fx: s => { s.xiuwei += 8; s.age += 4; s.shouyuan -= 4; s.flags.dabi = true; like(s, 'yunShu', 10); },
        next: 'sect_dabi'
      },
      {
        text: '不争大比了，进后山秘境（岁月+2）',
        fx: s => { s.age += 2; s.shouyuan -= 2; },
        next: s => (Math.random() < 0.55 || s.flags.za) ? 'secret_realm' : 'secret_hurt'
      }
    ]
  },

  sect_dabi: {
    chapter: '第一章 · 炼气',
    title: '内门大比',
    text: [
      '内门大比，炼气期弟子乱斗取前十。你在擂台上连过三轮，第四轮撞上了赵家请来的外援——一个练气十二层的世家子弟。',
      '"五行杂灵根也配上台？"对方抱着剑，笑得居高临下，"跪下认输，留你全尸。"',
      '台下八百外门弟子鸦雀无声。你看见云姝站在远处的松树下，抱着剑，看不清表情。',
      '你握紧了剑。'
    ],
    choices: [
      {
        text: '战！以伤换伤，拼了！（或惨胜，或惜败）',
        fx: s => {},
        next: s => {
          if (Math.random() < 0.35 + Math.min(0.3, s.xiuwei / 300)) {
            s.xiuwei += 16; s.xinjing += 8; s.flags.dabiWin = true; like(s, 'yunShu', 18);
            return 'dabi_win';
          }
          s.xiuwei += 6; s.xinjing += 10; s.shouyuan -= 2;
          return 'dabi_lose';
        }
      },
      {
        text: '战略性认输，保存实力（心境+4，修为+6）',
        fx: s => { s.xinjing += 4; s.xiuwei += 6; },
        next: 'qi_peak'
      }
    ]
  },

  dabi_win: {
    chapter: '第一章 · 炼气',
    title: '一战成名',
    text: [
      '你赢的方式很难看——滚地、抱腿、以命换命——但你赢了。',
      '世家子弟被抬下去的时候，外门八百弟子炸了锅。有人喊你的名字，喊的是"灵田七号的陈牛"！',
      '云姝从松树下走过来，把一枚内门才有的养气丹抛给你："赢得难看。但赢了。"',
      '她转身走出三步，又停下："三年后，我等你进内门。"',
      '你捏着那枚丹药，在擂台上站了很久。少年人的血，比炉里的火还烫。'
    ],
    choices: [
      { text: '收下丹药，冲击炼气圆满（修为+8，岁月+2）', fx: s => { s.xiuwei += 8; s.age += 2; s.shouyuan -= 2; }, next: 'qi_peak' }
    ]
  },

  dabi_lose: {
    chapter: '第一章 · 炼气',
    title: '虽败犹荣',
    text: [
      '你输了，输在灵根，输在底蕴，输在人家从小泡药浴长大的经脉。',
      '但你硬是在对方剑下撑了七十招。第七十一招，你力竭跪地，剑还指着对方的小腿。',
      '"疯子。"世家子弟啐了一口，收剑下台。',
      '云姝不知何时站在台边："输在修为，没输在心。知道自己怎么输的，比赢一场值钱。"',
      '你躺在擂台上喘着气，望着天上的云，忽然没那么想哭了。'
    ],
    choices: [
      { text: '养好伤，冲击炼气圆满（修为+6，岁月+3）', fx: s => { s.xiuwei += 6; s.age += 3; s.shouyuan -= 3; }, next: 'qi_peak' }
    ]
  },

  sect_yunshu: {
    chapter: '第一章 · 炼气',
    title: '月下论剑',
    portrait: 'assets/portraits/yunshu.jpg',
    npc: '云姝',
    text: [
      '云姝是内门最出挑的师姐，练气期就悟出了剑意，人冷得像山巅的雪。外门弟子见了她都绕道走，你却被分到和她一队巡山。',
      '那日巡到后山，天降大雨，你们躲进同一座破山亭。她抱着剑看雨，你抱着剑看她。',
      '"看够了么？"她忽然开口。',
      '"没。"你老实回答，"师姐比雨好看。"',
      '亭子里安静了三息。她转过头来，眼神像剑锋出鞘三分："你灵根驳杂，凭什么修仙？"',
      '你想了想，答："凭我不服。"',
      '她愣了一下，忽然笑了。你后来才知道，全青云宗见过她笑的，不超过五个人。雨停时，她解下自己的剑穗，系在你的铁剑上。',
      '"大比之上，别给我丢人。"'
    ],
    choices: [
      { text: '收好剑穗，此生不负（岁月+2，心境+6，云姝好感+8）', fx: s => { s.age += 2; s.shouyuan -= 2; s.xinjing += 6; like(s, 'yunShu', 8); }, next: 'qi_peak' }
    ]
  },

  secret_realm: {
    chapter: '第一章 · 炼气',
    title: '后山秘境',
    text: [
      '秘境里灵气浓得像化不开的酒。你在断壁残垣里摸了三天，衣服刮成布条，终于在塌了半边的丹房前停住脚——',
      '一株三百年份的紫芝，在瓦砾里安安静静地发着光。芝旁盘着一条小蛇，通体碧鳞，金瞳半阖，眼看就要断气。',
      '它抬眼看你。那眼神你熟——你放牛那些年，见过被狼咬断腿的鹿，就是这么看你的。',
      '紫芝能助你修为大涨。可这小蛇守着它，分明也是在等它救命。'
    ],
    choices: [
      {
        text: '采下紫芝，畜生罢了（修为+15，因果−1）',
        fx: s => { s.xiuwei += 15; s.flags.karma = (s.flags.karma || 0) - 1; },
        next: 'qi_peak'
      },
      {
        text: '留下紫芝，割一半喂它（心境+12，善缘+1，青翎好感+25）',
        fx: s => { s.xinjing += 12; s.flags.karma = (s.flags.karma || 0) + 1; s.flags.qingLing = true; like(s, 'qingLing', 25); },
        next: 'qi_peak'
      },
      {
        text: '采一半，留一半（修为+7，心境+4，青翎好感+5）',
        fx: s => { s.xiuwei += 7; s.xinjing += 4; like(s, 'qingLing', 5); },
        next: 'qi_peak'
      }
    ]
  },

  secret_hurt: {
    chapter: '第一章 · 炼气',
    title: '秘境遇险',
    text: [
      '你撞上了一头二阶铁背猿。护身符箓当场碎了三张，断了两根肋骨，你从秘境里爬出来的样子，比要饭的还惨。',
      '宗门不管。秘境历来生死自负。同屋的老弟子嗑着瓜子说：修仙路上，命是最不值钱的东西，趁早习惯。',
      '你躺在床板上看着房梁，疼得睡不着，想了很多。',
      '——这口气，你是咽下去，还是记下来？'
    ],
    choices: [
      {
        text: '记下来。此仇他日百倍奉还（修为+8，心境−6）',
        fx: s => { s.xiuwei += 8; s.xinjing -= 6; s.flags.grudge = true; },
        next: 'qi_peak'
      },
      {
        text: '生死有命，认栽，但路还得走（心境+8，修为+4）',
        fx: s => { s.xinjing += 8; s.xiuwei += 4; },
        next: 'qi_peak'
      }
    ]
  },

  rogue_early: {
    chapter: '第一章 · 炼气',
    title: '江湖散修',
    text: [
      '散修的日子是另一副模样：没有灵田，没有月俸，灵石得拿命换。你替商队押过镖，进妖兽山脉采过药，也在黑市上跟人抢过同一件货。',
      '三年下来你懂了散修的两课：第一课，天大地大，活着最大；第二课，散修的信义比宗门弟子的剑还快——说翻脸就翻脸。',
      '这日你押镖路过青山镇，天上下起了冻雨。山脚茶棚里，一个系着头巾的姑娘冲你招手："客官！喝碗热汤再赶路！"',
      '她叫阿茶。一碗汤面两个铜板，她给你卧了两个蛋，没收钱。',
      '"看你冻得，蛋是送的。"她笑起来眼睛弯成月牙，"出门在外，谁还没个难处。"'
    ],
    choices: [
      {
        text: '在茶棚帮工几日再上路（岁月+3，阿茶好感+25，心境+8）',
        fx: s => { s.age += 3; s.shouyuan -= 3; like(s, 'acha', 25); s.xinjing += 8; s.flags.metAcha = true; },
        next: 'acha_first'
      },
      {
        text: '谢过她，继续赶路（阿茶好感+8）',
        fx: s => { like(s, 'acha', 8); s.flags.metAcha = true; },
        next: 'qi_peak'
      },
      {
        text: '听说黑风峡有古修士洞府出世，去凑个热闹（岁月+1，搏命）',
        fx: s => { s.age += 1; s.shouyuan -= 1; },
        next: 'blackwind'
      }
    ]
  },

  acha_first: {
    chapter: '第一章 · 炼气',
    title: '青山茶棚',
    portrait: 'assets/portraits/acha.jpg',
    npc: '阿茶',
    text: [
      '你在茶棚帮了三日工。劈柴、挑水、记账，阿茶管你三顿饭，顿顿有蛋。',
      '第四日清晨，你要走了。阿茶往你包袱里塞了个布包，打开看，是六个煮鸡蛋，还热着。',
      '"听说你们这些仙人，一闭关就是几年。"她绞着衣角，不敢看你，"路过青山镇的时候，记得来喝碗汤。"',
      '你走出很远，回头看，她还站在茶棚门口，越来越小，最后变成一个墨点。',
      '你把鸡蛋吃完了，一个都没舍得扔。修仙路上头一回，你觉得心里有点沉，又有点暖。'
    ],
    choices: [
      { text: '把这份暖记在心里，继续赶路（岁月+2，心境+6）', fx: s => { s.age += 2; s.shouyuan -= 2; s.xinjing += 6; }, next: 'qi_peak' }
    ]
  },

  blackwind: {
    chapter: '第一章 · 炼气',
    title: '黑风峡夺宝',
    text: [
      '黑风峡里乌泱泱挤了上百散修。洞府禁制破开的一瞬间，人潮决堤。你被人流裹着冲进内府，眼前石台上供着一只玉盒。',
      '你的手刚碰到玉盒，一柄淬毒短刀贴着你的手腕递了过来。是同你喝过三天酒的"赵兄"。',
      '"对不住了，兄弟。"他狞笑，"修仙界嘛，人心隔肚皮，肚皮后面还隔着刀。"'
    ],
    choices: [
      {
        text: '玉盒让给他，保命要紧（心境+6，善缘+1）',
        fx: s => { s.xinjing += 6; s.flags.karma = (s.flags.karma || 0) + 1; },
        next: s => s.flags.za ? 'blackwind_gift' : 'qi_peak'
      },
      {
        text: '以伤换命，死死抓住玉盒（修为+12，心境−8，寿元−2）',
        fx: s => { s.xiuwei += 12; s.xinjing -= 8; s.shouyuan -= 2; s.flags.grudge = true; s.flags.zhao = true; },
        next: 'qi_peak'
      },
      {
        text: '示警四周："禁制有诈！"（心境+10，善缘+1）',
        fx: s => { s.xinjing += 10; s.flags.karma = (s.flags.karma || 0) + 1; s.flags.ming = true; },
        next: 'qi_peak'
      }
    ]
  },

  blackwind_gift: {
    chapter: '第一章 · 炼气',
    title: '峡谷深处',
    portrait: 'assets/portraits/dubiweng.jpg',
    npc: '独臂翁',
    text: [
      '你退开三步。赵兄抓住玉盒的刹那，脚下禁制轰然炸开——那石台，本就是个饵。',
      '烟尘里，一位独臂老散修踱步而出，把一枚真正的储物戒指抛给你。',
      '"能舍才能得。玉盒是钩，这戒指才是鱼。"老散修咧嘴一笑，缺了颗门牙，"老朽姓翁，江湖人称独臂翁。娃儿，你叫什么？"',
      '"陈牛。"',
      '"好名字，贱名好养活。"他哈哈大笑，"戒指里一百灵石、一瓶养气丹、一张破地图。别嫌少——老朽看人几十年，就送你一句话：这年头，好人死得快，傻好人死得更快，你得做个聪明的好人。"'
    ],
    choices: [
      {
        text: '收下传承，记此人情（修为+10，心境+8，独臂翁好感+25）',
        fx: s => { s.xiuwei += 10; s.xinjing += 8; s.flags.karma = (s.flags.karma || 0) + 1; s.flags.map = true; like(s, 'duBiWeng', 25); },
        next: 'qi_peak'
      }
    ]
  },

  devil_early: {
    chapter: '第一章 · 炼气',
    title: '鬼市沉浮',
    portrait: 'assets/portraits/laoyu.jpg',
    npc: '鬼市老妪',
    text: [
      '西荒鬼市，白日如夜。坊市里卖什么的都有：来路不明的法器、活人炼的丹、还有明码标价的"炉鼎"。',
      '你的引荐人枯脸老妪只教了你一件事："在鬼市，善意比灵石贵。灵石没了能再抢，善意露一次，命就没了。"',
      '你替鬼市跑腿、销赃、护送"货物"。修为涨得飞快——因为不干就死。第三个月，老妪让你押一口黑漆棺材去阴煞谷，酬劳是一块中品灵石。',
      '你接了。棺材里是什么，你没问。但押到半路，棺材板响了三声。',
      '"咚。咚。咚。"',
      '老妪的声音在耳边响起，人却不在："要么当没听见，要么打开。选了，就别后悔。"'
    ],
    choices: [
      {
        text: '不管，押到便是（修为+10，心境−6，老妪好感+10）',
        fx: s => { s.xiuwei += 10; s.xinjing -= 6; like(s, 'laoYu', 10); s.flags.devil_pull = (s.flags.devil_pull || 0) + 1; },
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
      '你照常押送。阴煞谷口，收货的魔修掀开棺盖——里面是个昏迷的少女，根骨极佳，是抓去炼炉鼎的。',
      '你垂着眼，领了灵石，转身离开。走出三十里，背后的山谷隐约传来一声短促的哭喊，然后，没了声息。',
      '那天夜里你一个人喝了很多酒。修为涨了，道心上多了一道头发丝细的裂纹。',
      '老妪不知何时坐在你对面，枯手给自己倒了碗酒："难受？难受就对了。在鬼市，难受是最没用的东西——要么咽下去，要么变得比它硬。"'
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
      '你撬开棺钉。里面是个面如金纸的少女，腕上锁着禁灵环——炉鼎。她睁开眼，第一句话是：',
      '"别送我去阴煞谷。我爹是丹霞谷的炼器师，他会报答你。"',
      '放了她，得罪整个鬼市；押过去，你这辈子忘不掉这双眼睛。',
      '你想起老妪的话：在鬼市，善意比灵石贵。'
    ],
    choices: [
      {
        text: '放她走，烧了棺材（心境+12，善缘+2，老妪好感−20）',
        fx: s => { s.xinjing += 12; s.flags.karma = (s.flags.karma || 0) + 2; s.flags.saved_girl = true; like(s, 'laoYu', -20); s.flags.devil_pull = Math.max(0, (s.flags.devil_pull || 0) - 1); },
        next: 'qi_peak'
      },
      {
        text: '押去阴煞谷，暗中记下路线（修为+8，心境−6，老妪好感+10）',
        fx: s => { s.xiuwei += 8; s.xinjing -= 6; like(s, 'laoYu', 10); s.flags.devil_pull = (s.flags.devil_pull || 0) + 1; },
        next: 'qi_peak'
      }
    ]
  },

  /* ---------------- 第二章 · 筑基（含失败机制） ---------------- */

  qi_peak: {
    chapter: '第二章 · 筑基',
    title: '炼气圆满',
    text: [
      '多年打磨，你的修为终于抵达炼气十三层圆满。灵气在丹田积成一片小湖，湖心有光。',
      '下一步，筑基。筑基丹、闭关地、护法之人，缺一不可。老话说：十炼气，三筑基——剩下七个，死在这道坎上。',
      '坊市里，赌坊甚至给筑基开了盘口。你站在闭关洞府前，听见自己心跳如鼓。',
      s => '老修行们都说：筑基如赌命。你这一局，胜算约莫 ' + Math.round(breakthroughChance(s, 0.45) * 100) + ' 成。'
    ],
    choices: [
      {
        text: '闭关，冲击筑基（成败在天）',
        fx: s => { s.flags.zhujiTries = (s.flags.zhujiTries || 0) + 1; },
        next: s => {
          const c = breakthroughChance(s, 0.45);
          if (Math.random() < c) {
            s.realm = '筑基'; s.shouyuan += 100;
            return s.xinjing >= 30 ? 'foundation_ok' : 'foundation_devil';
          }
          s.xiuwei = Math.max(0, s.xiuwei - 15); s.shouyuan -= 2;
          return 'foundation_fail';
        }
      }
    ]
  },

  foundation_fail: {
    chapter: '第二章 · 筑基',
    title: '走火入魔',
    text: [
      '闭关第四十日，异变陡生。',
      '丹田气湖翻涌如沸，灵气不受控地四处冲撞。你喷出一口黑血，硬生生从鬼门关前把自己拽了回来——',
      '筑基，失败了。',
      '经脉里像有烧红的铁丝在乱窜。但你还活着。道基未碎，就还有机会。',
      '洞府外不知是谁留下的半坛劣酒，你抱着坛子灌了两口，辣得直哆嗦，然后擦了擦嘴。',
      '再来。'
    ],
    choices: [
      {
        text: '不服，休整后再冲一次（修为−15已扣，寿元−2）',
        fx: s => {},
        next: 'qi_peak'
      },
      {
        text: '闭关调养三年，稳住道基再试（寿元−3，心境+6）',
        fx: s => { s.age += 3; s.shouyuan -= 3; s.xinjing += 6; },
        next: 'qi_peak'
      },
      {
        text: '捏碎青阳子的玉佩护住心神，强行再冲（寿元−5，本次成功率大增）',
        can: s => !s.flags.jadeUsed && s.flags.asked,
        fx: s => { s.flags.jadeUsed = true; s.flags.jadeBoost = true; s.shouyuan -= 5; },
        next: s => {
          const c = Math.min(0.95, breakthroughChance(s, 0.45) + 0.35);
          if (Math.random() < c) {
            s.realm = '筑基'; s.shouyuan += 100;
            return s.xinjing >= 30 ? 'foundation_ok' : 'foundation_devil';
          }
          s.xiuwei = Math.max(0, s.xiuwei - 15); s.shouyuan -= 2;
          return 'foundation_fail';
        }
      }
    ]
  },

  foundation_ok: {
    chapter: '第二章 · 筑基',
    title: '道基初成',
    text: [
      s => s.flags.zhujiTries > 1 ? '失败了多少次，只有丹田的伤痕记得。这一回，气湖轰然塌陷、凝实，化作一方青色道基——筑基，成了！' : '四十九日闭关。第四十九天的黎明，丹田气湖轰然塌陷、凝实，化作一方青色道基。',
      '筑基成！寿元添一百二十岁，五感通明，可御剑百里。你推开洞府石门的那一刻，山风扑面，天地都不一样了。',
      s => s.flags.path === '宗门' ? '宗门执事亲自来贺，内门名册添了你的名字。当年抢你灵石的赵亢，如今在人群里挤出个比哭还难看的笑。' : s.flags.path === '散修' ? '独臂翁听闻消息，托人送来一坛灵酒，附赠一句："筑基而已，值得骄傲，不值得停下脚步。"' : '鬼市老妪枯瘦的脸上难得有了点笑模样："没死？那以后做更大的买卖。"',
      s => (s.aff.duBiWeng || 0) >= 40 ? '酒坛底下压着一张字条：「筑基只是开始。黑风峡有桩大机缘，老朽给你留着。」' : ''
    ].filter(Boolean),
    choices: [
      { text: '筑基之后，路在脚下（岁月+2）', fx: s => { s.age += 2; s.shouyuan -= 2; }, next: 'foundation_road' }
    ]
  },

  foundation_devil: {
    chapter: '第二章 · 筑基',
    title: '心魔劫',
    text: [
      '闭关第三十日，心魔来了。',
      '它化作你放牛时冻死的爹娘，化作秘境里垂死的碧鳞蛇，化作黑漆棺材里的少女。它贴着你耳边，声音温柔得像摇篮曲：',
      '"放下，都放下。斩了这些累赘，道基自成。"',
      '你的道心布满裂纹。千钧一发之际，青阳子的玉佩在胸口微微发烫。'
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
      '筑基之后，要在万千道法里择一条主修。丹道绵长，剑道锋锐，阵道渊深——此选择关乎结丹品相，也关乎你往后百年的活法。',
      '传功长老捋着胡子说了句废话文学："选你舍不得的那一条。"',
      s => s.flags.metAcha ? '下山采买丹材的路上，你会路过青山镇。茶棚的旗子还插在老地方，被风吹得猎猎响。' : ''
    ].filter(Boolean),
    choices: [
      {
        text: '丹道 · 以天地为炉（心境+8，修为+6）',
        fx: s => { s.flags.dao = '丹'; s.xinjing += 8; s.xiuwei += 6; },
        next: s => s.flags.metAcha ? 'acha_reunion' : 'grudge_knock'
      },
      {
        text: '剑道 · 一剑破万法（修为+12，心境−3）',
        fx: s => { s.flags.dao = '剑'; s.xiuwei += 12; s.xinjing -= 3; },
        next: s => s.flags.metAcha ? 'acha_reunion' : 'grudge_knock'
      },
      {
        text: '阵道 · 以静制动（心境+5，修为+8）',
        fx: s => { s.flags.dao = '阵'; s.xinjing += 5; s.xiuwei += 8; },
        next: s => s.flags.metAcha ? 'acha_reunion' : 'grudge_knock'
      }
    ]
  },

  acha_reunion: {
    chapter: '第二章 · 筑基',
    title: '茶棚重逢',
    portrait: 'assets/portraits/acha.jpg',
    npc: '阿茶',
    text: [
      '青山镇，老茶棚。你推开吱呀作响的木门，风铃"叮"的一声。',
      '灶台后的姑娘猛地抬头，手里的汤勺当啷掉在锅里。',
      '"你回来啦！"她喊得很大声，随即耳根通红，低头去搅那锅永远搅不完的汤，"……我是说，客官，喝汤吗？"',
      '三年了。她的茶棚扩了一间，鬓角却还是老样子。你筑基有成，寿元一百八十四，容颜不老；她凡人寿数，青春就这么几年。',
      '她给你卧了两个蛋，没收钱——和三年前一样。',
      '你握着那碗热汤，忽然懂了什么叫仙凡有别。不是仙凡，是时间。你的时间还在往上走，她的时间在往下走。'
    ],
    choices: [
      {
        text: '送她一枚驻颜丹，把她安顿进宗门外坊（岁月+2，阿茶好感+30，善缘+1）',
        fx: s => { s.age += 2; s.shouyuan -= 2; like(s, 'acha', 30); s.flags.karma = (s.flags.karma || 0) + 1; s.flags.achaKept = true; },
        next: 'grudge_knock'
      },
      {
        text: '留一袋金银，不敢误她（阿茶好感+10，心境+5）',
        fx: s => { like(s, 'acha', 10); s.xinjing += 5; s.flags.achaPart = true; },
        next: 'grudge_knock'
      },
      {
        text: '远远看她一眼，不进茶棚（阿茶好感+15，心境−3）',
        fx: s => { like(s, 'acha', 15); s.xinjing -= 3; s.flags.achaFar = true; },
        next: 'grudge_knock'
      }
    ]
  },

  grudge_knock: {
    chapter: '第二章 · 筑基',
    title: '旧账',
    text: [
      '修行到中境，旧账总会找上门。',
      s => s.flags.zhao ? '黑风峡的"赵兄"拜入了血河门，如今筑基后期。他放话江湖：当年夺宝断指之恨，要你拿命来偿。' :
           s.flags.zhaoKan ? '外门恶霸赵亢的亲叔叔是内门管事，处处给你使绊子，扣你月俸、抢你丹房，恶心得理直气壮。' :
           s.flags.grudge ? '当年秘境里那头铁背猿成了三阶大妖，屡屡出山伤人——也是你的旧怨。' :
           s.flags.devil_pull >= 2 ? '鬼市的对头打听到你的来历，把你的名字挂上了悬赏碑，赏格五百灵石。' :
           '你的进境引来一位同门的嫉恨，处处给你下绊子。',
      '修行人说：因果因果，躲是躲不掉的。'
    ],
    choices: [
      {
        text: '登门了结，恩怨两清（修为+8，心境+6）',
        fx: s => { s.xiuwei += 8; s.xinjing += 6; s.flags.grudge_done = true; },
        next: 'core_forming'
      },
      {
        text: '请独臂翁出面调停（独臂翁好感≥40，心境+8，善缘+1）',
        show: s => (s.aff.duBiWeng || 0) >= 40,
        fx: s => { s.xinjing += 8; s.flags.karma = (s.flags.karma || 0) + 1; s.flags.grudge_done = true; like(s, 'duBiWeng', 10); },
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

  /* ---------------- 第三章 · 金丹（含失败机制） ---------------- */

  core_forming: {
    chapter: '第三章 · 金丹',
    title: '结丹',
    text: [
      '道基打磨圆满，灵液满溢，是结丹的时候了。',
      '金丹分九品。有人说品阶天定，有人说事在人为。你盘膝坐进闭关地，引动周身灵气向丹田汇聚——',
      s => (s.flags.karma || 0) >= 2 ? '冥冥之中，你曾种下的善缘化作一缕暖流，护住了丹火。' : s.flags.devil_pull >= 2 ? '丹火深处隐约有黑气缠绕，那是你欠下的债，连丹火都烧不净。' : '丹火平稳，一切看你自己。'
    ],
    choices: [
      {
        text: '顺其自然，水磨功夫，稳稳结丹（修为+20）',
        fx: s => { s.xiuwei += 20; },
        next: 'core_done'
      },
      {
        text: '强行冲上品金丹，风险自担（成功率约六成，失败则走火入魔）',
        can: s => s.xinjing >= 35,
        fx: s => {},
        next: s => {
          if (Math.random() < 0.6) { s.xiuwei += 40; s.xinjing -= 10; s.shouyuan -= 5; return 'core_done'; }
          s.xiuwei = Math.max(0, s.xiuwei - 25); s.xinjing -= 5; s.shouyuan -= 3;
          return 'core_fail';
        }
      },
      {
        text: '碎丹重修，不留瑕疵（心境+10，岁月+5，寿元−5）',
        can: s => s.xinjing >= 50,
        fx: s => { s.xinjing += 10; s.age += 5; s.shouyuan -= 5; s.xiuwei += 25; },
        next: 'core_done'
      }
    ]
  },

  core_fail: {
    chapter: '第三章 · 金丹',
    title: '丹碎',
    text: [
      '丹火暴走。',
      '眼看金丹将要凝成，一股浊气忽然从气海深处窜起。丹胚"咔"的一声裂开细纹，散了。',
      '你七窍渗血，在闭关地里瘫了整整十天。强行冲关的代价，比想象中更重。',
      '第十一天，你扶着墙站起来，给自己煮了锅粥。吃完粥，你想明白了一个道理：怕，就输一辈子。'
    ],
    choices: [
      {
        text: '养好伤，再结一次（心境+4，寿元−2）',
        fx: s => { s.shouyuan -= 2; s.xinjing += 4; },
        next: 'core_forming'
      },
      {
        text: '怕了。自此稳扎稳打，不再冒险（心境+8，修为+10）',
        fx: s => { s.xinjing += 8; s.xiuwei += 10; },
        next: 'core_done'
      }
    ]
  },

  core_done: {
    chapter: '第三章 · 金丹',
    title: '金丹真人',
    onEnter: s => {
      s.realm = '金丹'; s.shouyuan += 200;
      if (s.flags.qingLing) like(s, 'qingLing', 20);
    },
    text: [
      '丹田里，一枚金丹缓缓旋转，光华内蕴。金丹真人，放在任何一国都是能开宗立派的人物。',
      '你的名号开始传开。有人称你"真人"，有人来投效，有人重金求你出手，也有人开始算计你。',
      s => s.flags.qingLing ? '袖中一沉。青翎这些年吞了你不少丹药碎屑，如今已粗如儿臂，鳞片碧得发亮。它把脑袋搁在你腕上，金瞳半阖——这小家伙，快化形了。' : '',
      '金丹之后，修的不只是法，还有"局"。'
    ].filter(Boolean),
    choices: [
      { text: '开府立派，收徒传道（心境+10，岁月+8，寿元−8）', fx: s => { s.xinjing += 10; s.age += 8; s.shouyuan -= 8; s.flags.sect_master = true; }, next: 'auction' },
      { text: '赴华阳城拍卖会，见见世面（岁月+2）', fx: s => { s.age += 2; s.shouyuan -= 2; }, next: 'auction' },
      { text: '闭关潜修，不问外事（修为+35，心境−8，岁月+10，寿元−10）', fx: s => { s.xiuwei += 35; s.xinjing -= 8; s.age += 10; s.shouyuan -= 10; }, next: 'dao_heart' }
    ]
  },

  auction: {
    chapter: '第三章 · 金丹',
    title: '华阳城拍卖会',
    text: [
      '华阳城十年一度的大拍，三教九流齐聚一堂。你戴着斗笠坐在角落，看一件下品法器被炒出天价。',
      '压轴的，是一柄锈迹斑斑的断剑。拍卖师的介绍词很诚实："来历不明，灵性全无，但——坚不可摧。"',
      '全场哄笑。唯独你的储物袋里，那张独臂翁给的古地图微微发烫，地图上的标记点，正对着拍卖台上那柄断剑。',
      s => s.flags.zhao ? '更麻烦的是，斜对面的雅间里，血河门的赵师兄也盯上了这柄剑——不为剑，为的是当众踩你的脸。"陈牛？"他故意扬声，"杂灵根筑基的垃圾，也配进华阳城？"' : '你眯起眼。这剑，有古怪。'
    ],
    choices: [
      {
        text: '拍下断剑！（全额身家，独臂翁的机缘）',
        can: s => !s.flags.map,
        show: s => !s.flags.map,
        fx: s => { s.xiuwei += 15; s.xinjing += 5; s.flags.ancientSword = true; s.flags.karma = (s.flags.karma || 0) + 1; },
        next: 'auction_win'
      },
      {
        text: '出三百灵石，跟他争到底（赵兄在场时打响名号）',
        show: s => !!s.flags.zhao,
        fx: s => { s.xiuwei += 10; s.xinjing += 8; s.flags.faceSlap = true; s.flags.zhao = false; },
        next: 'auction_face'
      },
      {
        text: '冷眼旁观，静观其变（心境+4）',
        fx: s => { s.xinjing += 4; },
        next: 'dao_heart'
      }
    ]
  },

  auction_win: {
    chapter: '第三章 · 金丹',
    title: '无名断剑',
    text: [
      '你咬牙拍下断剑。全场看你的眼神，像看一个花冤枉钱的大冤种。',
      '当夜，古地图贴上剑身的刹那，断剑嗡鸣不止，锈迹寸寸剥落，露出底下一行小字：「剑可折，意不可折」。',
      '一股苍茫剑意顺着你的掌心涌入识海。你在识海里看见一个背对你的白衣剑修，仗剑立于山巅，一言不发，只留给你一道背影。',
      '你对着那背影，深深一揖。'
    ],
    choices: [
      { text: '悟了（修为+15，心境+10，岁月+3）', fx: s => { s.xiuwei += 15; s.xinjing += 10; s.age += 3; s.shouyuan -= 3; }, next: 'dao_heart' }
    ]
  },

  auction_face: {
    chapter: '第三章 · 金丹',
    title: '拍卖场打脸',
    text: [
      '"三百。"你举起号牌，不轻不重。',
      '"四百！"赵师兄冷笑。',
      '"四百零一。"你放下号牌，慢条斯理，"赵师兄财大气粗，跟就是了。"',
      '赵师兄的脸涨成了猪肝色。血河门给的底气撑到六百灵石，终于泄了。拍卖槌落下的瞬间，全场目光齐刷刷钉在你身上。',
      '有人低声问："那斗笠人是谁？"',
      '你收起断剑，路过赵师兄的雅间时停了半步："黑风峡一别，别来无恙。哦对了——你垫桌脚的剑，我收下了。"',
      '这一日之后，华阳城多了一段茶馆说书的热闹段子。'
    ],
    choices: [
      { text: '事了拂衣去（修为+10，心境+10，岁月+2）', fx: s => { s.xiuwei += 10; s.xinjing += 10; s.age += 2; s.shouyuan -= 2; }, next: 'dao_heart' }
    ]
  },

  dao_heart: {
    chapter: '第三章 · 金丹',
    title: '问道于情',
    text: [
      '这一夜你喝了酒，想起的人很多：冻死的爹娘、散道的老道、峡谷里的独臂翁、棺材里的少女。',
      s => (s.aff.yunShu || 0) >= 60 ? '还有一个人——云姝。这些年她始终站在你身侧，你的铁剑上还系着她当年解下的剑穗。前些日子她冲击金丹，闭关前给你留了句话："我若成了，内门长老就管不着我嫁谁了。"' :
           (s.flags.achaKept || (s.aff.acha || 0) >= 40) ? '还有一个人——阿茶。她在宗门外坊开了间小茶棚，每顿还是给你留两个蛋。凡人百年，金丹修士寿五百。这条鸿沟，你看得见，她也看得见。' :
           s.flags.path === '鬼市' ? '还有一个人——鬼市的老妪。她看你的时候，总像在看一件还没定价的货。可这些年，也只有她护过你。' :
           '还有一个人——这些年来始终站在你身侧的人。也许是同门的师姐，也许是山下茶棚里替你收过尸的凡人姑娘。',
      '金丹修士寿五百，凡人不过百年。修仙界有句话：问世间情为何物，直教生死相许——然后双双道途尽毁。',
      '你握着酒杯，直到天亮。'
    ],
    choices: [
      {
        text: '与云姝结为道侣（云姝好感≥60，心境+15，因果+1）',
        show: s => (s.aff.yunShu || 0) >= 60,
        fx: s => { s.xinjing += 15; s.flags.karma = (s.flags.karma || 0) + 1; s.flags.love = '道侣'; s.flags.loveWho = 'yunshu'; like(s, 'yunShu', 15); like(s, 'daoLv', 60); },
        next: 'great_war'
      },
      {
        text: '娶阿茶。仙凡殊途，我偏要渡（阿茶好感≥40，心境+15，因果+1）',
        show: s => (s.aff.acha || 0) >= 40 && (s.aff.yunShu || 0) < 60,
        fx: s => { s.xinjing += 15; s.flags.karma = (s.flags.karma || 0) + 1; s.flags.love = '道侣'; s.flags.loveWho = 'acha'; like(s, 'acha', 30); like(s, 'daoLv', 60); },
        next: 'great_war'
      },
      {
        text: '娶阿茶（心境+15，因果+1）',
        show: s => (s.aff.acha || 0) >= 40 && (s.aff.yunShu || 0) >= 60,
        fx: s => { s.xinjing += 15; s.flags.karma = (s.flags.karma || 0) + 1; s.flags.love = '道侣'; s.flags.loveWho = 'acha'; like(s, 'acha', 30); like(s, 'yunShu', -40); like(s, 'daoLv', 60); },
        next: 'great_war'
      },
      {
        text: '送她一世富贵，仙凡两别（心境+5）',
        fx: s => { s.xinjing += 5; s.flags.love = '别'; },
        next: 'great_war'
      },
      {
        text: '大道无情，斩断红尘（修为+20，心境−15）',
        fx: s => { s.xiuwei += 20; s.xinjing -= 15; s.flags.love = '斩'; s.flags.devil_pull = (s.flags.devil_pull || 0) + 1; like(s, 'daoLv', -30); like(s, 'yunShu', -30); like(s, 'acha', -30); },
        next: 'great_war'
      }
    ]
  },

  /* ---------------- 第四章 · 元婴 ---------------- */

  great_war: {
    chapter: '第四章 · 元婴',
    title: '正魔大战',
    text: [
      '大荒历三千八百零三年，正魔两道积蓄百年的仇怨终于炸开。血河门联同西荒鬼市举兵东进，青云宗广发英雄帖，召集天下修士共赴天断山。',
      '战线绵延千里，金丹修士也只是大一点的卒子。你站在天断山营帐前，看南方烧红半边天的火光，把夜空照得像一块烧透的铁。',
      '传讯玉简里传来军令：明日寅时，先锋营突袭魔修粮道——九死一生的差事。',
      s => s.flags.love === '道侣' ? beloved(s) + '在营帐里给你系紧披风，什么都没说。你走出十步，听见身后一句极轻的："回来吃饭。"' : ''
    ].filter(Boolean),
    choices: [
      {
        text: '领命，做这先锋（修为+40，心境−10，寿元−8）',
        fx: s => { s.xiuwei += 40; s.xinjing -= 10; s.shouyuan -= 8; s.flags.war_hero = true; },
        next: 'war_vanguard'
      },
      {
        text: '镇守后方，救伤护民（心境+15，岁月+4，寿元−4）',
        fx: s => { s.xinjing += 15; s.age += 4; s.shouyuan -= 4; s.flags.karma = (s.flags.karma || 0) + 1; if (s.flags.love === '道侣') like(s, 'daoLv', 10); },
        next: 'war_after'
      },
      {
        text: '两不相帮，远遁海外（心境+8，修为−10，岁月+6，寿元−6）',
        fx: s => { s.xinjing += 8; s.xiuwei = Math.max(0, s.xiuwei - 10); s.age += 6; s.shouyuan -= 6; s.flags.exile = true; },
        next: 'war_after'
      }
    ]
  },

  war_vanguard: {
    chapter: '第四章 · 元婴',
    title: '夜袭粮道',
    text: [
      '寅时，大雾。先锋营两百人摸进魔修粮道，前三十里顺利得反常。',
      '第三十一里，伏兵四起。血河门的血光大阵轰然合拢——中计了。',
      '你带着残部往外突，一名金丹魔修狞笑着自半空压下，掌心血雷吞吐："青云宗的小崽子，留下吧！"',
      '千钧一发之际，一声熟悉的笑骂从雾里炸响："以大欺小，要不要脸？"',
      s => (s.aff.duBiWeng || 0) >= 35 ? '独臂翁独臂持杖，硬生生替你接了那道血雷。雷光炸开的瞬间，他回头看了你一眼，还是那副缺颗门牙的笑："娃儿，老朽这条命，值你一声前辈。"' : '一支散修义军从侧翼杀到，为首的独臂老者独臂持杖，硬生生撕开了血光大阵的一道口子："娃儿们，走！"'
    ],
    choices: [
      {
        text: '杀出重围！（修为+20，心境−5）',
        fx: s => { s.xiuwei += 20; s.xinjing -= 5; },
        next: s => (s.aff.duBiWeng || 0) >= 35 ? 'war_sacrifice' : 'war_after'
      }
    ]
  },

  war_sacrifice: {
    chapter: '第四章 · 元婴',
    title: '断后',
    portrait: 'assets/portraits/dubiweng.jpg',
    npc: '独臂翁 · 最后一面',
    text: [
      '突围到最后一道山梁，魔修的主力追了上来。独臂翁忽然停下脚步，把酒葫芦抛给你。',
      '"老朽说过，做个聪明的好人。"他咧嘴一笑，缺颗门牙，"今天教你最后一句——有些仗，是用来打的；有些仗，是用来还的。"',
      '他转身，独臂张开，周身灵压节节攀升，攀升到不属于他这个境界的高度。',
      '"黑风峡的传承，不止那枚戒指。剑里那道背影，你迟早会懂。"',
      '"走——！"',
      '你被他一杖送出山梁，回头时，只看到半座山的光。那光里，有个独臂老人，笑得像个捡了糖的孩子。',
      '你抱着酒葫芦在雪地里跪了很久。葫芦里还剩半口酒，你留到了结婴那天。'
    ],
    choices: [
      {
        text: '记住这半口酒（心境+10，修为+20，岁月+4）',
        fx: s => { s.xinjing += 10; s.xiuwei += 20; s.age += 4; s.shouyuan -= 4; s.flags.duBiWengDead = true; s.flags.karma = (s.flags.karma || 0) + 1; },
        next: 'war_after'
      }
    ]
  },

  war_after: {
    chapter: '第四章 · 元婴',
    title: '战火之后',
    text: [
      '大战打了七年。天断山塌了半截，正魔两道各自元气大伤，倒是凡间遭了殃——三十六座城池化为焦土。',
      '你从尸山血海里走出来，道袍上的血渍洗不掉，只能用丹火一点点炼去。同行的老兵蹲在焦土上抽烟："别看咱们活下来了。其实每个人，都已经在里头死过一回啦。"',
      s => s.flags.duBiWengDead ? '你摸了摸腰间的酒葫芦。半口酒，还在。' : '',
      '夜里，结婴的契机，就在这片焦土上悄然降临。'
    ].filter(Boolean),
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
    onEnter: s => { if (s.flags.qingLing) like(s, 'qingLing', 25); if ((s.aff.yunShu || 0) > 0) like(s, 'yunShu', 10); },
    text: [
      '元婴成。紫府之中，一个眉眼与你一般无二的小人盘膝而坐，呼吸之间灵气如潮。',
      '元婴老祖，寿八百，一怒可倾一城。你的名字从此写进修行界的史册，小辈们谈起你，要恭恭敬敬称一声"老祖"。',
      s => s.flags.qingLing ? '青翎已化作丈许长，碧鳞如玉，金瞳开阖间隐有雷光。它把下巴搁在你膝上，像小时候一样——如果蛇也有小时候的话。' : '',
      '但你夜里开始做梦。梦见青阳子问你：何为长生？',
      '你答不上来。',
      '化神之境，近在眼前，又好像隔着一整条来路。'
    ].filter(Boolean),
    choices: [
      { text: '叩问本心，冲击化神', next: 'spirit_ask' }
    ]
  },

  /* ---------------- 第五章 · 化神 ---------------- */

  spirit_ask: {
    chapter: '第五章 · 化神',
    title: '化神三问',
    onEnter: s => { s.realm = '化神'; s.shouyuan += 800; },
    text: [
      '化神无雷劫，只有三问。问仙、问人、问自己。',
      '你坐在闭死关的石室里。第一问落下时，整个修行界都安静了：',
      '"你修的是仙，还是"不死"？"',
      s => s.flags.love === '道侣' && s.flags.loveWho === 'acha' ? '石室之外，阿茶已是白发苍苍。她进不来，就每日在门外摆一碗热汤，汤凉了，再换一碗。' :
           s.flags.love === '道侣' ? '石室之外，你的道侣已白发苍苍，仍每日在门外坐一个时辰。' :
           s.flags.love === '斩' ? '石室之外空无一物。你斩掉的红尘，干干净净。' :
           '石室之外，只剩山风。',
      '第二问："若长生要忘尽来路，你忘是不忘？"'
    ],
    choices: [
      {
        text: '不忘。爹娘的馍、老道的功法、她/他的汤，一样都不许忘。（心境+20，修为+30）',
        fx: s => { s.xinjing += 20; s.xiuwei += 30; s.flags.remember = true; like(s, 'daoLv', 10); if (s.flags.qingLing) like(s, 'qingLing', 10); },
        next: 'tribulation'
      },
      {
        text: '该忘的，忘了才走得远。（修为+60，心境−20）',
        fx: s => { s.xiuwei += 60; s.xinjing -= 20; s.flags.devil_pull = (s.flags.devil_pull || 0) + 1; },
        next: 'tribulation'
      },
      {
        text: '长生本就是逆天之魔道，何须作答。（修为+80，心境−30，堕入魔道）',
        can: s => (s.flags.devil_pull || 0) >= 4 || s.xinjing <= 10,
        fx: s => { s.xiuwei += 80; s.xinjing = Math.max(5, s.xinjing - 30); s.flags.devil = true; },
        next: 'tribulation'
      }
    ]
  },

  tribulation: {
    chapter: '终章 · 渡劫',
    title: '九九天劫',
    onEnter: s => {
      if ((s.aff.qingLing || 0) >= 80 && !s.flags.devil && !s.flags.qingLingUsed) {
        s.flags.qingLingUsed = true;
        s.flags.qingLingShield = true;
      }
    },
    text: [
      '化神圆满的那一日，天色变了。',
      '九重雷云在北海上空聚成漩涡，紫黑色的雷龙在云里游动，锁定的是你。整个修行界的大能都远远看着——有人盼你死，有人盼你成。',
      s => s.flags.devil ? '你周身黑气缭绕，魔道功法尽数展开。雷云深处，隐隐传来天道的怒意。' : '你周身清气流转，一甲子修行化作一道光柱，直插云霄。',
      s => s.flags.qingLingShield ? '雷光将落未落之际，袖中一道碧影窜出——青翎。它盘在你肩头，仰首向天，蛇瞳中金芒大盛。它要与你同渡此劫。' : '第一道天雷，落下来了。'
    ],
    choices: [
      {
        text: '迎上去。',
        next: s => {
          if (s.flags.devil) return 'end_devil';
          if (s.flags.qingLingShield && s.shouyuan <= 0) return 'end_serpent';
          if (s.xinjing <= 0) return 'end_heartdevil';
          if (s.shouyuan <= 0) return 'end_shouyuan';
          if (s.flags.qingLingShield && s.xinjing <= 30) return 'end_serpent';
          if (s.flags.remember && (s.flags.karma || 0) >= 2 && s.xinjing >= 55) return 'end_ascend';
          if (s.flags.remember && s.flags.love === '道侣') return 'end_pair';
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
      '第八十一道雷落下时，你没有挡。你张开手，想起青牛村的雪、山神庙的泥像、半个冻硬的馍、茶棚里的两个蛋。',
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
      s => s.flags.loveWho === 'acha' ? '就在此时，山下传来一声苍老的呼唤——百岁之身的阿茶燃尽寿数，为你隔空渡来一缕心念。那心念里，是一碗热汤的温度。' : '就在此时，山下传来一声熟悉的呼唤——道侣以百岁之身，燃尽修为，为你隔空渡来一缕心念。',
      '你接住那缕心念，也接住了最后九道雷。天门为你而开，但你摇了摇头。',
      '"我不上去了。"你说，"人间还有个人等我回去吃饭。"',
      '你散去半数修为，自封"散仙"，落回人间。史书写你渡劫失败。只有她知道，你是天地间最自在的仙人。'
    ],
    choices: [ { text: '再入轮回，重来一次', restart: true } ]
  },

  end_serpent: {
    chapter: '终章 · 渡劫',
    title: '同渡',
    ending: '情',
    portrait: 'assets/portraits/qingling.jpg',
    npc: '青翎',
    text: [
      '第七十九道天雷落下时，你的道心先一步崩了。',
      '眼看心魔要占据躯体，一道碧影逆着雷光冲了上去——青翎以百年蛇身，硬生生替你吞下了那道雷。雷光顺着它的鳞甲炸开，焦糊味弥漫了整片海面。',
      '"不——！"你嘶吼着接住它坠落的身体。天门在头顶缓缓关闭，你却笑了，笑出了眼泪。',
      '你散尽化神修为，引动残存天雷灌入它体内，为它重铸心脉。蛇躯寸寸焦黑，又寸寸生出新鳞——最后一道金纹亮起时，它睁开了眼。',
      '史书上没有这一笔。但在北海之滨，有一位不成仙的修士，和一条不肯走的蛇，看了一万年的潮起潮落。'
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
      '一缕残魂投入凡间。多年后，青牛村有个放牛的孩子，梦见一位缺了半边脸的老道问他三个问题……',
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
      '你试图反抗，却发现自己早已把反抗的力气，在漫长的岁月里一件件典当干净了。',
      '吞天真魔自此出世。而你的最后一缕清明，被永远封在雷云之上，看着"自己"走进人间。'
    ],
    choices: [ { text: '再入轮回，重来一次', restart: true } ]
  }

};
