export class ThemeService {
  constructor(storage){ this.storage = storage; }
  init(){
    const value = this.storage.get("SETTINGS", {theme:"system"}).theme || "system";
    document.documentElement.dataset.theme = value;
    return value;
  }
  set(value){
    const settings = this.storage.get("SETTINGS", {});
    settings.theme = value;
    this.storage.set("SETTINGS", settings);
    document.documentElement.dataset.theme = value;
  }
}
