export default function register(ctx){
  const { router, state, renderShell, events } = ctx;

  router.register("dashboard", () => {
    const m = state.metrics();
    const attention = state.attentionItems().slice(0,5);
    const amendments = state.amendmentItems();
    const stages = {
      drafting: amendments.filter(x => state.amendmentStage(x.review) === "drafting").length,
      awaitingBoard: amendments.filter(x => state.amendmentStage(x.review) === "awaiting_board").length,
      awaitingApproval: amendments.filter(x => state.amendmentStage(x.review) === "awaiting_approval").length,
      ready: amendments.filter(x => state.amendmentStage(x.review) === "ready_to_publish").length,
      published: amendments.filter(x => state.amendmentStage(x.review) === "published").length
    };

    const actions = state.actionSummary();

    const score = m.total
      ? Math.round(((m.complete + m.discussion * .55 + m.amendment * .35) / m.total) * 100)
      : 0;

    const attentionRows = attention.length
      ? attention.map(item => `
        <button class="attention-row" data-open-direct="${item.articleIndex}:${item.sectionIndex}">
          <span class="attention-mark ${item.review.status}"></span>
          <span>
            <strong>Section ${item.section.number} — ${item.section.title}</strong>
            <small>${item.review.status === "amendment" ? "Amendment recommended" : "Board discussion required"}</small>
          </span>
          <span>›</span>
        </button>`).join("")
      : `<div class="empty-state">Nothing currently requires immediate governance attention.</div>`;

    const content = `
      <section class="hero">
        <div class="eyebrow">Temple Board Workspace</div>
        <h1>Good ${state.greeting()}, Ryan.</h1>
        <p>CORE now tracks an amendment from initial analysis through committee review, Temple Board approval, and publication to ORE.</p>
        <div class="rule"></div>
      </section>

      <section class="health-card">
        <div>
          <span>Governance Health</span>
          <strong>${score}%</strong>
          <small>Internal completion indicator — not a legal certification</small>
        </div>
        <div class="health-ring" style="--score:${score}"><b>${score}</b></div>
      </section>

      <section class="summary-grid">
        <article class="summary-card"><span>Governance Review</span><strong>${m.reviewed} / ${m.total}</strong><small>sections reviewed</small></article>
        <article class="summary-card"><span>Review Progress</span><strong>${m.percent}%</strong><small>${m.total-m.reviewed} remaining</small><div class="progress-track"><i style="width:${m.percent}%"></i></div></article>
        <article class="summary-card"><span>Awaiting Approval</span><strong>${stages.awaitingApproval + stages.awaitingBoard}</strong><small>amendments</small></article>
        <article class="summary-card"><span>Open Actions</span><strong>${actions.open}</strong><small>${actions.overdue} overdue</small></article>
      </section>

      <button class="intelligence-launch-card" data-route="intelligence">
        <span class="intelligence-launch-icon">◎</span>
        <span>
          <small>Governance Intelligence</small>
          <strong>Meeting Guidance & Risk</strong>
          <em>${state.intelligenceSummary().high.length} high-risk · ${state.intelligenceSummary().estimated} estimated minutes remaining</em>
        </span>
        <b>Open →</b>
      </button>

      <button class="annual-launch-card" data-route="annual">
        <span class="annual-launch-icon">▣</span>
        <span>
          <small>Annual Governance Manager</small>
          <strong>${state.reviewYear} Review Cycle</strong>
          <em>${m.reviewed} of ${m.total} sections reviewed · ${state.annualQueue().length} in queue</em>
        </span>
        <b>Open →</b>
      </button>

      <button class="system-health-card" data-route="developer">
        <span><small>System Health</small><strong>${state.platformValidation().overall}</strong><em>${state.diagnosticSnapshot().modulesLoaded} / ${state.diagnosticSnapshot().modulesExpected} modules loaded · ${state.diagnosticSnapshot().errors.length} errors</em></span>
        <b>Diagnostics →</b>
      </button>

      <section class="panel">
        <div class="panel-head">
          <div><h2>${state.reviewYear} Governance Review</h2><p>${state.articles.length} Articles · ${m.total} Sections</p></div>
          <button class="btn" data-route="review">${m.reviewed ? "Continue Review" : "Begin Review"}</button>
        </div>
        <div class="panel-body">
          <button class="menu-row" data-route="actions"><span><span class="row-title">Action Centre</span><span class="row-sub">${actions.open} open · ${actions.overdue} overdue · ${actions.dueThisMonth} due this month</span></span></button>
          <button class="menu-row" data-route="review"><span><span class="row-title">Corporate By-Laws</span><span class="row-sub">Review all Articles and Sections.</span></span></button>
          <button class="menu-row" data-route="annual"><span><span class="row-title">Annual Governance Manager</span><span class="row-sub">${m.reviewed} of ${m.total} sections reviewed · ${state.annualQueue().length} in queue</span></span></button>
          <button class="menu-row" data-route="amendments"><span><span class="row-title">Amendment Centre</span><span class="row-sub">${amendments.length} amendment record${amendments.length === 1 ? "" : "s"} · ${stages.ready} ready to publish</span></span></button>
          <button class="menu-row" data-route="export"><span><span class="row-title">Review Data & Publication</span><span class="row-sub">Back up CORE or generate the ORE review file.</span></span></button>
          <button class="menu-row" data-route="settings"><span><span class="row-title">Platform & Modules</span><span class="row-sub">View installed modules, versions, and system health.</span></span></button>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head"><div><h2>Attention Required</h2><p>Discussion and amendment records</p></div></div>
        <div class="panel-body">${attentionRows}</div>
      </section>`;

    renderShell(content, "dashboard");
  });

  document.addEventListener("click", e => {
    const direct = e.target.closest("[data-open-direct]");
    if(!direct) return;
    const [articleIndex, sectionIndex] = direct.dataset.openDirect.split(":").map(Number);
    events.emit("review:open-direct", { articleIndex, sectionIndex });
  });
}
