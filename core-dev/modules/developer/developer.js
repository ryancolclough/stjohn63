import { escapeHTML } from "../../sdk/ui.js";

export default function register(ctx){
  const { router, state, renderShell, toast, platform, storage } = ctx;
  const expectedBuild = "20260713.005";

  installRuntimeLogging();

  router.register("developer", async () => {
    renderLoading();
    try{
      await renderDeveloper();
    }catch(error){
      recordError("developer", error);
      renderFailure(error);
    }
  });

  document.addEventListener("click", async event => {
    if(event.target.closest("[data-run-validation]")){
      await renderDeveloper(true);
      toast("Platform validation completed.");
      return;
    }

    if(event.target.closest("[data-refresh-core]")){
      location.reload();
      return;
    }

    if(event.target.closest("[data-force-fresh-load]")){
      const url = new URL(location.href);
      url.searchParams.set("v", Date.now().toString());
      location.href = url.toString();
      return;
    }

    if(event.target.closest("[data-clear-runtime-errors]")){
      storage.set("RUNTIME_ERRORS", []);
      toast("Runtime error log cleared.");
      await renderDeveloper();
      return;
    }

    if(event.target.closest("[data-copy-support-report]")){
      const report = await buildSupportReport();
      try{
        await navigator.clipboard.writeText(report);
        toast("Support report copied.");
      }catch(error){
        downloadText(report, "CORE-support-report.txt");
        toast("Support report downloaded.");
      }
      return;
    }

    if(event.target.closest("[data-download-support-report]")){
      downloadText(await buildSupportReport(), "CORE-support-report.txt");
      toast("Support report downloaded.");
    }
  });

  function installRuntimeLogging(){
    if(window.__CORE_RUNTIME_LOGGING__) return;
    window.__CORE_RUNTIME_LOGGING__ = true;

    window.addEventListener("error", event => {
      recordError("runtime", {
        message:event.message || "Runtime error",
        stack:event.error?.stack || "",
      });
    });

    window.addEventListener("unhandledrejection", event => {
      const reason = event.reason;
      recordError("promise", {
        message:reason?.message || String(reason || "Unhandled promise rejection"),
        stack:reason?.stack || "",
      });
    });
  }

  function recordError(module, error){
    const entries = storage.get("RUNTIME_ERRORS", []);
    entries.unshift({
      time:new Date().toISOString(),
      module,
      message:String(error?.message || error || "Unknown error"),
      stack:String(error?.stack || ""),
    });
    storage.set("RUNTIME_ERRORS", entries.slice(0, 50));
  }

  function renderLoading(){
    renderShell(`
      <div class="backline"><button data-route="settings">‹ Settings</button></div>
      <section class="hero">
        <div class="eyebrow">Developer Mode</div>
        <h1>Developer & Diagnostics</h1>
        <p>Loading the isolated diagnostic report…</p>
        <div class="rule"></div>
      </section>
      <section class="panel"><div class="diagnostic-empty">Inspecting modules and local records.</div></section>
    `, "developer");
  }

  async function getRegistry(){
    const response = await fetch(`data/module-registry.json?v=${expectedBuild}`, {
      cache:"no-store",
    });
    if(!response.ok){
      throw new Error(`Module registry HTTP ${response.status}`);
    }
    const value = await response.json();
    if(!Array.isArray(value)){
      throw new Error("Module registry is not an array.");
    }
    return value;
  }

  async function snapshot(){
    const registry = await getRegistry();
    const enabled = registry.filter(item => item.enabled);
    const loadedIds = new Set(platform.modules.map(item => item.id));
    const routeIds = new Set(router.routes.keys());
    const moduleHealth = enabled.map(item => ({
      ...item,
      loaded:loadedIds.has(item.id),
      routeRegistered:routeIds.has(item.id),
    }));

    const runtimeErrors = storage.get("RUNTIME_ERRORS", []);
    const records = {
      reviews:Object.keys(state.reviews || {}).length,
      amendments:state.amendmentItems().length,
      actions:state.actionItems().length,
      annualTasks:state.annualTasks().length,
      meetings:storage.get("MEETINGS", []).length,
    };

    return {
      registry,
      enabled,
      moduleHealth,
      runtimeErrors,
      records,
      generatedAt:new Date().toISOString(),
      online:navigator.onLine,
      userAgent:navigator.userAgent,
    };
  }

  function validate(data){
    const checks = [
      {
        label:"Module registry loaded",
        pass:Array.isArray(data.registry) && data.registry.length > 0,
      },
      {
        label:"All enabled modules loaded",
        pass:data.moduleHealth.every(item => item.loaded),
      },
      {
        label:"All enabled routes registered",
        pass:data.moduleHealth.every(item => item.routeRegistered),
      },
      {
        label:"ORE article data available",
        pass:Array.isArray(state.articles) && state.articles.length > 0,
      },
      {
        label:"Review records readable",
        pass:state.reviews && typeof state.reviews === "object" && !Array.isArray(state.reviews),
      },
      {
        label:"Action records readable",
        pass:Array.isArray(state.actionItems()),
      },
      {
        label:"Annual task records readable",
        pass:Array.isArray(state.annualTasks()),
      },
      {
        label:"Browser storage available",
        pass:storageAvailable(),
      },
    ];

    return {
      checks,
      passed:checks.filter(check => check.pass).length,
      total:checks.length,
      overall:checks.every(check => check.pass) ? "PASS" : "ATTENTION",
    };
  }

  async function renderDeveloper(showValidation=false){
    const data = await snapshot();
    const validation = validate(data);
    const loadedCount = data.moduleHealth.filter(item => item.loaded).length;
    const routedCount = data.moduleHealth.filter(item => item.routeRegistered).length;
    const health = Math.round(
      (
        (loadedCount / Math.max(1, data.enabled.length)) * 55 +
        (routedCount / Math.max(1, data.enabled.length)) * 25 +
        (storageAvailable() ? 10 : 0) +
        (data.runtimeErrors.length === 0 ? 10 : 0)
      )
    );

    const moduleRows = data.moduleHealth.map(item => `
      <div class="module-health-row ${item.loaded && item.routeRegistered ? "loaded" : "attention"}">
        <span class="module-health-dot"></span>
        <span>
          <strong>${escapeHTML(item.name)}</strong>
          <small>${escapeHTML(item.id)} · v${escapeHTML(item.version)} · route ${item.routeRegistered ? "registered" : "missing"}</small>
        </span>
        <b>${item.loaded ? "Loaded" : "Missing"}</b>
      </div>
    `).join("");

    const validationRows = validation.checks.map(check => `
      <div class="validation-row ${check.pass ? "pass" : "fail"}">
        <span>${check.pass ? "✓" : "!"}</span>
        <strong>${escapeHTML(check.label)}</strong>
        <b>${check.pass ? "PASS" : "ATTENTION"}</b>
      </div>
    `).join("");

    const errorRows = data.runtimeErrors.length
      ? data.runtimeErrors.slice(0, 20).map(error => `
          <article class="runtime-error-row">
            <strong>${escapeHTML(error.module || "runtime")}</strong>
            <small>${escapeHTML(error.time || "")}</small>
            <p>${escapeHTML(error.message || "Unknown error")}</p>
          </article>
        `).join("")
      : `<div class="diagnostic-empty">No runtime errors have been recorded since this module loaded.</div>`;

    const releaseRows = [
      ["1.6.2","Developer & Diagnostics","Isolated health, validation, support reports, and runtime logging."],
      ["1.6.1","Annual Governance","Annual obligations, workspaces, evidence, and linked actions."],
      ["1.5.1","Backup Import","Cross-device backup restore and merge."],
      ["1.5.0","Action Centre","Temple Board action tracking."],
      ["1.4.0","Governance Intelligence","Risk scoring and smart meeting agendas."],
      ["1.3.0","Annual Manager","Annual review queue and cycle planning."],
      ["1.2.2","Amendment Workflow","Motion, vote, approval, and publication readiness."],
    ].map(([version,title,summary]) => `
      <article class="release-row">
        <span>${version}</span>
        <div><strong>${escapeHTML(title)}</strong><small>${escapeHTML(summary)}</small></div>
      </article>
    `).join("");

    renderShell(`
      <div class="backline"><button data-route="settings">‹ Settings</button></div>

      <section class="hero">
        <div class="eyebrow">Developer Mode · Isolated Module</div>
        <h1>Developer & Diagnostics</h1>
        <p>This module reads platform health without changing CORE's startup or module loader.</p>
        <div class="rule"></div>
      </section>

      <section class="developer-health-card">
        <div>
          <span>System Health</span>
          <strong>${health}%</strong>
          <small>${loadedCount} of ${data.enabled.length} modules loaded · ${routedCount} routes registered</small>
        </div>
        <div class="developer-health-ring" style="--health:${health}"><b>${health}</b></div>
      </section>

      <section class="diagnostic-grid">
        <article><span>Platform</span><strong>${escapeHTML(platform.version)}</strong><small>${escapeHTML(platform.releaseId)}</small></article>
        <article><span>Build</span><strong>${escapeHTML(platform.build)}</strong><small>${escapeHTML(platform.environment)}</small></article>
        <article><span>Modules</span><strong>${loadedCount} / ${data.enabled.length}</strong><small>loaded successfully</small></article>
        <article><span>Network</span><strong>${data.online ? "Online" : "Offline"}</strong><small>browser status</small></article>
      </section>

      <section class="panel">
        <div class="panel-head"><div><h2>Module Health</h2><p>Registry, loaded modules, and route registration</p></div></div>
        <div class="panel-body">${moduleRows}</div>
      </section>

      <section class="diagnostic-columns">
        <section class="panel">
          <div class="panel-head"><div><h2>Local Database</h2><p>Records on this browser</p></div></div>
          <div class="database-list">
            ${databaseRow("Reviews", data.records.reviews)}
            ${databaseRow("Amendments", data.records.amendments)}
            ${databaseRow("Actions", data.records.actions)}
            ${databaseRow("Annual Tasks", data.records.annualTasks)}
            ${databaseRow("Meetings", data.records.meetings)}
            ${databaseRow("Runtime Errors", data.runtimeErrors.length)}
          </div>
        </section>

        <section class="panel">
          <div class="panel-head"><div><h2>Platform Validation</h2><p>${validation.passed} of ${validation.total} checks passed</p></div></div>
          <div class="validation-list">${validationRows}</div>
          <div class="diagnostic-actions">
            <button class="btn" data-run-validation>Run Validation</button>
            <button class="btn secondary" data-refresh-core>Reload CORE</button>
            <button class="btn secondary" data-force-fresh-load>Force Fresh Load</button>
          </div>
        </section>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div><h2>Runtime Error Log</h2><p>Errors captured after diagnostics initialized</p></div>
          <button class="btn secondary" data-clear-runtime-errors>Clear Log</button>
        </div>
        <div class="panel-body">${errorRows}</div>
      </section>

      <section class="diagnostic-columns">
        <section class="panel">
          <div class="panel-head"><div><h2>Support Report</h2><p>For deployment troubleshooting</p></div></div>
          <div class="support-body">
            <p>Copy or download a report containing versions, module health, routes, record counts, validation, and recent runtime errors.</p>
            <div class="diagnostic-actions">
              <button class="btn" data-copy-support-report>Copy Report</button>
              <button class="btn secondary" data-download-support-report>Download Report</button>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head"><div><h2>Release Centre</h2><p>Development history</p></div></div>
          <div class="release-list">${releaseRows}</div>
        </section>
      </section>
    `, "developer");

    if(showValidation){
      document.querySelector(".validation-list")?.scrollIntoView({
        behavior:"smooth",
        block:"center",
      });
    }
  }

  function renderFailure(error){
    renderShell(`
      <div class="backline"><button data-route="settings">‹ Settings</button></div>
      <section class="hero">
        <div class="eyebrow">Diagnostics Module Error</div>
        <h1>Diagnostics could not finish its report.</h1>
        <p>${escapeHTML(error?.message || String(error))}</p>
        <div class="rule"></div>
      </section>
      <section class="panel">
        <div class="diagnostic-actions">
          <button class="btn" data-refresh-core>Reload CORE</button>
          <button class="btn secondary" data-force-fresh-load>Force Fresh Load</button>
        </div>
      </section>
    `, "developer");
  }

  async function buildSupportReport(){
    const data = await snapshot();
    const validation = validate(data);
    return [
      "CORE Support Report",
      "===================",
      `Generated: ${data.generatedAt}`,
      `Platform: ${platform.version}`,
      `Build: ${platform.build}`,
      `Release ID: ${platform.releaseId}`,
      `Environment: ${platform.environment}`,
      `Modules: ${data.moduleHealth.filter(item => item.loaded).length}/${data.enabled.length} loaded`,
      `Routes: ${data.moduleHealth.filter(item => item.routeRegistered).length}/${data.enabled.length} registered`,
      `Validation: ${validation.overall} (${validation.passed}/${validation.total})`,
      "",
      "Module Health",
      ...data.moduleHealth.map(item =>
        `- ${item.id} v${item.version}: loaded=${item.loaded}, route=${item.routeRegistered}`
      ),
      "",
      "Local Records",
      `- Reviews: ${data.records.reviews}`,
      `- Amendments: ${data.records.amendments}`,
      `- Actions: ${data.records.actions}`,
      `- Annual Tasks: ${data.records.annualTasks}`,
      `- Meetings: ${data.records.meetings}`,
      "",
      "Recent Runtime Errors",
      ...(data.runtimeErrors.length
        ? data.runtimeErrors.slice(0, 10).map(error =>
            `- ${error.time} [${error.module}] ${error.message}`
          )
        : ["- None recorded"]),
      "",
      "Browser",
      data.userAgent,
    ].join("\n");
  }

  function storageAvailable(){
    try{
      const key = "__CORE_DIAGNOSTIC_TEST__";
      localStorage.setItem(key, "1");
      localStorage.removeItem(key);
      return true;
    }catch(error){
      return false;
    }
  }

  function databaseRow(label, value){
    return `<div class="database-row"><span>${escapeHTML(label)}</span><strong>${value}</strong></div>`;
  }

  function downloadText(text, filename){
    const blob = new Blob([text], {type:"text/plain"});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
