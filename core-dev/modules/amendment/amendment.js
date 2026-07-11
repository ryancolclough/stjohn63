import { escapeHTML } from "../../sdk/ui.js";

export default function register(ctx){
  const { events } = ctx;

  events.on("review:screen", ({section,existing})=>{
    const slot = document.querySelector("#amendment-slot");
    if(!slot) return;
    const a = existing.amendment || {};
    slot.innerHTML = `
      <section class="amendment-panel" data-amendment-panel style="${existing.status==="amendment"||Object.keys(a).length?"":"display:none"}">
        <h3>Amendment Workflow</h3>
        <div class="text-compare">
          <div class="text-block"><label>Current Wording</label><textarea name="originalText">${escapeHTML(a.originalText||(section.paragraphs||[]).join("\n\n"))}</textarea></div>
          <div class="text-block"><label>Proposed Wording</label><textarea name="proposedText">${escapeHTML(a.proposedText||"")}</textarea></div>
        </div>
        <div class="field"><label>Reason for Amendment</label><textarea name="amendmentReason">${escapeHTML(a.reason||"")}</textarea></div>
        <div class="amendment-grid">
          ${field("Motion / Resolution","motionNumber",a.motionNumber)}
          ${field("Meeting Date","meetingDate",a.meetingDate,"date")}
          ${field("Moved By","movedBy",a.movedBy)}
          ${field("Seconded By","secondedBy",a.secondedBy)}
          ${field("Vote Result","voteResult",a.voteResult)}
          ${field("Approval Date","approvalDate",a.approvalDate,"date")}
        </div>
        <div class="workflow-steps">
          ${step("analysisComplete","Analysis complete",a)}
          ${step("committeeReviewed","Committee reviewed",a)}
          ${step("boardDiscussed","Board discussion complete",a)}
          ${step("boardApproved","Temple Board approved",a)}
          ${step("publishedToORE","Published to ORE",a)}
        </div>
      </section>`;
  });

  events.on("amendment:collect", ({form,existing})=>{
    const fd = new FormData(form);
    if(fd.get("status")!=="amendment" && !fd.get("proposedText")) return existing?.amendment || null;
    return {
      originalText:String(fd.get("originalText")||""),
      proposedText:String(fd.get("proposedText")||""),
      reason:String(fd.get("amendmentReason")||""),
      motionNumber:String(fd.get("motionNumber")||""),
      meetingDate:String(fd.get("meetingDate")||""),
      movedBy:String(fd.get("movedBy")||""),
      secondedBy:String(fd.get("secondedBy")||""),
      voteResult:String(fd.get("voteResult")||""),
      approvalDate:String(fd.get("approvalDate")||""),
      analysisComplete:Boolean(fd.get("analysisComplete")),
      committeeReviewed:Boolean(fd.get("committeeReviewed")),
      boardDiscussed:Boolean(fd.get("boardDiscussed")),
      boardApproved:Boolean(fd.get("boardApproved")),
      publishedToORE:Boolean(fd.get("publishedToORE"))
    };
  });

  document.addEventListener("change",e=>{
    if(e.target.matches('input[name="status"]')){
      const panel=document.querySelector("[data-amendment-panel]");
      if(panel) panel.style.display=e.target.value==="amendment"?"grid":"none";
    }
  });

  function field(label,name,value="",type="text"){
    return `<div class="field"><label>${label}</label><input type="${type}" name="${name}" value="${escapeHTML(value||"")}"></div>`;
  }
  function step(name,label,a){ return `<label class="workflow-step"><input type="checkbox" name="${name}" ${a[name]?"checked":""}> ${label}</label>`; }
}
