/* ===== Поштова чайка · Архітектура (Андрій) =====
   Окремо від Танчиного інтерфейсу: свої дані, свій рендер, свої стилі (arch.css).
   Типи листів: Доручення (від Батата), Анонс (новини, щось з'явилось), Посилка (винагороди, отримані за період).
   Стани:
   - непереглянуто → переглянуто: червона булька біля відправника. Знімається ТІЛЬКИ прокручуванням:
     коли гість гортає список і булька підходить до верхнього краю, вона гасне. Знята булька більше не повертається.
   - непрочитано → прочитано: непрочитаний лист має фон білий 4%. Знімається відкриттям листа або «Прочитати всі».
   - у Доручення є свій шлях: нове → прийнято → виконано → нагороду забрано. */
(() => {
  const phone = document.getElementById('phone');
  if (!phone) return;

  /* ---------- шапка ---------- */
  const h1 = phone.querySelector('.top h1');
  if (h1) h1.textContent = 'Поштова чайка';

  /* ---------- модель ---------- */
  const TYPES = {task: {name: 'Доручення'}, thanks: {name: 'Відповідь Батата'}, announce: {name: 'Анонс'}, parcel: {name: 'Посилка'}, rare: {name: 'Відзнака'}, rewards: {name: 'Винагороди'}};
  const SENDERS = {
    batat: {name: 'Великий Батат', ini: 'ВБ'},
    uriad: {name: 'Таємний уряд', ini: 'ТУ'},
    tbd:   {name: 'Відправник ?', ini: '?', tbd: true}      /* хто шле Посилку — ще думаємо */
  };
  /* стани доручення: нове → виконується → виконано (приходить новий лист-відповідь) | наступного разу (не виконав або сплив термін) */
  const STAGES = [['new', 'Нове'], ['accepted', 'Виконується'], ['done', 'Виконано'], ['missed', 'Наступного разу']];

  const task = (what, term, prize, stage) => ({what, term, prize, stage});

  /* ---------- історія винагород ----------
     Кожна винагорода — окремий запис (квитанція). У списку день = одна плашка «Винагороди» з підсумком дня;
     тап розгортає джерела (Бондуелі · 6, Чеки · 2) з їхніми сумами. Рідкісне (рівень-віха, статус) — окремою карткою.
     Значення — з балансу v10.12.6. g: m — мммм, z — Заб, t — квитки, k — келихи, b — гейм-буст, x — скриня, s — СПшка */
  const G = {m: 'мммм', z: 'Заб', t: 'квитки', k: 'келихи', b: 'гейм-буст', x: 'скриня', s: 'СПшка'};
  /* Одна плашка «Винагороди» на день; parts — джерела всередині: [назва, квитанції] */
  const rw = (id, day, parts, seen, read) => ({id, type: 'rewards', from: 'tbd', day, title: 'Винагороди', parts, seen, read,
    date: parts[0][1][0][1], lines: ['']});
  const itemsOf = l => l.parts.flatMap(([, it]) => it);
  const win = {m: 60, z: 10, k: 10}, draw = {m: 25, z: 5, k: 5}, lose = {m: 10, z: 2};
  const REWARDS = [
    {id: 'r-lvl10', type: 'rare', from: 'tbd', day: 'week', date: 'Субота, 13:05', seen: false, read: false,
      title: 'Рівень 10', lines: ['Новий рівень сезону. Тримай скриню й знижку свого культу.'],
      items: [['Бокс середній', '×1'], ['СПшка культова 10%', '×1']]},
    rw('r-day-0', 'today', [
      ['Бондуелі', [
        ['Перемога · Кавун-Ножиці-Листок', '14:20', win], ['Перемога · Смачно-Несмачно', '14:12', win],
        ['Нічия · Кавун-Ножиці-Листок', '13:58', draw], ['Поразка · Мортал Кумкват', '13:47', lose],
        ['Перемога · Смачно-Несмачно', '13:40', win], ['Перемога · Кавун-Ножиці-Листок', '13:31', win]]],
      ['Щоденні завдання', [
        ['Геймер: зіграти 5 ігор', '14:20', {m: 120, z: 15, k: 5}], ['Покупець: чек у Сільпо', '09:20', {m: 60, z: 40, k: 10}]]],
      ['Чеки', [['Покупка на 707,00 ₴', '12:16', {t: 3}], ['Покупка на 413,86 ₴', '09:20', {t: 2}]]]], false, false),
    rw('r-day-1', 'yesterday', [
      ['Міні-ігри', [
        ['Крик на чек · відмінно', '21:40', {m: 80, z: 12}], ['Тапіока · добре', '21:33', {m: 60, z: 9}],
        ['Знижконадувачка · середньо', '20:10', {m: 40, z: 6}]]],
      ['Бондуелі', [
        ['Перемога · Мортал Кумкват', '20:05', win], ['Поразка · Кавун-Ножиці-Листок', '19:58', lose],
        ['Перемога · Смачно-Несмачно', '19:50', win]]],
      ['Чеки', [['Покупка на 356,20 ₴', '18:44', {t: 2}]]]], false, false),
    {id: 'r-status', type: 'rare', from: 'tbd', day: 'week', date: 'Четвер, 00:00', seen: true, read: false,
      title: 'Ти серед сотні найкращих', lines: ['Тиждень у культі закрито. Статус на наступний тиждень — Послідовник.'],
      items: [['Забобонуси', '+50'], ['Мммм', '+150'], ['Гейм-буст', '×1'], ['Квиток щодня', '+1']]},
    rw('r-week', 'week', [['Тижневі завдання', [['Геймер: 20 ігор за тиждень', 'Середа, 22:10', {m: 425, z: 75, k: 15}]]]], true, true)
  ];
  const DAYS = [['today', 'Сьогодні'], ['yesterday', 'Вчора'], ['week', 'Цього тижня'], ['month', 'Цього місяця'], ['older', 'Раніше']];
  const dayOf = l => l.day || 'older';
  const sumOf = items => items.reduce((s, [, , g]) => { for (const k in g) s[k] = (s[k] || 0) + g[k]; return s; }, {});
  /* Частота (рішення): листів-анонсів від Таємного уряду — не більше одного на день;
     Великий Батат пише раз на тиждень (одне доручення); винагороди — скільки заробив, одна плашка на день.
     Сьогодні — неділя, 22 листопада; тиждень Потойбіччя починається в четвер.
     Фокус мокапу — сьогоднішнє доручення Батата: сьогодні інших листів немає, тільки воно й винагороди. */
  const INIT = [
    {id: 'd10', type: 'task', from: 'batat', day: 'today', date: 'Сьогодні, 11:40', seen: false, read: false,
      title: 'Піца за пів ціни', lines: ['Тільки сьогодні: −50% на піцу в замовленні онлайн. Батат щедрий рідко — не проґав.'],
      task: Object.assign(task('Замовити піцу онлайн', 'тільки сьогодні', '−50% на піцу', 'new'),
        {gain: {m: 150, z: 30}, seal: true, committed: 412})},
    {id: 'a8', type: 'announce', from: 'uriad', day: 'week', date: 'П\'ятниця, 12:00', seen: false, read: false,
      title: 'Нова гра у Парку Атракціонів', lines: ['У Парку Атракціонів з\'явилась нова гра.'], cta: 'Перейти в Парк'},
    {id: 'a7', type: 'announce', from: 'uriad', day: 'month', date: '14 листопада', seen: true, read: false,
      title: 'Відчинилась Гардеробна', lines: ['Замок знято.', 'У Гардеробній висить перше вбрання для твого Їдола.'],
      cta: 'Перейти в Гардеробну'},
    {id: 'a5', type: 'announce', from: 'uriad', day: 'week', date: 'Четвер, 09:00', seen: true, read: false,
      title: 'Лососянці піднялися на перше місце', lines: ['Рейтинг культів оновився.', 'Лососянці перші, Томатисти дихають у спину.']},
    {id: 'd9', type: 'task', from: 'batat', day: 'month', date: '13 листопада', seen: true, read: true,
      title: 'Доручення №9', lines: ['Знайти в Сільпо три круглі речі й купити їх.', 'Кавун рахується за дві.'],
      task: task('Купити три круглі речі', 'до вечора середи', '60 забобонусів', 'done')},
    {id: 'a4', type: 'announce', from: 'uriad', day: 'month', date: '11 листопада', seen: true, read: true,
      title: 'Чайка тепер крикне, коли прийде лист', lines: ['Звук можна вимкнути в налаштуваннях.']},
    {id: 'd8', type: 'task', from: 'batat', day: 'month', date: '6 листопада', seen: true, read: true,
      title: 'Доручення №8', lines: ['Купити щось, що шурхотить.', 'Пакетик не рахується. Ми перевіряли.'],
      task: task('Купити щось, що шурхотить', 'до вечора середи', '50 забобонусів', 'done')},
    {id: 'a3', type: 'announce', from: 'uriad', day: 'month', date: '5 листопада', seen: true, read: true,
      title: 'Відчинився Парк Атракціонів', lines: ['Каруселі крутяться.', 'Квитки — у Парку.']},
    {id: 'a1', type: 'announce', from: 'uriad', day: 'month', date: '1 листопада', seen: true, read: true,
      title: 'Чайка тепер носить твою пошту', lines: ['Прийде лист — принесе. І крикне.']},
    {id: 'd7', type: 'task', from: 'batat', day: 'older', date: '30 жовтня', seen: true, read: true,
      title: 'Доручення №7', lines: ['Принести додому щось кисле.'],
      task: task('Купити щось кисле', 'до вечора середи', '30 забобонусів', 'done')},
    ...REWARDS
  ];

  /* стан пам'ятається між заходами (знята булька не повертається); «Скинути» в панелі — повертає все як було */
  const KEY = 'mc-arch-v11';
  const S = {letters: structuredClone(INIT), open: null, extra: 0, tab: 'ui', screen: 'home', expanded: new Set()};
  try {
    S.tab = localStorage.getItem('mc-tab') === 'arch' ? 'arch' : 'ui';
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && Array.isArray(saved.letters)) { S.letters = saved.letters; S.extra = saved.extra || 0; }
  } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({letters: S.letters, extra: S.extra})); } catch (e) {} };

  /* ---------- розмітка ---------- */
  const tabs = document.createElement('div');
  tabs.className = 'ar-tabs';
  tabs.innerHTML = '<button data-t="ui">Інтерфейс</button><button data-t="arch">Архітектура</button>';
  const ar = document.createElement('section');
  ar.className = 'ar'; ar.hidden = true;
  ar.innerHTML = '<div class="ar-sum"></div><div class="ar-list"></div>';
  /* відкритий лист — модалка по центру екрана, як у квестах: затемнення, картка з хрестиком, дія під карткою */
  const modal = document.createElement('div');
  modal.className = 'ar-open'; modal.hidden = true;
  modal.innerHTML = '<div class="ar-modal"><div class="ar-paper"></div><div class="ar-acts"></div></div>';
  phone.append(ar, modal);
  const A = window.__ARCH || {};
  /* шрифти Потойбіччя — ті самі файли, що на сайті зі звуками (PF Expo куплений). Вбудовані в прототип */
  const fonts = document.createElement('style');
  const face = (fam, w, k) => A[`arch/${k}.woff2`] ? `@font-face{font-family:"${fam}";font-weight:${w};font-display:block;src:url("${A[`arch/${k}.woff2`]}") format("woff2")}` : '';
  fonts.textContent = face('Nyght Serif', 400, 'nyght-serif') + face('PF Expo', '600 700', 'pf-expo-semibold') +
    face('Silpo Text', 400, 'silpo-text-regular') + face('Silpo Text', 500, 'silpo-text-medium') + face('Silpo Text', 600, 'silpo-text-semibold');
  document.head.append(fonts);
  if (A['arch/btn_left.png']) phone.style.setProperty('--ar-ico-left', `url("${A['arch/btn_left.png']}")`);
  if (A['arch/iOS.png']) phone.style.setProperty('--ar-status', `url("${A['arch/iOS.png']}")`);
  if (A['arch/btn_settings.png']) phone.style.setProperty('--ar-ico-gear', `url("${A['arch/btn_settings.png']}")`);
  const gear = document.createElement('button');
  gear.className = 'ar-gear'; gear.setAttribute('aria-label', 'Налаштування');
  phone.querySelector('.top')?.append(gear);
  phone.classList.add('ar-has-tabs');

  const side = document.createElement('div');
  side.className = 'ar-side'; side.hidden = true;
  /* панель праворуч: тільки контроли. Тексти (наша легенда й Танчин підпис) — у модалці «Опис» */
  const LEGEND = `
    <h4>Архітектура · типи</h4>
    <ul>
      <li><b>Доручення</b> — завдання від Великого Батата: що зробити, термін, нагорода. Нагороду забирають у самому листі.</li>
      <li><b>Анонс</b> — новини, щось з'явилось. Сюди ж поки йдуть листи Їдола, новини й листи Чайки; назви ще зміняться.</li>
      <li><b>Винагороди</b> — одна плашка на день із підсумком. Сьогоднішня жива: кожна нарахована нагорода одразу додається. Опівночі завмирає — це підсумок дня. Шеврон розгортає джерела: Бондуелі й міні-ігри — одним рядком, завдання — назвами, чеки — сумою й датою. Лише вже нараховане; що треба забрати — окремим листом. Рідкісне (рівень-віха, статус) — окремою карткою.</li>
    </ul>
    <h4>Частота</h4>
    <ul>
      <li><b>Анонс</b> (Таємний уряд) — не більше одного на день.</li>
      <li><b>Доручення</b> (Великий Батат) — 1–2 рази на тиждень.</li>
      <li><b>Винагороди</b> — залежать від активності гостя: скільки заробив, стільки квитанцій.</li>
    </ul>
    <h4>Відправники</h4>
    <p><b>Великий Батат</b> — тільки Доручення. <b>Таємний уряд</b> — ми, продукт: звичайні листи.</p>
    <h4>Стани</h4>
    <ul>
      <li><b>Непереглянуто</b>: червона булька в правому верхньому куті плашки. Гасне тільки, коли гість прокрутив список і булька дійшла до верху. Більше не повертається. Від цього залежить «!» у Чайки на Хоумспейсі. На плашці винагород бульки нема.</li>
      <li><b>Непрочитано</b>: яскрава обводка й легка заливка. Знімається відкриттям листа або «Прочитати всі». Переглянуте й винагороди — тьмяна обводка, тьмяніший заголовок. Срібляста рамка 4 px — тільки в Доручення Батата; поки не прийняте — біжучий рядок «Тільки сьогодні, тільки зараз».</li>
      <li><b>Відзнака</b> — між винагородою й листом: плашка з нагородами, тег і рядок тексту, відкривається листом.</li>
      <li><b>Хоумспейс</b>: булька на іконці пошти світиться, поки в розділі є хоч один непереглянутий лист (винагороди не рахуються). Виняток — доручення від Батата: поки воно непрочитане й термін не сплив, булька світиться екстра і гасне лише тоді, коли лист відкрили (прочитаність, а не перегляд). Гасне разом з останньою булькою в розділі. Після «Скинути» — світиться.</li>
      <li><b>Лист</b> відкривається модалкою по центру: затемнення, хрестик, дія під карткою.</li>
      <li><b>Доручення</b>: нове → виконується → виконано (приходить «Відповідь Батата» з нагородою) | наступного разу (не виконав або сплив термін).</li>
    </ul>`;
  side.innerHTML = `<div class="ar-ctl">
      <span class="ar-lbl">Що прийшло</span>
      <button class="ar-row ar-tgl" role="switch" aria-checked="false"><span>Є новий лист від Батата</span><i></i></button>
      <div class="ar-btns"><button class="ar-btn2 ar-check-in">Чек прийшов</button><button class="ar-btn2 ar-expire">Термін сплив</button></div>
      <div class="ar-btns"><button class="ar-btn2 ar-add">+ Винагорода</button><button class="ar-btn2 ar-reset">Скинути</button></div>
    </div>`;
  const sideHost = document.querySelector('aside.side');
  if (sideHost) sideHost.append(side);
  /* перемикач Інтерфейс / Архітектура — першим блоком у панелі праворуч */
  if (sideHost) sideHost.prepend(tabs); else document.body.append(tabs);
  const capEl = sideHost && sideHost.querySelector('.cap');
  const foot = document.createElement('div');
  foot.className = 'ar-foot';
  const infoBtn = document.createElement('button');
  infoBtn.className = 'ar-btn2 ar-info'; infoBtn.textContent = 'Опис';
  foot.append(infoBtn);
  if (sideHost) sideHost.append(foot);
  const doc = document.createElement('div');
  doc.className = 'ar-doc'; doc.hidden = true;
  doc.innerHTML = '<div class="ar-doc-box"><button class="ar-doc-x" aria-label="Закрити"></button><div class="ar-doc-body"></div></div>';
  document.body.append(doc);
  /* «Опис» показує текст поточної вкладки: в Інтерфейсі — Танчин підпис, в Архітектурі — наша легенда */
  infoBtn.addEventListener('click', () => {
    doc.querySelector('.ar-doc-body').innerHTML = S.tab === 'arch' ? LEGEND : `<h4>Інтерфейс</h4><p>${capEl ? capEl.innerHTML : ''}</p>`;
    doc.hidden = false;
  });
  doc.addEventListener('click', e => { if (e.target === doc || e.target.closest('.ar-doc-x')) doc.hidden = true; });
  addEventListener('keydown', e => { if (e.key === 'Escape') doc.hidden = true; });
  /* «Рішення по логіці» — документ для Танчиного Клода (arch/ARKHITEKTURA.md), вбудований у прототип.
     Дата оновлення — з рядка «Оновлено: …» на початку документа */
  const mdInline = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>');
  const md = src => {
    let html = '', list = 0;
    const close = to => { while (list > to) { html += '</ul>'; list--; } };
    src.split('\n').forEach(line => {
      const m = line.match(/^(\s*)- (.*)$/);
      if (m) { const lv = m[1].length / 2 + 1; while (list < lv) { html += '<ul>'; list++; } close(lv); html += `<li>${mdInline(m[2])}</li>`; return; }
      close(0);
      if (/^# /.test(line)) html += `<h3>${mdInline(line.slice(2))}</h3>`;
      else if (/^## /.test(line)) html += `<h4>${mdInline(line.slice(3))}</h4>`;
      else if (line.trim()) html += `<p>${mdInline(line)}</p>`;
    });
    close(0); return html;
  };
  /* два документи обміну контекстом: наш (ARKHITEKTURA.md) і Танчин (INTERFEIS.md); на кнопці — дата «Оновлено» */
  const docBtn = (label, key) => {
    const btn = document.createElement('button');
    btn.className = 'ar-btn2 ar-dec'; btn.innerHTML = `${label}<small></small>`;
    foot.append(btn);
    let text = '';
    if (A[key]) fetch(A[key]).then(r => r.text()).then(t => {
      text = t; const d = (t.match(/^Оновлено:\s*(.+)$/m) || [])[1];
      if (d && d.trim() !== '—') btn.querySelector('small').textContent = 'оновлено ' + d;
      else btn.querySelector('small').textContent = 'ще не заповнено';
    });
    btn.addEventListener('click', () => {
      doc.querySelector('.ar-doc-body').innerHTML = text ? md(text.replace(/^Оновлено:.*$/m, m => `**${m}**`)) : '<p>Документ не завантажився.</p>';
      doc.querySelector('.ar-doc-box').scrollTop = 0; doc.hidden = false;
    });
  };
  docBtn('Рішення по логіці', 'arch/ARKHITEKTURA.md');
  docBtn('Від Інтерфейсу', 'INTERFEIS.md');


  const $sum = ar.querySelector('.ar-sum'), $list = ar.querySelector('.ar-list');
  const $open = modal, $paper = modal.querySelector('.ar-paper'), $acts = modal.querySelector('.ar-acts');

  /* ---------- рендер ---------- */
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const byId = id => S.letters.find(l => l.id === id);
  /* срібний текст: градієнт + обведення ВСЕРЕДИНУ літер (щоб не товщали).
     Під низом — та сама літера світлим кольором, згори — градієнт, «з'їдений» фільтром на півпікселя: світлий край лишається всередині */
  const silver = t => `<b class="ar-silver" data-t="${esc(t)}"><span>${esc(t)}</span></b>`;
  if (!document.getElementById('arErode')) document.body.insertAdjacentHTML('beforeend',
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="arErode" x="-5%" y="-5%" width="110%" height="110%"><feMorphology operator="erode" radius="0.6"/></filter></svg>');
  const avaHtml = l => {
    const s = SENDERS[l.from];
    return `<span class="ar-ava${s.tbd ? ' tbd' : ''}">${silver(s.ini)}</span>`;
  };
  const stageName = st => (STAGES.find(x => x[0] === st) || [, ''])[1];
  /* теги над заголовком: тип і етап доручення */
  function tagsHtml(l) {
    let s = `<span class="ar-tag t-${l.type}">${TYPES[l.type].name}</span>`;
    if (l.type === 'task' && l.task.stage !== 'new') s += `<span class="ar-tag st st-${l.task.stage}">${stageName(l.task.stage)}</span>`;
    if (l.type === 'thanks' && l.claimed) s += '<span class="ar-tag st st-done">Нагороду забрано</span>';
    return `<span class="ar-tags">${s}</span>`;
  }

  const plural = (n, one, few, many) => {
    const a = n % 10, b = n % 100;
    return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many;
  };
  const unreadLbl = n => plural(n, 'непрочитаний лист', 'непрочитані листи', 'непрочитаних листів');
  const TICKS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12.5l4.5 4.5L15 8.5M9.5 16.5l.5.5L22 6"/></svg>';

  /* ---------- лічильник-барабан (як у послідовників): кожна цифра — окремий барабан;
     одиниці крутяться безперервно, старший розряд провертається, коли молодший переходить 9↔0;
     спершу мчить, під кінець плавно сідає на точне число. ---------- */
  const DRUM = '<span class="ar-strip">' + [0,1,2,3,4,5,6,7,8,9,0].map(d => `<i>${d}</i>`).join('') + '</span>';
  function drumSet(el, v, cols) {
    while (el.children.length < cols) el.insertAdjacentHTML('afterbegin', `<span class="ar-d">${DRUM}</span>`);
    while (el.children.length > cols) el.firstElementChild.remove();
    [...el.children].forEach((col, j) => {
      const k = cols - 1 - j, p = 10 ** k;
      let pos = k === 0 ? v % 10 : Math.floor(v / p) % 10;
      if (k > 0) { const below = v % p; if (below > p - 1) pos += below - (p - 1); }   /* перенос із молодшого розряду */
      col.firstElementChild.style.transform = `translateY(${-pos}em)`;
      const lead = k > 0 ? Math.max(0, Math.min(1, v - (p - 1))) : 1;                  /* зайвий нуль попереду гасне */
      col.style.opacity = lead;
      col.style.width = lead ? '' : '0';
    });
  }
  let drumRaf = 0;
  function drumRoll(el, from, to, ms, onFrame) {
    cancelAnimationFrame(drumRaf);
    const cols = String(Math.max(from, to, 0)).length;
    const quick = matchMedia('(prefers-reduced-motion: reduce)').matches;
    return new Promise(res => {
      if (quick || from === to) { drumSet(el, to, cols); onFrame && onFrame(to, 1); return res(); }
      const t0 = performance.now(), ease = t => 1 - Math.pow(1 - t, 3);
      const step = now => {
        const t = Math.min(1, (now - t0) / ms), v = from + (to - from) * ease(t);
        drumSet(el, v, cols); onFrame && onFrame(v, t);
        if (t < 1) drumRaf = requestAnimationFrame(step); else res();
      };
      drumRaf = requestAnimationFrame(step);
    });
  }

  function renderSum(roll) {
    const n = S.letters.filter(l => !l.read).length;
    if (!n) {
      $sum.innerHTML = `<div class="ar-unread done"><span class="ar-u-ico">${TICKS}</span><span class="ar-u-lbl">Усе прочитано</span></div>`;
      return;
    }
    $sum.innerHTML = `<div class="ar-unread"><span class="ar-u-num"></span><span class="ar-u-lbl">${unreadLbl(n)}</span>
      <button class="ar-u-act" aria-label="Прочитати всі">${TICKS}<span>Прочитати всі</span></button></div>`;
    const num = $sum.querySelector('.ar-u-num');
    if (roll) drumRoll(num, 0, n, 650); else drumSet(num, n, String(n).length);
  }

  /* картка листа — за макетом (Figma 96:894): теги, аватар ліворуч, назва й перший рядок. Срібляста рамка 4 px — лише в Доручення Батата */
  /* булька «непереглянуто» — в одному місці для всіх: правий верхній кут плашки */
  /* доручення Батата з незакінченим терміном: булька живе за прочитаністю й світиться хвилями (як на Хоумспейсі) */
  /* «живий» лист Батата (булька за прочитаністю, з хвилями): нове доручення або відповідь Батата, поки не прочитані */
  const isBatatLive = l => l.from === 'batat' && !l.read && ((l.type === 'task' && l.task.stage === 'new') || l.type === 'thanks');
  const bubHtml = l => isBatatLive(l) ? '<i class="ar-bub ar-wave" title="Непрочитане доручення"></i>' : l.seen ? '' : '<i class="ar-bub" title="Непереглянуто"></i>';
  /* нове доручення, поки не прийняте: біжить рядок «Тільки сьогодні, тільки зараз» поруч із тегом */
  const TICK = 'Тільки сьогодні, тільки зараз';
  /* соціальний доказ: скільки гостей уже прийняли доручення. Знак за виконане — у колекцію (назва ще умовна) */
  const SEAL = 'Сургуч Батата';
  const progLeft = () => { const n = new Date(), e = new Date(n); e.setHours(23, 59, 0, 0); return Math.max(0, e - n); };
  const progHtml = l => {
    const left = progLeft(), h = Math.floor(left / 36e5), m = Math.floor(left % 36e5 / 6e4);
    const p = Math.max(.04, Math.min(1, left / (12 * 36e5)));   /* вікно доручення — умовно з полудня до кінця дня */
    return `<span class="ar-prog"><span class="ar-prog-bar"><i style="width:${(p * 100).toFixed(1)}%"></i></span><span class="ar-prog-txt"><span>Чекаємо чек</span><b>лишилось ${h} год ${m} хв</b></span></span>`;
  };
  const proofTxt = n => `${n} ${plural(n, 'гість уже прийняв', 'гості вже прийняли', 'гостей уже прийняли')}`;
  const tickHtml = l => l.type === 'task' && l.task.stage === 'new'
    ? `<span class="ar-tick" aria-label="${TICK}"><span>${Array(6).fill(`<i>${TICK}</i>`).join('')}</span></span>` : '';
  function cardHtml(l) {
    return `<button class="ar-card t-${l.type}${l.read ? '' : ' unread'}" data-id="${l.id}">${bubHtml(l)}<span class="ar-card-in"><span class="ar-tagrow">${tagsHtml(l)}${tickHtml(l)}</span>
        <span class="ar-top">${avaHtml(l)}<span class="ar-txt"><h3>${esc(l.title)}</h3><p>${esc(l.lines[0])}</p>${l.type === 'task' && l.task.committed && l.task.stage === 'new' ? `<small class="ar-proof">${proofTxt(l.task.committed)}</small>` : ''}</span></span>${l.type === 'task' && l.task.stage === 'accepted' ? progHtml(l) : ''}
        <span class="ar-meta"><span>${esc(l.date)}</span><span>${esc(SENDERS[l.from].name)}</span></span>
      </span></button>`;
  }
  /* рядок валют: срібні значки + срібні числа (як у макеті) */
  const CUR = {m: 'arch/cur-m.png', z: 'arch/cur-z.png', k: 'arch/cur-k.png', t: 'arch/cur-t.png'};
  const gainRow = g => `<span class="ar-gain">${['m', 'z', 'k', 't', 'b', 'x', 's'].filter(k => g[k]).map(k => CUR[k] && A[CUR[k]]
      ? `<span><img src="${A[CUR[k]]}" alt="${G[k]}">${silver('+' + g[k])}</span>`
      : `<span>${silver(`${G[k]} ×${g[k]}`)}</span>`).join('')}</span>`;
  /* плашка «Винагороди» за день: назва, підсумок дня значками, час; тап розгортає джерела */
  function rewardsHtml(l) {
    const sum = sumOf(itemsOf(l)), open = S.expanded.has(l.id);
    const when = ({today: 'Сьогодні', yesterday: 'Вчора'}[l.day] ? `${({today: 'Сьогодні', yesterday: 'Вчора'})[l.day]}, ` : '') + l.date;
    return `<div class="ar-rw${l.read ? '' : ' unread'}${open ? ' open' : ''}" data-id="${l.id}">
        <button class="ar-rw-head"><b class="ar-rw-title">${esc(l.title)}</b>${gainRow(sum)}
          <span class="ar-meta"><span>${esc(when)}</span><span class="ar-rw-more"><svg viewBox="0 0 24 24" aria-label="Розгорнути"><path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg></span></span></button>
        <div class="ar-rw-list"><div>${l.parts.map(p => partHtml(p, l.day)).join('')}</div></div>
      </div>`;
  }
  /* Відзнака — між плашкою винагород і анонсом, ближче до винагород: та сама плашка й срібні нагороди,
     але з тегом і рядком тексту, без відправника; тап відкриває лист-модалку */
  const RARE_ICO = [[/^мммм/i, 'm'], [/^забобон/i, 'z'], [/^келих/i, 'k'], [/^квит/i, 't']];
  function rareHtml(l) {
    const chips = l.items.map(([n, v]) => {
      const k = (RARE_ICO.find(([re]) => re.test(n)) || [])[1];
      return k && A[CUR[k]] ? `<span><img src="${A[CUR[k]]}" alt="${esc(n)}">${silver(v)}</span>`
        : `<span>${silver(n + (v === '×1' ? '' : ' ' + v))}</span>`;
    }).join('');
    return `<button class="ar-rw ar-rare${l.read ? '' : ' unread'}" data-id="${l.id}"><span class="ar-rw-head">${tagsHtml(l)}
        <span class="ar-txt"><b class="ar-rw-title">${esc(l.title)}</b><span class="ar-rare-txt">${esc(l.lines[0])}</span></span>
        <span class="ar-gain">${chips}</span>
        <span class="ar-meta"><span>${esc(l.date)}</span></span></span>${bubHtml(l)}</button>`;
  }
  /* розгортка: завдання — назви закреслені (виконано); чеки — сума · час; Бондуелі й міні-ігри — одним рядком */
  const MASS = {'Бондуелі': it => {
      const c = {}; it.forEach(([w]) => { const k = w.split(' · ')[0]; c[k] = (c[k] || 0) + 1; });
      const f = {'Перемога': ['перемога', 'перемоги', 'перемог'], 'Нічия': ['нічия', 'нічиї', 'нічиїх'], 'Поразка': ['поразка', 'поразки', 'поразок']};
      return Object.keys(f).filter(k => c[k]).map(k => `${c[k]} ${plural(c[k], ...f[k])}`).join(', ');
    },
    'Міні-ігри': () => ''};   /* міні-ігри — без переліку, лише кількість і сума */
  /* дата чека: «22 листопада, 12:16» (як на картках) — день беремо з групи (сьогодні / вчора) */
  const dateOf = (day, time) => {
    const d = new Date(); if (day === 'yesterday') d.setDate(d.getDate() - 1);
    return `${d.toLocaleDateString('uk-UA', {day: 'numeric', month: 'long'})}, ${time}`;
  };
  function partHtml([name, it], day) {
    let body;
    if (MASS[name]) { const t = MASS[name](it); body = t ? `<p>${esc(t)}</p>` : ''; }
    else if (name === 'Чеки') body = it.map(([w, time]) => `<p class="ar-check"><span>${esc(w.replace(/^Покупка на /, ''))}</span><i></i><time>${esc(dateOf(day, time))}</time></p>`).join('');
    else body = it.map(([w]) => `<p class="ar-done">${esc(w)}</p>`).join('');
    return `<div class="ar-sec"><i class="ar-line"></i><small>${esc(name)}${MASS[name] ? ` · ${it.length}` : ''}</small>${body}${gainRow(sumOf(it))}</div>`;
  }
  function renderList() {
    if (!S.letters.length) { $list.innerHTML = '<p class="ar-empty">Листів поки немає.<br>Щойно щось прийде — Чайка принесе.</p>'; return; }
    $list.innerHTML = DAYS.map(([d, name]) => {
      const ls = S.letters.filter(l => dayOf(l) === d);
      return ls.length ? `<h4 class="ar-day">${name}</h4>` + ls.map(l => l.type === 'rewards' ? rewardsHtml(l) : l.type === 'rare' ? rareHtml(l) : cardHtml(l)).join('') : '';
    }).join('');
    S.letters.filter(isSpoiled).forEach(l => dustOn($list.querySelector(`.ar-card[data-id="${l.id}"] .ar-txt p`)));
  }

  function renderOpen() {
    const l = byId(S.open);
    if (!l) { hideModal(); return; }
    let acts = '', body = l.lines.map(t => `<p>${esc(t)}</p>`).join('');
    if (l.type === 'task') {
      const t = l.task, st = t.stage;
      /* одна кнопка «Прийняти й виконати»: фіксує прийняття й веде туди, де виконується умова.
         Виконання — чек, що підходить під умову; тоді приходить окремий лист «Відповідь Батата» з нагородою */
      body += `<div class="ar-block">
        <div><small>Що зробити</small><span>${esc(t.what)}</span></div>
        <div><small>Термін</small><span>${esc(t.term)}</span></div>
        <div><small>Вигода</small><span>${esc(t.prize)}</span></div>
        ${t.gain ? `<div><small>Нагорода Потойбіччя</small><span>${gainRow(t.gain)}${t.seal ? `<b class="ar-seal">+ ${SEAL}</b>` : ''}</span></div>` : ''}</div>`;
      if (st === 'new') { body += t.committed ? `<p class="ar-proof">${proofTxt(t.committed)}</p>` : ''; acts = '<button class="ar-btn" data-act="accept">Прийняти й виконати</button>'; }
      if (st === 'accepted') { body += progHtml(l) + '<p class="ar-note">Зарахуємо, щойно прийде чек онлайн-замовлення з піцою — після збирання.</p>'; acts = '<button class="ar-btn" data-act="shop">До покупок</button>'; }
      if (st === 'done') body += '<p class="ar-note">Виконано. Батат надіслав відповідь — нагорода в ній.</p>';
      if (st === 'missed') body += '<p class="ar-note">Цього разу не склалося. Батат ще повернеться з новим дорученням.</p>';
    }
    if (l.type === 'thanks') {
      body += `<div class="ar-block"><div><small>Нагорода Потойбіччя</small><span>${gainRow(l.gain)}${l.seal ? `<b class="ar-seal">+ ${SEAL}</b>` : ''}</span></div></div>`;
      if (!l.claimed) acts = '<button class="ar-btn" data-act="claim">Забрати нагороду</button>';
      else body += `<p class="ar-note">Нагороду забрано.${l.seal ? ` ${SEAL} — у твоїй колекції.` : ''}</p>`;
    }
    if (l.type === 'parcel' || l.type === 'rare') {
      body += `<div class="ar-block">${l.items.map(([n, v]) => `<div><span>${esc(n)}</span><span>${esc(v)}</span></div>`).join('')}</div>
        <p class="ar-note">Посилка — це звіт: усе вже нараховано. Від кого вона приходить, ще вирішуємо.</p>`;
    }
    if (l.type === 'announce' && l.cta) acts = `<button class="ar-btn">${esc(l.cta)}</button>`;
    $paper.innerHTML = `<button class="ar-x" aria-label="Закрити"></button>${tagsHtml(l)}<div class="ar-top"><div class="ar-txt"><h2>${esc(l.title)}</h2></div>${avaHtml(l)}</div>
      <div class="ar-meta"><span>${esc(l.date)}</span><span>${esc(SENDERS[l.from].name)}</span></div>${body}`;
    $acts.innerHTML = acts;
    if (S.reveal === l.id) { S.reveal = null; requestAnimationFrame(() => dustOn($paper.querySelector('.ar-txt ~ p, p'), true)); }
    if ($open.hidden) { $open.hidden = false; $paper.scrollTop = 0; requestAnimationFrame(() => requestAnimationFrame(() => $open.classList.add('in'))); }
  }
  let hideT;
  function hideModal() {
    if ($open.hidden) return;
    $open.classList.remove('in'); clearTimeout(hideT);
    hideT = setTimeout(() => { if (!S.open) $open.hidden = true; }, 220);
  }
  /* закрити: хрестик або тап по затемненню */
  $open.addEventListener('click', e => {
    /* закриваємо лише по хрестику або по самому затемненню (кнопки дій перемальовуються — їхній клік сюди не рахуємо) */
    if (e.target.closest('.ar-x') || e.target === $open || e.target.classList.contains('ar-modal')) { S.open = null; render(false); }
  });

  /* ---------- Хоумспейс (архітектура) ----------
     Беремо Танчин Хоумспейс як підкладку, але без її анімацій: лишається тільки іконка пошти.
     Булька на іконці підпорядковується логіці бульок у розділі: світиться, поки є хоч один непереглянутий лист
     (винагороди не рахуються — у них бульки нема). Гасне, коли в розділі погасла остання. */
  const intro = document.getElementById('intro'), mailIco = document.getElementById('mailIcon');
  const hasUnseen = () => S.letters.some(l => l.type !== 'rewards' && !l.seen);
  /* Єдиний виняток із логіки «переглянуто»: доручення від Батата.
     Поки є непрочитаний «живий» лист Батата (нове доручення або відповідь Батата), булька на іконці підпорядковується
     його ПРОЧИТАНОСТІ (світиться екстра й гасне, лише коли лист відкрили). Інакше — звичайна логіка непереглянутих.
     Сплив термін — доручення переходить у «Наступного разу» й перестає бути живим */
  const batatPending = () => S.letters.some(isBatatLive);
  const syncHomeDot = () => {
    if (!mailIco) return;
    const batat = batatPending();
    mailIco.classList.toggle('ar-unseen', batat || hasUnseen());
    mailIco.classList.toggle('ar-batat', batat);
  };
  let introWasHidden = null;
  function applyScreen() {
    const arch = S.tab === 'arch', home = arch && S.screen === 'home';
    phone.classList.toggle('ar-home', home);
    ar.hidden = !arch || home;
    if (intro) {
      if (arch) { if (introWasHidden === null) introWasHidden = intro.hidden; intro.hidden = !home; }
      else if (introWasHidden !== null) { intro.hidden = introWasHidden; introWasHidden = null; }
    }
    syncHomeDot();
  }
  function go(screen) { S.screen = screen; S.open = null; applyScreen(); if (screen === 'mail') { $list.scrollTop = 0; placeUnderBar(); fitTitle(); } render(true); }
  /* в архітектурі Хоумспейс живе за нашою логікою: тап по іконці пошти — у розділ, решта Танчиних дій вимкнена */
  if (intro) intro.addEventListener('click', e => {
    if (S.tab !== 'arch') return;
    e.stopImmediatePropagation(); e.preventDefault();
    if (e.target.closest('#mailIcon')) go('mail');
  }, true);

  /* тогл «Є новий лист від Батата»: додає свіже непрочитане й непереглянуте доручення або прибирає його */
  const BATAT = 'd10', tgl = side.querySelector('.ar-tgl');
  const syncTgl = () => { const on = !!byId(BATAT); tgl.classList.toggle('on', on); tgl.setAttribute('aria-checked', on); };
  tgl.addEventListener('click', () => {
    if (byId(BATAT)) S.letters = S.letters.filter(l => l.id !== BATAT);
    else S.letters.unshift(structuredClone(INIT.find(l => l.id === BATAT)));
    S.open = null; save(); render(true);
  });


  /* ---------- Спойлер «магічний пил» ----------
     Текст нового доручення Батата схований під пилом, що мерехтить (як спойлер у Telegram).
     У листі після відкриття пил розчиняється й проступає текст. У продукті — Lottie/JSON-анімація; тут — canvas */
  const isSpoiled = l => isBatatLive(l) && l.type === 'task';
  const dusts = new Set();
  let dustRaf = 0;
  function dustOn(el, reveal) {
    if (!el || el._dust) return;
    const w = el.offsetWidth, h = el.offsetHeight; if (!w || !h) return;
    const c = document.createElement('canvas'), R = 3;
    c.className = 'ar-dust'; c.width = w * R; c.height = h * R;
    el.classList.add('ar-spoil'); el.append(c);
    const n = Math.round(w * h / 9), P = [];
    for (let i = 0; i < n; i++) P.push({x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
      r: .5 + Math.random() * .7, a: Math.random(), da: (Math.random() - .5) * .04});
    const d = {el, c, ctx: c.getContext('2d'), w, h, R, P, t0: 0, reveal};
    el._dust = d; dusts.add(d);
    if (!dustRaf) dustRaf = requestAnimationFrame(dustTick);
  }
  function dustTick(now) {
    dustRaf = 0;
    dusts.forEach(d => {
      if (!d.el.isConnected) { dusts.delete(d); return; }
      const {ctx, w, h, R, P} = d;
      let k = 1;   /* 1 — повний пил, 0 — розчинився */
      if (d.reveal) {
        if (!d.t0) { d.t0 = now + 350; P.forEach(p => { const a = Math.atan2(p.y - h / 2, p.x - w / 2), s = .6 + Math.random() * 1.6; p.ex = Math.cos(a) * s; p.ey = Math.sin(a) * s - .4; }); }
        k = Math.max(0, 1 - Math.max(0, now - d.t0) / 1100);
        d.el.style.setProperty('--ar-reveal', 1 - k);
      }
      ctx.setTransform(R, 0, 0, R, 0, 0); ctx.clearRect(0, 0, w, h);
      P.forEach(p => {
        const out = d.reveal && now > d.t0;
        p.x += p.vx + (out ? p.ex * (1.2 - k) : 0); p.y += p.vy + (out ? p.ey * (1.2 - k) : 0);
        if (!out) { if (p.x < 0) p.x += w; if (p.x > w) p.x -= w; if (p.y < 0) p.y += h; if (p.y > h) p.y -= h; }
        p.a += p.da; if (p.a < .15 || p.a > 1) p.da *= -1;
        ctx.globalAlpha = Math.max(0, Math.min(1, p.a)) * k;
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      });
      if (d.reveal && k === 0) { d.c.remove(); d.el.classList.remove('ar-spoil'); d.el.style.removeProperty('--ar-reveal'); d.el._dust = null; dusts.delete(d); }
    });
    if (dusts.size) dustRaf = requestAnimationFrame(dustTick);
  }

  /* ---------- «Прийняти й виконати» → каталог Сільпо ----------
     Нативний перехід: каталог виїжджає справа, розділ трохи відходить ліворуч. «Назад» повертає в розділ */
  const cat = document.createElement('div');
  cat.className = 'ar-cat'; cat.hidden = true;
  cat.innerHTML = `<div class="ar-cat-bar"><button class="ar-cat-back" aria-label="Назад"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button><b>Піца</b><i></i></div>
    <div class="ar-cat-body"><div class="ar-cat-promo"><small>Доручення Батата · тільки сьогодні</small><b>−50% на піцу</b><span>Знижка застосується до чека після збирання</span></div>
    <div class="ar-cat-grid">${[['Маргарита', 189], ['Пепероні', 229], ['Чотири сири', 249], ['Гавайська', 219], ['З грибами', 209], ['Діабола', 239]].map(([t, p]) => `<span><i></i>${t}<em><s>${p} ₴</s> ${Math.round(p / 2)} ₴</em></span>`).join('')}</div></div>`;
  phone.append(cat);
  let catT = 0;
  function pushCat() {
    clearTimeout(catT); cat.hidden = false; cat.offsetWidth;   /* перерахунок — щоб перехід стартував з-за краю */
    phone.classList.add('ar-pushed');
  }
  function popCat() {
    phone.classList.remove('ar-pushed');
    catT = setTimeout(() => { cat.hidden = true; }, 380);
  }
  cat.querySelector('.ar-cat-back').addEventListener('click', popCat);

  function render(roll) { renderSum(roll); renderList(); renderOpen(); syncHomeDot(); syncTgl(); }

  /* ---------- «переглянуто»: тільки прокручуванням ----------
     Під час прокрутки дивимось на кожну червону бульку: щойно вона підходить до верхнього краю списку
     (тобто гість догорнув лист до верху), булька гасне від центру й лист стає переглянутим. */
  const SEEN_EDGE = 12;   /* px від верхнього краю списку, де булька гасне */
  let scrollRaf = 0;
  function checkSeen() {
    scrollRaf = 0;
    const edge = $list.getBoundingClientRect().top + SEEN_EDGE;
    /* останні листи до верху вже не догорнути: коли гість долистав до самого низу, гаснуть і їхні бульки */
    const atEnd = $list.scrollTop + $list.clientHeight >= $list.scrollHeight - 2;
    let changed = false;
    $list.querySelectorAll('.ar-bub:not(.pop):not(.ar-wave)').forEach(b => {
      if (b.getBoundingClientRect().top > edge && !atEnd) return;
      const l = byId(b.closest('[data-id]').dataset.id);
      l.seen = true; changed = true;
      b.classList.add('pop');
      b.addEventListener('animationend', () => b.remove(), {once: true});
    });
    if (changed) { save(); syncHomeDot(); }
  }
  /* віджет непрочитаних ховається, щойно гість почав гортати, і повертається тільки на самому верху списку
     (два різні пороги, щоб на межі не блимав) */
  function syncSum() {
    const y = $list.scrollTop;
    if (y > 24) $sum.classList.add('hide');
    else if (y <= 2) $sum.classList.remove('hide');
  }
  /* контент м'яко тане, заходячи під апбар: альфа-маска зверху, що наростає з прокруткою (на самому верху її немає) */
  const syncFade = () => $list.style.setProperty('--ar-fade', Math.min($list.scrollTop, 40) + 'px');
  $list.addEventListener('scroll', () => {
    syncSum(); syncFade();
    if (!scrollRaf) scrollRaf = requestAnimationFrame(checkSeen);
  }, {passive: true});

  /* заголовок має влізти між кнопками (257px за макетом): без PF Expo запасний шрифт ширший */
  function fitTitle() {
    const h = phone.querySelector('.top h1'); if (!h) return;
    h.style.fontSize = '';
    if (S.tab !== 'arch') return;
    let size = 32;
    while (h.scrollWidth > 257 && size > 18) h.style.setProperty('font-size', (--size) + 'px', 'important');
  }
  document.fonts && document.fonts.ready.then(fitTitle);

  /* список починається під шапкою і на OVERLAP px заходить під неї: там і тане альфа-градієнт */
  const OVERLAP = 20;
  function placeUnderBar() {
    const top = phone.querySelector('.top'); if (!top) return;
    requestAnimationFrame(() => {
      const pr = phone.getBoundingClientRect(), tr = top.getBoundingClientRect();
      ar.style.top = Math.round(tr.bottom - pr.top) - OVERLAP + 'px';   /* список трохи заходить під апбар */
    });
  }
  addEventListener('resize', () => { if (S.tab === 'arch') placeUnderBar(); });

  function setTab(t) {
    S.tab = t;
    try { localStorage.setItem('mc-tab', t); } catch (e) {}
    tabs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
    phone.classList.toggle('ar-mode', t === 'arch');
    document.body.classList.toggle('ar-arch', t === 'arch');
    side.hidden = t !== 'arch';
    if (t === 'arch') S.screen = 'home';   /* архітектура завжди починається з Хоумспейсу */
    applyScreen(); placeUnderBar(); fitTitle();
    if (t === 'arch') { S.open = null; render(true); }
  }

  /* ---------- події ---------- */
  tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setTab(b.dataset.t); });

  /* «Прочитати всі»: барабан відкручує число до нуля, і в такт йому картки згори вниз стають прочитаними */
  let readingAll = false;
  $sum.addEventListener('click', async e => {
    if (!e.target.closest('.ar-u-act') || readingAll) return;
    readingAll = true;
    const w = $sum.querySelector('.ar-unread'), num = $sum.querySelector('.ar-u-num'), lbl = $sum.querySelector('.ar-u-lbl');
    w.classList.add('busy');
    const cards = [...$list.querySelectorAll('.unread')], n = S.letters.filter(l => !l.read).length;
    let lit = 0;
    await drumRoll(num, n, 0, 650, v => {
      const gone = n - Math.ceil(v - 0.001);
      while (lit < gone && lit < cards.length) cards[lit++].classList.remove('unread');   /* картка гасне через CSS-переходи */
      lbl.textContent = unreadLbl(Math.max(1, Math.round(v)));
    });
    cards.forEach(c => c.classList.remove('unread'));
    S.letters.forEach(l => { if (isBatatLive(l)) l.seen = true; l.read = true; });
    /* доручення Батата прочитане — його хвиляста булька гасне так само, як звичайні */
    $list.querySelectorAll('.ar-bub.ar-wave').forEach(b => { b.classList.add('pop'); b.addEventListener('animationend', () => b.remove(), {once: true}); });
    save(); syncHomeDot();
    await new Promise(r => setTimeout(r, 180));
    readingAll = false;
    renderSum(false);
    const done = $sum.querySelector('.ar-unread.done');
    if (done) done.classList.add('arrive');
  });

  $list.addEventListener('click', e => {
    const g = e.target.closest('.ar-rw-head');
    if (g && !g.closest('.ar-rare')) {   /* група винагород: розгорнути/згорнути на місці, прочитана — щойно розгорнули */
      const row = g.parentElement, l = byId(row.dataset.id);
      const open = !S.expanded.has(l.id);
      open ? S.expanded.add(l.id) : S.expanded.delete(l.id);
      row.classList.toggle('open', open);
      if (!l.read) { l.read = true; row.classList.remove('unread'); save(); renderSum(false); }
      return;
    }
    const c = e.target.closest('.ar-card, .ar-rare'); if (!c) return;
    const l = byId(c.dataset.id);
    if (isSpoiled(l)) S.reveal = l.id;   /* у листі пил розчиниться */
    l.read = true; l.seen = true; S.open = l.id;   /* відкрили — отже, і переглянули: булька гасне */ save(); render(false);
  });
  /* стрілка «назад» у шапці: у відкритому листі повертає до списку, інакше — як була (на Хоумспейс) */
  phone.querySelector('.top .back').addEventListener('click', e => {
    if (S.tab !== 'arch') return;
    e.stopImmediatePropagation();
    if (S.open) { S.open = null; render(false); } else go('home');   /* з розділу — назад на Хоумспейс */
  }, true);
  $acts.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const l = byId(S.open);
    const act = b.dataset.act;
    if (act === 'claim') { l.claimed = true; save(); render(false); return; }
    if (act === 'shop') { S.open = null; render(false); setTimeout(pushCat, 180); return; }
    l.task.stage = 'accepted';
    if (l.task.committed) l.task.committed++;   /* гість теж прийняв — лічильник +1 */
    S.open = null; save(); render(false); setTimeout(pushCat, 180); return;   /* одразу туди, де виконується умова */
    save(); render(false);
  });
  /* демо: прилітає нова винагорода — не новий лист, а ще одна квитанція в сьогоднішній групі Бондуелей */
  side.querySelector('.ar-add').addEventListener('click', () => {
    const g = byId('r-day-0'); if (!g) return;
    const now = new Date(), hm = now.toTimeString().slice(0, 5);
    g.parts.find(([n]) => n === 'Бондуелі')[1].unshift(['Перемога · Смачно-Несмачно', hm, {m: 60, z: 10, k: 10}]);
    g.date = hm; g.seen = false; g.read = false;
    S.open = null; save(); render(true);
  });
  /* демо доручення: чек прийшов → доручення «Виконано» + новий лист «Відповідь Батата»; термін сплив → «Наступного разу» */
  side.querySelector('.ar-check-in').addEventListener('click', () => {
    const l = byId(BATAT); if (!l || l.task.stage === 'done' || l.task.stage === 'missed') return;
    l.task.stage = 'done'; l.read = true; l.seen = true;
    const hm = new Date().toTimeString().slice(0, 5);
    S.letters = S.letters.filter(x => x.id !== BATAT + 't');
    S.letters.unshift({id: BATAT + 't', type: 'thanks', from: 'batat', day: 'today', date: 'Сьогодні, ' + hm, seen: false, read: false, claimed: false,
      title: 'Батат задоволений', lines: ['Доручення виконано. Батат тримає слово — ось твоя нагорода.'], gain: l.task.gain || {}, seal: l.task.seal});
    S.open = null; save(); render(true);
  });
  side.querySelector('.ar-expire').addEventListener('click', () => {
    const l = byId(BATAT); if (!l || l.task.stage === 'done') return;
    l.task.stage = 'missed'; l.read = true; l.seen = true;
    S.open = null; save(); render(true);
  });
  side.querySelector('.ar-reset').addEventListener('click', () => {
    S.letters = structuredClone(INIT); S.open = null; S.extra = 0;
    try { localStorage.removeItem(KEY); } catch (e) {}
    $list.scrollTop = 0; render(true);
  });

  /* ---------- палець замість курсора ----------
     Імітуємо мобільний застосунок: над телефоном курсора немає, натомість — коло-подушечка пальця.
     - торкання: коло стискається, від дотику розходиться слід;
     - затискання (~0,45 с на місці): навколо набирається кільце;
     - свайп: тягнеш — список під пальцем гортається, відпускаєш — докочується за інерцією; клік після свайпу не спрацьовує;
     - наведення всередині телефона нічого не підсвічує (у телефоні немає наведення). */
  if (matchMedia('(pointer: fine)').matches) {
    const tip = document.createElement('div');
    tip.className = 'ar-finger';
    document.body.append(tip);
    phone.classList.add('ar-touch');

    /* :hover-правила, що стосуються елементів телефона, перетворюємо на :active (реакція на натискання) */
    for (const sh of document.styleSheets) {
      let rules; try { rules = sh.cssRules; } catch (e) { continue; }
      for (const r of [...rules]) {
        if (!(r instanceof CSSStyleRule) || !r.selectorText.includes(':hover')) continue;
        const parts = r.selectorText.split(',').map(sel => {
          if (!sel.includes(':hover')) return sel;
          let inPhone = false;
          try { inPhone = [...document.querySelectorAll(sel.replace(/:hover/g, ''))].some(el => phone.contains(el)); } catch (e) {}
          return inPhone ? sel.replace(/:hover/g, ':active') : sel;
        });
        r.selectorText = parts.join(',');
      }
    }

    const place = (el, x, y) => { el.style.transform = `translate(${x}px, ${y}px)`; };
    const scroller = el => {
      for (; el && el !== phone; el = el.parentElement) {
        const cs = getComputedStyle(el);
        if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1) return el;
      }
      return null;
    };
    /* гумовий край, як у iOS: за межею список тягнеться з опором і пружинить назад */
    const rubber = (x, h) => Math.sign(x) * (1 - 1 / (Math.abs(x) * 0.55 / h + 1)) * h;
    const stretch = (el, px, ease) => {
      el.style.transition = ease ? 'transform .45s cubic-bezier(.2,.9,.3,1)' : 'none';
      el.style.transform = px ? `translateY(${px}px)` : '';
    };
    const bounce = (el, px) => {   /* інерція вдарилась у край: невеликий відскок */
      stretch(el, px, false);
      requestAnimationFrame(() => requestAnimationFrame(() => stretch(el, 0, true)));
    };
    let drag = null, holdT = 0, glide = 0;
    phone.addEventListener('pointerenter', e => { place(tip, e.clientX, e.clientY); tip.classList.add('on'); });
    phone.addEventListener('pointerleave', () => { if (!drag) tip.classList.remove('on', 'down', 'hold'); });
    phone.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      cancelAnimationFrame(glide);
      place(tip, e.clientX, e.clientY); tip.classList.add('down');
      const r = document.createElement('div');
      r.className = 'ar-ripple'; place(r, e.clientX, e.clientY);
      document.body.append(r);
      r.addEventListener('animationend', () => r.remove(), {once: true});
      const sc = scroller(e.target) || e.target.closest('.ar-list, .piles-zone');
      drag = {x: e.clientX, y: e.clientY, el: sc, moved: false, last: e.clientY, t: performance.now(), v: 0, over: 0};
      holdT = setTimeout(() => { if (drag && !drag.moved) tip.classList.add('hold'); }, 450);
    });
    addEventListener('pointermove', e => {
      place(tip, e.clientX, e.clientY);
      if (!drag) return;
      const dy = e.clientY - drag.y, dx = e.clientX - drag.x;
      if (!drag.moved && Math.hypot(dx, dy) > 6) { drag.moved = true; clearTimeout(holdT); tip.classList.remove('hold'); }
      if (drag.moved && drag.el) {
        const k = parseFloat(getComputedStyle(phone).zoom) || 1;   /* телефон масштабований під вікно */
        const step = (e.clientY - drag.last) / k, now = performance.now();
        const el = drag.el, max = el.scrollHeight - el.clientHeight;
        if (drag.over) {                       /* уже тягнемо за край: спершу «відпускаємо» гуму */
          drag.over += step;
          if (Math.sign(drag.over) !== Math.sign(drag.over - step)) { el.scrollTop -= drag.over; drag.over = 0; }
        } else {
          const next = el.scrollTop - step;
          if (next < 0) { el.scrollTop = 0; drag.over = -next; }
          else if (next > max) { el.scrollTop = max; drag.over = max - next; }
          else el.scrollTop = next;
        }
        stretch(el, drag.over ? rubber(drag.over, el.clientHeight) : 0, false);
        drag.v = step / Math.max(1, now - drag.t); drag.last = e.clientY; drag.t = now;
      }
    }, {passive: true});
    addEventListener('pointerup', () => {
      clearTimeout(holdT);
      tip.classList.remove('down', 'hold');
      if (!drag) return;
      const d = drag; drag = null;
      if (d.moved) {
        /* після свайпу клік не спрацьовує */
        const kill = ev => { ev.stopPropagation(); ev.preventDefault(); };
        addEventListener('click', kill, {capture: true, once: true});
        setTimeout(() => removeEventListener('click', kill, true), 60);
        if (d.el && d.over) stretch(d.el, 0, true);          /* відпустили за краєм — пружинить назад */
        else if (d.el) {                                      /* інерція */
          let v = d.v * 16;
          const roll = () => {
            if (Math.abs(v) < 0.3) return;
            const el = d.el, max = el.scrollHeight - el.clientHeight, next = el.scrollTop - v;
            if (next <= 0 || next >= max) {
              el.scrollTop = Math.max(0, Math.min(max, next));
              bounce(el, Math.max(-36, Math.min(36, v * 4)));
              return;
            }
            el.scrollTop = next; v *= 0.94;
            glide = requestAnimationFrame(roll);
          };
          glide = requestAnimationFrame(roll);
        }
      }
    });
  }

  /* ---------- мокап пристрою ----------
     Під вьюпортом завжди лежить чорний прямокутник, на 12 px більший з усіх боків, радіус 68,
     внутрішня тінь 0 0 8px білий 25% (як у Фігмі). Екран має радіус 56 = 68 − 12, тож кути концентричні.
     Згладжування кутів не робимо. */
  (() => {
    const PAD = 12;
    const W = phone.offsetWidth + PAD * 2, H = phone.offsetHeight + PAD * 2;
    /* бічні кнопки з макета (Фігма, «Section 1»): ліворуч — вимкнути звук, гучність +/−, праворуч — блокування.
       Кнопки 4 px завтовшки, виступають за корпус; поруч підписи-іконки (Material Symbols, чорний 72%).
       Кожна кнопка трохи заходить під корпус, щоб не було щілини на стику. */
    /* іконки — файли з макета (Material Icons, 24×24) у src/arch/*_24dp_E3E3E3.svg; колір — чорний 72%, як у Фігмі */
    const ICO = {
      mute: 'M4.34 2.93L2.93 4.34 7.29 8.7 7 9H3v6h4l5 5v-6.59l4.18 4.18c-.65.49-1.38.88-2.18 1.11v2.06c1.34-.3 2.57-.92 3.61-1.75l2.05 2.05 1.41-1.41L4.34 2.93zM10 15.17L7.83 13H5v-2h2.83l.88-.88L10 11.41v3.76zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zm-7-8l-1.88 1.88L12 7.76zm4.5 8c0-1.77-1.02-3.29-2.5-4.03v1.79l2.48 2.48c.01-.08.02-.16.02-.24z',
      sound: 'M3 9v6h4l5 5V4L7 9H3zm7-.17v6.34L7.83 13H5v-2h2.83L10 8.83zM16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z',
      plus: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
      minus: 'M19 13H5v-2h14v2z'
    };
    const ico = (d, y, cls) => `<path${cls ? ` class="${cls}"` : ''} d="${d}" transform="translate(-36 ${y})" fill="rgba(0,0,0,.72)"/>`;
    /* кнопка 4 px завширшки, впритул до корпусу, скруглена лише назовні (2 px) */
    const keyL = (y, h) => `M0 ${y}H-2A2 2 0 0 0 -4 ${y + 2}V${y + h - 2}A2 2 0 0 0 -2 ${y + h}H0Z`;
    const keyR = (y, h) => `M${W} ${y}H${W + 2}A2 2 0 0 1 ${W + 4} ${y + 2}V${y + h - 2}A2 2 0 0 1 ${W + 2} ${y + h}H${W}Z`;
    /* блок = іконка + кнопка, 36 px завширшки: клікабельний увесь, іконка з'являється лише при наведенні */
    const key = (k, y, h, icons) => `<g class="ar-key" data-k="${k}">
        <rect class="hit" x="-36" y="${y}" width="36" height="${h}" fill="transparent"/>
        <path class="btn" d="${keyL(y, h)}" fill="#000"/>${icons}</g>`;
    const SIDE = `<g class="ar-side-btns">
      ${key('mute', 167, 32, ico(ICO.mute, 171, 'ico off') + ico(ICO.sound, 171, 'ico on'))}
      ${key('up', 229, 64, ico(ICO.plus, 249, 'ico'))}
      ${key('down', 314, 64, ico(ICO.minus, 334, 'ico'))}
      <path d="${keyR(275, 103)}" fill="#000"/></g>`;
    const dev = document.createElement('div');
    dev.className = 'ar-device';
    /* Корпус — рамка-кільце ПОВЕРХ екрана: зовнішній контур (радіус 68) мінус екран (радіус 56).
       Так кути екрана закриваються самим корпусом, і нічого не пробивається, незалежно від браузера
       (Safari/Chrome по-різному обрізають скруглення з анімаціями та zoom).
       Світіння — розмита біла смуга по зовнішньому краю, обрізана кільцем. */
    const w = phone.offsetWidth, h = phone.offsetHeight;
    /* виріз на 1 px менший за екран: рамка заходить на край екрана, і між ними не просвічує фон (згладжування двох країв) */
    const I = PAD + 1;
    const ring = `M68 0H${W - 68}A68 68 0 0 1 ${W} 68V${H - 68}A68 68 0 0 1 ${W - 68} ${H}H68A68 68 0 0 1 0 ${H - 68}V68A68 68 0 0 1 68 0Z
      M${I + 55} ${I}A55 55 0 0 0 ${I} ${I + 55}V${I + h - 2 - 55}A55 55 0 0 0 ${I + 55} ${I + h - 2}H${I + w - 2 - 55}A55 55 0 0 0 ${I + w - 2} ${I + h - 2 - 55}V${I + 55}A55 55 0 0 0 ${I + w - 2 - 55} ${I}Z`;
    dev.innerHTML = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true"><defs>
        <clipPath id="arDevClip"><path d="${ring}" clip-rule="evenodd"/></clipPath>
        <filter id="arDevBlur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="4"/></filter></defs>
      ${SIDE}
      <path d="${ring}" fill="#000" fill-rule="evenodd"/>
      <g clip-path="url(#arDevClip)"><rect width="${W}" height="${H}" rx="68" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="16" filter="url(#arDevBlur)"/></g></svg>`;
    /* фізичні кнопки — під корпусом: при натисканні ховаються в нього */
    document.body.append(dev);
    /* ---------- звук пристрою ----------
       10 порогів гучності (0…10) і перемикач «без звуку». Стан доступний іншим частинам прототипу:
       window.arDevice.volume / .muted, а кожна зміна шле подію 'ar-volume' {volume, muted}.
       На екрані — як в iOS: вертикальна шкала гучності біля кнопок і плашка «Звук увімкнено / вимкнено» вгорі. */
    const snd = {volume: 6, muted: true};
    try { Object.assign(snd, JSON.parse(localStorage.getItem('mc-device') || '{}')); } catch (e) {}
    window.arDevice = snd;
    const hud = document.createElement('div');
    hud.className = 'ar-vol';
    hud.innerHTML = '<i></i>';
    const pill = document.createElement('div');
    pill.className = 'ar-silent';
    phone.append(hud, pill);
    let hudT = 0, pillT = 0;
    const syncSnd = () => {
      dev.classList.toggle('ar-sound', !snd.muted);
      hud.firstElementChild.style.height = (snd.muted ? 0 : snd.volume * 10) + '%';
      try { localStorage.setItem('mc-device', JSON.stringify(snd)); } catch (e) {}
      document.dispatchEvent(new CustomEvent('ar-volume', {detail: {volume: snd.volume, muted: snd.muted}}));
    };
    const showHud = () => { hud.classList.add('show'); clearTimeout(hudT); hudT = setTimeout(() => hud.classList.remove('show'), 1400); };
    const showPill = () => {
      pill.innerHTML = `<svg viewBox="0 0 24 24"><path d="${snd.muted ? ICO.mute : ICO.sound}"/></svg>${snd.muted ? 'Звук вимкнено' : 'Звук увімкнено'}`;
      pill.classList.add('show'); clearTimeout(pillT); pillT = setTimeout(() => pill.classList.remove('show'), 1400);
    };
    dev.querySelectorAll('.ar-key').forEach(g => g.addEventListener('pointerdown', e => {
      e.preventDefault();
      g.classList.add('press');
      addEventListener('pointerup', () => g.classList.remove('press'), {once: true});
      const k = g.dataset.k;
      if (k === 'mute') { snd.muted = !snd.muted; showPill(); }
      else {
        if (snd.muted && k === 'up') snd.muted = false;          /* як на iPhone: гучніше — і звук повертається */
        snd.volume = Math.max(0, Math.min(10, snd.volume + (k === 'up' ? 1 : -1)));
        showHud();
      }
      syncSnd();
    }));
    syncSnd();
    phone.classList.add('ar-in-device');
    /* широкий екран: корпус по центру вікна, верхній і лівий край — рівно на піксель; панель праворуч від корпусу.
       Вузький екран: телефон стоїть, як у Танчиній верстці, корпус просто йде за ним. */
    const side = document.querySelector('aside.side');
    const fit = () => {
      const k = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fit')) || 1;
      const FW = W * k, FH = H * k, wide = innerWidth >= 760;
      phone.classList.toggle('ar-centered', wide);
      if (side) side.classList.toggle('ar-centered', wide);
      let left, top;
      if (wide) {
        /* екран ділимо на п'ять рівних частин: 3/5 ліворуч — мокап по центру, 2/5 праворуч — описи й деталі */
        /* робоча ширина не більша за 1920: на ширших екранах усе стоїть по центру */
        const area = Math.min(innerWidth, 1920), x0 = Math.round((innerWidth - area) / 2);
        const two = Math.round(area * 3 / 5), split = x0 + two;
        left = x0 + Math.max(16, Math.round((two - FW) / 2));
        top = Math.max(0, Math.round((innerHeight - FH) / 2));
        /* телефон має zoom, тож його власні left/top множаться на масштаб: ділимо */
        phone.style.left = (left + PAD * k) / k + 'px';
        phone.style.top = (top + PAD * k) / k + 'px';
        if (side) Object.assign(side.style, {left: split + 'px', top: '0px', width: x0 + area - split + 'px'});
      } else {
        phone.style.left = phone.style.top = '';
        if (side) side.style.left = side.style.top = side.style.width = '';
        const r = phone.getBoundingClientRect();   /* у Танчиній версії — в одиницях телефона, тож множимо на масштаб */
        left = r.left * k - PAD * k + scrollX; top = r.top * k - PAD * k + scrollY;
      }
      /* широкий екран: корпус fixed, як і телефон — скрол сторінки їх не розводить */
      Object.assign(dev.style, {position: wide ? 'fixed' : 'absolute', left: left + 'px', top: top + 'px', width: FW + 'px', height: FH + 'px'});
    };
    fit();
    addEventListener('resize', () => requestAnimationFrame(fit));
    addEventListener('load', fit);
    new ResizeObserver(fit).observe(document.body);
  })();

  setTab(S.tab);
})();
