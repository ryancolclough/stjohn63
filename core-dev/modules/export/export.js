export default function register(ctx){
  const { router, state, renderShell, toast, platform } = ctx;

  router.register("export", () => renderExport());

  document.addEventListener("click", e => {
    if(e.target.closest("[data-export-backup]")) backup();
    if(e.target.closest("[data-publish-ore]")) publish();
  });

  function renderExport(){
    const m = state.metrics();
    const amendmentItems = state.amendmentItems();
    const ready = amendmentItems.filter(x => state.amendmentStage(x.review) === "ready_to_publish").length;
    const incomplete = amendmentItems.filter(x => !["ready_to_publish","published"].includes(state.amendmentStage(x.review))).length;

    const content = `
      <div class="backline"><button data-route="dashboard">‹ Dashboard</button></div>
      <section class="hero">
        <div class="eyebrow">Review Data</div>
        <h1>Back Up & Publish</h1>
        <p>Download a complete private CORE backup or generate the approved public review file used by ORE.</p>
        <div class="rule"></div>
      </section>

      <section class="utility-grid">
        <article class="utility-card">
          <h3>CORE Backup</h3>
          <p>Includes private review history, institutional knowledge, motion records, votes, and amendment drafts.</p>
          <button class="btn secondary" data-export-backup>Download Backup</button>
        </article>

        <article class="utility-card">
          <h3>Publish to ORE</h3>
          <p>Generates <code>core-reviews.json</code>. Only board-approved amendment details are included publicly.</p>
          <button class="btn" data-publish-ore>Generate ORE File</button>
        </article>

        <article class="utility-card">
          <h3>Publication Readiness</h3>
          <p>${ready} approved amendment${ready === 1 ? "" : "s"} ready to publish. ${incomplete} amendment record${incomplete === 1 ? "" : "s"} still require work.</p>
        </article>

        <article class="utility-card">
          <h3>Current Record</h3>
          <p>${m.reviewed} of ${m.total} sections have review records. ${m.complete} reviews are complete.</p>
        </article>
      </section>`;

    renderShell(content, "export");
  }

  function backup(){
    download({
      product:"CORE",
      platformVersion:platform.version,
      build:platform.build,
      exportedAt:new Date().toISOString(),
      annualReview:state.annualSettings(),reviews:state.reviews
    }, `CORE-backup-${new Date().toISOString().slice(0,10)}.json`);
    toast("CORE backup downloaded.");
  }

  function publish(){
    const reviews = {};
    const warnings = [];

    Object.entries(state.reviews).forEach(([section, r]) => {
      const amendment = r.amendment || null;
      const approved = Boolean(
        amendment?.boardApproved &&
        amendment?.approvalDate &&
        amendment?.motionNumber &&
        amendment?.proposedText &&
        ["carried","carried-unanimously"].includes(amendment?.voteResult)
      );

      if(r.status === "amendment" && amendment && !approved){
        warnings.push(`Section ${section}: amendment not yet approved`);
      }

      reviews[section] = {
        reviewId:r.reviewId,
        status:r.status === "complete" ? "complete" : "in_review",
        reviewDate:r.reviewDate,
        reviewedBy:r.reviewedBy,
        authorities:r.authorities || [],
        notes:r.notes || "",
        institutionalKnowledge:r.institutionalKnowledge || "",
        responsibleCommittee:r.responsibleCommittee || "By-Laws Committee",
        relatedRecords:r.relatedRecords || {},
        nextReview:r.nextReview || "To be established",
        amendment:approved ? {
          amendmentId:amendment.amendmentId || "",
          proposedText:amendment.proposedText,
          reason:amendment.reason || "",
          committeeRecommendation:amendment.committeeRecommendation || "",
          motionNumber:amendment.motionNumber,
          meetingDate:amendment.meetingDate || "",
          movedBy:amendment.movedBy || "",
          secondedBy:amendment.secondedBy || "",
          votesFor:amendment.votesFor,
          votesAgainst:amendment.votesAgainst,
          abstentions:amendment.abstentions,
          voteResult:amendment.voteResult,
          approvalDate:amendment.approvalDate
        } : null
      };
    });

    download({
      schemaVersion:"1.2",
      generatedAt:new Date().toISOString(),
      publicationWarnings:warnings,
      reviews
    }, "core-reviews.json");

    toast(warnings.length
      ? `ORE file generated with ${warnings.length} internal warning${warnings.length === 1 ? "" : "s"}.`
      : "ORE publication file generated.");
  }

  function download(data, name){
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
