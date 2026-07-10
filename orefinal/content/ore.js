(() => {
  const data = window.ORE_DATA;
  const app = document.querySelector('#ore-reader');
  const dock = document.querySelector('#global-dock');
  const toast = document.querySelector('#toast');

  if (!data || !Array.isArray(data.articles)) {
    document.body.innerHTML = `<main style="min-height:100vh;background:#070707;color:#f5efe3;display:grid;place-items:center;padding:32px;font-family:Georgia,serif;text-align:center"><div><h1 style="color:#c8a45d">ORE could not load</h1><p>The file <code>content/ore-data.js</code> is missing, renamed, or was not uploaded.</p></div></main>`;
    return;
  }

  const slug = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const articleId = article => `article-${article.roman.toLowerCase()}`;
  const chainIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.2 13.8 13.8 10.2"/><path d="M7.4 16.6 5.8 18.2a3.4 3.4 0 0 1-4.8-4.8l3.2-3.2A3.4 3.4 0 0 1 9 10.1"/><path d="m16.6 7.4 1.6-1.6A3.4 3.4 0 0 1 23 10.6l-3.2 3.2a3.4 3.4 0 0 1-4.8.1"/></svg>';
  const icons = {
    library: '<svg viewBox="0 0 24 24"><path d="M4 5.5c3-1.2 5.7-.8 8 .8v13c-2.3-1.6-5-2-8-.8zM20 5.5c-3-1.2-5.7-.8-8 .8v13c2.3-1.6 5-2 8-.8z"/></svg>',
    certification: '<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="5"/><path d="m9 13-1 8 4-2 4 2-1-8"/></svg>',
    amendments: '<svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6z"/><path d="M9 10h6M9 14h6M9 18h4"/></svg>',
    forms: '<svg viewBox="0 0 24 24"><path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>'
  };

  const showToast = text => {
    toast.textContent = text;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 1800);
  };

  dock.innerHTML = [
    ['library', 'Library'],
    ['certification', 'Certification'],
    ['amendments', 'Amendments'],
    ['forms', 'Forms'],
    ['search', 'Search']
  ].map(([id, label]) => `<button class="dock-btn" data-action="${id}">${icons[id]}<span>${label}</span></button>`).join('');

  const cover = `
    <section id="cover" class="screen cover">
      <div class="cover-inner">
        <img class="cover-emblem" src="assets/emblem.svg" alt="ORE emblem">
        <div class="cover-org">${data.meta.corporation}</div>
        <h1>CORPORATE<br><span>BY-LAWS</span></h1>
        <div class="cover-sub">${data.meta.editionName}</div>
        <div class="cover-meta">${data.meta.editionShort} · Version ${data.meta.version}<br>Adopted ${data.meta.adoptedDate}</div><br>
        <a class="begin" href="#certification">Begin Reading <span>⌄</span></a>
      </div>
    </section>`;

  const certification = `
    <section id="certification" class="screen"><div class="page"><div class="page-inner">
      <div class="page-label">Certification</div><div class="kicker">of Official Edition</div><h2>Certification</h2><div class="gold-rule"></div>
      <div class="body-copy">${data.frontMatter.certification.map(p => `<p>${p}</p>`).join('')}</div>
      <div class="signature-block">
        <div class="signature-line"><strong>${data.meta.president}</strong><em>Temple Board President</em></div>
        <div class="signature-line"><strong>${data.meta.secretary}</strong><em>Secretary</em></div>
      </div>
    </div></div></section>`;

  const controlRows = [
    ['Document Title', data.meta.documentTitle],
    ['Corporation', data.meta.corporation],
    ['Current Version', data.meta.version],
    ['Original Adoption', data.meta.adoptedDate],
    ['Publication Date', data.meta.publicationDate],
    ['Publication ID', data.meta.publicationId]
  ].map(([label, value]) => `<div class="info-row"><strong>${label}</strong><span>${value}</span></div>`).join('');

  const control = `<section id="document-control" class="screen"><div class="page"><div class="page-inner"><div class="page-label">Document Control</div><h2>Document<br>Control</h2><div class="gold-rule"></div><div class="info-table">${controlRows}</div></div></div></section>`;

  const publisher = `<section id="publisher-note" class="screen"><div class="page"><div class="page-inner"><div class="page-label">Publisher's Note</div><h2>Publisher’s<br>Note</h2><div class="gold-rule"></div><div class="body-copy">${data.frontMatter.publisherNote.map(p => `<p>${p}</p>`).join('')}<p>Fraternally,<br>${data.meta.corporation}<br>Temple Board</p></div></div></div></section>`;

  const contentsRows = data.articles.map(article => `<a class="nav-row" href="#${articleId(article)}-contents"><span class="roman">${article.roman}</span><span>${article.title}</span><span class="chev">›</span></a>`).join('');
  const library = `<section id="contents" class="screen"><div class="page"><div class="page-inner"><div class="page-label">Library</div><h2>Governance<br>Library</h2><div class="gold-rule"></div><div class="library-list"><a class="nav-row" href="#bylaws-contents"><span class="roman">I</span><span><b>Corporate By-Laws</b><small>Articles I to XV</small></span><span class="chev">›</span></a><a class="nav-row" href="#governance-library"><span class="roman">II</span><span><b>Governance & Committees</b><small>Committees, responsibilities, vacancies, and projects</small></span><span class="chev">›</span></a><a class="nav-row" href="#corporate-records"><span class="roman">III</span><span><b>Corporate Records</b><small>Incorporation, signed records, and document control</small></span><span class="chev">›</span></a><a class="nav-row" href="#forms"><span class="roman">IV</span><span><b>Official Forms</b><small>Committee, project, expense, and maintenance forms</small></span><span class="chev">›</span></a><a class="nav-row" href="#governance-records"><span class="roman">V</span><span><b>Archives</b><small>Certifications, amendments, and previous editions</small></span><span class="chev">›</span></a></div></div></div></section>`;
  const bylawContents = `<section id="bylaws-contents" class="screen"><div class="page"><div class="page-inner"><div class="page-label">Part I</div><h2>Corporate<br>By-Laws</h2><div class="gold-rule"></div><div class="contents-list">${contentsRows}</div></div></div></section>`;

  const pageOrder = ['cover', 'certification', 'document-control', 'publisher-note', 'contents', 'bylaws-contents'];
  const sectionRoutes = new Map();

  const articleMarkup = data.articles.map((article, articleIndex) => {
    const aid = articleId(article);
    const articleContentsId = `${aid}-contents`;
    pageOrder.push(articleContentsId);

    const rows = article.sections.map(section => `<a class="nav-row" href="#${aid}-${slug(section.number)}"><span class="number">${section.number}</span><span>${section.title}</span><span class="chev">›</span></a>`).join('');
    const opener = `<section id="${articleContentsId}" class="screen"><div class="page article-opener"><div class="page-inner"><div class="kicker">Article ${article.roman}</div><h2>${article.title}</h2><div class="gold-rule"></div><div class="article-list">${rows}</div></div></div></section>`;

    const sectionScreens = article.sections.map((section, sectionIndex) => {
      const sid = `${aid}-${slug(section.number)}`;
      pageOrder.push(sid);

      const previousSection = sectionIndex > 0 ? article.sections[sectionIndex - 1] : null;
      const nextSection = sectionIndex < article.sections.length - 1 ? article.sections[sectionIndex + 1] : null;
      const previousArticle = articleIndex > 0 ? data.articles[articleIndex - 1] : null;
      const nextArticle = articleIndex < data.articles.length - 1 ? data.articles[articleIndex + 1] : null;

      const previousDestination = previousSection
        ? { id: `${aid}-${slug(previousSection.number)}`, number: previousSection.number, title: previousSection.title }
        : { id: articleContentsId, number: `Article ${article.roman}`, title: article.title };
      const nextDestination = nextSection
        ? { id: `${aid}-${slug(nextSection.number)}`, number: nextSection.number, title: nextSection.title }
        : nextArticle
          ? { id: `${articleId(nextArticle)}-contents`, number: `Article ${nextArticle.roman}`, title: nextArticle.title }
          : { id: 'governance-records', number: 'Records', title: 'Governance Records' };

      sectionRoutes.set(sid, { previous: previousDestination.id, next: nextDestination.id });

      return `<section id="${sid}" class="screen searchable section-reader" data-search="article ${article.roman} ${article.title} ${section.number} ${section.title} ${section.paragraphs.join(' ')}" data-prev="${previousDestination.id}" data-next="${nextDestination.id}"><div class="page"><div class="page-inner">
        <div class="crumbs"><a href="#contents">Library</a><span>›</span><a href="#bylaws-contents">By-Laws</a><span>›</span><a href="#${articleContentsId}">Article ${article.roman}</a><span>›</span><span>Section ${section.number}</span></div>
        <div class="kicker">Article ${article.roman}</div><h2>${article.title}</h2><div class="gold-rule"></div>
        <div class="section-heading"><span class="num">Section ${section.number}</span><h3>${section.title}</h3><button class="copy-link" data-copy="#${sid}" aria-label="Copy direct link to Section ${section.number}" title="Copy direct link">${chainIcon}</button></div>
        <div class="section-body">${section.paragraphs.map(p => `<p>${p}</p>`).join('')}</div>
        <div class="local-pager">
          <a href="#${previousDestination.id}" class="pager-back"><span class="pager-arrow">‹</span><span class="pager-copy"><span class="pager-number">${previousDestination.number}</span><span class="pager-title">${previousDestination.title}</span></span></a>
          <a href="#${nextDestination.id}" class="pager-next"><span class="pager-copy"><span class="pager-number">${nextDestination.number}</span><span class="pager-title">${nextDestination.title}</span></span><span class="pager-arrow">›</span></a>
        </div>
        <div class="edge-cue" aria-hidden="true"><span>Scroll again to continue</span></div>
      </div></div></section>`;
    }).join('');

    return opener + sectionScreens;
  }).join('');

  const committeeRows = data.committees.map(committee => `<a class="nav-row" href="#committee-${committee.id}"><span class="committee-status ${committee.status.toLowerCase()}"></span><span><b>${committee.name}</b><small>${committee.status} · ${committee.vacancies ?? committee.targetMembers} position${(committee.vacancies ?? committee.targetMembers) === 1 ? '' : 's'} available</small></span><span class="chev">›</span></a>`).join('');
  const governanceLibrary = `<section id="governance-library" class="screen"><div class="page"><div class="page-inner"><div class="page-label">Part II</div><h2>Governance &<br>Committees</h2><div class="gold-rule"></div><div class="records-list"><a class="nav-row" href="#committees"><span></span><span><b>Standing Committees</b><small>Current rosters, vacancies, mandates, and projects</small></span><span class="chev">›</span></a><a class="nav-row" href="#article-viii-contents"><span></span><span><b>Board Responsibilities</b><small>Duties and responsibilities under the By-Laws</small></span><span class="chev">›</span></a><a class="nav-row" href="#article-ix-contents"><span></span><span><b>Committee Provisions</b><small>Standing, ad hoc, membership, reports, and terms of reference</small></span><span class="chev">›</span></a></div></div></div></section>`;
  const committees = `<section id="committees" class="screen"><div class="page"><div class="page-inner"><div class="page-label">Standing Committees</div><h2>Committees</h2><div class="gold-rule"></div><p class="intro-copy">The Temple Board is strengthening its committees. Each page identifies the committee’s purpose, current roster, open positions, responsibilities, and active priorities.</p><div class="committee-list">${committeeRows}</div></div></div></section>`;
  const committeePages = data.committees.map(committee => {
    const currentCount = committee.members.length + (committee.chair && !committee.chair.toLowerCase().includes('confirm') && !committee.chair.toLowerCase().includes('vacant') ? 1 : 0);
    const vacancies = Math.max(committee.targetMembers - currentCount, 0);
    committee.vacancies = vacancies;
    return `<section id="committee-${committee.id}" class="screen searchable committee-page" data-search="committee ${committee.name} ${committee.mandate} ${committee.responsibilities.join(' ')} ${committee.projects.join(' ')} recruiting volunteer"><div class="page"><div class="page-inner"><div class="crumbs"><a href="#contents">Library</a><span>›</span><a href="#governance-library">Governance</a><span>›</span><a href="#committees">Committees</a></div><div class="page-label">Standing Committee</div><h2>${committee.name}</h2><div class="gold-rule"></div><div class="committee-summary"><div><span>Chair</span><strong>${committee.chair}</strong></div><div><span>Term</span><strong>${committee.term}</strong></div><div><span>Current Members</span><strong>${currentCount} / ${committee.targetMembers}</strong></div><div><span>Status</span><strong class="recruiting-text">${vacancies > 0 ? `Recruiting ${vacancies}` : 'Fully staffed'}</strong></div></div><div class="committee-section"><h3>Purpose</h3><p>${committee.mandate}</p></div><div class="committee-section"><h3>Current Roster</h3><p><b>Temple Board President:</b> ${data.meta.president} <span class="muted">(ex officio)</span></p>${committee.members.length ? `<ul>${committee.members.map(member => `<li>${member}</li>`).join('')}</ul>` : '<p class="vacancy-note">Additional committee members are required. Names can be added here as appointments are confirmed.</p>'}</div><div class="committee-section"><h3>Responsibilities</h3><ul>${committee.responsibilities.map(item => `<li>${item}</li>`).join('')}</ul></div><div class="committee-section"><h3>Current Priorities</h3><ul>${committee.projects.map(item => `<li>${item}</li>`).join('')}</ul></div><div class="recruitment-panel"><span>Interested in helping?</span><strong>${vacancies > 0 ? `${vacancies} committee position${vacancies === 1 ? '' : 's'} currently available` : 'This committee is currently fully staffed'}</strong>${vacancies > 0 ? '<a href="#forms" class="text-action">Open Committee Interest Form ›</a>' : ''}</div></div></div></section>`;
  }).join('');
  const corporateRecords = `<section id="corporate-records" class="screen"><div class="page"><div class="page-inner"><div class="page-label">Part III</div><h2>Corporate<br>Records</h2><div class="gold-rule"></div><div class="records-list"><a class="nav-row" href="pdf/official-bylaws-2023.pdf" target="_blank"><span></span><span><b>Original Signed By-Laws</b><small>Official signed 2023 document</small></span><span class="chev">›</span></a><a class="nav-row" href="#document-control"><span></span><span><b>Document Control</b><small>Edition, publication, and certification information</small></span><span class="chev">›</span></a><div class="nav-row unavailable"><span></span><span><b>Articles of Incorporation</b><small>File to be added</small></span><span></span></div><div class="nav-row unavailable"><span></span><span><b>Directors Register</b><small>Current and historical records to be added</small></span><span></span></div></div></div></div></section>`;
  const forms = `<section id="forms" class="screen"><div class="page"><div class="page-inner"><div class="page-label">Part IV</div><h2>Official<br>Forms</h2><div class="gold-rule"></div><div class="records-list">${data.forms.map(form => form.type === 'interactive' ? `<button class="nav-row form-open" data-form="${form.id}"><span></span><span><b>${form.name}</b><small>${form.description}</small></span><span class="chev">›</span></button>` : `<div class="nav-row unavailable"><span></span><span><b>${form.name}</b><small>${form.description} · File to be added</small></span><span></span></div>`).join('')}</div></div></div></section>`;
  const governance = `<section id="governance-records" class="screen"><div class="page"><div class="page-inner"><div class="page-label">Archives</div><h2>Governance<br>Records</h2><div class="gold-rule"></div><div class="records-list"><button class="nav-row record-open" data-record="amendments"><span></span><span>Amendment History</span><span class="chev">›</span></button><button class="nav-row record-open" data-record="certifications"><span></span><span>Certification Archive</span><span class="chev">›</span></button><a class="nav-row" href="pdf/official-bylaws-2023.pdf" target="_blank"><span></span><span>Original Signed By-Laws (PDF)</span><span class="chev">›</span></a><a class="nav-row" href="#document-control"><span></span><span>Document Control</span><span class="chev">›</span></a></div></div></div></section>`;
  pageOrder.push('governance-library', 'committees', ...data.committees.map(c => `committee-${c.id}`), 'corporate-records', 'forms', 'governance-records');

  const sheet = `<div id="sheet" class="sheet" aria-hidden="true"><div class="sheet-panel"><div class="sheet-head"><h2 id="sheet-title"></h2><button class="close-sheet" aria-label="Close">×</button></div><div id="sheet-body"></div></div></div>`;

  app.innerHTML = cover + certification + control + publisher + library + bylawContents + articleMarkup + governanceLibrary + committees + committeePages + corporateRecords + forms + governance + sheet;

  const allScreens = [...document.querySelectorAll('.screen')];
  const getRouteId = () => decodeURIComponent((location.hash || '#cover').slice(1)) || 'cover';
  const getScreen = id => document.getElementById(id) || document.getElementById('cover');

  function syncDock(routeId) {
    dock.hidden = routeId === 'cover';
    document.querySelectorAll('.dock-btn').forEach(button => button.classList.remove('active'));
    if (['contents','bylaws-contents','governance-library','committees','corporate-records'].includes(routeId) || routeId.startsWith('committee-')) document.querySelector('[data-action="library"]')?.classList.add('active');
    if (routeId === 'certification') document.querySelector('[data-action="certification"]')?.classList.add('active');
    if (routeId === 'governance-records') document.querySelector('[data-action="amendments"]')?.classList.add('active');
    if (routeId === 'forms') document.querySelector('[data-action="forms"]')?.classList.add('active');
  }

  function showRoute({ preserveScroll = false } = {}) {
    const routeId = getRouteId();
    const target = getScreen(routeId);
    allScreens.forEach(screen => screen.classList.toggle('active', screen === target));
    if (!preserveScroll) target.scrollTop = 0;
    syncDock(target.id);
    document.title = target.id === 'cover' ? 'Corporate By-Laws — Official Reformatted Edition' : `${target.querySelector('h3,h2')?.textContent?.trim() || 'Corporate By-Laws'} — ORE`;
  }

  window.addEventListener('hashchange', () => showRoute());
  if (!location.hash) history.replaceState(null, '', '#cover');
  showRoute();

  function navigateTo(id) {
    if (!id) return;
    if (getRouteId() === id) {
      getScreen(id).scrollTop = 0;
      return;
    }
    location.hash = `#${id}`;
  }

  function openSheet(title, html) {
    document.querySelector('#sheet-title').textContent = title;
    document.querySelector('#sheet-body').innerHTML = html;
    document.querySelector('#sheet').classList.add('open');
    document.querySelector('#sheet').setAttribute('aria-hidden', 'false');
  }

  function closeSheet() {
    document.querySelector('#sheet').classList.remove('open');
    document.querySelector('#sheet').setAttribute('aria-hidden', 'true');
  }

  dock.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'library') navigateTo('contents');
    if (action === 'certification') navigateTo('certification');
    if (action === 'amendments') navigateTo('governance-records');
    if (action === 'forms') navigateTo('forms');
    if (action === 'search') openSheet('Search', '<input id="search-box" class="search-input" type="search" placeholder="Search By-Laws, committees, records, and forms" autofocus><div id="search-results"></div>');
  });

  document.addEventListener('input', event => {
    if (event.target.id !== 'search-box') return;
    const query = event.target.value.trim().toLowerCase();
    const results = document.querySelector('#search-results');
    if (query.length < 2) {
      results.innerHTML = '';
      return;
    }
    const matches = [...document.querySelectorAll('.searchable')]
      .filter(element => element.dataset.search.toLowerCase().includes(query))
      .slice(0, 30);
    results.innerHTML = matches.map(element => {
      const section = element.querySelector('.section-heading');
      const title = section ? `${section.querySelector('.num')?.textContent || ''} — ${section.querySelector('h3')?.textContent || ''}` : (element.querySelector('h2')?.textContent?.trim() || 'Governance Record');
      const excerpt = element.querySelector('.section-body p,.committee-section p')?.textContent?.slice(0, 150) || '';
      return `<a class="result" href="#${element.id}"><b>${title}</b>${excerpt}${excerpt ? '…' : ''}</a>`;
    }).join('') || '<p>No results found.</p>';
  });

  document.addEventListener('click', event => {
    if (event.target.closest('.close-sheet') || event.target.id === 'sheet') closeSheet();
    if (event.target.closest('.result')) closeSheet();

    const copyButton = event.target.closest('[data-copy]');
    if (copyButton) {
      const url = `${location.origin}${location.pathname}${copyButton.dataset.copy}`;
      navigator.clipboard?.writeText(url).then(() => showToast('Direct link copied')).catch(() => showToast('Copy unavailable'));
    }

    const formButton = event.target.closest('[data-form]');
    if (formButton?.dataset.form === 'committee-interest') {
      openSheet('Committee Interest Form', `<form id="committee-interest-form" class="interest-form"><label>Your name<input name="name" required></label><label>Committee<select name="committee" required><option value="">Select a committee</option>${data.committees.map(c => `<option>${c.name}</option>`).join('')}</select></label><label>Skills, experience, or areas of interest<textarea name="skills" rows="5" placeholder="Tell the Temple Board how you would like to help."></textarea></label><label>Preferred contact information<input name="contact" placeholder="Email or phone"></label><button type="submit" class="primary-action">Copy Submission</button><p class="form-note">This creates a formatted submission you can paste into an email or message to the Temple Board.</p></form>`);
    }

    const recordButton = event.target.closest('[data-record]');
    if (recordButton?.dataset.record === 'amendments') {
      openSheet('Amendment History', data.amendments.map(item => `<div class="record"><b>Version ${item.version}</b><br>${item.date}<br>${item.summary}</div>`).join(''));
    }
    if (recordButton?.dataset.record === 'certifications') {
      openSheet('Certification Archive', data.certifications.map(item => `<div class="record"><b>Version ${item.version}</b><br>${item.date}<br>President: ${item.president}<br>Secretary: ${item.secretary}<br>${item.status}</div>`).join(''));
    }
  });

  document.addEventListener('submit', event => {
    if (event.target.id !== 'committee-interest-form') return;
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.target).entries());
    const text = `TEMPLE BOARD COMMITTEE INTEREST\n\nName: ${values.name}\nCommittee: ${values.committee}\nContact: ${values.contact || 'Not provided'}\n\nSkills / Interests:\n${values.skills || 'Not provided'}`;
    navigator.clipboard?.writeText(text).then(() => showToast('Committee interest submission copied')).catch(() => showToast('Copy unavailable'));
  });

  // PAGE-TURN BEHAVIOUR
  // Long sections scroll normally. At the true bottom/top, a second deliberate gesture changes section.
  let wheelArmed = null;
  let wheelArmTime = 0;
  let navigationCooldown = false;
  let touchStartY = 0;
  let touchStartedAtTop = false;
  let touchStartedAtBottom = false;
  let touchBoundaryArmed = null;
  let touchBoundaryTime = 0;

  const activeSection = () => document.querySelector('.screen.active.section-reader');
  const isAtTop = screen => screen.scrollTop <= 1;
  const isAtBottom = screen => screen.scrollTop + screen.clientHeight >= screen.scrollHeight - 2;

  function flashEdgeCue(screen) {
    const cue = screen.querySelector('.edge-cue');
    if (!cue) return;
    cue.classList.add('show');
    window.clearTimeout(flashEdgeCue.timer);
    flashEdgeCue.timer = window.setTimeout(() => cue.classList.remove('show'), 900);
  }

  function turnPage(direction) {
    if (navigationCooldown) return;
    const screen = activeSection();
    if (!screen) return;
    const destination = direction === 'next' ? screen.dataset.next : screen.dataset.prev;
    if (!destination) return;
    navigationCooldown = true;
    navigateTo(destination);
    window.setTimeout(() => { navigationCooldown = false; }, 360);
  }

  document.addEventListener('wheel', event => {
    const screen = activeSection();
    if (!screen || Math.abs(event.deltaY) < 8) return;
    const direction = event.deltaY > 0 ? 'next' : 'previous';
    const atBoundary = direction === 'next' ? isAtBottom(screen) : isAtTop(screen);

    if (!atBoundary) {
      wheelArmed = null;
      return;
    }

    const now = Date.now();
    if (wheelArmed === direction && now - wheelArmTime < 1100) {
      event.preventDefault();
      wheelArmed = null;
      turnPage(direction === 'next' ? 'next' : 'previous');
    } else {
      wheelArmed = direction;
      wheelArmTime = now;
      flashEdgeCue(screen);
    }
  }, { passive: false });

  document.addEventListener('touchstart', event => {
    const screen = activeSection();
    if (!screen || event.touches.length !== 1) return;
    touchStartY = event.touches[0].clientY;
    touchStartedAtTop = isAtTop(screen);
    touchStartedAtBottom = isAtBottom(screen);
  }, { passive: true });

  document.addEventListener('touchend', event => {
    const screen = activeSection();
    if (!screen || !event.changedTouches.length) return;
    const delta = event.changedTouches[0].clientY - touchStartY;
    const threshold = 62;
    const now = Date.now();
    const direction = touchStartedAtBottom && isAtBottom(screen) && delta < -threshold
      ? 'next'
      : touchStartedAtTop && isAtTop(screen) && delta > threshold
        ? 'previous'
        : null;

    if (!direction) {
      touchBoundaryArmed = null;
      return;
    }

    if (touchBoundaryArmed === direction && now - touchBoundaryTime < 1400) {
      touchBoundaryArmed = null;
      turnPage(direction);
    } else {
      touchBoundaryArmed = direction;
      touchBoundaryTime = now;
      flashEdgeCue(screen);
    }
  }, { passive: true });

  document.addEventListener('keydown', event => {
    if (!activeSection()) return;
    if (event.key === 'ArrowRight' || event.key === 'PageDown') turnPage('next');
    if (event.key === 'ArrowLeft' || event.key === 'PageUp') turnPage('previous');
  });
})();
