export default function register(ctx){
  const { router, renderShell, state, themes, platform } = ctx;

  router.register("settings",()=>{
    const modules = platform.modules.map(m=>`
      <div class="module-row"><span><strong>${m.name}</strong><small>${m.id}</small></span><b>v${m.version}</b></div>`).join("");

    const content=`
      <div class="backline"><button data-route="dashboard">‹ Dashboard</button></div>
      <section class="hero"><div class="eyebrow">Platform</div><h1>Settings & Health</h1><p>Confirm the active development build and installed module versions.</p><div class="rule"></div></section>

      <section class="panel">
        <div class="panel-head"><div><h2>CORE Platform</h2><p>${platform.environment}</p></div></div>
        <div class="about-grid">
          ${about("Platform Version","1.7.2 Theme Lab")}
          ${about("Build",platform.build)}
          ${about("Release ID",platform.releaseId)}
          ${about("ORE Connection",state.articles.length?"Connected":"Unavailable")}
          ${about("Storage","Available")}
          ${about("Theme",document.documentElement.dataset.theme)}
          ${about("Module Registry",platform.modules.length ? "OK" : "Unavailable")}
          ${about("Review Records",Object.keys(state.reviews).length)}
          ${about("Amendment Records",state.amendmentItems().length)}
          ${about("Event Bus","Operational")}
          ${about("Annual Queue",state.annualQueue().length)}
          ${about("High-Risk Sections",state.intelligenceSummary().high.length)}
          ${about("Estimated Work",state.intelligenceSummary().estimated + " min")}
          ${about("Open Actions",state.actionSummary().open)}
          ${about("Overdue Actions",state.actionSummary().overdue)}
          ${about("Platform Health",state.articles.length && platform.modules.length === 9 ? "100%" : "Attention")}
        </div>
      </section>

      <section class="panel">
        <div class="panel-head"><div><h2>Developer & Diagnostics</h2><p>Isolated health and support tools.</p></div></div>
        <div class="settings-diagnostic-launch">
          <span>
            <strong>Open Developer Console</strong>
            <small>Module health, validation, runtime errors, releases, and support reports.</small>
          </span>
          <button class="btn" data-route="developer">Open Diagnostics</button>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head"><div><h2>Appearance</h2><p>Light, dark, or system.</p></div></div>
        <div class="theme-options">
          <button data-theme="light">Light</button><button data-theme="dark">Dark</button><button data-theme="system">System</button>
        </div>
      </section>

      <section class="panel"><div class="panel-head"><div><h2>Motion</h2><p>Startup and scroll-triggered animation.</p></div></div><div class="motion-setting-grid"><button data-motion="off">Off</button><button data-motion="reduced">Reduced</button><button data-motion="full">Full</button></div></section>
      <section class="panel"><div class="panel-head"><div><h2>Glass Reflection</h2><p>Occasional light movement across visible cards.</p></div></div><div class="motion-setting-grid"><button data-reflection="off">Off</button><button data-reflection="subtle">Subtle</button><button data-reflection="normal">Normal</button></div></section>
      <section class="panel"><div class="panel-head"><div><h2>Progress Animation</h2><p>Animate wheels, counters, bars, and graphs.</p></div></div><div class="motion-setting-grid two"><button data-progress-animation="off">Off</button><button data-progress-animation="on">On</button></div></section>

      <section class="panel">
        <div class="panel-head"><div><h2>Installed Modules</h2><p>${platform.modules.length} loaded successfully</p></div></div>
        <div class="module-list">${modules}</div>
      </section>`;
    renderShell(content,"settings");
  });

  document.addEventListener("click",e=>{

    const mb=e.target.closest("button[data-motion]");if(mb&&mb.closest(".motion-setting-grid")){themes.setMotion(mb.dataset.motion);router.go("settings");return;}
    const rb=e.target.closest("button[data-reflection]");if(rb&&rb.closest(".motion-setting-grid")){themes.setReflection(rb.dataset.reflection);router.go("settings");return;}
    const pb=e.target.closest("button[data-progress-animation]");if(pb&&pb.closest(".motion-setting-grid")){themes.setProgressAnimation(pb.dataset.progressAnimation);router.go("settings");return;}
    const b=e.target.closest("button[data-theme]");
    if(!b || !b.closest(".theme-options")) return;
    e.preventDefault();
    e.stopPropagation();
    themes.set(b.dataset.theme);
    router.go("settings");
  });

  function about(label,value){return `<div class="about-row"><span>${label}</span><strong>${value}</strong></div>`}
}
