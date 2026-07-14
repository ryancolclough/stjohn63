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
          ${about("Platform Version","1.7.0 Theme Lab")}
          ${about("Build",platform.build)}
          ${about("Release ID",platform.releaseId)}
          ${about("ORE Connection",state.articles.length?"Connected":"Unavailable")}
          ${about("Storage","Available")}
          ${about("Theme",document.documentElement.dataset.theme)}
          ${about("Appearance Profile",document.documentElement.dataset.profile)}
          ${about("Motion",document.documentElement.dataset.motion)}
          ${about("Glass",document.documentElement.dataset.glass)}
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
        <div class="panel-head"><div><h2>Appearance Profiles</h2><p>Change the visual atmosphere without changing CORE's workflow.</p></div></div>
        <div class="profile-options">
          <button class="profile-card alpine ${document.documentElement.dataset.profile==="alpine"?"active":""}" data-profile="alpine">
            <strong>Alpine Night</strong><small>Mountain lake, universe sky, warm brass glass.</small>
          </button>
          <button class="profile-card titanium ${document.documentElement.dataset.profile==="titanium"?"active":""}" data-profile="titanium">
            <strong>Titanium</strong><small>Metallic graphite, restrained reflections, executive feel.</small>
          </button>
          <button class="profile-card heritage ${document.documentElement.dataset.profile==="heritage"?"active":""}" data-profile="heritage">
            <strong>Heritage</strong><small>Traditional charcoal and brass CORE identity.</small>
          </button>
        </div>
        <p class="theme-lab-note">This is a separate visual test branch. Your stable CORE data and governance logic are unchanged.</p>
      </section>

      <section class="panel">
        <div class="panel-head"><div><h2>Display Mode</h2><p>Use the selected profile in dark or light presentation.</p></div></div>
        <div class="theme-options">
          <button data-theme="light">Light</button><button data-theme="dark">Dark</button><button data-theme="system">System</button>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head"><div><h2>Glass Finish</h2><p>Adjust transparency and blur.</p></div></div>
        <div class="glass-options">
          <button data-glass="crystal" class="${document.documentElement.dataset.glass==="crystal"?"active":""}">Crystal</button>
          <button data-glass="balanced" class="${document.documentElement.dataset.glass==="balanced"?"active":""}">Balanced</button>
          <button data-glass="frosted" class="${document.documentElement.dataset.glass==="frosted"?"active":""}">Frosted</button>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head"><div><h2>Ambient Motion</h2><p>Subtle background movement and interface entrances.</p></div></div>
        <div class="motion-options">
          <button data-motion="off" class="${document.documentElement.dataset.motion==="off"?"active":""}">Off</button>
          <button data-motion="low" class="${document.documentElement.dataset.motion==="low"?"active":""}">Low</button>
          <button data-motion="normal" class="${document.documentElement.dataset.motion==="normal"?"active":""}">Normal</button>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head"><div><h2>Installed Modules</h2><p>${platform.modules.length} loaded successfully</p></div></div>
        <div class="module-list">${modules}</div>
      </section>`;
    renderShell(content,"settings");
  });

  document.addEventListener("click",e=>{

    const profileButton=e.target.closest("button[data-profile]");
    if(profileButton && profileButton.closest(".profile-options")){
      e.preventDefault();
      e.stopPropagation();
      themes.setProfile(profileButton.dataset.profile);
      router.go("settings");
      return;
    }

    const motionButton=e.target.closest("button[data-motion]");
    if(motionButton && motionButton.closest(".motion-options")){
      e.preventDefault();
      e.stopPropagation();
      themes.setMotion(motionButton.dataset.motion);
      router.go("settings");
      return;
    }

    const glassButton=e.target.closest("button[data-glass]");
    if(glassButton && glassButton.closest(".glass-options")){
      e.preventDefault();
      e.stopPropagation();
      themes.setGlass(glassButton.dataset.glass);
      router.go("settings");
      return;
    }
    const b=e.target.closest("button[data-theme]");
    if(!b || !b.closest(".theme-options")) return;
    e.preventDefault();
    e.stopPropagation();
    themes.set(b.dataset.theme);
    router.go("settings");
  });

  function about(label,value){return `<div class="about-row"><span>${label}</span><strong>${value}</strong></div>`}
}
