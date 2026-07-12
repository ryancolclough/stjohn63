import { StorageService } from "../sdk/storage.js";
import { EventBus } from "../sdk/events.js";
import { Router } from "../sdk/router.js";
import { ThemeService } from "../sdk/themes.js";
import { DialogService } from "../sdk/dialogs.js";

const PLATFORM = {
  version:"1.5.0-dev",
  build:"20260712.007",
  releaseId:"CORE-DEV-REL-006-HF1",
  environment:"Development",
  modules:[]
};

const app = document.querySelector("#core-app");
const toastNode = document.querySelector("#core-toast");
const ORE = window.ORE_DATA;

if(!ORE || !Array.isArray(ORE.articles)){
  app.innerHTML=`<main class="main"><section class="hero"><div class="eyebrow">CORE could not load</div><h1>ORE data not found.</h1><p>Confirm that <code>core-dev</code> and <code>orefinal</code> sit beside one another.</p></section></main>`;
  throw new Error("ORE_DATA unavailable");
}

const storage = new StorageService("CORE");
const events = new EventBus();
const router = new Router();
const themes = new ThemeService(storage);
const dialogs = new DialogService();
themes.init();

const state = {
  articles: ORE.articles,
  allSections: ORE.articles.flatMap((article,articleIndex)=>article.sections.map((section,sectionIndex)=>({article,section,articleIndex,sectionIndex}))),
  reviewYear: new Date().getFullYear(),
  articleIndex:null,
  sectionIndex:null,
  reviews: storage.get("REVIEWS",{}),
  settings: storage.get("SETTINGS",{theme:"system",reviewer:""}),
  getReview(section){ return this.reviews[String(section.number)] || null; },
  setReview(section,record){ this.reviews[String(section.number)] = record; storage.set("REVIEWS",this.reviews); },
  removeReview(section){ delete this.reviews[String(section.number)]; storage.set("REVIEWS",this.reviews); },
  attentionItems(){ return this.allSections.map(x=>({ ...x, review:this.getReview(x.section) })).filter(x=>x.review && ["discussion","amendment"].includes(x.review.status)); },
  amendmentItems(){
    return this.allSections
      .map(x=>({ ...x, review:this.getReview(x.section) }))
      .filter(x=>x.review?.status === "amendment" || x.review?.amendment);
  },
  amendmentStage(record){
    const a = record?.amendment || {};
    if(a.archived) return "archived";
    if(a.publishedToORE) return "published";
    if(a.boardApproved) return "ready_to_publish";
    if(a.boardDiscussed) return "awaiting_approval";
    if(a.committeeReviewed) return "awaiting_board";
    if(a.analysisComplete || a.proposedText) return "drafting";
    return "not_started";
  },
  nextReviewId(){
    const used=Object.values(this.reviews).map(r=>r?.reviewId).filter(Boolean);
    let n=1; let id;
    do{id=`CORE-${this.reviewYear}-${String(n++).padStart(4,"0")}`;}while(used.includes(id));
    return id;
  },
  annualSettings(){
    return storage.get("ANNUAL", {
      year:this.reviewYear,
      status:"in_progress",
      startedDate:new Date().toISOString().slice(0,10),
      targetCompletionDate:`${this.reviewYear}-12-15`,
      meetingTarget:4,
      notes:"",
      recessMonths:[7,8]
    });
  },
  saveAnnualSettings(value){
    storage.set("ANNUAL", value);
  },
  annualQueue(){
    const attention = this.allSections
      .filter(item => ["discussion","amendment"].includes(this.getReview(item.section)?.status))
      .map(item => ({
        ...item,
        queueReason:this.getReview(item.section).status === "amendment"
          ? "Amendment recommended"
          : "Discussion required"
      }));

    const notReviewed = this.allSections
      .filter(item => !this.getReview(item.section))
      .map(item => ({
        ...item,
        queueReason:"Not reviewed"
      }));

    return [...attention, ...notReviewed];
  },
  annualArticleProgress(){
    return this.articles.map((article, articleIndex) => {
      const reviewed = article.sections.filter(section => this.getReview(section)).length;
      const total = article.sections.length;
      return {
        article,
        articleIndex,
        reviewed,
        total,
        percent:total ? Math.round((reviewed / total) * 100) : 0
      };
    });
  },
  sectionRisk(item){
    const review = this.getReview(item.section);
    if(!review) return {level:"medium",score:55,reasons:["Not yet reviewed"]};

    const reasons = [];
    let score = 15;

    if(review.status === "discussion"){ score += 30; reasons.push("Board discussion required"); }
    if(review.status === "amendment"){ score += 45; reasons.push("Amendment recommended"); }
    if(review.amendment && !review.amendment.boardApproved){ score += 15; reasons.push("Amendment not yet approved"); }
    if(review.amendment?.boardApproved && !review.amendment?.publishedToORE){ score += 10; reasons.push("Approved amendment not yet published"); }
    if((review.authorities || []).length < 3){ score += 15; reasons.push("Authority review incomplete"); }
    if(!review.institutionalKnowledge){ score += 5; reasons.push("Institutional knowledge not recorded"); }

    const reviewedDate = review.reviewDate ? new Date(review.reviewDate) : null;
    if(reviewedDate && !Number.isNaN(reviewedDate.getTime())){
      const ageDays = Math.floor((Date.now() - reviewedDate.getTime()) / 86400000);
      if(ageDays > 730){ score += 25; reasons.push("Last review more than two years ago"); }
      else if(ageDays > 365){ score += 12; reasons.push("Last review more than one year ago"); }
    }

    score = Math.min(100, score);
    const level = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
    if(!reasons.length) reasons.push("Current review record has no unresolved issues");
    return {level,score,reasons};
  },
  estimatedReviewMinutes(item){
    const review = this.getReview(item.section);
    let minutes = 4;
    const length = (item.section.paragraphs || []).join(" ").length;
    minutes += Math.min(8, Math.ceil(length / 500));
    if(!review) minutes += 2;
    if(review?.status === "discussion") minutes += 6;
    if(review?.status === "amendment") minutes += 10;
    if(review?.amendment && !review.amendment.boardApproved) minutes += 4;
    return minutes;
  },
  intelligenceSummary(){
    const queue = this.annualQueue();
    const risks = this.allSections.map(item => ({...item,risk:this.sectionRisk(item)}));
    const high = risks.filter(x => x.risk.level === "high");
    const medium = risks.filter(x => x.risk.level === "medium");
    const estimated = queue.reduce((sum,item)=>sum+this.estimatedReviewMinutes(item),0);
    return {queue,risks,high,medium,estimated};
  },
  generateAgenda(limitMinutes=45){
    const queue = this.annualQueue();
    const amendments = this.amendmentItems().filter(x => !["published","archived"].includes(this.amendmentStage(x.review)));
    const agenda = [];
    let used = 8;

    agenda.push({type:"standard",title:"Call to Order and Approval of Previous Minutes",minutes:8});

    for(const item of queue){
      const minutes = this.estimatedReviewMinutes(item);
      if(used + minutes > limitMinutes - 5) break;
      agenda.push({
        type:"review",
        title:`Review Section ${item.section.number} — ${item.section.title}`,
        minutes,
        articleIndex:item.articleIndex,
        sectionIndex:item.sectionIndex,
        reason:item.queueReason
      });
      used += minutes;
    }

    for(const item of amendments){
      const title = item.review?.amendment?.amendmentId
        ? `Amendment ${item.review.amendment.amendmentId}`
        : `Amendment for Section ${item.section.number}`;
      if(agenda.some(x => x.articleIndex===item.articleIndex && x.sectionIndex===item.sectionIndex)) continue;
      if(used + 8 > limitMinutes - 5) break;
      agenda.push({
        type:"amendment",
        title,
        minutes:8,
        articleIndex:item.articleIndex,
        sectionIndex:item.sectionIndex,
        reason:"Pending amendment workflow"
      });
      used += 8;
    }

    agenda.push({type:"standard",title:"Actions, New Business and Adjournment",minutes:5});
    return {items:agenda,totalMinutes:agenda.reduce((sum,x)=>sum+x.minutes,0),limitMinutes};
  },
  actionItems(){
    return storage.get("ACTIONS", []);
  },
  saveActionItems(items){
    storage.set("ACTIONS", items);
  },
  nextActionId(){
    const used = this.actionItems().map(item => item.id).filter(Boolean);
    let n = 1; let id;
    do{ id = `ACT-${this.reviewYear}-${String(n++).padStart(4,"0")}`; }while(used.includes(id));
    return id;
  },
  actionSummary(){
    const items = this.actionItems();
    const today = new Date().toISOString().slice(0,10);
    return {
      total:items.length,
      open:items.filter(x => !["completed","archived"].includes(x.status)).length,
      overdue:items.filter(x => !["completed","archived"].includes(x.status) && x.dueDate && x.dueDate < today).length,
      dueThisMonth:items.filter(x => !["completed","archived"].includes(x.status) && x.dueDate?.slice(0,7) === today.slice(0,7)).length,
      completed:items.filter(x => x.status === "completed").length
    };
  },
  metrics(){
    const total=this.allSections.length;
    const records=this.allSections.map(x=>this.getReview(x.section)).filter(Boolean);
    const reviewed=records.length;
    return {
      total,reviewed,
      complete:records.filter(r=>r.status==="complete").length,
      discussion:records.filter(r=>r.status==="discussion").length,
      amendment:records.filter(r=>r.status==="amendment").length,
      percent:total?Math.round(reviewed/total*100):0
    };
  },
  greeting(){ const h=new Date().getHours(); return h<12?"morning":h<18?"afternoon":"evening"; }
};

function toast(message){
  toastNode.textContent=message;toastNode.classList.add("show");
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>toastNode.classList.remove("show"),1800);
}

const icons={
  dashboard:'<svg viewBox="0 0 24 24"><path d="M3 11 12 3l9 8v10H3z"/><path d="M9 21v-7h6v7"/></svg>',
  review:'<svg viewBox="0 0 24 24"><path d="M5 3h14v18H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  actions:'<svg viewBox="0 0 24 24"><path d="M5 4h14v16H5z"/><path d="m8 9 2 2 4-4M8 15h8"/></svg>',
  amendments:'<svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6z"/><path d="M9 10h6M9 14h6M9 18h4"/></svg>',
  annual:'<svg viewBox="0 0 24 24"><path d="M4 5h16v15H4z"/><path d="M8 3v4M16 3v4M4 9h16"/><path d="M8 13h3M13 13h3M8 17h3"/></svg>',
  export:'<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 20h16"/></svg>',
  settings:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A8 8 0 0 0 15 6l-.3-2.6h-4L10.4 6A8 8 0 0 0 8.9 7.1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1A8 8 0 0 0 10.4 18l.3 2.6h4L15 18a8 8 0 0 0 1.5-1.1l2.4 1 2-3.4-2-1.5a7 7 0 0 0 .1-1z"/></svg>'
};

function renderShell(content,active="dashboard"){
  app.innerHTML=`
    <div class="app-shell">
      <div class="dev-banner">CORE Development Build · ${PLATFORM.version} · ${PLATFORM.build}</div>
      <header class="topbar">
        <button class="brand" data-route="dashboard"><span class="brand-mark"><span>C</span></span><span><strong>CORE</strong><small>Compliance &amp; Operational Review Engine</small></span></button>
        <div class="top-actions"><button class="icon-btn" data-route="settings">⚙</button></div>
      </header>
      <main class="main">${content}</main>
      <div class="version-stamp">CORE Platform ${PLATFORM.version} · Build ${PLATFORM.build}</div>
      <nav class="dock">
        ${dock("dashboard","Home",active)}
        ${dock("review","Review",active)}
        ${dock("actions","Actions",active)}
        ${dock("export","Export",active)}
        ${dock("settings","Settings",active)}
      </nav>
      <div id="core-modal" class="modal" aria-hidden="true"><div class="modal-panel"><div class="modal-head"><h2 id="modal-title"></h2><button data-close-modal>×</button></div><div id="modal-body"></div></div></div>
    </div>`;
}
function dock(route,label,active){ return `<button data-route="${route}" class="${active===route?"active":""}">${icons[route]||icons.actions}<span>${label}</span></button>`; }

async function boot(){
  const registry = await fetch("data/module-registry.json?v=20260712.007", {cache:"no-store"}).then(r=>{
    if(!r.ok) throw new Error(`Module registry HTTP ${r.status}`);
    return r.json();
  });
  for(const item of registry.filter(x=>x.enabled)){
    const mod = await import(`${item.entry}?v=20260712.007`);
    PLATFORM.modules.push(item);
    mod.default({router,state,storage,events,themes,dialogs,renderShell,toast,platform:PLATFORM});
  }
  if(!router.routes.has("amendments")) router.register("amendments",()=>toast("Amendment module unavailable."));
  if(!router.routes.has("annual")) router.register("annual",()=>toast("Annual Governance Manager unavailable."));
  if(!router.routes.has("intelligence")) router.register("intelligence",()=>toast("Governance Intelligence unavailable."));
  if(!router.routes.has("actions")){
    router.register("actions",()=>{
      toast("Action Centre failed to register. Refresh this build.");
      console.error("CORE diagnostics: actions route missing", PLATFORM.modules);
    });
  }
  console.info("CORE loaded routes:", [...router.routes.keys()]);
  console.info("CORE loaded modules:", PLATFORM.modules.map(module => `${module.id}@${module.version}`));
  router.go("dashboard");
}

document.addEventListener("click",e=>{
  const routeButton = e.target.closest("[data-route]");
  const r = routeButton?.dataset.route;
  if(r){
    e.preventDefault();
    e.stopPropagation();
    try{
      router.go(r);
    }catch(err){
      console.error(`CORE route failure: ${r}`, err);
      toast(`${r} module route unavailable.`);
    }
    return;
  }
  if(e.target.closest("[data-close-modal]")||e.target.id==="core-modal") dialogs.close();
});

boot().catch(err=>{
  console.error(err);
  app.innerHTML=`<main class="main"><section class="hero"><div class="eyebrow">CORE module failure</div><h1>The development build could not start.</h1><p>${err.message}</p></section></main>`;
});
