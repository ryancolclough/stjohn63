export class StorageService {
  constructor(prefix="CORE"){ this.prefix = prefix; }
  get(key, fallback={}){
    try { return JSON.parse(localStorage.getItem(`${this.prefix}_${key}`)) ?? fallback; }
    catch { return fallback; }
  }
  set(key, value){ localStorage.setItem(`${this.prefix}_${key}`, JSON.stringify(value)); }
  remove(key){ localStorage.removeItem(`${this.prefix}_${key}`); }
}
