export class Router {
  constructor(){ this.routes = new Map(); this.current = null; }
  register(id, handler){ this.routes.set(id, handler); }
  go(id, params={}){
    const handler = this.routes.get(id);
    if(!handler) throw new Error(`Route not registered: ${id}`);
    this.current = { id, params };
    handler(params);
  }
}
