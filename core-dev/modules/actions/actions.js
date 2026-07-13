import { escapeHTML } from "../../sdk/ui.js";

export default function register(ctx){
  const { router, state, renderShell, toast, events, dialogs } = ctx;
  let currentFilter = "active";

  router.register("actions", () => renderActions(currentFilter));

  events.on("actions:create-from-review", detail => {
    const items = state.actionItems();
    const action = {
      id:state.nextActionId(),
      title:detail.title || `Follow up Section ${detail.section}`,
      description:detail.description || "",
      sourceType:"By-Law Review",
      sourceReference:`Section ${detail.section}`,
      articleIndex:detail.articleIndex,
      sectionIndex:detail.sectionIndex,
      assignedCommittee:detail.assignedCommittee || "By-Laws Committee",
      assignedOfficer:"",
      priority:"medium",
      status:"open",
      dueDate:"",
      createdDate:new Date().toISOString().slice(0,10),
      completedDate:"",
      history:[{
        date:new Date().toISOString(),
        event:"Action created",
        note:`Created from Section ${detail.section}`
      }]
    };
    items.unshift(action);
    state.saveActionItems(items);
    toast(`${action.id} created.`);
    return action;
  });

  document.addEventListener("click", e => {
    const filter = e.target.closest("[data-action-filter]");
    if(filter){
      currentFilter = filter.dataset.actionFilter;
      renderActions(currentFilter);
      return;
    }

    if(e.target.closest("[data-new-action]")){
      openEditor();
      return;
    }

    const edit = e.target.closest("[data-edit-action]");
    if(edit){
      openEditor(edit.dataset.editAction);
      return;
    }

    const complete = e.target.closest("[data-complete-action]");
    if(complete){
      setStatus(complete.dataset.completeAction, "completed");
      return;
    }

    const reopen = e.target.closest("[data-reopen-action]");
    if(reopen){
      setStatus(reopen.dataset.reopenAction, "open");
      return;
    }

    const source = e.target.closest("[data-open-action-source]");
    if(source){
      const item = state.actionItems().find(x => x.id === source.dataset.openActionSource);
      if(item && item.articleIndex !== undefined){
        events.emit("review:open-direct", {
          articleIndex:item.articleIndex,
          sectionIndex:item.sectionIndex
        });
      }
      return;
    }

    if(e.target.closest("[data-modal-save-action]")){
      saveEditor();
      return;
    }

    if(e.target.closest("[data-modal-cancel-action]")){
      dialogs.close();
      return;
    }

    const remove = e.target.closest("[data-modal-delete-action]");
    if(remove){
      deleteAction(remove.dataset.modalDeleteAction);
    }
  });

  function renderActions(filter="active"){
    const items = state.actionItems();
    const summary = state.actionSummary();
    const today = new Date().toISOString().slice(0,10);

    const visible = items.filter(item => {
      if(filter === "all") return true;
      if(filter === "completed") return item.status === "completed";
      if(filter === "overdue"){
        return !["completed","archived"].includes(item.status) &&
          item.dueDate &&
          item.dueDate < today;
      }
      return !["completed","archived"].includes(item.status);
    });

    const rows = visible.length
      ? visible.map(actionRow).join("")
      : `<div class="actions-empty">No action items match this view.</div>`;

    const content = `
      <div class="backline"><button data-route="dashboard">‹ Dashboard</button></div>
      <section class="hero">
        <div class="eyebrow">Temple Board Work · Action Centre Module</div>
        <h1>Action Centre</h1>
        <p>Assign, track, complete, and preserve follow-up work created by reviews, amendments, meetings, and operations.</p>
        <div class="rule"></div>
      </section>

      <section class="action-summary">
        ${stat("Open",summary.open)}
        ${stat("Overdue",summary.overdue)}
        ${stat("Due This Month",summary.dueThisMonth)}
        ${stat("Completed",summary.completed)}
      </section>

      <section class="panel">
        <div class="panel-head action-head">
          <div><h2>Action Items</h2><p>${visible.length} shown · ${summary.total} total</p></div>
          <div class="action-controls">
            <button class="filter-btn ${filter==="active"?"active":""}" data-action-filter="active">Active</button>
            <button class="filter-btn ${filter==="overdue"?"active":""}" data-action-filter="overdue">Overdue</button>
            <button class="filter-btn ${filter==="completed"?"active":""}" data-action-filter="completed">Completed</button>
            <button class="filter-btn ${filter==="all"?"active":""}" data-action-filter="all">All</button>
            <button class="btn" data-new-action>New Action</button>
          </div>
        </div>
        <div class="panel-body">${rows}</div>
      </section>`;

    renderShell(content,"actions");
  }

  function actionRow(item){
    const overdue = item.dueDate &&
      !["completed","archived"].includes(item.status) &&
      item.dueDate < new Date().toISOString().slice(0,10);

    return `
      <article class="action-row ${overdue ? "overdue" : ""}">
        <div class="action-priority ${item.priority}"></div>
        <div class="action-main">
          <span>${escapeHTML(item.id)}</span>
          <strong>${escapeHTML(item.title)}</strong>
          <small>${escapeHTML(item.assignedCommittee || "Unassigned")} · ${escapeHTML(statusLabel(item.status))}${item.dueDate ? ` · Due ${escapeHTML(item.dueDate)}` : ""}</small>
        </div>
        <div class="action-links">
          ${item.articleIndex !== undefined ? `<button data-open-action-source="${item.id}">Source</button>` : ""}
          <button data-edit-action="${item.id}">Edit</button>
          ${item.status === "completed"
            ? `<button data-reopen-action="${item.id}">Reopen</button>`
            : `<button data-complete-action="${item.id}">Complete</button>`}
        </div>
      </article>`;
  }

  function openEditor(id=""){
    const existing = state.actionItems().find(x => x.id === id) || {};
    dialogs.open(existing.id ? "Edit Action" : "Create Action", `
      <div class="action-modal" data-action-modal>
        <input type="hidden" id="modal-action-id" value="${escapeHTML(existing.id || "")}">
        <div class="field"><label>Title</label><input id="modal-action-title" value="${escapeHTML(existing.title || "")}" placeholder="What needs to be done?"></div>
        <div class="field"><label>Description</label><textarea id="modal-action-description" placeholder="Expected result and context.">${escapeHTML(existing.description || "")}</textarea></div>
        <div class="action-form-grid">
          <div class="field"><label>Assigned Committee</label><select id="modal-action-committee">${committeeOptions(existing.assignedCommittee)}</select></div>
          <div class="field"><label>Assigned Officer</label><input id="modal-action-officer" value="${escapeHTML(existing.assignedOfficer || "")}" placeholder="Optional"></div>
          <div class="field"><label>Priority</label><select id="modal-action-priority">${priorityOptions(existing.priority)}</select></div>
          <div class="field"><label>Status</label><select id="modal-action-status">${statusOptions(existing.status)}</select></div>
          <div class="field"><label>Due Date</label><input id="modal-action-due" type="date" value="${escapeHTML(existing.dueDate || "")}"></div>
          <div class="field"><label>Source Reference</label><input id="modal-action-source" value="${escapeHTML(existing.sourceReference || "")}" placeholder="Section, motion, meeting, etc."></div>
        </div>
        <div class="actions">
          <button class="btn" data-modal-save-action>Save Action</button>
          <button class="btn secondary" data-modal-cancel-action>Cancel</button>
          ${existing.id ? `<button class="btn danger" data-modal-delete-action="${existing.id}">Delete</button>` : ""}
        </div>
      </div>
    `);
  }

  function saveEditor(){
    const title = document.querySelector("#modal-action-title")?.value.trim();
    if(!title){
      toast("Action title is required.");
      return;
    }

    const id = document.querySelector("#modal-action-id")?.value || state.nextActionId();
    const items = state.actionItems();
    const index = items.findIndex(x => x.id === id);
    const existing = index >= 0 ? items[index] : null;
    const status = document.querySelector("#modal-action-status")?.value || "open";

    const action = {
      id,
      title,
      description:document.querySelector("#modal-action-description")?.value.trim() || "",
      assignedCommittee:document.querySelector("#modal-action-committee")?.value || "",
      assignedOfficer:document.querySelector("#modal-action-officer")?.value.trim() || "",
      priority:document.querySelector("#modal-action-priority")?.value || "medium",
      status,
      dueDate:document.querySelector("#modal-action-due")?.value || "",
      sourceType:existing?.sourceType || "Manual",
      sourceReference:document.querySelector("#modal-action-source")?.value.trim() || "",
      articleIndex:existing?.articleIndex,
      sectionIndex:existing?.sectionIndex,
      createdDate:existing?.createdDate || new Date().toISOString().slice(0,10),
      completedDate:status === "completed" ? (existing?.completedDate || new Date().toISOString().slice(0,10)) : "",
      history:[
        ...(existing?.history || []),
        {
          date:new Date().toISOString(),
          event:existing ? "Action updated" : "Action created",
          note:`Status: ${statusLabel(status)}`
        }
      ]
    };

    if(index >= 0) items[index] = action;
    else items.unshift(action);

    state.saveActionItems(items);
    dialogs.close();
    toast(`${id} saved.`);
    renderActions(currentFilter);
  }

  function setStatus(id,status){
    const items = state.actionItems();
    const item = items.find(x => x.id === id);
    if(!item) return;
    item.status = status;
    item.completedDate = status === "completed" ? new Date().toISOString().slice(0,10) : "";
    item.history = [
      ...(item.history || []),
      {date:new Date().toISOString(),event:`Status changed to ${statusLabel(status)}`,note:""}
    ];
    state.saveActionItems(items);
    toast(`${id} ${status === "completed" ? "completed" : "reopened"}.`);
    renderActions(currentFilter);
  }

  function deleteAction(id){
    if(!confirm(`Delete ${id}?`)) return;
    state.saveActionItems(state.actionItems().filter(x => x.id !== id));
    dialogs.close();
    toast(`${id} deleted.`);
    renderActions(currentFilter);
  }

  function committeeOptions(current=""){
    return [
      "By-Laws Committee",
      "Building Committee",
      "Finance Committee",
      "Property Committee",
      "Executive Committee",
      "Temple Board",
      "Unassigned"
    ].map(value => option(value,value,current || "By-Laws Committee")).join("");
  }

  function priorityOptions(current="medium"){
    return [
      ["low","Low"],
      ["medium","Medium"],
      ["high","High"],
      ["urgent","Urgent"]
    ].map(([value,label]) => option(value,label,current || "medium")).join("");
  }

  function statusOptions(current="open"){
    return [
      ["open","Open"],
      ["assigned","Assigned"],
      ["in_progress","In Progress"],
      ["waiting_review","Waiting Review"],
      ["completed","Completed"],
      ["archived","Archived"]
    ].map(([value,label]) => option(value,label,current || "open")).join("");
  }

  function option(value,label,current){
    return `<option value="${escapeHTML(value)}" ${current===value ? "selected" : ""}>${escapeHTML(label)}</option>`;
  }

  function stat(label,value){
    return `<article><span>${label}</span><strong>${value}</strong></article>`;
  }

  function statusLabel(status){
    return ({
      open:"Open",
      assigned:"Assigned",
      in_progress:"In Progress",
      waiting_review:"Waiting Review",
      completed:"Completed",
      archived:"Archived"
    })[status] || status;
  }
}
