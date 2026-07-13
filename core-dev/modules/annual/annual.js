import { escapeHTML } from "../../sdk/ui.js";

export default function register(ctx){
  const { router, state, renderShell, events, toast, dialogs } = ctx;
  let activeTaskId = "";

  router.register("annual", () => renderAnnual());

  document.addEventListener("click", e => {
    const openSection = e.target.closest("[data-annual-open]");
    if(openSection){
      const [articleIndex, sectionIndex] = openSection.dataset.annualOpen.split(":").map(Number);
      events.emit("review:open-direct", {articleIndex, sectionIndex});
      return;
    }

    const article = e.target.closest("[data-annual-article]");
    if(article){
      const articleIndex = Number(article.dataset.annualArticle);
      const firstPending = state.articles[articleIndex].sections.findIndex(section => !state.getReview(section));
      events.emit("review:open-direct", {articleIndex, sectionIndex:firstPending >= 0 ? firstPending : 0});
      return;
    }

    const task = e.target.closest("[data-open-annual-task]");
    if(task){
      openTask(task.dataset.openAnnualTask);
      return;
    }

    if(e.target.closest("[data-save-annual]")) return saveSettings();
    if(e.target.closest("[data-save-annual-task]")) return saveTask();
    if(e.target.closest("[data-complete-annual-task]")) return completeTask();
    if(e.target.closest("[data-create-annual-action]")) return createActionFromTask();
    if(e.target.closest("[data-close-annual-task]")) return dialogs.close();

    if(e.target.closest("[data-complete-annual]")){
      const m = state.metrics();
      const taskSummary = state.annualTaskSummary();
      if(m.reviewed !== m.total || taskSummary.completed !== taskSummary.total){
        toast("Complete all section reviews and annual tasks first.");
        return;
      }
      const settings = state.annualSettings();
      settings.status = "complete";
      settings.completedDate = new Date().toISOString().slice(0,10);
      state.saveAnnualSettings(settings);
      toast("Annual governance cycle marked complete.");
      renderAnnual();
    }
  });

  function renderAnnual(){
    const settings = state.annualSettings();
    const m = state.metrics();
    const queue = state.annualQueue();
    const articles = state.annualArticleProgress();
    const tasks = state.annualTasks();
    const summary = state.annualTaskSummary();
    const currentMonth = new Date().getMonth()+1;
    const annualHealth = Math.round(((m.percent * .55) + ((summary.completed/summary.total)*100 * .45)));

    const queueRows = queue.slice(0,6).map(item => `
      <button class="annual-queue-row" data-annual-open="${item.articleIndex}:${item.sectionIndex}">
        <span class="queue-number">${escapeHTML(item.section.number)}</span>
        <span><strong>${escapeHTML(item.section.title)}</strong><small>Article ${escapeHTML(item.article.roman)} · ${escapeHTML(item.queueReason)}</small></span>
        <span>›</span>
      </button>`).join("") || `<div class="annual-empty">The section review queue is complete.</div>`;

    const taskRows = tasks.map(task => {
      const overdue = task.status !== "complete" && task.dueDate < new Date().toISOString().slice(0,10);
      return `
        <button class="annual-task-row ${task.status} ${overdue?"overdue":""}" data-open-annual-task="${task.id}">
          <span class="task-status-dot"></span>
          <span><strong>${escapeHTML(task.title)}</strong><small>${escapeHTML(task.committee)} · Due ${escapeHTML(task.dueDate)}</small></span>
          <span class="task-state">${overdue?"Overdue":task.status==="complete"?"Complete":"Open"}</span>
        </button>`;
    }).join("");

    const articleRows = articles.map(item => `
      <button class="annual-article-row" data-annual-article="${item.articleIndex}">
        <span class="annual-roman">${escapeHTML(item.article.roman)}</span>
        <span><strong>${escapeHTML(item.article.title)}</strong><small>${item.reviewed} of ${item.total} reviewed</small><i><b style="width:${item.percent}%"></b></i></span>
        <span>${item.percent}%</span>
      </button>`).join("");

    const content = `
      <div class="backline"><button data-route="dashboard">‹ Dashboard</button></div>
      <section class="hero">
        <div class="eyebrow">${settings.year} Governance Cycle</div>
        <h1>Annual Governance</h1>
        <p>Track section reviews, recurring Temple Board obligations, evidence, responsible committees, and follow-up actions in one annual workspace.</p>
        <div class="rule"></div>
      </section>

      <section class="annual-health">
        <div><span>Annual Governance Health</span><strong>${annualHealth}%</strong><small>Section review and annual obligations combined</small></div>
        <div class="annual-health-ring" style="--annual-score:${annualHealth}"><b>${annualHealth}</b></div>
      </section>

      <section class="annual-overview">
        <article><span>Completed Tasks</span><strong>${summary.completed}</strong><small>of ${summary.total}</small></article>
        <article><span>Upcoming</span><strong>${summary.upcoming}</strong><small>annual obligations</small></article>
        <article><span>Overdue</span><strong>${summary.overdue}</strong><small>require attention</small></article>
        <article><span>Work Remaining</span><strong>${formatMinutes(summary.estimatedMinutes)}</strong><small>estimated annual tasks</small></article>
      </section>

      <section class="panel">
        <div class="panel-head"><div><h2>Annual Compliance Timeline</h2><p>Open any obligation to record evidence or create an Action Centre item.</p></div></div>
        <div class="panel-body">${taskRows}</div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div><h2>Continue the By-Law Review</h2><p>Priority items first, followed by unreviewed sections.</p></div>
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
          <div class="panel-head"><div><h2>Cycle Settings</h2><p>Stored on this device</p></div></div>
          <div class="annual-settings">
            <div class="field"><label>Review Year</label><input id="annual-year" type="number" value="${settings.year}"></div>
            <div class="field"><label>Target Completion Date</label><input id="annual-target" type="date" value="${escapeHTML(settings.targetCompletionDate||"")}"></div>
            <div class="field"><label>Planned Review Meetings</label><input id="annual-meetings" type="number" min="1" value="${settings.meetingTarget||4}"></div>
            <div class="field"><label>Annual Notes</label><textarea id="annual-notes">${escapeHTML(settings.notes||"")}</textarea></div>
            <div class="actions"><button class="btn secondary" data-save-annual>Save Cycle</button><button class="btn" data-complete-annual>Complete Annual Cycle</button></div>
          </div>
        </section>

        <section class="panel ai-ready-panel">
          <div class="panel-head"><div><h2>AI Governance Analysis</h2><p>Framework prepared for CORE 2.0</p></div></div>
          <div class="ai-ready-body">
            <span>Coming in CORE 2.0</span>
            <p>Annual obligations will be compared against ONCA, Grand Lodge requirements, Articles, and approved internal policies. AI will prepare findings; officers and the Board will retain final authority.</p>
            <div class="ai-authorities"><b>ONCA</b><b>Grand Lodge</b><b>Articles</b><b>Internal Policies</b></div>
          </div>
        </section>
      </section>`;

    renderShell(content,"annual");
  }

  function openTask(id){
    const task = state.annualTasks().find(item => item.id === id);
    if(!task) return;
    activeTaskId = id;

    dialogs.open(task.title, `
      <div class="annual-task-workspace">
        <div class="task-meta-grid">
          <div><span>Task ID</span><strong>${escapeHTML(task.id)}</strong></div>
          <div><span>Due Date</span><strong>${escapeHTML(task.dueDate)}</strong></div>
          <div><span>Committee</span><strong>${escapeHTML(task.committee)}</strong></div>
          <div><span>Priority</span><strong>${escapeHTML(task.priority)}</strong></div>
        </div>
        <div class="field"><label>Status</label><select id="annual-task-status">
          ${option("not_started","Not Started",task.status)}
          ${option("in_progress","In Progress",task.status)}
          ${option("waiting_review","Waiting Review",task.status)}
          ${option("complete","Complete",task.status)}
        </select></div>
        <div class="field"><label>Responsible Committee</label><input id="annual-task-committee" value="${escapeHTML(task.committee)}"></div>
        <div class="field"><label>Due Date</label><input id="annual-task-due" type="date" value="${escapeHTML(task.dueDate)}"></div>
        <div class="field"><label>Evidence / Documents</label><textarea id="annual-task-evidence" placeholder="Certificate, filing number, minutes reference, document path...">${escapeHTML(task.evidence||"")}</textarea></div>
        <div class="field"><label>Notes</label><textarea id="annual-task-notes">${escapeHTML(task.notes||"")}</textarea></div>
        <div class="task-link-status">${task.linkedActionId ? `Linked Action: <strong>${escapeHTML(task.linkedActionId)}</strong>` : "No Action Centre item linked."}</div>
        <div class="actions">
          <button class="btn" data-save-annual-task>Save Task</button>
          <button class="btn secondary" data-complete-annual-task>Mark Complete</button>
          <button class="btn secondary" data-create-annual-action ${task.linkedActionId?"disabled":""}>Create Action</button>
          <button class="btn secondary" data-close-annual-task>Close</button>
        </div>
      </div>`);
  }

  function saveTask(){
    const tasks = state.annualTasks();
    const task = tasks.find(item => item.id === activeTaskId);
    if(!task) return;

    task.status = document.querySelector("#annual-task-status")?.value || task.status;
    task.committee = document.querySelector("#annual-task-committee")?.value.trim() || task.committee;
    task.dueDate = document.querySelector("#annual-task-due")?.value || task.dueDate;
    task.evidence = document.querySelector("#annual-task-evidence")?.value.trim() || "";
    task.notes = document.querySelector("#annual-task-notes")?.value.trim() || "";
    if(task.status === "complete" && !task.completedDate) task.completedDate = new Date().toISOString().slice(0,10);
    task.history = [...(task.history||[]),{date:new Date().toISOString(),event:"Task updated"}];
    state.saveAnnualTasks(tasks);
    toast(`${task.id} saved.`);
    dialogs.close();
    renderAnnual();
  }

  function completeTask(){
    const tasks = state.annualTasks();
    const task = tasks.find(item => item.id === activeTaskId);
    if(!task) return;
    task.status = "complete";
    task.completedDate = new Date().toISOString().slice(0,10);
    task.history = [...(task.history||[]),{date:new Date().toISOString(),event:"Task completed"}];
    state.saveAnnualTasks(tasks);
    toast(`${task.id} completed.`);
    dialogs.close();
    renderAnnual();
  }

  function createActionFromTask(){
    const tasks = state.annualTasks();
    const task = tasks.find(item => item.id === activeTaskId);
    if(!task || task.linkedActionId) return;

    const action = events.emit("actions:create-from-review", {
      title:task.title,
      description:task.notes || `Complete annual governance obligation ${task.id}.`,
      section:task.id,
      assignedCommittee:task.committee,
      dueDate:task.dueDate
    });

    if(action?.id){
      task.linkedActionId = action.id;
      task.history = [...(task.history||[]),{date:new Date().toISOString(),event:`Linked ${action.id}`}];
      state.saveAnnualTasks(tasks);
      toast(`${action.id} created.`);
      dialogs.close();
      renderAnnual();
    }else{
      toast("Action Centre could not create the linked action.");
    }
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

  function option(value,label,current){ return `<option value="${value}" ${value===current?"selected":""}>${label}</option>`; }
  function formatMinutes(minutes){ const h=Math.floor(minutes/60),m=minutes%60; return h ? `${h}h${m?` ${m}m`:""}` : `${m}m`; }
}
