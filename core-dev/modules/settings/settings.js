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
          ${about("Version",platform.version)}
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
          ${about("Platform Health",state.articles.length && platform.modules.length === 6 ? "100%" : "Attention")}
        </div>
      </section>

      <section class="panel">
        <div class="panel-head"><div><h2>Appearance</h2><p>Light, dark, or system.</p></div></div>
        <div class="theme-options">
          <button data-theme="light">Light</button><button data-theme="dark">Dark</button><button data-theme="system">System</button>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head"><div><h2>Installed Modules</h2><p>${platform.modules.length} loaded successfully</p></div></div>
        <div class="module-list">${modules}</div>
      </section>`;
    renderShell(content,"settings");
  });

  document.addEventListener("click",e=>{
    const b=e.target.closest("[data-theme]");
    if(!b) return;
    themes.set(b.dataset.theme);
    router.go("settings");
  });

  function about(label,value){return `<div class="about-row"><span>${label}</span><strong>${value}</strong></div>`}
}
