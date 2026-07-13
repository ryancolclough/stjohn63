import { escapeHTML } from "../../sdk/ui.js";

export default function register(ctx){
  const { router, state, renderShell, toast, platform, storage } = ctx;

  const releases = [
    ["1.6.2","Developer & Diagnostics","Platform validation, module health, support reports, release history."],
    ["1.6.1","Annual Governance","Annual obligations, task workspaces, health score, Action Centre links."],
    ["1.5.1","Backup Import","Cross-device backup restore and merge."],
    ["1.5.0","Action Centre","Temple Board action tracking."],
    ["1.4.0","Governance Intelligence","Risk scoring and smart meeting agendas."],
    ["1.3.0","Annual Manager","Annual review queue and cycle planning."],
    ["1.2.2","Amendment Workflow","Motion, vote, approval, and publication readiness."],
    ["1.2.1","Review Record","Compliance matrix, timeline, and institutional knowledge."]
  ];

  router.register("developer", () => renderDeveloper());

  document.addEventListener("click", async e => {
    if(e.target.closest("[data-run-validation]")){
      renderDeveloper(true);
      toast("Platform validation complete.");
      return;
    }

    if(e.target.closest("[data-refresh-platform]")){
      location.reload();
      return;
    }

    if(e.target.closest("[data-force-refresh]")){
      const url = new URL(location.href);
      url.searchParams.set("v", Date.now());
      location.href = url.toString();
      return;
    }

    if(e.target.closest("[data-clear-errors]")){
      storage.set("ERROR_LOG",[]);
      toast("Error log cleared.");
      renderDeveloper();
      return;
    }

    if(e.target.closest("[data-copy-report]")){
      const report = buildReport();
      try{
        await navigator.clipboard.writeText(report);
        toast("Diagnostic report copied.");
      }catch{
        downloadText(report,"CORE-diagnostic-report.txt");
        toast("Diagnostic report downloaded.");
      }
      return;
    }

    if(e.target.closest("[data-download-report]")){
      downloadText(buildReport(),"CORE-diagnostic-report.txt");
      toast("Diagnostic report downloaded.");
    }
  });

  function renderDeveloper(showValidation=false){
    const snapshot = state.diagnosticSnapshot();
    const validation = state.platformValidation();
    const health = Math.max(0, Math.round(
      ((snapshot.modulesLoaded / Math.max(1,snapshot.modulesExpected))*70) +
      (snapshot.storageAvailable ? 20 : 0) +
      (snapshot.errors.length ? 0 : 10)
    ));

    const moduleRows = snapshot.moduleLoadLog.map(item => `
      <div class="module-health-row ${item.status}">
        <span class="module-health-dot"></span>
        <span>
          <strong>${escapeHTML(item.name || item.id)}</strong>
          <small>${escapeHTML(item.id)} · v${escapeHTML(item.version || "unknown")} · ${item.loadMs} ms</small>
        </span>
        <b>${item.status === "loaded" ? "Loaded" : "Failed"}</b>
      </div>
    `).join("") || `<div class="diagnostic-empty">No module telemetry recorded.</div>`;

    const errorRows = snapshot.errors.length ? snapshot.errors.slice(0,20).map(error => `
      <article class="error-log-row">
        <strong>${escapeHTML(error.module || "platform")}</strong>
        <small>${escapeHTML(error.time || "")}</small>
        <p>${escapeHTML(error.message || "Unknown error")}</p>
      </article>
    `).join("") : `<div class="diagnostic-empty">No recorded module errors.</div>`;

    const validationRows = validation.checks.map(check => `
      <div class="validation-row ${check.pass ? "pass" : "fail"}">
        <span>${check.pass ? "✓" : "!"}</span>
        <strong>${escapeHTML(check.label)}</strong>
        <b>${check.pass ? "PASS" : "ATTENTION"}</b>
      </div>
    `).join("");

    const releaseRows = releases.map(([version,title,summary]) => `
      <article class="release-row">
        <span>${version}</span>
        <div><strong>${escapeHTML(title)}</strong><small>${escapeHTML(summary)}</small></div>
      </article>
    `).join("");

    const content = `
      <div class="backline"><button data-route="settings">‹ Settings</button></div>
      <section class="hero">
        <div class="eyebrow">Developer Mode</div>
        <h1>Developer & Diagnostics</h1>
        <p>Inspect platform health, module loading, local data, errors, releases, and validation results.</p>
        <div class="rule"></div>
      </section>

      <section class="developer-health-card">
        <div>
          <span>System Health</span>
          <strong>${health}%</strong>
          <small>${snapshot.modulesLoaded} of ${snapshot.modulesExpected} modules loaded</small>
        </div>
        <div class="developer-health-ring" style="--health:${health}"><b>${health}</b></div>
      </section>

      <section class="diagnostic-grid">
        <article><span>Platform</span><strong>${escapeHTML(platform.version)}</strong><small>${escapeHTML(platform.releaseId)}</small></article>
        <article><span>Build</span><strong>${escapeHTML(platform.build)}</strong><small>Development</small></article>
        <article><span>Storage</span><strong>${snapshot.storageAvailable ? "Available" : "Unavailable"}</strong><small>${snapshot.reviews + snapshot.actions + snapshot.annualTasks + snapshot.meetings} total records</small></article>
        <article><span>Network</span><strong>${snapshot.online ? "Online" : "Offline"}</strong><small>${escapeHTML(navigator.platform || "Browser")}</small></article>
      </section>

      <section class="panel">
        <div class="panel-head"><div><h2>Module Health</h2><p>Live load status and timing</p></div></div>
        <div class="panel-body">${moduleRows}</div>
      </section>

      <section class="diagnostic-columns">
        <section class="panel">
          <div class="panel-head"><div><h2>Local Database</h2><p>Records stored on this browser</p></div></div>
          <div class="database-list">
            ${dbRow("Reviews",snapshot.reviews)}
            ${dbRow("Actions",snapshot.actions)}
            ${dbRow("Annual Tasks",snapshot.annualTasks)}
            ${dbRow("Meetings",snapshot.meetings)}
            ${dbRow("Settings",snapshot.settingsCount)}
            ${dbRow("Errors",snapshot.errors.length)}
          </div>
        </section>

        <section class="panel">
          <div class="panel-head"><div><h2>Platform Validation</h2><p>${validation.passed} of ${validation.total} checks passed</p></div></div>
          <div class="validation-list">${validationRows}</div>
          <div class="diagnostic-actions">
            <button class="btn" data-run-validation>Run Validation</button>
            <button class="btn secondary" data-refresh-platform>Reload CORE</button>
            <button class="btn secondary" data-force-refresh>Force Fresh Load</button>
          </div>
        </section>
      </section>

      <section class="panel">
        <div class="panel-head"><div><h2>Error Log</h2><p>${snapshot.errors.length} recorded errors</p></div><button class="btn secondary" data-clear-errors>Clear Log</button></div>
        <div class="panel-body">${errorRows}</div>
      </section>

      <section class="diagnostic-columns">
        <section class="panel">
          <div class="panel-head"><div><h2>Support Report</h2><p>Copy or download system information</p></div></div>
          <div class="support-body">
            <p>Use this report when troubleshooting a deployment or module issue.</p>
            <div class="diagnostic-actions">
              <button class="btn" data-copy-report>Copy Report</button>
              <button class="btn secondary" data-download-report>Download Report</button>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head"><div><h2>Release Centre</h2><p>Platform history</p></div></div>
          <div class="release-list">${releaseRows}</div>
        </section>
      </section>`;

    renderShell(content,"developer");
  }

  function buildReport(){
    const snapshot = state.diagnosticSnapshot();
    const validation = state.platformValidation();
    const lines = [
      "CORE Diagnostic Report",
      "======================",
      `Generated: ${snapshot.timestamp}`,
      `Platform: ${snapshot.platform}`,
      `Build: ${snapshot.build}`,
      `Release ID: ${snapshot.releaseId}`,
      `Modules: ${snapshot.modulesLoaded}/${snapshot.modulesExpected} loaded`,
      `Failed Modules: ${snapshot.modulesFailed}`,
      `Storage Available: ${snapshot.storageAvailable}`,
      `Online: ${snapshot.online}`,
      `Reviews: ${snapshot.reviews}`,
      `Actions: ${snapshot.actions}`,
      `Annual Tasks: ${snapshot.annualTasks}`,
      `Meetings: ${snapshot.meetings}`,
      `Errors: ${snapshot.errors.length}`,
      `Validation: ${validation.overall} (${validation.passed}/${validation.total})`,
      "",
      "Module Details",
      ...snapshot.moduleLoadLog.map(item => `- ${item.id} v${item.version}: ${item.status} (${item.loadMs} ms)`),
      "",
      "Validation",
      ...validation.checks.map(check => `- ${check.pass ? "PASS" : "ATTENTION"}: ${check.label}`),
      "",
      "Recent Errors",
      ...(snapshot.errors.slice(0,10).map(error => `- ${error.time} [${error.module}] ${error.message}`) || []),
      "",
      "Browser",
      snapshot.userAgent
    ];
    return lines.join("\n");
  }

  function dbRow(label,value){
    return `<div class="database-row"><span>${escapeHTML(label)}</span><strong>${value}</strong></div>`;
  }

  function downloadText(text,name){
    const blob=new Blob([text],{type:"text/plain"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=name;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
}
