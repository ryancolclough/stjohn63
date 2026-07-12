/*
CORE Event Bus
Version: 1.1.0
*/
export class EventBus {
  constructor(){ this.events = new Map(); }

  on(name, handler){
    if(!this.events.has(name)) this.events.set(name, new Set());
    this.events.get(name).add(handler);
    return () => this.events.get(name)?.delete(handler);
  }

  emit(name, detail){
    let result;
    this.events.get(name)?.forEach(handler => {
      const value = handler(detail);
      if(value !== undefined) result = value;
    });
    return result;
  }
}
