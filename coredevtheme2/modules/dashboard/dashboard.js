export default function register(ctx){
  const { router, state, renderShell, events, platform } = ctx;

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

    const nextReview = `${state.reviewYear}-07-24`;
    const completed = m.reviewed;
    const openReviews = Math.max(0, m.total - m.reviewed);

    const content = `
      <section class="hero cinematic-hero">
        <div class="eyebrow">Temple Board Workspace</div>
        <h1>Good ${state.greeting()},<br>Ryan.</h1>
        <p>CORE now tracks an amendment from initial analysis through committee review, Temple Board approval, and publication to ORE.</p>
        <div class="rule"><span></span></div>
      </section>

      <section class="health-card cinematic-health">
        <div class="health-primary">
          <span>Governance Health</span>
          <strong data-count-to="${score}" data-count-suffix="%">${score}%</strong>
          <small>Internal completion indicator —<br>not a legal certification</small>
        </div>
        <div class="health-ring-wrap">
          <div class="health-ring" data-progress-value="${score}" style="--score:${score}"><b data-count-to="${completed}">${completed}</b></div>
          <span>Items Complete</span>
        </div>
        <div class="health-pillars">
          <button data-route="review"><i>✓</i><span>Compliance</span></button>
          <button data-route="settings"><i>♙</i><span>Organization</span></button>
          <button data-route="export"><i>▤</i><span>Resource</span></button>
          <button data-route="settings"><i>⚙</i><span>Engine</span></button>
        </div>
      </section>

      <section class="summary-grid cinematic-summary">
        <button class="summary-card review-summary" data-route="review">
          <span>Governance Review</span>
          <strong data-count-to="${openReviews}">${openReviews}</strong>
          <small>Open reviews</small>
          <b class="round-arrow">→</b>
          <div class="summary-footer">
            <i>▦</i>
            <span><small>Next Review</small><strong>${new Date(nextReview+"T12:00:00").toLocaleDateString("en-CA",{month:"short",day:"numeric",year:"numeric"})}</strong></span>
          </div>
        </button>

        <button class="summary-card progress-summary" data-route="review">
          <span>Review Progress</span>
          <strong data-count-to="${m.percent}" data-count-suffix="%">${m.percent}%</strong>
          <small>Current progress</small>
          <b class="round-arrow">→</b>
          <div class="summary-footer">
            <i>↗</i>
            <span><small>${actions.overdue ? "Needs Attention" : "On Track"}</small><strong>${actions.overdue ? `${actions.overdue} overdue item${actions.overdue===1?"":"s"}` : "No overdue items"}</strong></span>
          </div>
        </button>
      </section>

      <section class="module-links">
        <button class="module-link" data-route="intelligence">
          <span><small>Governance Intelligence</small><strong>Meeting Guidance &amp; Risk</strong></span><b>Open →</b>
        </button>
        <button class="module-link" data-route="annual">
          <span><small>Annual Governance Manager</small><strong>${state.reviewYear} Review Cycle</strong></span><b>Open →</b>
        </button>
        <button class="module-link" data-route="actions">
          <span><small>Action Centre</small><strong>${actions.open} open · ${actions.overdue} overdue</strong></span><b>Open →</b>
        </button>
      </section>

      <section class="panel compact-panel">
        <div class="panel-head">
          <div><h2>${state.reviewYear} Governance Review</h2><p>${state.articles.length} Articles · ${m.total} Sections</p></div>
          <button class="btn" data-route="review">${m.reviewed ? "Continue Review" : "Begin Review"}</button>
        </div>
        <div class="panel-body">
          <button class="menu-row" data-route="actions"><span><span class="row-title">Action Centre</span><span class="row-sub">${actions.open} open · ${actions.overdue} overdue · ${actions.dueThisMonth} due this month</span></span></button>
          <button class="menu-row" data-route="review"><span><span class="row-title">Corporate By-Laws</span><span class="row-sub">Review all Articles and Sections.</span></span></button>
          <button class="menu-row" data-route="annual"><span><span class="row-title">Annual Governance Manager</span><span class="row-sub">${m.reviewed} of ${m.total} sections reviewed · ${state.annualQueue().length} in queue</span></span></button>
          <button class="menu-row" data-route="amendments"><span><span class="row-title">Amendment Centre</span><span class="row-sub">${amendments.length} amendment record${amendments.length === 1 ? "" : "s"} · ${stages.ready} ready to publish</span></span></button>
        </div>
      </section>

      <section class="panel compact-panel">
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
