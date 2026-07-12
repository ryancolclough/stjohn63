import { escapeHTML } from "../../sdk/ui.js";

export default function register(ctx){
  const { router, state, renderShell, events, toast, platform, storage } = ctx;

  router.register("intelligence", () => renderIntelligence());

  document.addEventListener("click", e => {
    const open = e.target.closest("[data-intel-open]");
    if(open){
      const [articleIndex, sectionIndex] = open.dataset.intelOpen.split(":").map(Number);
      events.emit("review:open-direct",{articleIndex,sectionIndex});
      return;
    }

    if(e.target.closest("[data-generate-agenda]")){
      renderIntelligence(Number(document.querySelector("#agenda-length")?.value || 45));
      return;
    }

    if(e.target.closest("[data-save-meeting]")){
      const agenda = state.generateAgenda(Number(document.querySelector("#agenda-length")?.value || 45));
      const meeting = {
        id:`MTG-${state.reviewYear}-${String(Date.now()).slice(-5)}`,
        date:new Date().toISOString().slice(0,10),
        status:"draft",
        agenda
      };
      const meetings = storage.get("MEETINGS",[]);
      meetings.unshift(meeting);
      storage.set("MEETINGS",meetings);
      toast("Draft meeting agenda saved.");
      renderIntelligence(agenda.limitMinutes);
      return;
    }
  });

  function renderIntelligence(limit=45){
    const summary = state.intelligenceSummary();
    const agenda = state.generateAgenda(limit);
    const savedMeetings = storage.get("MEETINGS",[]);
    const next = summary.queue[0] || null;
    const overallRisk = summary.high.length ? "High" : summary.medium.length ? "Medium" : "Low";

    const agendaRows = agenda.items.map((item,index)=>`
      <div class="agenda-item ${item.type}">
        <span>${index+1}</span>
        <div>
          <strong>${escapeHTML(item.title)}</strong>
          <small>${escapeHTML(item.reason || item.type)}</small>
        </div>
        <b>${item.minutes} min</b>
        ${item.articleIndex !== undefined ? `<button data-intel-open="${item.articleIndex}:${item.sectionIndex}">Open</button>` : ""}
      </div>
    `).join("");

    const riskRows = summary.risks
      .sort((a,b)=>b.risk.score-a.risk.score)
      .slice(0,8)
      .map(item=>`
        <button class="risk-row" data-intel-open="${item.articleIndex}:${item.sectionIndex}">
          <span class="risk-dot ${item.risk.level}"></span>
          <span>
            <strong>Section ${escapeHTML(item.section.number)} — ${escapeHTML(item.section.title)}</strong>
            <small>${escapeHTML(item.risk.reasons[0])}</small>
          </span>
          <b>${item.risk.score}</b>
        </button>
      `).join("");

    const diagnosticRows = [
      ["Platform",platform.version],
      ["Build",platform.build],
      ["Loaded Modules",String(platform.modules.length)],
      ["ORE Data",state.articles.length ? "Connected" : "Unavailable"],
      ["Storage","Available"],
      ["Event Bus","Operational"],
      ["Review Records",String(Object.keys(state.reviews).length)],
      ["Saved Meetings",String(savedMeetings.length)]
    ].map(([label,value])=>`<div class="diagnostic-row"><span>${label}</span><strong>${value}</strong></div>`).join("");

    const content = `
      <div class="backline"><button data-route="dashboard">‹ Dashboard</button></div>
      <section class="hero">
        <div class="eyebrow">Rules-Based Assistance</div>
        <h1>Governance Intelligence</h1>
        <p>CORE now turns its existing records into meeting guidance, risk indicators, review estimates, and platform diagnostics—without using a paid AI service.</p>
        <div class="rule"></div>
      </section>

      <section class="intelligence-overview">
        <article><span>Overall Risk</span><strong class="risk-text ${overallRisk.toLowerCase()}">${overallRisk}</strong><small>${summary.high.length} high · ${summary.medium.length} medium</small></article>
        <article><span>Work Remaining</span><strong>${formatMinutes(summary.estimated)}</strong><small>${summary.queue.length} queued sections</small></article>
        <article><span>Suggested Next</span><strong>${next ? `§ ${escapeHTML(next.section.number)}` : "Complete"}</strong><small>${next ? escapeHTML(next.section.title) : "No queued section"}</small></article>
        <article><span>Saved Agendas</span><strong>${savedMeetings.length}</strong><small>meeting drafts</small></article>
      </section>

      <section class="panel">
        <div class="panel-head intelligence-head">
          <div><h2>Smart Meeting Agenda</h2><p>Generated from unresolved reviews and amendments.</p></div>
          <div class="agenda-controls">
            <select id="agenda-length">
              ${[30,45,60,90].map(value=>`<option value="${value}" ${value===limit?"selected":""}>${value} minutes</option>`).join("")}
            </select>
            <button class="btn secondary" data-generate-agenda>Generate</button>
            <button class="btn" data-save-meeting>Save Draft</button>
          </div>
        </div>
        <div class="agenda-summary"><strong>${agenda.totalMinutes} minutes</strong><span>${agenda.items.length} agenda items</span></div>
        <div class="agenda-list">${agendaRows}</div>
      </section>

      <section class="intelligence-columns">
        <section class="panel">
          <div class="panel-head"><div><h2>Governance Risk</h2><p>Highest-risk sections first</p></div></div>
          <div class="panel-body">${riskRows || '<div class="intel-empty">No section risk data.</div>'}</div>
        </section>

        <section class="panel">
          <div class="panel-head"><div><h2>Developer Diagnostics</h2><p>Live platform health</p></div></div>
          <div class="diagnostic-list">${diagnosticRows}</div>
        </section>
      </section>

      <section class="intelligence-note">
        <strong>How this works</strong>
        <p>Risk and time estimates are calculated from review status, source coverage, amendment stage, review age, and section length. They assist the committee but do not replace legal or governance judgment.</p>
      </section>`;

    renderShell(content,"intelligence");
  }

  function formatMinutes(minutes){
    if(minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes/60);
    const remainder = minutes % 60;
    return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
  }
}
