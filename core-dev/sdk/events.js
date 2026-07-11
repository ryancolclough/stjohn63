export class EventBus {
  constructor(){ this.events = new Map(); }
  on(name, handler){
    if(!this.events.has(name)) this.events.set(name, new Set());
    this.events.get(name).add(handler);
    return () => this.events.get(name)?.delete(handler);
  }
  emit(name, detail){ this.events.get(name)?.forEach(fn => fn(detail)); }
}
