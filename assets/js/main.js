/* Luca Wolput · portfolio
   Todo el contenido vive en /content (site.json, projects.json, about.json).
   Este archivo solo lo pinta en la página y gestiona idioma, menú y animaciones. */
(async function () {
  const isAbout = document.body.classList.contains('page-about');
  const load = f => fetch(f).then(r => r.json());
  const [site, data, about] = await Promise.all([
    load('content/site.json'),
    load('content/projects.json'),
    isAbout ? load('content/about.json') : Promise.resolve(null)
  ]);

  /* ---------- idioma ---------- */
  const stored = (() => { try { return localStorage.getItem('lang'); } catch (e) { return null; } })();
  const fromUrl = new URLSearchParams(location.search).get('lang');
  const nav = (navigator.language || 'es').toLowerCase();
  let lang = fromUrl || stored || (nav.startsWith('es') || nav.startsWith('ca') ? 'es' : 'en');

  /* ---------- colores editables ---------- */
  Object.entries(site.theme || {}).forEach(([k, v]) => document.documentElement.style.setProperty('--' + k, v));

  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  const tr = v => (v && typeof v === 'object' && !Array.isArray(v) && ('es' in v || 'en' in v)) ? (v[lang] ?? v.es) : v;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = id => document.getElementById(id);
  const fill = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };

  function renderCommon() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-k]').forEach(n => { const v = tr(get(site, n.dataset.k)); if (v != null) n.textContent = v; });
    document.querySelectorAll('[data-src]').forEach(n => { const v = get(site, n.dataset.src); if (v && n.getAttribute('src') !== v) n.src = v; });
    document.querySelectorAll('[data-alt]').forEach(n => { n.alt = tr(get(site, n.dataset.alt)) || ''; });
    document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));

    fill('menu-list', site.menu.items.map(i => `
      <li><a href="${esc(i.href)}"><span class="menu__n">${esc(i.n)}</span><span class="menu__t">${esc(tr(i.title))}</span><span class="menu__d small">${esc(tr(i.desc))}</span></a></li>`).join(''));

    const mail = $('mail'); if (mail) { mail.href = 'mailto:' + site.email; mail.textContent = site.email; }
    const li = $('linkedin'); if (li) li.href = site.linkedin;
    const contact = document.querySelector('.contact');
    if (contact && site.contact.background) contact.style.backgroundImage = `url("${site.contact.background}")`;
  }

  function renderHome() {
    if (!$('facts')) return;
    fill('facts', site.about.facts.map(f => `<li data-reveal><b>${esc(f.value)}</b><span>${esc(tr(f.label))}</span></li>`).join(''));
    fill('brands', site.brands.list.map(b => `<li>${esc(b)}</li>`).join(''));

    const word = tr(site.works.count_word);
    $('count-all').textContent = data.projects.length;
    fill('cats', data.categories.map(c => {
      const n = data.projects.filter(p => p.category === c.id).length;
      return `<li data-reveal><a href="projects.html?cat=${esc(c.id)}"><span class="phrase">${esc(tr(c.name))}</span><span class="small">${n} ${esc(word)}</span></a></li>`;
    }).join(''));

    fill('cards', site.works.featured.map(id => {
      const p = data.projects.find(x => x.id === id);
      if (!p) return '';
      const cat = data.categories.find(c => c.id === p.category);
      return `
        <article class="card" data-reveal>
          <a href="projects.html#${esc(p.id)}">
            <figure class="card__img" data-reveal-img><img src="${esc(p.cover)}" alt="${esc(p.brand)}" loading="lazy"><span class="card__view small">${esc(tr(site.works.view))}</span></figure>
            <p class="card__meta small"><span>${esc(tr(cat?.name))}</span><span>${esc(tr(data.types[p.type]))}, ${esc(p.year)}</span></p>
            <h3 class="phrase">${esc(tr(p.title))}</h3>
            ${p.data ? `<p class="card__data"><span class="small">${esc(tr(p.data_label))}</span><span>${esc(tr(p.data))}</span></p>` : ''}
          </a>
        </article>`;
    }).join(''));
  }

  function renderAbout() {
    if (!about) return;
    document.querySelectorAll('[data-a]').forEach(n => { const v = tr(get(about, n.dataset.a)); if (v != null) n.textContent = v; });
    document.querySelectorAll('[data-asrc]').forEach(n => { const v = get(about, n.dataset.asrc); if (v && n.getAttribute('src') !== v) n.src = v; });
    document.querySelectorAll('[data-aalt]').forEach(n => { n.alt = tr(get(about, n.dataset.aalt)) || ''; });
    document.title = `${tr(about.title).charAt(0)}${tr(about.title).slice(1).toLowerCase()} | Luca Wolput`;

    fill('bio', about.bio.map(p => `<p>${esc(tr(p))}</p>`).join(''));
    const cv = $('cv'); if (cv) cv.href = tr(about.cv_file);

    const job = j => `
      <li class="row" data-reveal>
        <span class="row__years small">${esc(tr(j.years))}</span>
        <div>
          <p class="row__name">${esc(j.company)}</p>
          <span class="row__role small">${esc(tr(j.role))}</span>
          <ul class="row__points">${j.points.map(pt => `<li>${esc(tr(pt))}</li>`).join('')}</ul>
          ${j.data ? `<span class="row__data">${esc(tr(j.data))}</span>` : ''}
        </div>
      </li>`;
    fill('exp', about.experience.map(job).join(''));
    fill('other', about.other.map(job).join(''));

    fill('edu', about.education.map(e => `
      <li class="row" data-reveal>
        <span class="row__years small">${esc(tr(e.years))}</span>
        <div><p class="row__name">${esc(e.school)}</p><span class="row__role small">${esc(tr(e.degree))}</span>${e.note ? `<p class="row__note">${esc(tr(e.note))}</p>` : ''}</div>
      </li>`).join(''));

    fill('certs', about.certifications.map(c => `
      <li class="row" data-reveal>
        <div><p class="row__name">${esc(tr(c.name))}</p><span class="row__issuer small">${esc(c.issuer)}</span></div>
        <span class="row__status small">${esc(tr(c.status) || '')}</span>
      </li>`).join(''));

    fill('skills', about.skills.map(s => `<li data-reveal><span class="small">${esc(tr(s.label))}</span><p>${esc(tr(s.items))}</p></li>`).join(''));
  }

  function render() { renderCommon(); renderHome(); renderAbout(); observe(); }

  /* ---------- aparición al hacer scroll ---------- */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .12 })
    : null;
  function observe() {
    document.querySelectorAll('[data-reveal]:not(.is-in), [data-reveal-img]:not(.is-in)').forEach(el => io ? io.observe(el) : el.classList.add('is-in'));
  }

  /* ---------- cambio de idioma con fundido ---------- */
  document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.lang === lang) return;
    lang = b.dataset.lang;
    try { localStorage.setItem('lang', lang); } catch (e) {}
    document.body.classList.add('is-switching');
    setTimeout(() => {
      render();
      document.querySelectorAll('[data-reveal], [data-reveal-img]').forEach(el => el.classList.add('is-in'));
      document.body.classList.remove('is-switching');
    }, 260);
  }));

  /* ---------- menú ---------- */
  const menu = $('menu');
  const burger = document.querySelector('.burger');
  const setMenu = open => {
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    if (open) setTimeout(() => menu.querySelector('.menu__close').focus(), 300); else burger.focus();
  };
  burger.addEventListener('click', () => setMenu(true));
  menu.querySelector('.menu__close').addEventListener('click', () => setMenu(false));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false); });

  render();

  /* ---------- entrada de la página ---------- */
  const start = () => requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('is-loading')));
  const hero = document.querySelector('.cover__photo img');
  Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    !hero || hero.complete ? Promise.resolve() : new Promise(r => { hero.onload = r; hero.onerror = r; })
  ]).then(start);
  setTimeout(start, 2500);
})();
