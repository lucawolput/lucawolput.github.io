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
      return `<li data-reveal><a href="projects.html#${esc(c.id)}"><span class="phrase">${esc(tr(c.name))}</span><span class="small">${n} ${esc(word)}</span></a></li>`;
    }).join(''));

    fill('cards', site.works.featured.map(id => {
      const p = data.projects.find(x => x.id === id);
      if (!p) return '';
      const cat = data.categories.find(c => c.id === p.category);
      return `
        <article class="card" data-reveal>
          <a href="project.html#${esc(p.id)}">
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

  /* ---------- proyectos: piezas comunes ---------- */
  const catName = id => tr(data.categories.find(c => c.id === id)?.name);
  const typeTag = p => tr(data.types[p.type]);
  const tcover = p => {
    const t = p.cover_type || {};
    return `<div class="tcover" style="--tc-bg:${esc(t.bg)};--tc-fg:${esc(t.fg)};--tc-accent:${esc(t.accent)}"><span class="tcover__word">${esc(t.word || p.brand)}</span><span class="tcover__line">${esc(tr(t.line) || '')}</span></div>`;
  };
  const media = (p, cls) => p.cover
    ? `<img src="${esc(p.cover)}" alt="${esc(p.brand)}" loading="lazy" ${cls ? `class="${cls}"` : ''} onload="if(this.naturalWidth/this.naturalHeight>1.5)this.classList.add('is-wide')">`
    : tcover(p);

  function renderProjects() {
    if (!document.body.classList.contains('page-projects')) return;
    document.querySelectorAll('[data-p]').forEach(n => { const v = tr(get(data, n.dataset.p)); if (v != null) n.textContent = v; });
    document.title = `${tr(data.page.title).charAt(0)}${tr(data.page.title).slice(1).toLowerCase()} | Luca Wolput`;
    const active = decodeURIComponent(location.hash.slice(1)) || 'todos';
    const opts = [{ id: 'todos', name: data.page.all }, ...data.categories];
    fill('filters', opts.map(o => {
      const n = o.id === 'todos' ? data.projects.length : data.projects.filter(p => p.category === o.id).length;
      return `<button type="button" data-filter="${esc(o.id)}" aria-pressed="${o.id === active}">${esc(tr(o.name))} <span class="small">${n}</span></button>`;
    }).join(''));
    const list = active === 'todos' ? data.projects : data.projects.filter(p => p.category === active);
    fill('grid', list.map(p => `
      <article class="pc" data-reveal>
        <a href="project.html#${esc(p.id)}">
          <figure class="pc__media" data-reveal-img>${media(p)}<span class="pc__type small ${p.type === 'ongoing' ? 'is-ongoing' : ''}">${esc(typeTag(p))}</span><span class="card__view small">${esc(tr(data.page.view))}</span></figure>
          <p class="card__meta small"><span>${esc(catName(p.category))}</span><span>${esc(p.brand)}, ${esc(p.year)}</span></p>
          <h3 class="phrase">${esc(tr(p.title))}</h3>
          ${p.data ? `<p class="card__data"><span class="small">${esc(tr(p.data_label))}</span><span>${esc(tr(p.data))}</span></p>` : ''}
        </a>
      </article>`).join(''));
    document.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.filter;
      history.replaceState(null, '', id === 'todos' ? location.pathname : '#' + id);
      const g = $('grid'); g.classList.add('is-fading');
      setTimeout(() => { renderProjects(); observe(); g.classList.remove('is-fading'); }, 300);
    }));
  }

  function renderProject() {
    if (!document.body.classList.contains('page-project')) return;
    const f = data.page.fields;
    const id = decodeURIComponent(location.hash.slice(1));
    const i = Math.max(0, data.projects.findIndex(p => p.id === id));
    const p = data.projects[i];
    document.querySelectorAll('[data-p]').forEach(n => { const v = tr(get(data, n.dataset.p)); if (v != null) n.textContent = v; });
    document.title = `${p.brand} | Luca Wolput`;
    $('pd-label').textContent = `${catName(p.category)} / ${typeTag(p)}`;
    const brandEl = $('pd-brand'); brandEl.textContent = p.brand.toUpperCase();
    // los nombres largos se ajustan para caber en una línea
    brandEl.style.fontSize = `min(var(--s1), ${(182 / Math.max(p.brand.length, 1)).toFixed(2)}vw)`;
    $('pd-title').textContent = tr(p.title);

    const cover = $('pd-cover');
    cover.className = 'pd-cover';
    cover.innerHTML = p.cover ? `<img src="${esc(p.cover)}" alt="${esc(p.brand)}">` : tcover(p);
    const ci = cover.querySelector('img');
    if (ci) { const mark = () => { if (ci.naturalWidth / ci.naturalHeight < 1.2) cover.classList.add('is-tall'); }; ci.complete ? mark() : ci.addEventListener('load', mark); }

    const rows = [
      [p.client ? f.client : f.brand, p.client ? tr(p.client) : p.brand],
      [f.type, `${typeTag(p)}${p.type === 'ongoing' ? '' : ''}`],
      [f.year, p.year],
      [f.role, tr(p.role)],
      [f.deliverable, tr(p.deliverable)]
    ].filter(r => r[1]);
    let sheet = rows.map(([k, v]) => `<dt class="small">${esc(tr(k))}</dt><dd>${esc(v)}</dd>`).join('');
    if (p.data) sheet += `<dt class="small">${esc(tr(p.data_label))}</dt><dd class="is-key">${esc(tr(p.data))}</dd>`;
    if (p.link) sheet += `<dt class="small">Link</dt><dd><a href="${esc(p.link.url)}" target="_blank" rel="noopener">${esc(tr(p.link.label))}</a></dd>`;
    $('pd-sheet').innerHTML = sheet;

    const story = [
      [f.challenge, p.challenge],
      [f.idea, p.idea],
      p.next_steps ? [f.next_steps, p.next_steps] : [f.outcome, p.outcome]
    ].filter(s => s[1]);
    fill('pd-story', story.map(([k, v]) => `<div data-reveal><span class="small">${esc(tr(k))}</span><p>${esc(tr(v))}</p></div>`).join(''));

    fill('pd-figures', (p.figures || []).map(x => `<div data-reveal><b>${esc(x.value)}</b><span>${esc(tr(x.label))}</span></div>`).join(''));

    fill('pd-video', p.video ? `
      <span class="small" data-reveal>${esc(tr(f.video))}</span>
      <div class="pd-video__frame" data-reveal><iframe src="https://www.youtube-nocookie.com/embed/${esc(p.video)}" title="${esc(tr(p.title))}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>
      <a class="small pd-video__link more" href="https://www.youtube.com/watch?v=${esc(p.video)}" target="_blank" rel="noopener">${esc(tr(f.watch))}</a>` : '');

    const g = p.gallery || [];
    fill('pd-gallery', g.length ? `
      <span class="small" data-reveal>${esc(tr(f.gallery))}</span>
      ${p.gallery_intro ? `<p class="pd-gallery__intro" data-reveal>${esc(tr(p.gallery_intro))}</p>` : ''}
      <div class="pd-gallery__grid ${g.length === 1 ? 'is-single' : ''}" id="pd-ggrid">${g.map(x => `
        <figure data-reveal-img><img src="${esc(x.src)}" alt="${esc(tr(x.caption))}" loading="lazy"><figcaption class="small">${esc(tr(x.caption))}</figcaption></figure>`).join('')}</div>` : '');
    const gg = $('pd-ggrid');
    if (gg) { const first = gg.querySelector('img'); const mark = () => { if (first.naturalWidth / first.naturalHeight < 1 && g.length > 1) { gg.classList.add('is-tall'); if (g.length === 4) gg.classList.add('is-four'); } }; first.complete ? mark() : first.addEventListener('load', mark); }

    $('pd-note').textContent = tr(p.note) || '';

    const prev = data.projects[(i - 1 + data.projects.length) % data.projects.length];
    const next = data.projects[(i + 1) % data.projects.length];
    $('pd-nav').innerHTML = `
      <a href="project.html#${esc(prev.id)}"><span class="small">${esc(tr(data.page.prev))}</span><span class="phrase">${esc(prev.brand)}</span></a>
      <a href="project.html#${esc(next.id)}"><span class="small">${esc(tr(data.page.next))}</span><span class="phrase">${esc(next.brand)}</span></a>`;
  }

  window.addEventListener('hashchange', () => {
    if (document.body.classList.contains('page-project')) { window.scrollTo(0, 0); render(); document.querySelectorAll('.pd-hero [data-reveal-img]').forEach(el => el.classList.add('is-in')); }
    if (document.body.classList.contains('page-projects')) render();
  });

  function render() { renderCommon(); renderHome(); renderAbout(); renderProjects(); renderProject(); observe(); }

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
