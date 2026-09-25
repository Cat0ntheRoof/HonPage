/* poems.js — 一天一句：名家现代诗库（32 首，按日轮换，约一个月不重样）
 *
 * 轮换规则：以「自 1970-01-01 起的天数 % 诗库总数」取诗，
 *          同一天打开永远是同一首，跨天自动推进，全部走完才回到第一首。
 *
 * 采集原则：
 *   1. 优先选流传广、公认度高的名句；外语诗用通行中文译法，附篇目原名。
 *   2. 【意象红线】只收吉利意象：相遇、相守、思念、日常的甜、希望与光明。
 *      不收：分离/告别、失恋/曾经爱过、死亡、孤独、哀伤、遗忘、后悔、眼泪。
 *      （2026-09-25 审查换血：删 12 首负面意象，新增 12 首吉利意象）
 *   3. 只取原诗中连续的段落，不跨段拼接、不改原文一字。
 *   4. 查不到可靠出处的句子宁可不要。
 */
'use strict';

const POEMS = [
  /* —— 中国 · 当代 —— */
  {
    text: '那一天我二十一岁，\n在我一生的黄金时代。\n我有好多奢望。\n我想爱，想吃，\n还想在一瞬间变成天上半明半暗的云。',
    author: '王小波',
    source: '《黄金时代》',
    origin: ''
  },
  {
    text: '爱你就像\n爱生命。',
    author: '王小波',
    source: '《爱你就像爱生命》',
    origin: ''
  },
  {
    text: '你好哇，\n李银河。',
    author: '王小波',
    source: '《致李银河的信》',
    origin: ''
  },
  {
    text: '一想到你，\n我这张丑脸上\n就泛起微笑。',
    author: '王小波',
    source: '《致李银河的信》',
    origin: ''
  },
  {
    text: '你要是愿意，\n我就永远爱你。\n你要是不愿意，\n我就永远相思。',
    author: '王小波',
    source: '《致李银河的信》',
    origin: ''
  },
  {
    text: '我和你好像两个小孩子，\n围着一个神秘的果酱罐，\n一点一点地尝它，\n看看里面有多少甜。',
    author: '王小波',
    source: '《爱你就像爱生命》',
    origin: ''
  },
  {
    text: '从明天起，做一个幸福的人\n喂马，劈柴，周游世界\n从明天起，关心粮食和蔬菜\n我有一所房子，面朝大海，春暖花开',
    author: '海子',
    source: '《面朝大海，春暖花开》',
    origin: ''
  },
  {
    text: '你来人间一趟，\n你要看看太阳，\n和你的心上人\n一起走在街上。',
    author: '海子',
    source: '《夏天》',
    origin: ''
  },
  {
    text: '陌生人，我也为你祝福\n愿你有一个灿烂的前程\n愿你有情人终成眷属\n愿你在尘世获得幸福',
    author: '海子',
    source: '《面朝大海，春暖花开》',
    origin: ''
  },
  {
    text: '活在这珍贵的人间，\n太阳强烈，\n水波温柔。',
    author: '海子',
    source: '《活在珍贵的人间》',
    origin: ''
  },
  {
    text: '黑夜给了我黑色的眼睛，\n我却用它寻找光明。',
    author: '顾城',
    source: '《一代人》',
    origin: ''
  },
  {
    text: '草在结它的种子，\n风在摇它的叶子。\n我们站着，不说话，\n就十分美好。',
    author: '顾城',
    source: '《门前》',
    origin: ''
  },
  {
    text: '我想在大地上画满窗子，\n让所有习惯黑暗的眼睛\n都习惯光明。',
    author: '顾城',
    source: '《我是一个任性的孩子》',
    origin: ''
  },
  {
    text: '阳光好的时候就把自己放进去，\n像放一块陈皮\n茶叶轮换着喝：菊花，茉莉，玫瑰，柠檬\n这些美好的事物仿佛把我往春天的路上带',
    author: '余秀华',
    source: '《我爱你》',
    origin: ''
  },
  {
    text: '如果给你寄一本书，\n我不会寄给你诗歌，\n我要给你一本关于植物，关于庄稼的，\n告诉你稻子和稗子的区别。',
    author: '余秀华',
    source: '《我爱你》',
    origin: ''
  },
  {
    text: '你站在桥上看风景，\n看风景人在楼上看你。\n明月装饰了你的窗子，\n你装饰了别人的梦。',
    author: '卞之琳',
    source: '《断章》',
    origin: ''
  },
  {
    text: '从前的日色变得慢，\n车，马，邮件都慢，\n一生只够爱一个人。',
    author: '木心',
    source: '《从前慢》',
    origin: ''
  },
  {
    text: '我如果爱你——\n绝不像攀援的凌霄花，\n借你的高枝炫耀自己。\n我必须是你近旁的一株木棉，\n作为树的形象和你站在一起。',
    author: '舒婷',
    source: '《致橡树》',
    origin: ''
  },
  {
    text: '我行过许多地方的桥，\n看过许多次数的云，\n喝过许多种类的酒，\n却只爱过一个正当最好年龄的人。',
    author: '沈从文',
    source: '《致张兆和的家书》',
    origin: ''
  },
  {
    text: '春水初生，\n春林初盛，\n春风十里，\n不如你。',
    author: '冯唐',
    source: '《三十六大》',
    origin: ''
  },
  {
    text: '你是爱，是暖，是希望，\n你是人间的四月天！',
    author: '林徽因',
    source: '《你是人间的四月天》',
    origin: ''
  },
  {
    text: '于千万人之中遇见你所要遇见的人，\n于千万年之中，时间无涯的荒野里，\n没有早一步，也没有晚一步，\n刚巧赶上了。',
    author: '张爱玲',
    source: '《爱》',
    origin: ''
  },
  {
    text: '不要愁老之将至，\n你老了一定很可爱。',
    author: '朱生豪',
    source: '《朱生豪情书》',
    origin: ''
  },
  {
    text: '如何让你遇见我，\n在我最美丽的时刻。\n为这，\n我已在佛前求了五百年，\n求佛让我们结一段尘缘。',
    author: '席慕蓉',
    source: '《一棵开花的树》',
    origin: ''
  },
  {
    text: '等你，在雨中，在造虹的雨中\n蝉声沉落，蛙声升起\n一池的红莲如红焰，在雨中',
    author: '余光中',
    source: '《等你，在雨中》',
    origin: ''
  },
  {
    text: '天上飘着些微云，\n地上吹着些微风。\n啊！微风吹动了我头发，\n教我如何不想她？',
    author: '刘半农',
    source: '《教我如何不想她》',
    origin: ''
  },
  {
    text: '假如我是一朵雪花，\n翩翩的在半空里潇洒，\n我一定认清我的方向——\n飞扬，飞扬，飞扬——\n这地面上有我的方向。',
    author: '徐志摩',
    source: '《雪花的快乐》',
    origin: ''
  },

  /* —— 外国 · 通行中译 —— */
  {
    text: '我爱你，\n因为我不知道，\n还有什么别的方式。',
    author: '巴勃罗·聂鲁达',
    source: '《一百首爱的十四行诗·第十七首》',
    origin: 'Pablo Neruda, <i>Cien sonetos de amor</i>, Soneto XVII'
  },
  {
    text: '我想和你一起生活，\n在某个小镇，\n共享无尽的黄昏\n和绵延不绝的钟声。',
    author: '玛琳娜·茨维塔耶娃',
    source: '《我想和你一起生活》',
    origin: 'Марина Цветаева'
  },
  {
    text: '他们两人都相信，\n是一股突然的热情让他俩交会。\n这样的笃定是美丽的。',
    author: '维斯瓦娃·辛波斯卡',
    source: '《一见钟情》',
    origin: 'Wis&#322;awa Szymborska'
  },
  {
    text: '我来到这个世界，\n为了看太阳，\n和蔚蓝色的原野。',
    author: '康斯坦丁·巴尔蒙特',
    source: '《我来到这个世界》',
    origin: 'Константин Бальмонт'
  },
  {
    text: '让我的爱，\n像阳光一样包围着你，\n而又给你\n光辉灿烂的自由。',
    author: '拉宾德拉纳特·泰戈尔',
    source: '《流萤集》',
    origin: 'Rabindranath Tagore, <i>Fireflies</i>'
  }
];

/* 轮换顺序：把同一位诗人的作品均匀分散到整个周期，任意相邻两天作者都不同。
 * 算法：按收录数降序，依次把每位诗人的作品插进「当前最宽松」的空位，
 *      即每次选择与已有邻居冲突最小的位置（贪心 + 冲突打分）。
 */
const POEM_ORDER = (function(){
  const n = POEMS.length;
  const slots = new Array(n).fill(-1);
  const authorOf = function(pi){ return POEMS[pi].author; };

  // 每位诗人的作品下标，按收录数从多到少处理（多者优先占位，更均匀）
  const byAuthor = new Map();
  POEMS.forEach(function(p, i){
    if (!byAuthor.has(p.author)) byAuthor.set(p.author, []);
    byAuthor.get(p.author).push(i);
  });
  const groups = Array.from(byAuthor.values())
    .sort(function(a, b){ return b.length - a.length; });

  // 某位置放 author 会与已确定的左右邻居冲突则计分
  function conflicts(pos, author){
    let c = 0;
    for (let d = -1; d <= 1; d += 2){
      let k = pos + d;
      if (k < 0) k = n - 1;          // 周期是环形的，首尾也算相邻
      if (k >= n) k = 0;
      if (slots[k] !== -1 && authorOf(slots[k]) === author) c++;
    }
    return c;
  }

  // 把一组（同一诗人）的下标铺开：优先选冲突最少的位置，且彼此尽量远离
  groups.forEach(function(group){
    // 该组起点在环上均匀铺开，避免全部挤在一侧
    const step = Math.max(1, Math.floor(n / group.length));
    const used = [];
    group.forEach(function(pi, gi){
      let best = -1, bestScore = Infinity;
      // 从均匀分布的建议位置开始，向两侧搜索，取冲突最少者
      const ideal = gi * step;
      for (let off = 0; off < n; off++){
        for (const dir of (off === 0 ? [0] : [1, -1])){
          let pos = (ideal + off * dir) % n;
          if (pos < 0) pos += n;
          if (slots[pos] !== -1) continue;
          // 与同组已放置项的距离也算进代价，推动分散
          let score = conflicts(pos, POEMS[pi].author) * 100;
          used.forEach(function(u){
            const dist = Math.min(Math.abs(pos - u), n - Math.abs(pos - u));
            if (dist < step) score += (step - dist);
          });
          if (score < bestScore){ bestScore = score; best = pos; }
          if (score === 0) break;
        }
        if (best !== -1 && bestScore === 0) break;
      }
      if (best === -1){ // 兜底：任取空位
        for (let k = 0; k < n; k++){ if (slots[k] === -1){ best = k; break; } }
      }
      slots[best] = pi;
      used.push(best);
    });
  });

  return slots;
})();

/* 按自然日序数取诗，保证同一天结果一致 */
function poemOfDay(date){
  const d = date || new Date();
  const dayIndex = Math.floor(
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000
  );
  const n = POEM_ORDER.length;
  return POEMS[POEM_ORDER[((dayIndex % n) + n) % n]];
}

if (typeof window !== 'undefined') {
  window.POEMS = POEMS;
  window.POEM_ORDER = POEM_ORDER;
  window.poemOfDay = poemOfDay;
}
