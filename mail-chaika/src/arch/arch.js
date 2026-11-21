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
  const TYPES = {task: {name: 'Доручення'}, announce: {name: 'Анонс'}, parcel: {name: 'Посилка'}};
  const SENDERS = {
    batat: {name: 'Великий Батат', ini: 'ВБ'},
    uriad: {name: 'Таємний уряд', ini: 'ТУ'},
    tbd:   {name: 'Відправник ?', ini: '?', tbd: true}      /* хто шле Посилку — ще думаємо */
  };
  const STAGES = [['new', 'Нове'], ['accepted', 'Прийнято'], ['done', 'Виконано'], ['claimed', 'Нагороду забрано']];

  const task = (what, term, prize, stage) => ({what, term, prize, stage});
  const INIT = [
    {id: 'd9', type: 'task', from: 'batat', date: 'Сьогодні, 10:00', seen: false, read: false,
      title: 'Доручення №9', lines: ['Знайти в Сільпо три круглі речі й купити їх.', 'Кавун рахується за дві.'],
      task: task('Купити три круглі речі', 'до вечора неділі', '60 забобонусів', 'new')},
    {id: 'a8', type: 'announce', from: 'uriad', date: 'Сьогодні, 08:15', seen: false, read: false,
      title: 'Нова гра у Парку Атракціонів', lines: ['У Парку Атракціонів з\'явилась нова гра.'], cta: 'Перейти в Парк'},
    {id: 'a7', type: 'announce', from: 'uriad', date: 'Вчора, 18:30', seen: false, read: false,
      title: 'Відчинилась Гардеробна', lines: ['Замок знято.', 'У Гардеробній висить перше вбрання для твого Їдола.'],
      cta: 'Перейти в Гардеробну'},
    {id: 'p4', type: 'parcel', from: 'tbd', date: 'Вчора, 09:00', seen: false, read: false,
      title: 'Посилка за тиждень', lines: ['Ось що ти отримав у Потойбіччі за 9–15 листопада.'],
      items: [['Забобонуси', '+80'], ['Квитки в Парк', '×3'], ['Гейм-буст', '×1']]},
    {id: 'd8', type: 'task', from: 'batat', date: '15 листопада', seen: false, read: false,
      title: 'Доручення №8', lines: ['Купити щось, що шурхотить.', 'Пакетик не рахується. Ми перевіряли.'],
      task: task('Купити щось, що шурхотить', 'до вечора середи', '50 забобонусів', 'accepted')},
    {id: 'a6', type: 'announce', from: 'uriad', date: '14 листопада', seen: false, read: false,
      title: 'Підсумок тижня культу', lines: ['Тиждень вийшов шовковий.', 'На рахунку культу 400 мммм із 1000.']},
    {id: 'a5', type: 'announce', from: 'uriad', date: '13 листопада', seen: false, read: false,
      title: 'Лососянці піднялися на перше місце', lines: ['Рейтинг культів оновився.', 'Лососянці перші, Томатисти дихають у спину.']},
    {id: 'd7', type: 'task', from: 'batat', date: '12 листопада', seen: false, read: true,
      title: 'Доручення №7', lines: ['Принести додому щось кисле.'],
      task: task('Купити щось кисле', 'до кінця дня', '30 забобонусів', 'done')},
    {id: 'a4', type: 'announce', from: 'uriad', date: '11 листопада', seen: true, read: false,
      title: 'Чайка тепер крикне, коли прийде лист', lines: ['Звук можна вимкнути в налаштуваннях.']},
    {id: 'd6', type: 'task', from: 'batat', date: '10 листопада', seen: true, read: true,
      title: 'Доручення №6', lines: ['Знайти на полиці найсумніший огірок і забрати його додому.'],
      task: task('Купити найсумніший огірок', 'до вечора вівторка', '40 забобонусів', 'claimed')},
    {id: 'p3', type: 'parcel', from: 'tbd', date: '8 листопада', seen: true, read: true,
      title: 'Посилка за тиждень', lines: ['Ось що ти отримав у Потойбіччі за 2–8 листопада.'],
      items: [['Забобонуси', '+40'], ['Квитки в Парк', '×1']]},
    {id: 'a3', type: 'announce', from: 'uriad', date: '5 листопада', seen: true, read: true,
      title: 'Відчинився Парк Атракціонів', lines: ['Каруселі крутяться.', 'Квитки — у Парку.']},
    {id: 'd5', type: 'task', from: 'batat', date: '2 листопада', seen: true, read: true,
      title: 'Доручення №5', lines: ['Принести додому щось жовте.'],
      task: task('Купити щось жовте', 'до кінця дня', '30 забобонусів', 'claimed')},
    {id: 'a1', type: 'announce', from: 'uriad', date: '1 листопада', seen: true, read: true,
      title: 'Чайка тепер носить твою пошту', lines: ['Прийде лист — принесе. І крикне.']}
  ];
  const EXTRA = [
    {type: 'announce', from: 'uriad', title: 'Новий відділ у Парку', lines: ['У Парку Атракціонів з\'явилась ще одна гра.'], cta: 'Перейти в Парк'},
    {type: 'task', from: 'batat', title: 'Доручення №10', lines: ['Купити щось, що світиться в темряві.'],
      task: task('Купити щось, що світиться', 'до вечора середи', '50 забобонусів', 'new')},
    {type: 'parcel', from: 'tbd', title: 'Посилка за тиждень', lines: ['Ось що ти отримав у Потойбіччі за тиждень.'],
      items: [['Забобонуси', '+20'], ['Квитки в Парк', '×2']]}
  ];

  /* стан пам'ятається між заходами (знята булька не повертається); «Скинути» в панелі — повертає все як було */
  const KEY = 'mc-arch-v2';
  const S = {letters: structuredClone(INIT), open: null, extra: 0, tab: 'ui'};
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
  ar.innerHTML = '<div class="ar-sum"></div><div class="ar-list"></div>' +
    '<div class="ar-open" hidden><div class="ar-paper"></div></div>';
  phone.append(ar, tabs);
  const A = window.__ARCH || {};
  if (A['arch/btn_left.png']) phone.style.setProperty('--ar-ico-left', `url("${A['arch/btn_left.png']}")`);
  if (A['arch/btn_settings.png']) phone.style.setProperty('--ar-ico-gear', `url("${A['arch/btn_settings.png']}")`);
  const gear = document.createElement('button');
  gear.className = 'ar-gear'; gear.setAttribute('aria-label', 'Налаштування');
  phone.querySelector('.top')?.append(gear);
  phone.classList.add('ar-has-tabs');

  const side = document.createElement('div');
  side.className = 'ar-side'; side.hidden = true;
  side.innerHTML = `
    <h4>Архітектура · типи</h4>
    <ul>
      <li><b>Доручення</b> — завдання від Великого Батата: що зробити, термін, нагорода. Нагороду забирають у самому листі.</li>
      <li><b>Анонс</b> — новини, щось з'явилось. Сюди ж поки йдуть листи Їдола, новини й листи Чайки; назви ще зміняться.</li>
      <li><b>Посилка</b> — винагороди, отримані в Потойбіччі за період. Відправник — питання відкрите.</li>
    </ul>
    <h4>Відправники</h4>
    <p><b>Великий Батат</b> — тільки Доручення. <b>Таємний уряд</b> — ми, продукт: звичайні листи.</p>
    <h4>Стани</h4>
    <ul>
      <li><b>Непереглянуто</b>: червона булька біля відправника. Гасне тільки, коли гість прокрутив список і булька дійшла до верху. Більше не повертається. Від цього залежить «!» у Чайки на Хоумспейсі.</li>
      <li><b>Непрочитано</b>: фон картки білий 4%. Знімається відкриттям листа або «Прочитати всі».</li>
      <li><b>Доручення</b>: нове → прийнято → виконано → нагороду забрано.</li>
    </ul>
    <button class="ar-add">+ Надіслати лист</button> <button class="ar-reset">Скинути</button>`;
  const sideHost = document.querySelector('aside.side');
  if (sideHost) sideHost.append(side);

  const $sum = ar.querySelector('.ar-sum'), $list = ar.querySelector('.ar-list');
  const $open = ar.querySelector('.ar-open'), $paper = ar.querySelector('.ar-paper');

  /* ---------- рендер ---------- */
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const byId = id => S.letters.find(l => l.id === id);
  const avaHtml = (l, bubble) => {
    const s = SENDERS[l.from];
    return `<span class="ar-ava${s.tbd ? ' tbd' : ''}"><b>${s.ini}</b>${bubble && !l.seen ? '<i class="ar-bub" title="Непереглянуто"></i>' : ''}</span>`;
  };
  const stageName = st => (STAGES.find(x => x[0] === st) || [, ''])[1];
  /* теги над заголовком: тип і етап доручення */
  function tagsHtml(l) {
    let s = `<span class="ar-tag t-${l.type}">${TYPES[l.type].name}</span>`;
    if (l.type === 'task' && l.task.stage !== 'new') s += `<span class="ar-tag st${l.task.stage === 'claimed' ? ' soft' : ''}">${stageName(l.task.stage)}</span>`;
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

  function renderList() {
    $list.innerHTML = S.letters.length ? S.letters.map(l => `
      <button class="ar-card${l.read ? '' : ' unread'}" data-id="${l.id}">
        ${tagsHtml(l)}
        <span class="ar-top"><span class="ar-txt"><h3>${esc(l.title)}</h3><p>${esc(l.lines[0])}</p></span>${avaHtml(l, true)}</span>
        <span class="ar-meta"><span>${esc(l.date)}</span><span>${esc(SENDERS[l.from].name)}</span></span>
      </button>`).join('') : '<p class="ar-empty">Листів поки немає.<br>Щойно щось прийде — Чайка принесе.</p>';
  }

  function renderOpen() {
    const l = byId(S.open);
    if (!l) { $open.hidden = true; return; }
    let body = l.lines.map(t => `<p>${esc(t)}</p>`).join('');
    if (l.type === 'task') {
      const st = l.task.stage, i = STAGES.findIndex(x => x[0] === st);
      body += `<div class="ar-block">
        <div><small>Що зробити</small><span>${esc(l.task.what)}</span></div>
        <div><small>Термін</small><span>${esc(l.task.term)}</span></div>
        <div><small>Нагорода</small><span>${esc(l.task.prize)}</span></div></div>
        <div class="ar-steps">${STAGES.map((s, j) => `<span class="${j <= i ? 'done' : ''}">${s[1]}</span>`).join('')}</div>`;
      if (st === 'new') body += '<button class="ar-btn" data-act="accept">Прийняти доручення</button>';
      if (st === 'accepted') body += '<button class="ar-btn" disabled>Виконується</button><button class="ar-btn ghost" data-act="done">Демо: позначити виконаним</button>';
      if (st === 'done') body += '<button class="ar-btn" data-act="claim">Забрати нагороду</button>';
      if (st === 'claimed') body += '<p class="ar-note">Нагороду забрано. Вона з\'явиться в найближчій Посилці.</p>';
    }
    if (l.type === 'parcel') {
      body += `<div class="ar-block">${l.items.map(([n, v]) => `<div><span>${esc(n)}</span><span>${esc(v)}</span></div>`).join('')}</div>
        <p class="ar-note">Посилка — це звіт: усе вже нараховано. Від кого вона приходить, ще вирішуємо.</p>`;
    }
    if (l.type === 'announce' && l.cta) body += `<button class="ar-btn">${esc(l.cta)}</button>`;
    $paper.innerHTML = `${tagsHtml(l)}<div class="ar-top"><div class="ar-txt"><h2>${esc(l.title)}</h2></div>${avaHtml(l, false)}</div>
      <div class="ar-meta"><span>${esc(l.date)}</span><span>${esc(SENDERS[l.from].name)}</span></div>${body}`;
    $open.hidden = false;
  }

  function render(roll) { renderSum(roll); renderList(); renderOpen(); }

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
    $list.querySelectorAll('.ar-bub:not(.pop)').forEach(b => {
      if (b.getBoundingClientRect().top > edge && !atEnd) return;
      const l = byId(b.closest('.ar-card').dataset.id);
      l.seen = true; changed = true;
      b.classList.add('pop');
      b.addEventListener('animationend', () => b.remove(), {once: true});
    });
    if (changed) save();
  }
  /* віджет непрочитаних ховається, щойно гість почав гортати, і повертається тільки на самому верху списку
     (два різні пороги, щоб на межі не блимав) */
  function syncSum() {
    const y = $list.scrollTop;
    if (y > 24) $sum.classList.add('hide');
    else if (y <= 2) $sum.classList.remove('hide');
  }
  $list.addEventListener('scroll', () => {
    syncSum();
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

  /* список починається рівно під шапкою */
  function placeUnderBar() {
    const top = phone.querySelector('.top'); if (!top) return;
    requestAnimationFrame(() => {
      const pr = phone.getBoundingClientRect(), tr = top.getBoundingClientRect();
      ar.style.top = Math.round(tr.bottom - pr.top) + 'px';
    });
  }
  addEventListener('resize', () => { if (S.tab === 'arch') placeUnderBar(); });

  function setTab(t) {
    S.tab = t;
    try { localStorage.setItem('mc-tab', t); } catch (e) {}
    tabs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
    ar.hidden = t !== 'arch';
    phone.classList.toggle('ar-mode', t === 'arch');
    side.hidden = t !== 'arch';
    placeUnderBar(); fitTitle();
    if (t === 'arch') { S.open = null; render(true); }
  }

  /* ---------- події ---------- */
  tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setTab(b.dataset.t); });

  /* «Прочитати всі»: барабан відкручує число до нуля, і в такт йому картки згори вниз втрачають підсвітку */
  let readingAll = false;
  $sum.addEventListener('click', async e => {
    if (!e.target.closest('.ar-u-act') || readingAll) return;
    readingAll = true;
    const w = $sum.querySelector('.ar-unread'), num = $sum.querySelector('.ar-u-num'), lbl = $sum.querySelector('.ar-u-lbl');
    w.classList.add('busy');
    const cards = [...$list.querySelectorAll('.ar-card.unread')], n = S.letters.filter(l => !l.read).length;
    let lit = 0;
    await drumRoll(num, n, 0, 650, v => {
      const gone = n - Math.ceil(v - 0.001);
      while (lit < gone && lit < cards.length) cards[lit++].classList.add('reading');
      lbl.textContent = unreadLbl(Math.max(1, Math.round(v)));
    });
    cards.forEach(c => c.classList.add('reading'));
    S.letters.forEach(l => { l.read = true; });
    save();
    await new Promise(r => setTimeout(r, 180));
    readingAll = false;
    renderSum(false);
    const done = $sum.querySelector('.ar-unread.done');
    if (done) done.classList.add('arrive');
    cards.forEach(c => c.classList.remove('unread', 'reading'));
  });

  $list.addEventListener('click', e => {
    const c = e.target.closest('.ar-card'); if (!c) return;
    const l = byId(c.dataset.id);
    l.read = true; S.open = l.id; save(); render(false);
  });
  /* стрілка «назад» у шапці: у відкритому листі повертає до списку, інакше — як була (на Хоумспейс) */
  phone.querySelector('.top .back').addEventListener('click', e => {
    if (S.tab === 'arch' && S.open) { e.stopImmediatePropagation(); S.open = null; render(false); }
  }, true);
  $paper.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const l = byId(S.open);
    l.task.stage = {accept: 'accepted', done: 'done', claim: 'claimed'}[b.dataset.act];
    save(); render(false);
  });
  side.querySelector('.ar-add').addEventListener('click', () => {
    const src = EXTRA[S.extra++ % EXTRA.length];
    S.letters.unshift(Object.assign(structuredClone(src), {id: 'x' + S.extra, date: 'Щойно', seen: false, read: false}));
    S.open = null; save(); $list.scrollTop = 0; render(true);
  });
  side.querySelector('.ar-reset').addEventListener('click', () => {
    S.letters = structuredClone(INIT); S.open = null; S.extra = 0;
    try { localStorage.removeItem(KEY); } catch (e) {}
    $list.scrollTop = 0; render(true);
  });

  setTab(S.tab);
})();
