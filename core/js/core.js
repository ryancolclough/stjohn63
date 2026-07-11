(() => {
  "use strict";

  const app = document.querySelector("#core-app");
  const toast = document.querySelector("#core-toast");
  const ORE = window.ORE_DATA;

  if (!ORE || !Array.isArray(ORE.articles)) {
    app.innerHTML = `
      <main class="main">
        <section class="hero">
          <div class="eyebrow">CORE could not load</div>
          <h1>ORE data was not found.</h1>
          <p>CORE expects the existing file at <code>../orefinal/content/ore-data.js</code>. Confirm that the <strong>core</strong> and <strong>orefinal</strong> folders sit beside one another.</p>
        </section>
      </main>`;
    return;
  }

  const STORAGE_KEY = "CORE_REVIEWS_V1";
  const SETTINGS_KEY = "CORE_SETTINGS_V1";
  const REVIEW_YEAR = new Date().getFullYear();

  const state = {
    route: "dashboard",
    articleIndex: null,
    sectionIndex: null,
    reviews: loadJSON(STORAGE_KEY, {}),
    settings: loadJSON(SETTINGS_KEY, { theme: "system", reviewer: "" })
  };

  document.documentElement.dataset.theme = state.settings.theme || "system";

  function loadJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch { return fallback; }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.reviews));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  }

  function notify(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => toast.classList.remove("show"), 1800);
  }

  const allSections = ORE.articles.flatMap((article, articleIndex) =>
    article.sections.map((section, sectionIndex) => ({ article, section, articleIndex, sectionIndex }))
  );

  function sectionKey(section) { return String(section.number); }
  function getReview(section) { return state.reviews[sectionKey(section)] || null; }

  function metrics() {
    const total = allSections.length;
    const records = allSections.map(({section}) => getReview(section)).filter(Boolean);
    const complete = records.filter(r => r.status === "complete").length;
    const discussion = records.filter(r => r.status === "discussion").length;
    const amendment = records.filter(r => r.status === "amendment").length;
    const reviewed = records.length;
    return { total, reviewed, complete, discussion, amendment, percent: total ? Math.round(reviewed / total * 100) : 0 };
  }

  const icons = {
    home:'<svg viewBox="0 0 24 24"><path d="M3 11 12 3l9 8v10H3z"/><path d="M9 21v-7h6v7"/></svg>',
    review:'<svg viewBox="0 0 24 24"><path d="M5 3h14v18H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    actions:'<svg viewBox="0 0 24 24"><path d="M5 4h14v16H5z"/><path d="m8 9 2 2 4-4M8 15h8"/></svg>',
    export:'<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 20h16"/></svg>',
    settings:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A8 8 0 0 0 15 6l-.3-2.6h-4L10.4 6A8 8 0 0 0 8.9 7.1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1A8 8 0 0 0 10.4 18l.3 2.6h4L15 18a8 8 0 0 0 1.5-1.1l2.4 1 2-3.4-2-1.5a7 7 0 0 0 .1-1z"/></svg>'
  };

  function shell(content, active="home") {
    return `
      <div class="app-shell">
        <header class="topbar">
          <button class="brand" data-route="dashboard" aria-label="CORE home">
            <span class="brand-mark"><span>C</span></span>
            <span><strong>CORE</strong><small>Corporate Operations & Review Engine</small></span>
          </button>
          <div class="top-actions"><button class="icon-btn" data-open-settings aria-label="Settings">⚙</button></div>
        </header>
        <main class="main">${content}</main>
        <nav class="dock" aria-label="CORE navigation">
          ${dockButton("dashboard","home","Home",active)}
          ${dockButton("articles","review","Review",active)}
          ${dockButton("actions","actions","Actions",active)}
          ${dockButton("export","export","Export",active)}
          ${dockButton("settings","settings","Settings",active)}
        </nav>
        ${modalMarkup()}
      </div>`;
  }

  function dockButton(route, icon, label, active) {
    return `<button data-route="${route}" class="${active===route ? "active":""}">${icons[icon]}<span>${label}</span></button>`;
  }

  function modalMarkup() {
    return `<div id="core-modal" class="modal" aria-hidden="true">
      <div class="modal-panel">
        <div class="modal-head"><h2 id="modal-title">Settings</h2><button data-close-modal aria-label="Close">×</button></div>
        <div id="modal-body"></div>
      </div>
    </div>`;
  }

  function statusMarkup(review) {
    if (!review) return `<span class="status"><span class="status-dot"></span>Not reviewed</span>`;
    const cls = review.status === "complete" ? "complete" : review.status === "amendment" ? "attention" : "review";
    const label = review.status === "complete" ? "Review complete" : review.status === "amendment" ? "Amendment recommended" : "Discussion required";
    return `<span class="status ${cls}"><span class="status-dot"></span>${label}</span>`;
  }

  function dashboard() {
    const m = metrics();
    const remaining = m.total - m.reviewed;
    const content = `
      <section class="hero">
        <div class="eyebrow">Temple Board Workspace</div>
        <h1>Good ${greeting()}, Ryan.</h1>
        <p>CORE begins with the annual governance review and grows into the operational memory of the Temple Board.</p>
        <div class="rule"></div>
      </section>

      <section class="summary-grid">
        ${summary("Governance Review",`${m.reviewed} / ${m.total}`,"sections reviewed")}
        ${summary("Review Progress",`${m.percent}%`,`${remaining} remaining`,m.percent)}
        ${summary("Discussion",m.discussion,"sections")}
        ${summary("Amendments",m.amendment,"recommended")}
      </section>

      <section class="panel">
        <div class="panel-head">
          <div><h2>${REVIEW_YEAR} Governance Review</h2><p>${ORE.articles.length} Articles · ${m.total} Sections</p></div>
          <button class="btn" data-route="articles">${m.reviewed ? "Continue Review" : "Begin Review"}</button>
        </div>
        <div class="panel-body">
          <button class="menu-row" data-route="articles"><span><span class="row-title">Corporate By-Laws</span><span class="row-sub">Review every Article and Section against the authorities selected by the Temple Board.</span></span></button>
          <button class="menu-row" data-placeholder="Committee Operations"><span><span class="row-title">Committee Operations</span><span class="row-sub">Foundation reserved for committee duties, rosters, projects, and annual requirements.</span></span></button>
          <button class="menu-row" data-placeholder="Annual Certification"><span><span class="row-title">Annual Certification</span><span class="row-sub">Becomes available after the governance review is complete.</span></span></button>
          <button class="menu-row" data-placeholder="Operations & Renewals"><span><span class="row-title">Operations & Renewals</span><span class="row-sub">Future module for inspections, insurance, contracts, and recurring deadlines.</span></span></button>
        </div>
      </section>`;
    app.innerHTML = shell(content,"dashboard");
  }

  function summary(label,value,sub,progress=null){
    return `<article class="summary-card"><span>${label}</span><strong>${value}</strong><small>${sub}</small>${progress!==null?`<div class="progress-track"><i style="width:${progress}%"></i></div>`:""}</article>`;
  }

  function articleList() {
    const rows = ORE.articles.map((article, i) => {
      const completed = article.sections.filter(s => getReview(s)).length;
      const allDone = completed === article.sections.length && article.sections.length > 0;
      return `<button class="article-row" data-open-article="${i}">
        <span class="roman">${article.roman}</span>
        <span><span class="row-title">${article.title}</span><span class="row-sub">${completed} of ${article.sections.length} reviewed</span></span>
        ${statusMarkup(allDone ? {status:"complete"} : completed ? {status:"discussion"} : null)}
      </button>`;
    }).join("");

    const content = `
      <div class="backline"><button data-route="dashboard">‹ Dashboard</button></div>
      <section class="hero">
        <div class="eyebrow">${REVIEW_YEAR} Initial Review</div>
        <h1>Corporate By-Laws</h1>
        <p>${ORE.articles.length} Articles · ${allSections.length} Sections. Every saved decision updates the progress automatically.</p>
        <div class="rule"></div>
      </section>
      <section class="panel">
        <div class="panel-head"><div><h2>Articles</h2><p>Select an Article to continue.</p></div></div>
        <div class="panel-body">${rows}</div>
      </section>`;
    app.innerHTML = shell(content,"articles");
  }

  function sectionList(articleIndex) {
    state.articleIndex = articleIndex;
    const article = ORE.articles[articleIndex];
    const rows = article.sections.map((section, i) => `<button class="section-row" data-open-section="${i}">
      <span class="sec-num">${section.number}</span>
      <span><span class="row-title">${section.title}</span><span class="row-sub">${getReview(section)?.reviewId || "No review record"}</span></span>
      ${statusMarkup(getReview(section))}
    </button>`).join("");

    const content = `
      <div class="backline"><button data-route="articles">‹ All Articles</button></div>
      <section class="hero">
        <div class="eyebrow">Article ${article.roman}</div>
        <h1>${article.title}</h1>
        <p>${article.sections.length} sections in this Article.</p>
        <div class="rule"></div>
      </section>
      <section class="panel"><div class="panel-body">${rows}</div></section>`;
    app.innerHTML = shell(content,"articles");
  }

  function reviewScreen(articleIndex, sectionIndex) {
    state.articleIndex = articleIndex;
    state.sectionIndex = sectionIndex;
    const article = ORE.articles[articleIndex];
    const section = article.sections[sectionIndex];
    const existing = getReview(section) || {};
    const authority = new Set(existing.authority || []);

    const content = `
      <div class="backline"><button data-back-article>‹ Article ${article.roman}</button></div>
      <div class="review-layout">
        <article class="paper">
          <div class="crumb">CORE › Article ${article.roman} › Section ${section.number}</div>
          <div class="article-kicker">Article ${article.roman}</div>
          <h2>${article.title}</h2>
          <div class="gold-rule"></div>
          <div class="section-label">Section ${section.number}</div>
          <h3>${section.title}</h3>
          <div class="copy">${section.paragraphs.map(p=>`<p>${escapeHTML(p)}</p>`).join("")}</div>
        </article>

        <aside class="review-card">
          <h2>Governance Review</h2>
          <form id="review-form">
            <div class="field">
              <label>Applicable Authorities</label>
              <div class="checks">
                ${authorityCheck("ONCA",authority)}
                ${authorityCheck("GLON",authority)}
                ${authorityCheck("Articles of Incorporation",authority)}
                ${authorityCheck("Temple Board Policies",authority)}
                ${authorityCheck("Previous CORE Reviews",authority)}
              </div>
            </div>
            <div class="field"><label>Analysis / Review Notes</label><textarea name="notes" placeholder="Record the analysis, reasoning, references, and recommendations.">${escapeHTML(existing.notes || "")}</textarea></div>
            <div class="field"><label>Reviewer</label><input name="reviewedBy" value="${escapeHTML(existing.reviewedBy || state.settings.reviewer || "")}" placeholder="Name or committee"></div>
            <div class="field">
              <label>Decision</label>
              <div class="decision-grid">
                ${decision("complete","Review Complete",existing.status)}
                ${decision("discussion","Board Discussion Required",existing.status)}
                ${decision("amendment","Amendment Recommended",existing.status)}
              </div>
            </div>
            <div class="actions">
              <button class="btn" type="submit">Save Review</button>
              <button class="btn secondary" type="button" data-save-next>Save & Next</button>
              ${existing.reviewId ? `<button class="btn danger" type="button" data-clear-review>Clear</button>`:""}
            </div>
          </form>
        </aside>
      </div>`;
    app.innerHTML = shell(content,"articles");
  }

  function authorityCheck(name,set){
    return `<label><input type="checkbox" name="authority" value="${name}" ${set.has(name)?"checked":""}> ${name}</label>`;
  }
  function decision(value,label,current){
    return `<label class="decision"><input type="radio" name="status" value="${value}" ${current===value?"checked":""}> ${label}</label>`;
  }

  function saveReview(next=false){
    const article = ORE.articles[state.articleIndex];
    const section = article.sections[state.sectionIndex];
    const form = document.querySelector("#review-form");
    const data = new FormData(form);
    const status = data.get("status");
    if (!status) { notify("Choose a decision first."); return; }

    const existing = getReview(section);
    const reviewId = existing?.reviewId || nextReviewId();
    const date = new Date().toISOString().slice(0,10);
    const reviewedBy = String(data.get("reviewedBy") || "").trim();

    state.reviews[sectionKey(section)] = {
      reviewId,
      type:"bylaw-section",
      article:article.roman,
      section:String(section.number),
      title:section.title,
      status,
      reviewDate:date,
      reviewedBy: reviewedBy || "Temple Board",
      authority:data.getAll("authority"),
      notes:String(data.get("notes") || "").trim(),
      nextReview:`${REVIEW_YEAR+1}-${date.slice(5)}`,
      published:false
    };
    if (reviewedBy) state.settings.reviewer = reviewedBy;
    save();
    notify(`${reviewId} saved.`);

    if (next) goNextSection();
    else reviewScreen(state.articleIndex,state.sectionIndex);
  }

  function nextReviewId(){
    const used = Object.values(state.reviews).map(r => r?.reviewId).filter(Boolean);
    let n = 1;
    while (used.includes(`CORE-${REVIEW_YEAR}-${String(n).padStart(4,"0")}`)) n++;
    return `CORE-${REVIEW_YEAR}-${String(n).padStart(4,"0")}`;
  }

  function goNextSection(){
    const article = ORE.articles[state.articleIndex];
    if (state.sectionIndex < article.sections.length - 1) {
      reviewScreen(state.articleIndex,state.sectionIndex+1);
    } else if (state.articleIndex < ORE.articles.length - 1) {
      reviewScreen(state.articleIndex+1,0);
    } else {
      dashboard();
      notify("Governance review reached the final section.");
    }
  }

  function exportReviews(){
    const payload = {
      meta:{
        product:"CORE",
        expansion:"Corporate Operations & Review Engine",
        organization:ORE.meta?.corporation || "Temple Board",
        reviewYear:REVIEW_YEAR,
        exportedAt:new Date().toISOString(),
        totalArticles:ORE.articles.length,
        totalSections:allSections.length
      },
      reviews:state.reviews
    };
    const blob = new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url;
    a.download=`core-reviews-${REVIEW_YEAR}.json`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    notify("Review data exported.");
  }

  function settingsModal(){
    const modal = document.querySelector("#core-modal");
    document.querySelector("#modal-title").textContent="CORE Settings";
    document.querySelector("#modal-body").innerHTML=`
      <div class="field"><label>Appearance</label>
        <div class="theme-options">
          ${themeButton("light","Light")}
          ${themeButton("dark","Dark")}
          ${themeButton("system","System")}
        </div>
      </div>
      <div class="field"><label>Default Reviewer</label><input id="setting-reviewer" value="${escapeHTML(state.settings.reviewer||"")}" placeholder="Name or committee"></div>
      <div class="actions"><button class="btn" data-save-settings>Save Settings</button></div>`;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden","false");
  }

  function themeButton(value,label){
    return `<button data-theme-choice="${value}" class="${state.settings.theme===value?"active":""}">${label}</button>`;
  }

  function closeModal(){
    const modal=document.querySelector("#core-modal");
    modal?.classList.remove("open");
    modal?.setAttribute("aria-hidden","true");
  }

  function greeting(){
    const h=new Date().getHours();
    return h<12?"morning":h<18?"afternoon":"evening";
  }

  function escapeHTML(value=""){
    return String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
  }

  document.addEventListener("click", e => {
    const route = e.target.closest("[data-route]")?.dataset.route;
    if (route) {
      if (route==="dashboard") dashboard();
      if (route==="articles") articleList();
      if (route==="export") exportReviews();
      if (route==="settings") settingsModal();
      if (route==="actions") notify("Action Centre is reserved for CORE v0.2.");
      return;
    }

    const article = e.target.closest("[data-open-article]");
    if (article) return sectionList(Number(article.dataset.openArticle));

    const section = e.target.closest("[data-open-section]");
    if (section) return reviewScreen(state.articleIndex,Number(section.dataset.openSection));

    if (e.target.closest("[data-back-article]")) return sectionList(state.articleIndex);
    if (e.target.closest("[data-open-settings]")) return settingsModal();
    if (e.target.closest("[data-close-modal]") || (e.target.id==="core-modal")) return closeModal();

    const theme = e.target.closest("[data-theme-choice]");
    if (theme) {
      state.settings.theme=theme.dataset.themeChoice;
      document.documentElement.dataset.theme=state.settings.theme;
      document.querySelectorAll("[data-theme-choice]").forEach(b=>b.classList.toggle("active",b===theme));
      return;
    }

    if (e.target.closest("[data-save-settings]")) {
      state.settings.reviewer=document.querySelector("#setting-reviewer").value.trim();
      save(); closeModal(); notify("Settings saved."); return;
    }

    if (e.target.closest("[data-save-next]")) return saveReview(true);

    if (e.target.closest("[data-clear-review]")) {
      const section=ORE.articles[state.articleIndex].sections[state.sectionIndex];
      delete state.reviews[sectionKey(section)]; save(); reviewScreen(state.articleIndex,state.sectionIndex); notify("Review cleared."); return;
    }

    const placeholder=e.target.closest("[data-placeholder]");
    if (placeholder) notify(`${placeholder.dataset.placeholder} is planned for the next CORE module.`);
  });

  document.addEventListener("submit", e => {
    if (e.target.id!=="review-form") return;
    e.preventDefault();
    saveReview(false);
  });

  dashboard();
})();
