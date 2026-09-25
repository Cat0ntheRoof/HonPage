/* festivals.js — 节日系统
 *
 * 功能：
 *   1. 临近节日倒计时（提前 7 天显示）
 *   2. 节日当天：返回节日信息供页面挂装饰 + 弹祝贺弹窗
 *
 * 农历节日（除夕/春节/七夕/中秋）的公历日期为硬编码，
 * 来源：日历网 / 光明网 / 日本国立天文台 / 多个万年历站交叉核对（2026-09-25 查证）。
 * 覆盖 2026-2030；超出色表范围时农历节日自动缺席，公历节日不受影响。
 *
 * theme 决定节日当天的装饰方案（颜色 + emoji 挂件 + 飘落粒子）：
 *   love       情人节系（粉）
 *   spring     除夕/春节（红金）
 *   midautumn  中秋（暖金 + 月 + 月饼）
 *   xmas       平安夜/圣诞（红绿 + 雪）
 *   newyear    元旦（金 + 烟花）
 */
'use strict';

const FESTIVALS = [
  /* —— 公历节日 —— */
  {
    name: '元旦', emoji: '🎆', theme: 'newyear',
    month: 1, day: 1,
    greeting: '今年的第一句新年快乐，必须说给你听。'
  },
  {
    name: '情人节', emoji: '💝', theme: 'love',
    month: 2, day: 14,
    greeting: '情人节快乐。不过说实话，有你每天都是。'
  },
  {
    name: '白色情人节', emoji: '🤍', theme: 'love',
    month: 3, day: 14,
    greeting: '白色情人节，回礼是一个更认真的我。'
  },
  {
    name: '520', emoji: '💕', theme: 'love',
    month: 5, day: 20,
    greeting: '今天是 520。其实每天都是，只是今天有理由大声说。'
  },
  {
    name: '平安夜', emoji: '🍎', theme: 'xmas',
    month: 12, day: 24,
    greeting: '愿今夜平安，往后都平安。平安夜快乐！'
  },
  {
    name: '圣诞节', emoji: '🎅', theme: 'xmas',
    month: 12, day: 25,
    greeting: 'Merry Christmas！你就是我今年收到最好的礼物。'
  },

  /* —— 农历节日（硬编码公历日期，2026-2030） —— */
  {
    name: '除夕', emoji: '🏮', theme: 'spring',
    date: '2027-02-05',
    greeting: '今晚一起守岁，把旧年最后一个心愿留给你。除夕快乐！'
  },
  {
    name: '除夕', emoji: '🏮', theme: 'spring',
    date: '2028-01-25',
    greeting: '今晚一起守岁，把旧年最后一个心愿留给你。除夕快乐！'
  },
  {
    name: '除夕', emoji: '🏮', theme: 'spring',
    date: '2029-02-12',
    greeting: '今晚一起守岁，把旧年最后一个心愿留给你。除夕快乐！'
  },
  {
    name: '除夕', emoji: '🏮', theme: 'spring',
    date: '2030-02-02',
    greeting: '今晚一起守岁，把旧年最后一个心愿留给你。除夕快乐！'
  },
  {
    name: '春节', emoji: '🧧', theme: 'spring',
    date: '2027-02-06',
    greeting: '新的一年，第一件事还是喜欢你。过年好！'
  },
  {
    name: '春节', emoji: '🧧', theme: 'spring',
    date: '2028-01-26',
    greeting: '新的一年，第一件事还是喜欢你。过年好！'
  },
  {
    name: '春节', emoji: '🧧', theme: 'spring',
    date: '2029-02-13',
    greeting: '新的一年，第一件事还是喜欢你。过年好！'
  },
  {
    name: '春节', emoji: '🧧', theme: 'spring',
    date: '2030-02-03',
    greeting: '新的一年，第一件事还是喜欢你。过年好！'
  },
  {
    name: '七夕', emoji: '💞', theme: 'love',
    date: '2027-08-08',
    greeting: '银河今晚很挤，好在我们不用一年只见一次。七夕快乐！'
  },
  {
    name: '七夕', emoji: '💞', theme: 'love',
    date: '2028-08-26',
    greeting: '银河今晚很挤，好在我们不用一年只见一次。七夕快乐！'
  },
  {
    name: '七夕', emoji: '💞', theme: 'love',
    date: '2029-08-16',
    greeting: '银河今晚很挤，好在我们不用一年只见一次。七夕快乐！'
  },
  {
    name: '七夕', emoji: '💞', theme: 'love',
    date: '2030-08-05',
    greeting: '银河今晚很挤，好在我们不用一年只见一次。七夕快乐！'
  },
  {
    name: '中秋节', emoji: '🌕', theme: 'midautumn',
    date: '2026-09-25',
    greeting: '月已经圆了，思念的人就在身边。中秋节快乐！'
  },
  {
    name: '中秋节', emoji: '🌕', theme: 'midautumn',
    date: '2027-09-15',
    greeting: '月已经圆了，思念的人就在身边。中秋节快乐！'
  },
  {
    name: '中秋节', emoji: '🌕', theme: 'midautumn',
    date: '2028-10-03',
    greeting: '月已经圆了，思念的人就在身边。中秋节快乐！'
  },
  {
    name: '中秋节', emoji: '🌕', theme: 'midautumn',
    date: '2029-09-22',
    greeting: '月已经圆了，思念的人就在身边。中秋节快乐！'
  },
  {
    name: '中秋节', emoji: '🌕', theme: 'midautumn',
    date: '2030-09-12',
    greeting: '月已经圆了，思念的人就在身边。中秋节快乐！'
  }
];

/* 节日对应的装饰方案（挂件 emoji + 飘落粒子 emoji + 主色） */
const FEST_THEMES = {
  love:      { hang: ['💝', '💞', '💘'],      fall: '💗', accent: '#e8798f' },
  spring:    { hang: ['🏮', '🧧', '✨'],      fall: '🏮', accent: '#d9483b' },
  midautumn: { hang: ['🌕', '🥮', '🏮'],      fall: '🥮', accent: '#c8965a' },
  xmas:      { hang: ['🎄', '❄️', '🎅'],      fall: '❄️', accent: '#b8433c' },
  newyear:   { hang: ['🎆', '🎉', '✨'],      fall: '✨', accent: '#c8965a' }
};

/* 计算某个节日实例在指定年份的日期（农历节日用硬编码 date） */
function festDateOf(f, year){
  if (f.date) {
    const p = f.date.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  return new Date(year, f.month - 1, f.day);
}

/* 取节日上下文：
 *   active   —— 今天是不是节日（命中返回节日对象，否则 null）
 *   upcoming —— 最近的未来节日 { fest, days }（days = 1 表示明天）
 * 规则：以「自然日 0 点」比较；active 优先于 upcoming。
 */
function getFestivalContext(now){
  const d = now || new Date();
  const today0 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const year = today0.getFullYear();
  let active = null, upcoming = null;

  for (let i = 0; i < FESTIVALS.length; i++){
    const f = FESTIVALS[i];
    const fd = festDateOf(f, year);
    const diff = Math.round((fd - today0) / 86400000); // 整数天差
    if (diff === 0 && !active) active = f;
    if (diff > 0 && (!upcoming || diff < upcoming.days)){
      upcoming = { fest: f, days: diff, date: fd };
    }
  }
  return { active: active, upcoming: upcoming };
}

if (typeof window !== 'undefined') {
  window.FESTIVALS = FESTIVALS;
  window.FEST_THEMES = FEST_THEMES;
  window.getFestivalContext = getFestivalContext;
}
