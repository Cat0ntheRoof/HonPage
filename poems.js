/* poems.js — 一天一句：名家现代诗库（32 首，按日轮换，约一个月不重样）
 *
 * 轮换规则：以「自 1970-01-01 起的天数 % 诗库总数」取诗，
 *          同一天打开永远是同一首，跨天自动推进，全部走完才回到第一首。
 *
 * 采集原则：优先选流传广、公认度高的名句；外语诗用通行中文译法，
 *          并附作者与篇目原名。王小波、李银河按用户偏好收录。
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
  },  {
    text: '你一会看我，\n一会看云。\n我觉得，\n你看我时很远，\n你看云时很近。',
    author: '顾城',
    source: '《远和近》',
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
    text: '只要想起一生中后悔的事，\n梅花便落了下来。',
    author: '张枣',
    source: '《镜中》',
    origin: ''
  },
  {
    text: '巴巴地活着，每天打水，煮饭，按时吃药\n茶叶轮换着喝：菊花，茉莉，玫瑰，柠檬\n这些美好的事物仿佛把我往春天的路上带',
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
    text: '我要和你一起，\n走过人生的\n每一段荒凉。',
    author: '余秀华',
    source: '《摇摇晃晃的人间》',
    origin: ''
  },  {
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
    text: '与其在悬崖上展览千年，\n不如在爱人肩头痛哭一晚。',
    author: '舒婷',
    source: '《神女峰》',
    origin: ''
  },

  /* —— 外国 · 通行中译 —— */
  {
    text: '今夜我可以写下最哀伤的诗句。\n写，譬如：&#8220;夜被击碎，\n而蓝色的星在远处颤栗。&#8221;',
    author: '巴勃罗·聂鲁达',
    source: '《今夜我可以写》',
    origin: 'Pablo Neruda, <i>Puedo escribir los versos m&#225;s tristes esta noche</i>'
  },
  {
    text: '我爱你，\n因为我不知道，\n还有什么别的方式。',
    author: '巴勃罗·聂鲁达',
    source: '《一百首爱的十四行诗·第十七首》',
    origin: 'Pablo Neruda, <i>Cien sonetos de amor</i>, Soneto XVII'
  },
  {
    text: '爱是这么短，\n遗忘是这么长。',
    author: '巴勃罗·聂鲁达',
    source: '《二十首情诗与绝望的歌》',
    origin: 'Pablo Neruda, <i>Veinte poemas de amor</i>'
  },
  {
    text: '我想和你一起生活，\n在某个小镇，\n共享无尽的黄昏\n和绵延不绝的钟声。',
    author: '玛琳娜·茨维塔耶娃',
    source: '《我想和你一起生活》',
    origin: 'Марина Цветаева'
  },
  {
    text: '我偏爱牢记此一可能——\n存在的理由不假外求。',
    author: '维斯瓦娃·辛波斯卡',
    source: '《种种可能》',
    origin: 'Wis&#322;awa Szymborska, <i>Mo&#380;liwo&#347;ci</i>'
  },
  {
    text: '谁这时没有房屋，就不必建筑。\n谁这时孤独，就永远孤独。',
    author: '赖内·马利亚·里尔克',
    source: '《秋日》',
    origin: 'Rainer Maria Rilke, <i>Herbsttag</i>'
  },
  {
    text: '若我会见到你，\n事隔经年，\n我如何贺你？\n以眼泪，以沉默。',
    author: '乔治·戈登·拜伦',
    source: '《春逝》',
    origin: 'Lord Byron, <i>When We Two Parted</i>'
  },
  {
    text: '生如夏花之绚烂，\n死如秋叶之静美。',
    author: '拉宾德拉纳特·泰戈尔',
    source: '《飞鸟集》',
    origin: 'Rabindranath Tagore, <i>Stray Birds</i>'
  },
  {
    text: '我来到这个世界，\n为了看太阳，\n和蔚蓝色的原野。',
    author: '康斯坦丁·巴尔蒙特',
    source: '《我来到这个世界》',
    origin: 'Константин Бальмонт'
  },
  {
    text: '我是你路上\n最后一个过客，\n最后一个春天。',
    author: '罗贝托·波拉尼奥',
    source: '《浪漫主义狗》',
    origin: 'Roberto Bola&#241;o'
  },
  {
    text: '我曾经爱过你，\n爱情，也许\n在我的心灵里还没有完全消亡。',
    author: '亚历山大·普希金',
    source: '《我曾经爱过你》',
    origin: 'Александр Пушкин'
  },
  {
    text: '你要爱着\n就像世界上\n从来不曾有过爱情。',
    author: '维斯瓦娃·辛波斯卡',
    source: '《一见钟情》',
    origin: 'Wis&#322;awa Szymborska'
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
