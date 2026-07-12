import { StorageService } from "../sdk/storage.js";
import { EventBus } from "../sdk/events.js";
import { Router } from "../sdk/router.js";
import { ThemeService } from "../sdk/themes.js";
import { DialogService } from "../sdk/dialogs.js";

const PLATFORM = {
  version:"1.3.0-dev",
  build:"20260712.003",
  releaseId:"CORE-DEV-REL-004-HF1",
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
        ${dock("amendments","Amendments",active)}
        ${dock("export","Export",active)}
        ${dock("settings","Settings",active)}
      </nav>
      <div id="core-modal" class="modal" aria-hidden="true"><div class="modal-panel"><div class="modal-head"><h2 id="modal-title"></h2><button data-close-modal>×</button></div><div id="modal-body"></div></div></div>
    </div>`;
}
function dock(route,label,active){ return `<button data-route="${route}" class="${active===route?"active":""}">${icons[route]||icons.actions}<span>${label}</span></button>`; }

async function boot(){
  const registry = await fetch("data/module-registry.json").then(r=>r.json());
  for(const item of registry.filter(x=>x.enabled)){
    const mod = await import(item.entry);
    PLATFORM.modules.push(item);
    mod.default({router,state,storage,events,themes,dialogs,renderShell,toast,platform:PLATFORM});
  }
  if(!router.routes.has("amendments")) router.register("amendments",()=>toast("Amendment module unavailable."));
  if(!router.routes.has("annual")) router.register("annual",()=>toast("Annual Governance Manager unavailable."));
  router.go("dashboard");
}

document.addEventListener("click",e=>{
  const r=e.target.closest("[data-route]")?.dataset.route;
  if(r){ try{router.go(r)}catch(err){console.error(err);toast("Module route unavailable.");} }
  if(e.target.closest("[data-close-modal]")||e.target.id==="core-modal") dialogs.close();
});

boot().catch(err=>{
  console.error(err);
  app.innerHTML=`<main class="main"><section class="hero"><div class="eyebrow">CORE module failure</div><h1>The development build could not start.</h1><p>${err.message}</p></section></main>`;
});
