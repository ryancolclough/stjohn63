(() => {
  const data = window.ORE_DATA;
  const app = document.querySelector('#ore-reader');
  const dock = document.querySelector('#global-dock');
  const toast = document.querySelector('#toast');
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  const articleId = a => `article-${a.roman.toLowerCase()}`;
  const icons = {
    contents:'<svg viewBox="0 0 24 24"><path d="M4 5.5c3-1.2 5.7-.8 8 .8v13c-2.3-1.6-5-2-8-.8zM20 5.5c-3-1.2-5.7-.8-8 .8v13c2.3-1.6 5-2 8-.8z"/></svg>',
    search:'<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>',
    amendments:'<svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6z"/><path d="M9 10h6M9 14h6M9 18h4"/></svg>',
    pdf:'<svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6z"/><path d="M9 15h6M12 9v8m-3-3 3 3 3-3"/></svg>'
  };
  function showToast(text){toast.textContent=text;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1800)}
  function dockMarkup(){return [
    ['contents','Contents'],['search','Search'],['amendments','Amendments'],['pdf','PDF']
  ].map(([id,label])=>`<button class="dock-btn" data-action="${id}">${icons[id]}<span>${label}</span></button>`).join('')}
  dock.innerHTML = dockMarkup();
  const cover = `
    <section id="cover" class="screen cover">
      <div class="cover-inner">
        <div class="morning-star" aria-hidden="true"><span></span></div>
        <div class="cover-org">${data.meta.corporation}</div>
        <h1>CORPORATE<br><span>BY-LAWS</span></h1>
        <div class="cover-sub">${data.meta.editionName}</div>
        <div class="cover-meta">${data.meta.editionShort} · Version ${data.meta.version}<br>Adopted ${data.meta.adoptedDate}</div><br>
        <a class="begin" href="#certification">Begin Reading <span>⌄</span></a>
      </div>
    </section>`;
  const certification = `
    <section id="certification" class="screen"><div class="page"><div class="page-inner">
      <div class="page-label">Certification</div><div class="kicker">of Official Edition</div><h2>Certification</h2><div class="gold-rule"></div>
      <div class="body-copy">${data.frontMatter.certification.map(p=>`<p>${p}</p>`).join('')}</div>
      <div class="signature-block">
        <div class="signature-line"><strong>${data.meta.president}</strong><em>Temple Board President</em></div>
        <div class="signature-line"><strong>${data.meta.secretary}</strong><em>Secretary</em></div>
      </div>
    </div></div></section>`;
  const controlRows = [
    ['Document Title',data.meta.documentTitle],['Corporation',data.meta.corporation],['Current Version',data.meta.version],['Original Adoption',data.meta.adoptedDate],['Publication Date',data.meta.publicationDate],['Publication ID',data.meta.publicationId]
  ].map(([a,b])=>`<div class="info-row"><strong>${a}</strong><span>${b}</span></div>`).join('');
  const control = `<section id="document-control" class="screen"><div class="page"><div class="page-inner"><div class="page-label">Document Control</div><h2>Document<br>Control</h2><div class="gold-rule"></div><div class="info-table">${controlRows}</div></div></div></section>`;
  const publisher = `<section id="publisher-note" class="screen"><div class="page"><div class="page-inner"><div class="page-label">Publisher's Note</div><h2>Publisher’s<br>Note</h2><div class="gold-rule"></div><div class="body-copy">${data.frontMatter.publisherNote.map(p=>`<p>${p}</p>`).join('')}<p>Fraternally,<br>${data.meta.corporation}<br>Temple Board</p></div></div></div></section>`;
  const contentsRows = data.articles.map(a=>`<a class="nav-row" href="#${articleId(a)}-contents"><span class="roman">${a.roman}</span><span>${a.title}</span><span class="chev">›</span></a>`).join('');
  const contents = `<section id="contents" class="screen"><div class="page"><div class="page-inner"><div class="page-label">Contents</div><h2>Contents</h2><div class="gold-rule"></div><div class="contents-list">${contentsRows}<a class="nav-row" href="#governance-records"><span class="roman"></span><span>Governance Records</span><span class="chev">›</span></a></div></div></div></section>`;
  const articleMarkup = data.articles.map((a,aIndex)=>{
    const aid=articleId(a);
    const rows=a.sections.map(s=>`<a class="nav-row" href="#${aid}-${slug(s.number)}"><span class="number">${s.number}</span><span>${s.title}</span><span class="chev">›</span></a>`).join('');
    const opener=`<section id="${aid}-contents" class="screen"><div class="page article-opener"><div class="page-inner"><div class="kicker">Article ${a.roman}</div><h2>${a.title}</h2><div class="gold-rule"></div><div class="article-list">${rows}</div></div></div></section>`;
    const sections=a.sections.map((s,i)=>{
      const sid=`${aid}-${slug(s.number)}`;
      const prev=i>0?a.sections[i-1]:null,next=i<a.sections.length-1?a.sections[i+1]:null;
      return `<section id="${sid}" class="screen searchable" data-search="article ${a.roman} ${a.title} ${s.number} ${s.title} ${s.paragraphs.join(' ')}"><div class="page"><div class="page-inner">
        <div class="crumbs"><a href="#contents">Contents</a><span>›</span><a href="#${aid}-contents">Article ${a.roman}</a><span>›</span><span>Section ${s.number}</span></div>
        <div class="kicker">Article ${a.roman}</div><h2>${a.title}</h2><div class="gold-rule"></div>
        <div class="section-title"><span class="num">Section ${s.number}</span><h3>${s.title}</h3><button class="copy-link" data-copy="#${sid}">Copy Link</button></div>
        <div class="section-body">${s.paragraphs.map(p=>`<p>${p}</p>`).join('')}</div>
        <div class="local-pager">${prev?`<a href="#${aid}-${slug(prev.number)}"><span>←</span><span><small>Previous section</small>${prev.number} ${prev.title}</span></a>`:'<span></span>'}<span class="center">Article ${a.roman}</span>${next?`<a href="#${aid}-${slug(next.number)}"><span><small>Next section</small>${next.number} ${next.title}</span><span>→</span></a>`:'<span></span>'}</div>
      </div></div></section>`;
    }).join('');
    return opener+sections;
  }).join('');
  const governance = `<section id="governance-records" class="screen"><div class="page"><div class="page-inner"><div class="page-label">Amendments</div><h2>Governance<br>Records</h2><div class="gold-rule"></div><div class="records-list"><button class="nav-row record-open" data-record="amendments"><span></span><span>Amendment History</span><span class="chev">›</span></button><button class="nav-row record-open" data-record="certifications"><span></span><span>Certification Archive</span><span class="chev">›</span></button><a class="nav-row" href="pdf/official-bylaws-2023.pdf" target="_blank"><span></span><span>Original Signed By-Laws (PDF)</span><span class="chev">›</span></a><a class="nav-row" href="#document-control"><span></span><span>Document Control</span><span class="chev">›</span></a></div></div></div></section>`;
  const sheet = `<div id="sheet" class="sheet" aria-hidden="true"><div class="sheet-panel"><div class="sheet-head"><h2 id="sheet-title"></h2><button class="close-sheet" aria-label="Close">×</button></div><div id="sheet-body"></div></div></div>`;
  app.innerHTML = cover + certification + control + publisher + contents + articleMarkup + governance + sheet;
  function syncDock(){dock.hidden=location.hash===''||location.hash==='#cover';document.querySelectorAll('.dock-btn').forEach(b=>b.classList.remove('active'));if(location.hash==='#contents')document.querySelector('[data-action="contents"]')?.classList.add('active');if(location.hash==='#governance-records')document.querySelector('[data-action="amendments"]')?.classList.add('active')}
  window.addEventListener('hashchange',syncDock);syncDock();
  function openSheet(title,html){document.querySelector('#sheet-title').textContent=title;document.querySelector('#sheet-body').innerHTML=html;document.querySelector('#sheet').classList.add('open');document.querySelector('#sheet').setAttribute('aria-hidden','false')}
  function closeSheet(){document.querySelector('#sheet').classList.remove('open');document.querySelector('#sheet').setAttribute('aria-hidden','true')}
  dock.addEventListener('click',e=>{const btn=e.target.closest('[data-action]');if(!btn)return;const action=btn.dataset.action;if(action==='contents')location.hash='#contents';if(action==='amendments')location.hash='#governance-records';if(action==='pdf')window.open('pdf/official-bylaws-2023.pdf','_blank');if(action==='search')openSheet('Search',`<input id="search-box" class="search-input" type="search" placeholder="Search the By-Laws" autofocus><div id="search-results"></div>`)});
  document.addEventListener('input',e=>{if(e.target.id!=='search-box')return;const q=e.target.value.trim().toLowerCase();const results=document.querySelector('#search-results');if(q.length<2){results.innerHTML='';return}const items=[...document.querySelectorAll('.searchable')].filter(el=>el.dataset.search.toLowerCase().includes(q)).slice(0,30);results.innerHTML=items.map(el=>{const parts=el.id.split('-');const sec=el.querySelector('.section-title');return `<a class="result" href="#${el.id}"><b>${sec?.querySelector('.num')?.textContent||''} — ${sec?.querySelector('h3')?.textContent||''}</b>${el.querySelector('.section-body p')?.textContent.slice(0,150)||''}…</a>`}).join('')||'<p>No results found.</p>'});
  document.addEventListener('click',e=>{if(e.target.closest('.close-sheet')||e.target.id==='sheet')closeSheet();const link=e.target.closest('.result');if(link)closeSheet();const copy=e.target.closest('[data-copy]');if(copy){const url=location.origin+location.pathname+copy.dataset.copy;navigator.clipboard?.writeText(url).then(()=>showToast('Direct link copied'));}const record=e.target.closest('[data-record]');if(record){if(record.dataset.record==='amendments')openSheet('Amendment History',data.amendments.map(x=>`<div class="record"><b>Version ${x.version}</b><br>${x.date}<br>${x.summary}</div>`).join(''));if(record.dataset.record==='certifications')openSheet('Certification Archive',data.certifications.map(x=>`<div class="record"><b>Version ${x.version}</b><br>${x.date}<br>President: ${x.president}<br>Secretary: ${x.secretary}<br>${x.status}</div>`).join(''));}});
})();
