import { escapeHTML } from "../../sdk/ui.js";

export default function register(ctx){
  const { events, router, state, renderShell, toast } = ctx;

  router.register("amendments", () => renderAmendmentCentre());

  events.on("review:screen", ({ section, existing }) => {
    const slot = document.querySelector("#amendment-slot");
    if(!slot) return;

    const a = existing.amendment || {};
    const shouldShow = existing.status === "amendment" || Object.keys(a).length > 0;

    slot.innerHTML = `
      <section class="amendment-panel" data-amendment-panel style="${shouldShow ? "" : "display:none"}">
        <div class="amendment-head">
          <div>
            <span>Amendment Engine</span>
            <h3>${a.amendmentId || "Draft Amendment"}</h3>
          </div>
          <span class="stage-badge ${stageClass(stageOf(a))}">${stageLabel(stageOf(a))}</span>
        </div>

        <div class="text-compare">
          <div class="text-block">
            <label>Current Wording</label>
            <textarea name="originalText">${escapeHTML(a.originalText || (section.paragraphs || []).join("\n\n"))}</textarea>
          </div>
          <div class="text-block">
            <label>Proposed Wording</label>
            <textarea name="proposedText" placeholder="Enter the proposed replacement wording.">${escapeHTML(a.proposedText || "")}</textarea>
          </div>
        </div>

        <div class="field">
          <label>Reason for Amendment</label>
          <textarea name="amendmentReason" placeholder="Explain why this change is required or recommended.">${escapeHTML(a.reason || "")}</textarea>
        </div>

        <div class="field">
          <label>Committee Recommendation</label>
          <textarea name="committeeRecommendation" placeholder="Record the committee's recommendation to the Temple Board.">${escapeHTML(a.committeeRecommendation || "")}</textarea>
        </div>

        <div class="amendment-grid">
          ${field("Motion / Resolution", "motionNumber", a.motionNumber, "text", "TB-2026-001")}
          ${field("Meeting Date", "meetingDate", a.meetingDate, "date")}
          ${field("Moved By", "movedBy", a.movedBy)}
          ${field("Seconded By", "secondedBy", a.secondedBy)}
          ${field("Votes For", "votesFor", a.votesFor, "number")}
          ${field("Votes Against", "votesAgainst", a.votesAgainst, "number")}
          ${field("Abstentions", "abstentions", a.abstentions, "number")}
          ${field("Approval Date", "approvalDate", a.approvalDate, "date")}
        </div>

        <div class="field">
          <label>Vote Result / Decision</label>
          <select name="voteResult">
            ${option("", "Not recorded", a.voteResult)}
            ${option("carried", "Carried", a.voteResult)}
            ${option("carried-unanimously", "Carried unanimously", a.voteResult)}
            ${option("defeated", "Defeated", a.voteResult)}
            ${option("tabled", "Tabled / deferred", a.voteResult)}
            ${option("withdrawn", "Withdrawn", a.voteResult)}
          </select>
        </div>

        <div class="field">
          <label>Workflow</label>
          <div class="workflow-steps">
            ${step("analysisComplete", "Analysis complete", "Review analysis and supporting authorities documented.", a)}
            ${step("committeeReviewed", "Committee reviewed", "By-Laws Committee recommendation completed.", a)}
            ${step("boardDiscussed", "Board discussion complete", "The matter was formally considered at a meeting.", a)}
            ${step("boardApproved", "Temple Board approved", "Motion carried and approval details recorded.", a)}
            ${step("publishedToORE", "Published to ORE", "Approved public record was exported and uploaded.", a)}
            ${step("archived", "Archived", "Final amendment record was preserved in the governance archive.", a)}
          </div>
        </div>

        <div class="publication-readiness ${publicationReady(a) ? "ready" : ""}">
          <span>${publicationReady(a) ? "✓" : "○"}</span>
          <div>
            <strong>${publicationReady(a) ? "Ready to publish" : "Publication requirements incomplete"}</strong>
            <small>${publicationReady(a) ? "This approved amendment can be included in the ORE publication export." : readinessMessage(a)}</small>
          </div>
        </div>
      </section>`;
  });

  events.on("amendment:collect", ({ form, existing }) => {
    const fd = new FormData(form);
    const old = existing?.amendment || {};
    const status = fd.get("status");
    const hasDraft = String(fd.get("proposedText") || "").trim() ||
      String(fd.get("amendmentReason") || "").trim() ||
      old.amendmentId;

    if(status !== "amendment" && !hasDraft) return old && Object.keys(old).length ? old : null;

    return {
      amendmentId: old.amendmentId || nextAmendmentId(),
      createdDate: old.createdDate || new Date().toISOString().slice(0,10),
      originalText: String(fd.get("originalText") || "").trim(),
      proposedText: String(fd.get("proposedText") || "").trim(),
      reason: String(fd.get("amendmentReason") || "").trim(),
      committeeRecommendation: String(fd.get("committeeRecommendation") || "").trim(),
      motionNumber: String(fd.get("motionNumber") || "").trim(),
      meetingDate: String(fd.get("meetingDate") || "").trim(),
      movedBy: String(fd.get("movedBy") || "").trim(),
      secondedBy: String(fd.get("secondedBy") || "").trim(),
      votesFor: numberOrBlank(fd.get("votesFor")),
      votesAgainst: numberOrBlank(fd.get("votesAgainst")),
      abstentions: numberOrBlank(fd.get("abstentions")),
      voteResult: String(fd.get("voteResult") || "").trim(),
      approvalDate: String(fd.get("approvalDate") || "").trim(),
      analysisComplete: Boolean(fd.get("analysisComplete")),
      committeeReviewed: Boolean(fd.get("committeeReviewed")),
      boardDiscussed: Boolean(fd.get("boardDiscussed")),
      boardApproved: Boolean(fd.get("boardApproved")),
      publishedToORE: Boolean(fd.get("publishedToORE")),
      archived: Boolean(fd.get("archived"))
    };
  });

  document.addEventListener("change", e => {
    if(e.target.matches('input[name="status"]')){
      const panel = document.querySelector("[data-amendment-panel]");
      if(panel) panel.style.display = e.target.value === "amendment" ? "grid" : "none";
    }

    const stepBox = e.target.closest(".workflow-step input");
    if(stepBox){
      stepBox.closest(".workflow-step").classList.toggle("complete", stepBox.checked);
    }
  });

  document.addEventListener("click", e => {
    const open = e.target.closest("[data-open-amendment]");
    if(!open) return;
    const [articleIndex, sectionIndex] = open.dataset.openAmendment.split(":").map(Number);
    events.emit("review:open-direct", { articleIndex, sectionIndex });
  });

  function renderAmendmentCentre(){
    const items = state.amendmentItems();
    const counts = {
      drafting: items.filter(x => state.amendmentStage(x.review) === "drafting").length,
      awaiting_board: items.filter(x => state.amendmentStage(x.review) === "awaiting_board").length,
      awaiting_approval: items.filter(x => state.amendmentStage(x.review) === "awaiting_approval").length,
      ready_to_publish: items.filter(x => state.amendmentStage(x.review) === "ready_to_publish").length,
      published: items.filter(x => state.amendmentStage(x.review) === "published").length
    };

    const rows = items.length ? items.map(item => {
      const a = item.review.amendment || {};
      const stage = state.amendmentStage(item.review);
      return `
        <button class="amendment-row" data-open-amendment="${item.articleIndex}:${item.sectionIndex}">
          <span class="amendment-id">${escapeHTML(a.amendmentId || "Draft")}</span>
          <span>
            <strong>Section ${item.section.number} — ${escapeHTML(item.section.title)}</strong>
            <small>${escapeHTML(a.reason || "No amendment reason recorded.")}</small>
          </span>
          <span class="stage-badge ${stageClass(stage)}">${stageLabel(stage)}</span>
        </button>`;
    }).join("") : `<div class="empty-amendments">No amendment records have been created yet.</div>`;

    const content = `
      <div class="backline"><button data-route="dashboard">‹ Dashboard</button></div>
      <section class="hero">
        <div class="eyebrow">Amendment Engine</div>
        <h1>Amendment Centre</h1>
        <p>Track every recommended change from initial drafting through approval, publication, and archival.</p>
        <div class="rule"></div>
      </section>

      <section class="amendment-stats">
        ${stat("Drafting", counts.drafting)}
        ${stat("Awaiting Board", counts.awaiting_board)}
        ${stat("Awaiting Approval", counts.awaiting_approval)}
        ${stat("Ready to Publish", counts.ready_to_publish)}
        ${stat("Published", counts.published)}
      </section>

      <section class="panel">
        <div class="panel-head"><div><h2>Amendment Records</h2><p>${items.length} total</p></div></div>
        <div class="panel-body">${rows}</div>
      </section>`;

    renderShell(content, "amendments");
  }

  function nextAmendmentId(){
    const used = state.amendmentItems()
      .map(x => x.review?.amendment?.amendmentId)
      .filter(Boolean);
    let n = 1;
    let id;
    do{
      id = `AMD-${state.reviewYear}-${String(n++).padStart(4,"0")}`;
    }while(used.includes(id));
    return id;
  }

  function stageOf(a){
    if(a.archived) return "archived";
    if(a.publishedToORE) return "published";
    if(a.boardApproved) return "ready_to_publish";
    if(a.boardDiscussed) return "awaiting_approval";
    if(a.committeeReviewed) return "awaiting_board";
    if(a.analysisComplete || a.proposedText) return "drafting";
    return "not_started";
  }

  function stageLabel(stage){
    return ({
      not_started:"Not started",
      drafting:"Drafting",
      awaiting_board:"Awaiting board",
      awaiting_approval:"Awaiting approval",
      ready_to_publish:"Ready to publish",
      published:"Published",
      archived:"Archived"
    })[stage] || stage;
  }

  function stageClass(stage){ return String(stage).replaceAll("_", "-"); }

  function publicationReady(a){
    return Boolean(
      a.boardApproved &&
      a.approvalDate &&
      a.motionNumber &&
      a.proposedText &&
      ["carried","carried-unanimously"].includes(a.voteResult)
    );
  }

  function readinessMessage(a){
    const missing = [];
    if(!a.proposedText) missing.push("proposed wording");
    if(!a.motionNumber) missing.push("motion number");
    if(!a.voteResult || !["carried","carried-unanimously"].includes(a.voteResult)) missing.push("carried vote");
    if(!a.approvalDate) missing.push("approval date");
    if(!a.boardApproved) missing.push("board approval");
    return missing.length ? `Missing: ${missing.join(", ")}.` : "Complete the remaining workflow steps.";
  }

  function field(label, name, value="", type="text", placeholder=""){
    return `<div class="field"><label>${label}</label><input type="${type}" name="${name}" value="${escapeHTML(value ?? "")}" placeholder="${escapeHTML(placeholder)}"></div>`;
  }

  function step(name, label, description, a){
    return `<label class="workflow-step ${a[name] ? "complete" : ""}">
      <input type="checkbox" name="${name}" ${a[name] ? "checked" : ""}>
      <span><strong>${label}</strong><small>${description}</small></span>
    </label>`;
  }

  function option(value, label, current){
    return `<option value="${value}" ${current === value ? "selected" : ""}>${label}</option>`;
  }

  function stat(label, value){
    return `<article><span>${label}</span><strong>${value}</strong></article>`;
  }

  function numberOrBlank(value){
    const text = String(value ?? "").trim();
    return text === "" ? "" : Number(text);
  }
}
