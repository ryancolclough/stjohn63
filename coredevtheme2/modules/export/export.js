export default function register(ctx){
  const {router,state,renderShell,toast,platform,storage}=ctx;
  router.register("export",()=>renderExport());

  document.addEventListener("click",e=>{
    if(e.target.closest("[data-export-backup]")) return downloadBackup();
    if(e.target.closest("[data-import-backup]")) return document.querySelector("#core-backup-file")?.click();
    if(e.target.closest("[data-publish-ore]")) return publishORE();
    if(e.target.closest("[data-clear-device-data]")) return clearLocal();
  });

  document.addEventListener("change",e=>{
    if(e.target.id==="core-backup-file" && e.target.files?.[0]) importBackup(e.target.files[0]);
  });

  function renderExport(){
    const m=state.metrics(), a=state.actionSummary(), meetings=storage.get("MEETINGS",[]);
    const content=`
      <div class="backline"><button data-route="dashboard">‹ Dashboard</button></div>
      <section class="hero"><div class="eyebrow">Data Portability</div><h1>Back Up, Restore & Publish</h1>
      <p>Move CORE records between devices, restore a saved dataset, or generate the approved public file used by ORE.</p><div class="rule"></div></section>

      <section class="sync-note"><strong>Local-device storage</strong>
      <p>CORE currently saves separately in each browser. Export on one device and import on another to transfer the complete dataset.</p></section>

      <section class="utility-grid">
        <article class="utility-card"><h3>Export CORE Backup</h3><p>Downloads private reviews, amendments, actions, annual settings, meeting drafts, and app settings.</p><button class="btn secondary" data-export-backup>Download Backup</button></article>
        <article class="utility-card"><h3>Import CORE Backup</h3><p>Restore or merge a previously exported CORE backup on this browser.</p><button class="btn" data-import-backup>Select Backup File</button><input id="core-backup-file" type="file" accept=".json,application/json" hidden></article>
        <article class="utility-card"><h3>Publish to ORE</h3><p>Generates <code>core-reviews.json</code> with approved public data.</p><button class="btn" data-publish-ore>Generate ORE File</button></article>
        <article class="utility-card"><h3>Current Device Record</h3><p>${m.reviewed} reviews · ${a.total} actions · ${meetings.length} saved agendas · Annual cycle ${state.annualSettings().year}.</p></article>
        <article class="utility-card danger-card"><h3>Clear This Device</h3><p>Removes local CORE records from this browser only.</p><button class="btn danger" data-clear-device-data>Clear Local Data</button></article>
      </section>`;
    renderShell(content,"export");
  }

  function backupObject(){
    return {
      product:"CORE",schemaVersion:"1.5",platformVersion:platform.version,build:platform.build,
      releaseId:platform.releaseId,exportedAt:new Date().toISOString(),
      data:{
        reviews:state.reviews,
        actions:state.actionItems(),
        annual:state.annualSettings(),
        annualTasks:state.annualTasks(),
        meetings:storage.get("MEETINGS",[]),
        settings:storage.get("SETTINGS",{})
      }
    };
  }

  function downloadBackup(){
    const date=new Date().toISOString().slice(0,10);
    download(backupObject(),`CORE-backup-${date}.json`);
    toast("CORE backup downloaded.");
  }

  async function importBackup(file){
    try{
      const parsed=JSON.parse(await file.text());
      const data=parsed?.data || parsed;
      if(!data || typeof data!=="object") throw new Error("Backup data missing.");
      const recognizable=data.reviews||data.actions||data.annual||data.meetings||data.settings;
      if(!recognizable) throw new Error("This does not appear to be a CORE backup.");

      const replace=confirm("OK = replace this device's CORE records.\n\nCancel = merge with existing records.");
      if(replace){
        if(data.reviews) storage.set("REVIEWS",data.reviews);
        if(Array.isArray(data.actions)) storage.set("ACTIONS",data.actions);
        if(data.annual) storage.set("ANNUAL",data.annual);
        if(Array.isArray(data.annualTasks)) storage.set("ANNUAL_TASKS",data.annualTasks);
        if(Array.isArray(data.meetings)) storage.set("MEETINGS",data.meetings);
        if(data.settings) storage.set("SETTINGS",data.settings);
      }else{
        if(data.reviews) storage.set("REVIEWS",{...storage.get("REVIEWS",{}),...data.reviews});
        if(Array.isArray(data.actions)) storage.set("ACTIONS",merge(storage.get("ACTIONS",[]),data.actions));
        if(Array.isArray(data.meetings)) storage.set("MEETINGS",merge(storage.get("MEETINGS",[]),data.meetings));
        if(data.annual) storage.set("ANNUAL",{...storage.get("ANNUAL",{}),...data.annual});
        if(Array.isArray(data.annualTasks)) storage.set("ANNUAL_TASKS",merge(storage.get("ANNUAL_TASKS",[]),data.annualTasks));
        if(data.settings) storage.set("SETTINGS",{...storage.get("SETTINGS",{}),...data.settings});
      }
      state.reviews=storage.get("REVIEWS",{});
      state.settings=storage.get("SETTINGS",{theme:"system",reviewer:""});
      document.querySelector("#core-backup-file").value="";
      toast(replace?"CORE backup restored.":"CORE backup merged.");
      setTimeout(()=>router.go("dashboard"),250);
    }catch(err){
      console.error(err);
      toast(err.message||"Backup import failed.");
    }
  }

  function merge(a,b){
    const map=new Map();
    [...a,...b].forEach(x=>map.set(x?.id||JSON.stringify(x),x));
    return [...map.values()];
  }

  function clearLocal(){
    if(!confirm("Clear all CORE data saved in this browser? Export a backup first if needed.")) return;
    ["REVIEWS","ACTIONS","ANNUAL","ANNUAL_TASKS","MEETINGS","SETTINGS"].forEach(k=>storage.remove(k));
    state.reviews={}; state.settings={theme:"system",reviewer:""};
    toast("Local CORE data cleared.");
    setTimeout(()=>router.go("dashboard"),250);
  }

  function publishORE(){
    const reviews={};
    Object.entries(state.reviews).forEach(([section,r])=>{
      const a=r.amendment||null;
      const approved=Boolean(a?.boardApproved&&a?.approvalDate&&a?.motionNumber&&a?.proposedText&&["carried","carried-unanimously"].includes(a?.voteResult));
      reviews[section]={
        reviewId:r.reviewId,status:r.status==="complete"?"complete":"in_review",
        reviewDate:r.reviewDate,reviewedBy:r.reviewedBy,authorities:r.authorities||[],
        notes:r.notes||"",institutionalKnowledge:r.institutionalKnowledge||"",
        responsibleCommittee:r.responsibleCommittee||"By-Laws Committee",
        relatedRecords:r.relatedRecords||{},nextReview:r.nextReview||"To be established",
        amendment:approved?{
          amendmentId:a.amendmentId||"",proposedText:a.proposedText,reason:a.reason||"",
          committeeRecommendation:a.committeeRecommendation||"",motionNumber:a.motionNumber,
          meetingDate:a.meetingDate||"",movedBy:a.movedBy||"",secondedBy:a.secondedBy||"",
          votesFor:a.votesFor,votesAgainst:a.votesAgainst,abstentions:a.abstentions,
          voteResult:a.voteResult,approvalDate:a.approvalDate
        }:null
      };
    });
    download({schemaVersion:"1.5",generatedAt:new Date().toISOString(),reviews},"core-reviews.json");
    toast("ORE publication file generated.");
  }

  function download(data,name){
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
}
