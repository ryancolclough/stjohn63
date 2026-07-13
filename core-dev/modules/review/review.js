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
    state.articleIndex=articleIndex; state.sectionIndex=sectionIndex;
    const article=state.articles[articleIndex], section=article.sections[sectionIndex], existing=state.getReview(section)||{};
    const authority=new Set(existing.authorities||[]), related=existing.relatedRecords||{}, history=Array.isArray(existing.history)?existing.history:[];
    const content=`<div class="backline"><button data-back-article>‹ Article ${article.roman}</button></div><section class="record-summary"><div><span>Section ${section.number}</span><strong>${section.title}</strong></div><div class="record-meta"><div><span>Status</span><strong>${statusLabel(existing.status)}</strong></div><div><span>Review ID</span><strong>${existing.reviewId||"Not assigned"}</strong></div><div><span>Last Review</span><strong>${existing.reviewDate||"Not reviewed"}</strong></div><div><span>Next Review</span><strong>${existing.nextReview||"Not scheduled"}</strong></div><div><span>Reviewer</span><strong>${existing.reviewedBy||"Not assigned"}</strong></div><div><span>Committee</span><strong>${existing.responsibleCommittee||"By-Laws Committee"}</strong></div></div></section><div class="review-layout"><article class="paper"><div class="crumb">CORE › Article ${article.roman} › Section ${section.number}</div><div class="article-kicker">Article ${article.roman}</div><h2>${article.title}</h2><div class="gold-rule"></div><div class="section-label">Section ${section.number}</div><h3>${section.title}</h3><div class="copy">${section.paragraphs.map(p=>`<p>${escapeHTML(p)}</p>`).join("")}</div></article><aside class="review-card"><h2>Governance Review</h2><form id="review-form"><div class="field"><label>Responsible Committee</label><input name="responsibleCommittee" value="${escapeHTML(existing.responsibleCommittee||"By-Laws Committee")}"></div><div class="field"><label>Compliance Matrix</label><div class="matrix-grid">${matrixRow("Ontario Not-for-Profit Corporations Act, 2010",authority)}${matrixRow("Grand Lodge governance documents",authority)}${matrixRow("Articles of Incorporation",authority)}${matrixRow("Temple Board Corporate By-Laws",authority)}${matrixRow("Previous CORE Reviews",authority)}</div></div><div class="field"><label>Analysis / Review Notes</label><textarea name="notes">${escapeHTML(existing.notes||"")}</textarea></div><div class="field"><label>Institutional Knowledge</label><textarea name="institutionalKnowledge" placeholder="Record why this wording exists, lessons learned, and what future boards should know.">${escapeHTML(existing.institutionalKnowledge||"")}</textarea></div><div class="field"><label>Reviewer</label><input name="reviewedBy" value="${escapeHTML(existing.reviewedBy||state.settings.reviewer||"")}"></div><div class="field"><label>Related Records</label><div class="related-grid">${relatedField("Meeting","meeting",related.meeting)}${relatedField("Motion","motion",related.motion)}${relatedField("Amendment","amendment",related.amendment)}${relatedField("ORE Publication","orePublication",related.orePublication)}</div></div><div class="field"><label>Decision</label><div class="decision-grid">${decision("complete","Review Complete",existing.status)}${decision("discussion","Board Discussion Required",existing.status)}${decision("amendment","Amendment Recommended",existing.status)}</div></div><div class="field"><label>Governance Timeline</label><div class="timeline-list">${buildTimeline(existing)}</div></div>${historyMarkup(history)}<div id="amendment-slot"></div><div class="actions"><button class="btn" type="submit">Save Review</button><button class="btn secondary" type="button" data-save-next>Save & Next</button>${existing.reviewId?'<button class="btn danger" type="button" data-clear-current>Clear Record</button>':''}</div></form></aside></div>`;
    renderShell(content,"review"); events.emit("review:screen",{section,existing});
  }
  function statusLabel(s){return s==="complete"?"Review Complete":s==="discussion"?"Discussion Required":s==="amendment"?"Amendment Recommended":"Not Reviewed"}
  function matrixRow(name,set){return `<label class="matrix-row"><input type="checkbox" name="authority" value="${name}" ${set.has(name)?"checked":""}><span>${name}</span><b>${set.has(name)?"Reviewed":"Pending"}</b></label>`}
  function relatedField(label,name,value=""){return `<div><span>${label}</span><input name="${name}" value="${escapeHTML(value||"")}" placeholder="Optional reference"></div>`}
  function buildTimeline(e){const rows=[{l:"Imported into CORE",d:true,date:e.importedDate||""},{l:"Governance review completed",d:Boolean(e.reviewId),date:e.reviewDate||""},{l:"Board discussion",d:e.status==="discussion"||Boolean(e.amendment?.boardDiscussed),date:e.amendment?.meetingDate||""},{l:"Amendment approved",d:Boolean(e.amendment?.boardApproved),date:e.amendment?.approvalDate||""},{l:"Published to ORE",d:Boolean(e.amendment?.publishedToORE)||Boolean(e.published),date:e.amendment?.approvalDate||""}]; return rows.map(r=>`<div class="timeline-item ${r.d?"done":""}"><span>${r.d?"✓":"○"}</span><div><strong>${r.l}</strong>${r.date?`<small>${escapeHTML(r.date)}</small>`:""}</div></div>`).join("")}
  function historyMarkup(h){if(!h.length)return ""; return `<div class="field"><label>Review History</label><div class="history-list">${h.map(i=>`<article class="history-card"><strong>${escapeHTML(i.reviewId||"Previous review")}</strong><small>${escapeHTML(i.reviewDate||"")}</small><p>${escapeHTML(i.notes||"No notes recorded.")}</p></article>`).join("")}</div></div>`}

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
    const now=new Date().toISOString().slice(0,10); const history=Array.isArray(existing?.history)?[...existing.history]:[];
    if(existing?.reviewId && (
      existing.status !== status ||
      existing.notes !== String(data.get("notes") || "") ||
      existing.institutionalKnowledge !== String(data.get("institutionalKnowledge") || "")
    )){
      history.unshift({
        reviewId:existing.reviewId,
        status:existing.status,
        reviewDate:existing.reviewDate,
        reviewedBy:existing.reviewedBy,
        notes:existing.notes || "",
        institutionalKnowledge:existing.institutionalKnowledge || "",
        amendmentId:existing.amendment?.amendmentId || ""
      });
    }
    const record={reviewId:existing?.reviewId||state.nextReviewId(),type:"bylaw-section",article:article.roman,section:String(section.number),title:section.title,status,importedDate:existing?.importedDate||now,reviewDate:now,nextReview:`${new Date().getFullYear()+1}-${now.slice(5)}`,reviewedBy:String(data.get("reviewedBy")||"Temple Board"),responsibleCommittee:String(data.get("responsibleCommittee")||"By-Laws Committee"),authorities:data.getAll("authority"),notes:String(data.get("notes")||""),institutionalKnowledge:String(data.get("institutionalKnowledge")||""),relatedRecords:{meeting:String(data.get("meeting")||""),motion:String(data.get("motion")||""),amendment:String(data.get("amendment")||""),orePublication:String(data.get("orePublication")||"")},history,
      amendment:events.emit("amendment:collect",{form,existing}) ?? existing?.amendment ?? null,
      published:Boolean(existing?.published)
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
    if(e.target.closest("[data-create-review-action]")){
      const article = state.articles[state.articleIndex];
      const section = article.sections[state.sectionIndex];
      const record = state.getReview(section) || {};
      events.emit("actions:create-from-review",{
        title:`Follow up Section ${section.number} — ${section.title}`,
        description:record.notes || record.institutionalKnowledge || "",
        section:String(section.number),
        articleIndex:state.articleIndex,
        sectionIndex:state.sectionIndex,
        assignedCommittee:record.responsibleCommittee || "By-Laws Committee"
      });
      return;
    }
    if(e.target.closest("[data-clear-current]")){const section=state.articles[state.articleIndex].sections[state.sectionIndex];state.removeReview(section);toast("Review record cleared.");return reviewScreen(state.articleIndex,state.sectionIndex);}
  });
  events.on("review:open-direct",({articleIndex,sectionIndex})=>reviewScreen(articleIndex,sectionIndex));
  document.addEventListener("submit",e=>{
    if(e.target.id!=="review-form") return;
    e.preventDefault(); saveReview(false);
  });
}
