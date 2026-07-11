export default function register(ctx){
  const { router, state, renderShell } = ctx;

  router.register("dashboard", () => {
    const m = state.metrics();
    const content = `
      <section class="hero">
        <div class="eyebrow">Temple Board Workspace</div>
        <h1>Good ${state.greeting()}, Ryan.</h1>
        <p>CORE is running as a modular development platform. Governance review, amendment records, publishing, and settings are now independent modules.</p>
        <div class="rule"></div>
      </section>

      <section class="summary-grid">
        <article class="summary-card"><span>Governance Review</span><strong>${m.reviewed} / ${m.total}</strong><small>sections reviewed</small></article>
        <article class="summary-card"><span>Progress</span><strong>${m.percent}%</strong><small>${m.total-m.reviewed} remaining</small><div class="progress-track"><i style="width:${m.percent}%"></i></div></article>
        <article class="summary-card"><span>Discussion</span><strong>${m.discussion}</strong><small>sections</small></article>
        <article class="summary-card"><span>Amendments</span><strong>${m.amendment}</strong><small>recommended</small></article>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div><h2>${state.reviewYear} Governance Review</h2><p>${state.articles.length} Articles · ${m.total} Sections</p></div>
          <button class="btn" data-route="review">${m.reviewed ? "Continue Review" : "Begin Review"}</button>
        </div>
        <div class="panel-body">
          <button class="menu-row" data-route="review"><span><span class="row-title">Corporate By-Laws</span><span class="row-sub">Review all Articles and Sections.</span></span></button>
          <button class="menu-row" data-route="export"><span><span class="row-title">Review Data & Publication</span><span class="row-sub">Back up CORE or generate the ORE review file.</span></span></button>
          <button class="menu-row" data-route="settings"><span><span class="row-title">Platform & Modules</span><span class="row-sub">View installed modules, versions, and system health.</span></span></button>
        </div>
      </section>`;
    renderShell(content,"dashboard");
  });
}
