import { escapeHTML } from "../../sdk/ui.js";

export default function register(ctx){
  const { router, state, renderShell, events, toast } = ctx;

  router.register("annual", () => renderAnnual());

  document.addEventListener("click", e => {
    const open = e.target.closest("[data-annual-open]");
    if(open){
      const [articleIndex, sectionIndex] = open.dataset.annualOpen.split(":").map(Number);
      events.emit("review:open-direct", {articleIndex, sectionIndex});
      return;
    }

    const article = e.target.closest("[data-annual-article]");
    if(article){
      const articleIndex = Number(article.dataset.annualArticle);
      const firstPending = state.articles[articleIndex].sections.findIndex(section => !state.getReview(section));
      const sectionIndex = firstPending >= 0 ? firstPending : 0;
      events.emit("review:open-direct", {articleIndex, sectionIndex});
      return;
    }

    if(e.target.closest("[data-save-annual]")){
      saveSettings();
      return;
    }

    if(e.target.closest("[data-complete-annual]")){
      const m = state.metrics();
      if(m.reviewed !== m.total){
        toast(`${m.total-m.reviewed} section${m.total-m.reviewed===1?" remains":"s remain"} before completion.`);
        return;
      }
      const settings = state.annualSettings();
      settings.status = "complete";
      settings.completedDate = new Date().toISOString().slice(0,10);
      state.saveAnnualSettings(settings);
      toast("Annual governance review marked complete.");
      renderAnnual();
    }
  });

  function renderAnnual(){
    const settings = state.annualSettings();
    const m = state.metrics();
    const queue = state.annualQueue();
    const articleProgress = state.annualArticleProgress();
    const currentMonth = new Date().getMonth() + 1;
    const recess = settings.recessMonths?.includes(currentMonth);

    const queueRows = queue.slice(0,8).map(item => `
      <button class="annual-queue-row" data-annual-open="${item.articleIndex}:${item.sectionIndex}">
        <span class="queue-number">${escapeHTML(item.section.number)}</span>
        <span>
          <strong>${escapeHTML(item.section.title)}</strong>
          <small>Article ${escapeHTML(item.article.roman)} · ${escapeHTML(item.queueReason)}</small>
        </span>
        <span>›</span>
      </button>
    `).join("") || `<div class="annual-empty">The annual section queue is complete.</div>`;

    const articleRows = articleProgress.map(item => `
      <button class="annual-article-row" data-annual-article="${item.articleIndex}">
        <span class="annual-roman">${escapeHTML(item.article.roman)}</span>
        <span>
          <strong>${escapeHTML(item.article.title)}</strong>
          <small>${item.reviewed} of ${item.total} reviewed</small>
          <i><b style="width:${item.percent}%"></b></i>
        </span>
        <span>${item.percent}%</span>
      </button>
    `).join("");

    const scheduleRows = governanceSchedule(currentMonth);

    const content = `
      <div class="backline"><button data-route="dashboard">‹ Dashboard</button></div>
      <section class="hero">
        <div class="eyebrow">${settings.year} Review Cycle</div>
        <h1>Annual Governance Manager</h1>
        <p>Plan the review year, continue from the next unresolved section, and see whether annual certification is becoming ready.</p>
        <div class="rule"></div>
      </section>

      <section class="annual-overview">
        <article>
          <span>Overall Progress</span>
          <strong>${m.percent}%</strong>
          <small>${m.reviewed} of ${m.total} sections reviewed</small>
          <div class="annual-progress"><i style="width:${m.percent}%"></i></div>
        </article>
        <article>
          <span>Cycle Status</span>
          <strong>${settings.status === "complete" ? "Complete" : recess ? "Summer Recess" : "In Progress"}</strong>
          <small>${settings.targetCompletionDate ? `Target ${settings.targetCompletionDate}` : "No target date set"}</small>
        </article>
        <article>
          <span>Review Queue</span>
          <strong>${queue.length}</strong>
          <small>sections requiring attention</small>
        </article>
        <article>
          <span>Amendments</span>
          <strong>${m.amendment}</strong>
          <small>${state.amendmentItems().filter(x => state.amendmentStage(x.review)==="ready_to_publish").length} ready to publish</small>
        </article>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div><h2>Continue the Annual Review</h2><p>Priority items appear first, followed by unreviewed sections.</p></div>
          ${queue.length ? `<button class="btn" data-annual-open="${queue[0].articleIndex}:${queue[0].sectionIndex}">Start Next</button>` : ""}
        </div>
        <div class="panel-body">${queueRows}</div>
      </section>

      <section class="panel">
        <div class="panel-head"><div><h2>Article Progress</h2><p>All ${state.articles.length} Articles</p></div></div>
        <div class="panel-body">${articleRows}</div>
      </section>

      <section class="annual-columns">
        <section class="panel">
          <div class="panel-head"><div><h2>Governance Calendar</h2><p>Suggested annual rhythm</p></div></div>
          <div class="panel-body">${scheduleRows}</div>
        </section>

        <section class="panel">
          <div class="panel-head"><div><h2>Cycle Settings</h2><p>Stored on this device</p></div></div>
          <div class="annual-settings">
            <div class="field"><label>Review Year</label><input id="annual-year" type="number" value="${settings.year}"></div>
            <div class="field"><label>Target Completion Date</label><input id="annual-target" type="date" value="${escapeHTML(settings.targetCompletionDate || "")}"></div>
            <div class="field"><label>Planned Review Meetings</label><input id="annual-meetings" type="number" min="1" value="${settings.meetingTarget || 4}"></div>
            <div class="field"><label>Annual Notes</label><textarea id="annual-notes" placeholder="Record the intended review approach for this year.">${escapeHTML(settings.notes || "")}</textarea></div>
            <div class="actions">
              <button class="btn secondary" data-save-annual>Save Cycle</button>
              <button class="btn" data-complete-annual ${m.reviewed===m.total ? "" : "disabled"}>Complete Annual Review</button>
            </div>
          </div>
        </section>
      </section>

      <section class="certification-readiness ${m.reviewed===m.total && m.discussion===0 && m.amendment===0 ? "ready" : ""}">
        <span>${m.reviewed===m.total && m.discussion===0 && m.amendment===0 ? "✓" : "○"}</span>
        <div>
          <strong>${m.reviewed===m.total && m.discussion===0 && m.amendment===0 ? "Certification review ready" : "Certification review not yet ready"}</strong>
          <small>${readinessText(m)}</small>
        </div>
      </section>`;

    renderShell(content, "annual");
  }

  function saveSettings(){
    const settings = state.annualSettings();
    settings.year = Number(document.querySelector("#annual-year")?.value || state.reviewYear);
    settings.targetCompletionDate = document.querySelector("#annual-target")?.value || "";
    settings.meetingTarget = Number(document.querySelector("#annual-meetings")?.value || 4);
    settings.notes = document.querySelector("#annual-notes")?.value || "";
    state.saveAnnualSettings(settings);
    toast("Annual review cycle saved.");
    renderAnnual();
  }

  function governanceSchedule(currentMonth){
    const items = [
      [1,"Annual governance review begins"],
      [2,"Corporate records and filing check"],
      [3,"Fire and life-safety records review"],
      [4,"Financial statements and insurance review"],
      [5,"Annual meeting preparation"],
      [6,"Committee reports and summer handoff"],
      [7,"Summer recess"],
      [8,"Summer recess and September preparation"],
      [9,"Governance cycle resumes"],
      [10,"Budget and contract planning"],
      [11,"Committee appointments and annual reports"],
      [12,"Year-end archive and certification"]
    ];
    return items.map(([month,label]) => `
      <div class="calendar-row ${month===currentMonth ? "current" : ""}">
        <span>${String(month).padStart(2,"0")}</span>
        <strong>${label}</strong>
        ${month===currentMonth ? "<small>Current month</small>" : ""}
      </div>
    `).join("");
  }

  function readinessText(m){
    const missing = [];
    if(m.reviewed < m.total) missing.push(`${m.total-m.reviewed} section${m.total-m.reviewed===1?"":"s"} unreviewed`);
    if(m.discussion) missing.push(`${m.discussion} discussion item${m.discussion===1?"":"s"}`);
    if(m.amendment) missing.push(`${m.amendment} amendment item${m.amendment===1?"":"s"}`);
    return missing.length ? `Remaining: ${missing.join(", ")}.` : "All section reviews are complete with no unresolved governance items.";
  }
}
