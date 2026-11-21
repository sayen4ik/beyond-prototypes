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
  if (A['arch/iOS.png']) phone.style.setProperty('--ar-status', `url("${A['arch/iOS.png']}")`);
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
    ar.hidden = t !== 'arch';
    phone.classList.toggle('ar-mode', t === 'arch');
    side.hidden = t !== 'arch';
    placeUnderBar(); fitTitle();
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
    const cards = [...$list.querySelectorAll('.ar-card.unread')], n = S.letters.filter(l => !l.read).length;
    let lit = 0;
    await drumRoll(num, n, 0, 650, v => {
      const gone = n - Math.ceil(v - 0.001);
      while (lit < gone && lit < cards.length) cards[lit++].classList.remove('unread');   /* картка гасне через CSS-переходи */
      lbl.textContent = unreadLbl(Math.max(1, Math.round(v)));
    });
    cards.forEach(c => c.classList.remove('unread'));
    S.letters.forEach(l => { l.read = true; });
    save();
    await new Promise(r => setTimeout(r, 180));
    readingAll = false;
    renderSum(false);
    const done = $sum.querySelector('.ar-unread.done');
    if (done) done.classList.add('arrive');
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
      <path d="${ring}" fill="#000" fill-rule="evenodd"/>
      <g clip-path="url(#arDevClip)"><rect width="${W}" height="${H}" rx="68" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="16" filter="url(#arDevBlur)"/></g>
      ${SIDE}</svg>`;
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
      Object.assign(dev.style, {left: left + 'px', top: top + 'px', width: FW + 'px', height: FH + 'px'});
    };
    fit();
    addEventListener('resize', () => requestAnimationFrame(fit));
    addEventListener('load', fit);
    new ResizeObserver(fit).observe(document.body);
  })();

  setTab(S.tab);
})();
