// 考试证件照规格数据库
const examDB = [
  { name:'国家公务员考试 (国考)', cat:'公务员', icon:'🏛️', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#ffffff',note:'白底' },
  { name:'北京公务员考试', cat:'公务员', icon:'🏛️', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#438edb',note:'蓝底' },
  { name:'上海公务员考试', cat:'公务员', icon:'🏛️', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#ffffff',note:'白底' },
  { name:'广东省考', cat:'公务员', icon:'🏛️', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#ffffff',note:'白底/蓝底' },
  { name:'江苏省考', cat:'公务员', icon:'🏛️', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#ffffff',note:'白底' },
  { name:'浙江省考', cat:'公务员', icon:'🏛️', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#438edb',note:'蓝底' },
  { name:'山东省考', cat:'公务员', icon:'🏛️', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#ffffff',note:'白底' },
  { name:'四川省考', cat:'公务员', icon:'🏛️', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#ffffff',note:'白底' },
  { name:'河南省考', cat:'公务员', icon:'🏛️', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#ffffff',note:'白底' },
  { name:'湖北省考', cat:'公务员', icon:'🏛️', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#438edb',note:'蓝底' },
  { name:'湖南省考', cat:'公务员', icon:'🏛️', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#ffffff',note:'白底' },
  { name:'事业单位考试', cat:'公务员', icon:'🏢', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#ffffff',note:'白底/蓝底' },
  { name:'选调生考试', cat:'公务员', icon:'🎓', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#438edb',note:'蓝底' },
  { name:'军队文职', cat:'公务员', icon:'🎖️', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#d43030',note:'红底' },
  { name:'全国硕士研究生考试', cat:'教育', icon:'📚', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#ffffff',note:'白底' },
  { name:'高考报名 (全国)', cat:'教育', icon:'📝', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#ffffff',note:'白底' },
  { name:'成人高考', cat:'教育', icon:'📝', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#438edb',note:'蓝底' },
  { name:'自学考试', cat:'教育', icon:'📝', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#438edb',note:'蓝底' },
  { name:'英语四六级 (CET)', cat:'教育', icon:'🔤', wMm:20,hMm:27,wPx:144,hPx:192,bg:'#69b4ff',note:'浅蓝底' },
  { name:'普通话水平测试', cat:'教育', icon:'🗣️', wMm:33,hMm:48,wPx:390,hPx:567,bg:'#438edb',note:'蓝底' },
  { name:'教师资格证', cat:'资格证', icon:'👩‍🏫', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#ffffff',note:'白底' },
  { name:'法律职业资格 (法考)', cat:'资格证', icon:'⚖️', wMm:35,hMm:49,wPx:413,hPx:626,bg:'#438edb',note:'蓝底' },
  { name:'注册会计师 (CPA)', cat:'资格证', icon:'💰', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#ffffff',note:'白底' },
  { name:'初级/中级会计', cat:'资格证', icon:'💹', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#ffffff',note:'白底' },
  { name:'计算机等级考试', cat:'资格证', icon:'💻', wMm:20,hMm:27,wPx:144,hPx:192,bg:'#69b4ff',note:'浅蓝底' },
  { name:'建造师 (一建/二建)', cat:'资格证', icon:'🏗️', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#ffffff',note:'白底' },
  { name:'执业医师', cat:'资格证', icon:'🩺', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#ffffff',note:'白底' },
  { name:'护士执业资格', cat:'资格证', icon:'💉', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#ffffff',note:'白底' },
  { name:'导游资格证', cat:'资格证', icon:'🚩', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#ffffff',note:'白底' },
  { name:'消防工程师', cat:'资格证', icon:'🔥', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#ffffff',note:'白底' },
  { name:'社会工作者', cat:'资格证', icon:'🤝', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#ffffff',note:'白底' },
  { name:'人力资源管理师', cat:'资格证', icon:'👔', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#ffffff',note:'白底' },
  { name:'中国护照', cat:'出国', icon:'🛂', wMm:33,hMm:48,wPx:390,hPx:567,bg:'#ffffff',note:'白底' },
  { name:'港澳通行证', cat:'出国', icon:'🛂', wMm:33,hMm:48,wPx:390,hPx:567,bg:'#438edb',note:'蓝底' },
  { name:'台湾通行证', cat:'出国', icon:'🛂', wMm:33,hMm:48,wPx:390,hPx:567,bg:'#ffffff',note:'白底' },
  { name:'美国签证', cat:'出国', icon:'🇺🇸', wMm:51,hMm:51,wPx:600,hPx:600,bg:'#ffffff',note:'白底' },
  { name:'申根签证', cat:'出国', icon:'🇪🇺', wMm:35,hMm:45,wPx:413,hPx:531,bg:'#ffffff',note:'白底' },
  { name:'日本签证', cat:'出国', icon:'🇯🇵', wMm:45,hMm:35,wPx:531,hPx:413,bg:'#ffffff',note:'白底' },
  { name:'英国签证', cat:'出国', icon:'🇬🇧', wMm:35,hMm:45,wPx:413,hPx:531,bg:'#ffffff',note:'白底' },
  { name:'加拿大签证', cat:'出国', icon:'🇨🇦', wMm:35,hMm:45,wPx:413,hPx:531,bg:'#ffffff',note:'白底' },
  { name:'澳大利亚签证', cat:'出国', icon:'🇦🇺', wMm:35,hMm:45,wPx:413,hPx:531,bg:'#ffffff',note:'白底' },
  { name:'韩国签证', cat:'出国', icon:'🇰🇷', wMm:35,hMm:45,wPx:413,hPx:531,bg:'#ffffff',note:'白底' },
  { name:'驾驶证 (C1/C2)', cat:'驾驶', icon:'🚗', wMm:22,hMm:32,wPx:260,hPx:378,bg:'#ffffff',note:'白底' },
  { name:'网约车资格证', cat:'驾驶', icon:'🚕', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#ffffff',note:'白底' },
  { name:'身份证', cat:'其他', icon:'🪪', wMm:26,hMm:32,wPx:358,hPx:441,bg:'#ffffff',note:'白底' },
  { name:'社保卡', cat:'其他', icon:'💳', wMm:26,hMm:32,wPx:358,hPx:441,bg:'#ffffff',note:'白底' },
  { name:'简历/求职照', cat:'其他', icon:'📄', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#ffffff',note:'白底/蓝底' },
  { name:'学生证/校园卡', cat:'其他', icon:'🎒', wMm:25,hMm:35,wPx:295,hPx:413,bg:'#438edb',note:'蓝底' },
];

const currentFilter = { cat:'all', search:'' };

function filterByCategory(cat, el) {
  currentFilter.cat = cat;
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  renderExamList();
}

function filterExams() {
  currentFilter.search = document.getElementById('examSearch').value.trim().toLowerCase();
  renderExamList();
}

function renderExamList() {
  const list = document.getElementById('examList');
  let f = examDB;
  if (currentFilter.cat !== 'all') f = f.filter(e => e.cat === currentFilter.cat);
  if (currentFilter.search) f = f.filter(e =>
    e.name.toLowerCase().includes(currentFilter.search) ||
    e.cat.includes(currentFilter.search) ||
    e.note.includes(currentFilter.search)
  );
  if (!f.length) { list.innerHTML = '<div class="exam-empty">没有找到匹配的考试</div>'; return; }
  list.innerHTML = f.map(e =>
    '<div class="exam-item" onclick="applyExamSpec(\'' +
    e.name.replace(/'/g, "\\'") + '\',' + e.wMm + ',' + e.hMm + ',' +
    e.wPx + ',' + e.hPx + ',\'' + e.bg + '\')">' +
    '<span class="exam-icon">' + e.icon + '</span>' +
    '<div class="exam-info"><div class="exam-name">' + e.name + '</div>' +
    '<div class="exam-meta">' + e.wMm + '×' + e.hMm + 'mm · ' +
    e.wPx + '×' + e.hPx + 'px · ' + e.note + '</div></div>' +
    '<span class="exam-dot" style="background-color:' + e.bg + '"></span></div>'
  ).join('');
}
