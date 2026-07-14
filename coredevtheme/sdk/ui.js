export function escapeHTML(value=""){
  return String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}
export function statusMarkup(review){
  if(!review) return `<span class="status"><span class="status-dot"></span>Not reviewed</span>`;
  const cls = review.status === "complete" ? "complete" : review.status === "amendment" ? "attention" : "review";
  const label = review.status === "complete" ? "Review complete" : review.status === "amendment" ? "Amendment recommended" : "Discussion required";
  return `<span class="status ${cls}"><span class="status-dot"></span>${label}</span>`;
}
export function summaryCard(label,value,sub,progress=null){
  return `<article class="summary-card"><span>${label}</span><strong>${value}</strong><small>${sub}</small>${progress!==null?`<div class="progress-track"><i style="width:${progress}%"></i></div>`:""}</article>`;
}
