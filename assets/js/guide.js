/* Field Guide Core — modular includes + drawer + stamp */
(function(){
  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));

  async function fetchText(url){
    const r = await fetch(url,{cache:'no-store'});
    if(!r.ok) throw new Error(`Fetch failed ${r.status}: ${url}`);
    return await r.text();
  }

  async function includePartials(){
    const nodes = $$('[data-include]');
    for(const el of nodes){
      const url = el.getAttribute('data-include');
      try{
        const html = await fetchText(url);
        el.outerHTML = html;
      }catch(err){
        el.innerHTML = `<div class="small">Missing include: ${url}</div>`;
        console.warn(err);
      }
    }
  }

  function initDrawer(){
    const drawer = $('#drawer');
    const btnDrawer = $('#btnDrawer');
    const btnClose = $('#btnClose');
    function toggle(force){
      if(!drawer) return;
      const open = (typeof force==='boolean') ? force : !drawer.classList.contains('open');
      drawer.classList.toggle('open', open);
    }
    if(btnDrawer) btnDrawer.addEventListener('click', ()=>toggle());
    if(btnClose) btnClose.addEventListener('click', ()=>toggle(false));
    window.addEventListener('keydown', e=>{ if(e.key.toLowerCase()==='d') toggle(); });
    window.__fieldGuide = { toggleDrawer: toggle };
  }

  function stampBg(){
    const meta = $('[data-ch-title]');
    if(!meta) return;
    const title = meta.getAttribute('data-ch-title')||'';
    const sub = meta.getAttribute('data-ch-sub')||'';
    const t = $('#bgTitle'), s = $('#bgSub');
    if(t && title) t.textContent = title;
    if(s && sub) s.textContent = sub;
  }

  window.addEventListener('DOMContentLoaded', async ()=>{
    await includePartials();
    initDrawer();
    stampBg();
  });
})();
