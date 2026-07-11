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
          <p>CORE expects <code>../orefinal/content/ore-data.js</code>. Confirm that <strong>core</strong> and <strong>orefinal</strong> sit beside one another.</p>
        </section>
      </main>`;
    return;
  }

  const STORAGE_KEY = "CORE_REVIEWS_V1";
  const SETTINGS_KEY = "CORE_SETTINGS_V1";
  const REVIEW_YEAR = new Date().getFullYear();
  const ORE_REVIEW_URL = "../orefinal/data/core-reviews.json";

  const state = {
    articleIndex: null,
    sectionIndex: null,
    filter: "all",
    query: "",
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

  const sectionKey = section => String(section.number);
  const getReview = section => state.reviews[sectionKey(section)] || null;

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
            <span><strong>CORE</strong><small>Compliance &amp; Operational Review Engine</small></span>
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
    const content = `
      <section class="hero">
        <div class="eyebrow">Temple Board Workspace</div>
        <h1>Good ${greeting()}, Ryan.</h1>
        <p>CORE records the annual governance review, prepares publication data for ORE, and preserves the reasoning behind each decision.</p>
        <div class="rule"></div>
      </section>

      <section class="summary-grid">
        ${summary("Governance Review",`${m.reviewed} / ${m.total}`,"sections reviewed")}
        ${summary("Review Progress",`${m.percent}%`,`${m.total-m.reviewed} remaining`,m.percent)}
        ${summary("Discussion",m.discussion,"sections")}
        ${summary("Amendments",m.amendment,"recommended")}
      </section>

      <section class="panel">
        <div class="panel-head">
          <div><h2>${REVIEW_YEAR} Governance Review</h2><p>${ORE.articles.length} Articles · ${m.total} Sections</p></div>
          <button class="btn" data-route="articles">${m.reviewed ? "Continue Review" : "Begin Review"}</button>
        </div>
        <div class="panel-body">
          <button class="menu-row" data-route="articles"><span><span class="row-title">Corporate By-Laws</span><span class="row-sub">Review, document, and prepare each section for publication to ORE.</span></span></button>
          <button class="menu-row" data-route="export"><span><span class="row-title">Review Data & Publication</span><span class="row-sub">Import previous work, create a backup, or generate the ORE review file.</span></span></button>
          <button class="menu-row" data-placeholder="Committee Operations"><span><span class="row-title">Committee Operations</span><span class="row-sub">Reserved for the next CORE module.</span></span></button>
        </div>
      </section>`;
    app.innerHTML = shell(content,"dashboard");
  }

  function summary(label,value,sub,progress=null){
    return `<article class="summary-card"><span>${label}</span><strong>${value}</strong><small>${sub}</small>${progress!==null?`<div class="progress-track"><i style="width:${progress}%"></i></div>`:""}</article>`;
  }

  function articleList() {
    const query = state.query.trim().toLowerCase();
    const rows = ORE.articles.map((article, i) => {
      const visibleSections = article.sections.filter(section => sectionMatches(section, query, state.filter));
      if (!visibleSections.length) return "";
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
        <div class="eyebrow">${REVIEW_YEAR} Governance Review</div>
        <h1>Corporate By-Laws</h1>
        <p>${ORE.articles.length} Articles · ${allSections.length} Sections.</p>
        <div class="rule"></div>
      </section>

      <div class="review-toolbar">
        <input class="review-search" id="review-search" type="search" value="${escapeHTML(state.query)}" placeholder="Search section number, title, or wording">
        <div class="filter-row">
          ${filterButton("all","All")}
          ${filterButton("not_reviewed","Not Reviewed")}
          ${filterButton("complete","Complete")}
          ${filterButton("discussion","Discussion")}
          ${filterButton("amendment","Amendment")}
        </div>
      </div>

      <section class="panel">
        <div class="panel-head"><div><h2>Articles</h2><p>Select an Article to continue.</p></div></div>
        <div class="panel-body">${rows || '<div class="empty">No sections match this filter.</div>'}</div>
      </section>`;
    app.innerHTML = shell(content,"articles");
  }

  function filterButton(value,label){
    return `<button class="filter-btn ${state.filter===value?"active":""}" data-filter="${value}">${label}</button>`;
  }

  function sectionMatches(section, query, filter){
    const review = getReview(section);
    const status = review?.status || "not_reviewed";
    const filterMatch = filter === "all" || status === filter;
    const haystack = `${section.number} ${section.title} ${(section.paragraphs||[]).join(" ")}`.toLowerCase();
    return filterMatch && (!query || haystack.includes(query));
  }

  function sectionList(articleIndex) {
    state.articleIndex = articleIndex;
    const article = ORE.articles[articleIndex];
    const query = state.query.trim().toLowerCase();
    const rows = article.sections
      .filter(section => sectionMatches(section,query,state.filter))
      .map(section => {
        const i = article.sections.indexOf(section);
        return `<button class="section-row" data-open-section="${i}">
          <span class="sec-num">${section.number}</span>
          <span><span class="row-title">${section.title}</span><span class="row-sub">${getReview(section)?.reviewId || "No review record"}</span></span>
          ${statusMarkup(getReview(section))}
        </button>`;
      }).join("");

    const content = `
      <div class="backline"><button data-route="articles">‹ All Articles</button></div>
      <section class="hero">
        <div class="eyebrow">Article ${article.roman}</div>
        <h1>${article.title}</h1>
        <p>${article.sections.length} sections in this Article.</p>
        <div class="rule"></div>
      </section>
      <section class="panel"><div class="panel-body">${rows || '<div class="empty">No sections match this filter.</div>'}</div></section>`;
    app.innerHTML = shell(content,"articles");
  }

  function reviewScreen(articleIndex, sectionIndex) {
    state.articleIndex = articleIndex;
    state.sectionIndex = sectionIndex;
    const article = ORE.articles[articleIndex];
    const section = article.sections[sectionIndex];
    const existing = getReview(section) || {};
    const authority = new Set(existing.authority || existing.authorities || []);

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
                ${authorityCheck("Ontario Not-for-Profit Corporations Act, 2010",authority,"ONCA")}
                ${authorityCheck("Grand Lodge governance documents",authority,"GLON")}
                ${authorityCheck("Articles of Incorporation",authority)}
                ${authorityCheck("Temple Board Corporate By-Laws",authority,"Temple Board Policies")}
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
            <div class="review-id-preview">${existing.reviewId ? `Review record: ${escapeHTML(existing.reviewId)}` : `Next record: ${nextReviewId()}`}</div>
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

  function authorityCheck(name,set,legacy=null){
    const checked = set.has(name) || (legacy && set.has(legacy));
    return `<label><input type="checkbox" name="authority" value="${name}" ${checked?"checked":""}> ${name}</label>`;
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
      authorities:data.getAll("authority"),
      notes:String(data.get("notes") || "").trim(),
      nextReview:`${REVIEW_YEAR+1}-${date.slice(5)}`,
      published:false
    };

    if (reviewedBy) state.settings.reviewer = reviewedBy;
    save();
    notify(`${reviewId} saved.`);
    next ? goNextSection() : reviewScreen(state.articleIndex,state.sectionIndex);
  }

  function nextReviewId(){
    const used = Object.values(state.reviews).map(r => r?.reviewId).filter(Boolean);
    let n = 1;
    while (used.includes(`CORE-${REVIEW_YEAR}-${String(n).padStart(4,"0")}`)) n++;
    return `CORE-${REVIEW_YEAR}-${String(n).padStart(4,"0")}`;
  }

  function goNextSection(){
    const article = ORE.articles[state.articleIndex];
    if (state.sectionIndex < article.sections.length - 1) reviewScreen(state.articleIndex,state.sectionIndex+1);
    else if (state.articleIndex < ORE.articles.length - 1) reviewScreen(state.articleIndex+1,0);
    else { dashboard(); notify("Governance review reached the final section."); }
  }

  function dataTools() {
    const m = metrics();
    const content = `
      <div class="backline"><button data-route="dashboard">‹ Dashboard</button></div>
      <section class="hero">
        <div class="eyebrow">Review Data</div>
        <h1>Import, Back Up & Publish</h1>
        <p>CORE stores work on this device. These tools move the review data safely between devices and prepare the public ORE file.</p>
        <div class="rule"></div>
      </section>

      <section class="utility-grid">
        <article class="utility-card">
          <h3>Load Existing ORE Records</h3>
          <p>Imports the current <code>orefinal/data/core-reviews.json</code> file into CORE without deleting newer local records.</p>
          <button class="btn secondary" data-load-ore>Load from ORE</button>
        </article>

        <article class="utility-card">
          <h3>Import CORE Backup</h3>
          <p>Restore a previously exported CORE backup JSON file on this device.</p>
          <label class="btn secondary" for="core-import">Choose Backup</label>
          <input class="file-input" id="core-import" type="file" accept=".json,application/json">
        </article>

        <article class="utility-card">
          <h3>Export CORE Backup</h3>
          <p>Downloads the complete private working record, including discussion and amendment statuses.</p>
          <button class="btn secondary" data-export-backup>Download Backup</button>
        </article>

        <article class="utility-card">
          <h3>Publish to ORE</h3>
          <p>Generates the exact public <code>core-reviews.json</code> file used by ORE. Upload it to <code>orefinal/data/</code>.</p>
          <button class="btn" data-publish-ore>Generate ORE File</button>
        </article>

        <article class="utility-card">
          <h3>Current Record</h3>
          <p>${m.reviewed} of ${m.total} sections have review records. ${m.complete} are complete; ${m.discussion+m.amendment} remain under attention.</p>
        </article>

        <article class="utility-card">
          <h3>Clear Local Data</h3>
          <p>Removes reviews from this browser only. Export a backup first.</p>
          <button class="btn danger" data-clear-all>Clear This Device</button>
        </article>
      </section>`;
    app.innerHTML = shell(content,"export");
  }

  function exportBackup(){
    downloadJSON({
      schemaVersion:"2.0",
      product:"CORE",
      expansion:"Compliance & Operational Review Engine",
      organization:ORE.meta?.corporation || "Temple Board",
      exportedAt:new Date().toISOString(),
      settings:state.settings,
      reviews:state.reviews
    },`CORE-backup-${REVIEW_YEAR}.json`);
    notify("CORE backup downloaded.");
  }

  function publishORE(){
    const reviews = {};
    Object.entries(state.reviews).forEach(([section,record]) => {
      const publicStatus = record.status === "complete" ? "complete" : "in_review";
      reviews[section] = {
        reviewId:record.reviewId,
        status:publicStatus,
        reviewDate:record.reviewDate,
        reviewedBy:record.reviewedBy || "Temple Board",
        authorities:record.authorities || record.authority || [],
        notes:record.notes || "",
        nextReview:record.nextReview || "To be established"
      };
    });

    downloadJSON({
      schemaVersion:"1.0",
      publication:ORE.meta?.documentTitle || "Corporate By-Laws",
      generatedAt:new Date().toISOString().slice(0,10),
      reviews
    },"core-reviews.json");
    notify("ORE publication file generated.");
  }

  function downloadJSON(payload,filename){
    const blob = new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url; a.download=filename; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  async function loadFromORE(){
    try{
      const res = await fetch(`${ORE_REVIEW_URL}?v=${Date.now()}`,{cache:"no-store"});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      const incoming = payload.reviews || {};
      Object.entries(incoming).forEach(([section,record]) => {
        if (!state.reviews[section]) {
          state.reviews[section] = {
            ...record,
            status: record.status === "complete" ? "complete" : "discussion",
            authorities: record.authorities || [],
            published:true
          };
        }
      });
      save(); notify("ORE records loaded."); dataTools();
    }catch(err){
      console.error(err);
      notify("Could not load ORE review data.");
    }
  }

  async function importBackup(file){
    try{
      const payload = JSON.parse(await file.text());
      const incoming = payload.reviews || payload;
      if (!incoming || typeof incoming !== "object") throw new Error("Invalid review data");
      state.reviews = incoming;
      if(payload.settings) state.settings = {...state.settings,...payload.settings};
      save();
      notify("CORE backup imported.");
      dashboard();
    }catch(err){
      console.error(err);
      notify("That file is not a valid CORE backup.");
    }
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

  document.addEventListener("input", e => {
    if(e.target.id==="review-search"){
      state.query=e.target.value;
      articleList();
      requestAnimationFrame(()=>document.querySelector("#review-search")?.focus());
    }
  });

  document.addEventListener("change", e => {
    if(e.target.id==="core-import" && e.target.files?.[0]) importBackup(e.target.files[0]);
  });

  document.addEventListener("click", e => {
    const route = e.target.closest("[data-route]")?.dataset.route;
    if (route) {
      if (route==="dashboard") dashboard();
      if (route==="articles") articleList();
      if (route==="export") dataTools();
      if (route==="settings") settingsModal();
      if (route==="actions") notify("Action Centre is planned for CORE v0.3.");
      return;
    }

    const filter=e.target.closest("[data-filter]");
    if(filter){ state.filter=filter.dataset.filter; articleList(); return; }

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

    if(e.target.closest("[data-load-ore]")) return loadFromORE();
    if(e.target.closest("[data-export-backup]")) return exportBackup();
    if(e.target.closest("[data-publish-ore]")) return publishORE();
    if(e.target.closest("[data-clear-all]")){
      if(confirm("Clear all CORE review data from this device?")){
        state.reviews={}; save(); notify("Local review data cleared."); dataTools();
      }
      return;
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
