export default function register(ctx){
  const { router, state, renderShell, toast } = ctx;

  router.register("export",()=>{
    const m=state.metrics();
    const content=`
      <div class="backline"><button data-route="dashboard">‹ Dashboard</button></div>
      <section class="hero"><div class="eyebrow">Review Data</div><h1>Back Up & Publish</h1><p>Download a private CORE backup or generate the public file used by ORE.</p><div class="rule"></div></section>
      <section class="utility-grid">
        <article class="utility-card"><h3>CORE Backup</h3><p>Includes private review and amendment records.</p><button class="btn secondary" data-export-backup>Download Backup</button></article>
        <article class="utility-card"><h3>Publish to ORE</h3><p>Generates <code>core-reviews.json</code> for <code>orefinal/data/</code>.</p><button class="btn" data-publish-ore>Generate ORE File</button></article>
        <article class="utility-card"><h3>Current Record</h3><p>${m.reviewed} of ${m.total} sections have review records.</p></article>
      </section>`;
    renderShell(content,"export");
  });

  document.addEventListener("click",e=>{
    if(e.target.closest("[data-export-backup]")) backup();
    if(e.target.closest("[data-publish-ore]")) publish();
  });

  function backup(){
    download({product:"CORE",version:ctx.platform.version,exportedAt:new Date().toISOString(),reviews:state.reviews},"CORE-backup.json");
    toast("CORE backup downloaded.");
  }
  function publish(){
    const reviews={};
    Object.entries(state.reviews).forEach(([section,r])=>{
      reviews[section]={
        reviewId:r.reviewId,status:r.status==="complete"?"complete":"in_review",
        reviewDate:r.reviewDate,reviewedBy:r.reviewedBy,authorities:r.authorities||[],
        notes:r.notes||"",institutionalKnowledge:r.institutionalKnowledge||"",responsibleCommittee:r.responsibleCommittee||"By-Laws Committee",relatedRecords:r.relatedRecords||{},nextReview:r.nextReview||"To be established",
        amendment:r.amendment?.boardApproved?{
          motionNumber:r.amendment.motionNumber||"",
          approvalDate:r.amendment.approvalDate||r.reviewDate,
          reason:r.amendment.reason||""
        }:null
      };
    });
    download({schemaVersion:"1.0",generatedAt:new Date().toISOString().slice(0,10),reviews},"core-reviews.json");
    toast("ORE publication file generated.");
  }
  function download(data,name){
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
}
