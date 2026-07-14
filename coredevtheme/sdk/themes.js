export class ThemeService {
  constructor(storage){ this.storage = storage; }

  init(){
    const settings = this.storage.get("SETTINGS", {
      theme:"dark",
      profile:"alpine",
      motion:"normal",
      glass:"balanced"
    });

    const theme = settings.theme || "dark";
    const profile = settings.profile || "alpine";
    const motion = settings.motion || "normal";
    const glass = settings.glass || "balanced";

    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.profile = profile;
    document.documentElement.dataset.motion = motion;
    document.documentElement.dataset.glass = glass;

    return {theme,profile,motion,glass};
  }

  set(value){
    const settings = this.storage.get("SETTINGS", {});
    settings.theme = value;
    this.storage.set("SETTINGS", settings);
    document.documentElement.dataset.theme = value;
  }

  setProfile(value){
    const settings = this.storage.get("SETTINGS", {});
    settings.profile = value;
    this.storage.set("SETTINGS", settings);
    document.documentElement.dataset.profile = value;
  }

  setMotion(value){
    const settings = this.storage.get("SETTINGS", {});
    settings.motion = value;
    this.storage.set("SETTINGS", settings);
    document.documentElement.dataset.motion = value;
  }

  setGlass(value){
    const settings = this.storage.get("SETTINGS", {});
    settings.glass = value;
    this.storage.set("SETTINGS", settings);
    document.documentElement.dataset.glass = value;
  }
}
