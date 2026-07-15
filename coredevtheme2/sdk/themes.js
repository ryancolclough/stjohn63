export class ThemeService {
  constructor(storage){ this.storage=storage; }
  init(){
    const s=this.storage.get("SETTINGS",{theme:"dark",motion:"full",reflection:"subtle",progressAnimation:"on"});
    const v={theme:s.theme||"dark",motion:s.motion||"full",reflection:s.reflection||"subtle",progressAnimation:s.progressAnimation||"on"};
    for(const [k,val] of Object.entries(v)) document.documentElement.dataset[k]=val;
    return v;
  }
  save(k,v){const s=this.storage.get("SETTINGS",{});s[k]=v;this.storage.set("SETTINGS",s);document.documentElement.dataset[k]=v;}
  set(v){this.save("theme",v)}
  setMotion(v){this.save("motion",v)}
  setReflection(v){this.save("reflection",v)}
  setProgressAnimation(v){this.save("progressAnimation",v)}
}
