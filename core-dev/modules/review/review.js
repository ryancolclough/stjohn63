import { escapeHTML, statusMarkup } from "../../sdk/ui.js";

export default function register(ctx){
  const { router, state, renderShell, toast, events } = ctx;

  router.register("review", () => articleList());

  function articleList(){
    const rows = state.articles.map((article,i)=>{
      const completed = article.sections.filter(s=>state.getReview(s)).length;
      const allDone = completed === article.sections.length && article.sections.length;
      return `<button class="article-row" data-open-article="${i}">
        <span class="roman">${article.roman}</span>
        <span><span class="row-title">${article.title}</span><span class="row-sub">${completed} of ${article.sections.length} reviewed</span></span>
        ${statusMarkup(allDone?{status:"complete"}:completed?{status:"discussion"}:null)}
      </button>`;
    }).join("");

    const content = `
      <div class="backline"><button data-route="dashboard">‹ Dashboard</button></div>
      <section class="hero">
        <div class="eyebrow">${state.reviewYear} Governance Review</div>
        <h1>Corporate By-Laws</h1>
        <p>${state.articles.length} Articles · ${state.allSections.length} Sections.</p>
        <div class="rule"></div>
      </section>
      <section class="panel"><div class="panel-head"><div><h2>Articles</h2><p>Select an Article.</p></div></div><div class="panel-body">${rows}</div></section>`;
    renderShell(content,"review");
  }

  function sectionList(articleIndex){
    state.articleIndex = articleIndex;
    const article = state.articles[articleIndex];
    const rows = article.sections.map((section,i)=>`
      <button class="section-row" data-open-section="${i}">
        <span class="sec-num">${section.number}</span>
        <span><span class="row-title">${section.title}</span><span class="row-sub">${state.getReview(section)?.reviewId || "No review record"}</span></span>
        ${statusMarkup(state.getReview(section))}
      </button>`).join("");

    const content = `
      <div class="backline"><button data-route="review">‹ All Articles</button></div>
      <section class="hero"><div class="eyebrow">Article ${article.roman}</div><h1>${article.title}</h1><p>${article.sections.length} sections.</p><div class="rule"></div></section>
      <section class="panel"><div class="panel-body">${rows}</div></section>`;
    renderShell(content,"review");
  }

  function reviewScreen(articleIndex, sectionIndex){
    state.articleIndex = articleIndex;
    state.sectionIndex = sectionIndex;
    const article = state.articles[articleIndex];
    const section = article.sections[sectionIndex];
    const existing = state.getReview(section) || {};
    const authority = new Set(existing.authorities || []);

    const content = `
      <div class="backline"><button data-back-article>‹ Article ${article.roman}</button></div>
      <div class="review-layout">
        <article class="paper">
          <div class="crumb">CORE › Article ${article.roman} › Section ${section.number}</div>
          <div class="article-kicker">Article ${article.roman}</div><h2>${article.title}</h2><div class="gold-rule"></div>
          <div class="section-label">Section ${section.number}</div><h3>${section.title}</h3>
          <div class="copy">${section.paragraphs.map(p=>`<p>${escapeHTML(p)}</p>`).join("")}</div>
        </article>

        <aside class="review-card">
          <h2>Governance Review</h2>
          <form id="review-form">
            <div class="field"><label>Applicable Authorities</label><div class="checks">
              ${check("Ontario Not-for-Profit Corporations Act, 2010",authority)}
              ${check("Grand Lodge governance documents",authority)}
              ${check("Articles of Incorporation",authority)}
              ${check("Temple Board Corporate By-Laws",authority)}
              ${check("Previous CORE Reviews",authority)}
            </div></div>
            <div class="field"><label>Analysis / Review Notes</label><textarea name="notes">${escapeHTML(existing.notes||"")}</textarea></div>
            <div class="field"><label>Reviewer</label><input name="reviewedBy" value="${escapeHTML(existing.reviewedBy||state.settings.reviewer||"")}"></div>
            <div class="field"><label>Decision</label><div class="decision-grid">
              ${decision("complete","Review Complete",existing.status)}
              ${decision("discussion","Board Discussion Required",existing.status)}
              ${decision("amendment","Amendment Recommended",existing.status)}
            </div></div>
            <div id="amendment-slot"></div>
            <div class="actions">
              <button class="btn" type="submit">Save Review</button>
              <button class="btn secondary" type="button" data-save-next>Save & Next</button>
            </div>
          </form>
        </aside>
      </div>`;
    renderShell(content,"review");
    events.emit("review:screen", { section, existing });
  }

  function check(name,set){ return `<label><input type="checkbox" name="authority" value="${name}" ${set.has(name)?"checked":""}> ${name}</label>`; }
  function decision(value,label,current){ return `<label class="decision"><input type="radio" name="status" value="${value}" ${current===value?"checked":""}> ${label}</label>`; }

  function saveReview(next=false){
    const article = state.articles[state.articleIndex];
    const section = article.sections[state.sectionIndex];
    const form = document.querySelector("#review-form");
    const data = new FormData(form);
    const status = data.get("status");
    if(!status){ toast("Choose a decision first."); return; }

    const existing = state.getReview(section);
    const record = {
      reviewId: existing?.reviewId || state.nextReviewId(),
      type:"bylaw-section",
      article:article.roman,
      section:String(section.number),
      title:section.title,
      status,
      reviewDate:new Date().toISOString().slice(0,10),
      reviewedBy:String(data.get("reviewedBy")||"Temple Board"),
      authorities:data.getAll("authority"),
      notes:String(data.get("notes")||""),
      amendment: events.emit("amendment:collect", { form, existing }) || existing?.amendment || null
    };

    state.setReview(section, record);
    toast(`${record.reviewId} saved.`);
    if(next) goNext(); else reviewScreen(state.articleIndex,state.sectionIndex);
  }

  function goNext(){
    const article = state.articles[state.articleIndex];
    if(state.sectionIndex < article.sections.length-1) reviewScreen(state.articleIndex,state.sectionIndex+1);
    else if(state.articleIndex < state.articles.length-1) reviewScreen(state.articleIndex+1,0);
    else router.go("dashboard");
  }

  document.addEventListener("click",e=>{
    const a=e.target.closest("[data-open-article]"); if(a) return sectionList(Number(a.dataset.openArticle));
    const s=e.target.closest("[data-open-section]"); if(s) return reviewScreen(state.articleIndex,Number(s.dataset.openSection));
    if(e.target.closest("[data-back-article]")) return sectionList(state.articleIndex);
    if(e.target.closest("[data-save-next]")) return saveReview(true);
  });
  document.addEventListener("submit",e=>{
    if(e.target.id!=="review-form") return;
    e.preventDefault(); saveReview(false);
  });
}
