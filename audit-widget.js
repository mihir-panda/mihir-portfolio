(function(){
  'use strict';

  var PAGES=[
    {label:'Home', file:'index.html'},
    {label:'Resume', file:'resume.html'},
    {label:'Profile', file:'profile.html'},
    {label:'Playground', file:'playground.html'},
    {label:'QA Notes', file:'notes.html'},
    {label:'Work With Me', file:'work-with-me.html'}
  ];

  function currentFile(){
    var seg=location.pathname.split('/').filter(Boolean).pop()||'index.html';
    if(!/\.html?$/.test(seg)) seg='index.html';
    return seg;
  }

  function runChecks(doc,isLive){
    var d=doc||document;
    var results=[];
    function check(id,label,fn,liveOnly){
      if(liveOnly && !isLive){
        results.push({id:id,label:label,skip:true,detail:'Only measurable on the page you\'re currently viewing'});
        return;
      }
      try{
        var r=fn();
        results.push({id:id,label:label,pass:r.pass,detail:r.detail});
      }catch(e){
        results.push({id:id,label:label,pass:false,detail:'Check failed to run: '+e.message});
      }
    }

    check('title','Page has a title and meta description',function(){
      var title=d.title && d.title.trim().length>0;
      var desc=d.querySelector('meta[name="description"]');
      var descOk=desc && desc.getAttribute('content') && desc.getAttribute('content').trim().length>0;
      return {pass: title && descOk, detail: (title&&descOk) ? 'Title and description present' : 'Missing title or meta description'};
    });

    check('viewport','Mobile viewport meta tag present',function(){
      var vp=d.querySelector('meta[name="viewport"]');
      return {pass: !!vp, detail: vp ? 'Viewport meta present' : 'No viewport meta tag found'};
    });

    check('headings','Heading hierarchy is valid (one H1, no skipped levels)',function(){
      var heads=Array.prototype.slice.call(d.querySelectorAll('h1,h2,h3,h4,h5,h6'));
      var h1Count=heads.filter(function(h){return h.tagName==='H1'}).length;
      var skipped=false, prev=0;
      heads.forEach(function(h){
        var level=parseInt(h.tagName.charAt(1),10);
        if(prev && level-prev>1) skipped=true;
        prev=level;
      });
      var pass=h1Count===1 && !skipped;
      var detail;
      if(h1Count===0) detail='No H1 found on this page';
      else if(h1Count>1) detail=h1Count+' H1 tags found (should be exactly 1)';
      else if(skipped) detail='A heading level is skipped somewhere in the hierarchy';
      else detail='1 H1, '+heads.length+' headings total, properly nested';
      return {pass:pass, detail:detail};
    });

    function inExcludedZone(el){
      return !!el.closest('[data-audit-exclude]');
    }

    check('alt','All images have alt text',function(){
      var imgs=Array.prototype.slice.call(d.querySelectorAll('img')).filter(function(el){return !inExcludedZone(el)});
      var missing=imgs.filter(function(img){return !img.hasAttribute('alt')});
      var detail = imgs.length===0 ? 'No images on this page' :
        (missing.length===0 ? (imgs.length)+'/'+(imgs.length)+' images have alt text' : missing.length+' of '+imgs.length+' images missing alt text');
      return {pass: missing.length===0, detail: detail};
    });

    check('labels','Form fields have associated labels',function(){
      var fields=Array.prototype.slice.call(d.querySelectorAll('input:not([type=hidden]),textarea,select')).filter(function(el){return !inExcludedZone(el)});
      var unlabeled=fields.filter(function(f){
        if(f.getAttribute('aria-label')||f.getAttribute('aria-labelledby')) return false;
        if(f.id){
          try{ if(d.querySelector('label[for="'+CSS.escape(f.id)+'"]')) return false; }catch(e){}
        }
        if(f.closest('label')) return false;
        return true;
      });
      var detail = fields.length===0 ? 'No form fields on this page' :
        (unlabeled.length===0 ? fields.length+'/'+fields.length+' fields labeled' : unlabeled.length+' of '+fields.length+' fields missing a label');
      return {pass: unlabeled.length===0, detail: detail};
    });

    check('links','External links guard against window.opener access',function(){
      var links=Array.prototype.slice.call(d.querySelectorAll('a[target="_blank"]'));
      var unsafe=links.filter(function(a){ return !/noopener|noreferrer/.test(a.getAttribute('rel')||'') });
      var detail = links.length===0 ? 'No external-tab links on this page' :
        (unsafe.length===0 ? links.length+'/'+links.length+' external links safe' : unsafe.length+' of '+links.length+' external links missing rel="noopener" or "noreferrer"');
      return {pass: unsafe.length===0, detail: detail};
    });

    check('errors','No JavaScript errors since page load',function(){
      var errs=window.__auditErrors||[];
      return {pass: errs.length===0, detail: errs.length===0 ? 'No errors captured' : errs.length+' error(s) captured — e.g. "'+errs[0]+'"'};
    },true);

    check('perf','Page loaded quickly',function(){
      var nav=performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
      if(!nav || !nav.loadEventEnd) return {pass:true, detail:'Timing not available yet — try again in a moment'};
      var loadMs=Math.round(nav.loadEventEnd - nav.startTime);
      return {pass: loadMs>0 && loadMs<3000, detail:'Loaded in '+loadMs+'ms (measured just now via the Performance API)'};
    },true);

    return results;
  }

  function injectStyles(){
    var css=
      '#auditBadge{position:fixed;right:18px;bottom:18px;z-index:80;display:flex;align-items:center;gap:7px;padding:10px 14px;border-radius:999px;border:1px solid var(--border-strong,#d0d5dd);background:var(--surface,#fff);color:var(--text,#0f172a);box-shadow:0 10px 28px rgba(0,0,0,.18);font:600 .7rem/1 "DM Mono",monospace;cursor:pointer;transition:transform .15s ease}'+
      '#auditBadge:hover{transform:translateY(-2px)}'+
      '#auditBadge .ab-dot{width:7px;height:7px;border-radius:50%;background:#94a3b8;flex:none}'+
      '#auditBadge.ok .ab-dot{background:#0a8f5b}'+
      '#auditBadge.warn .ab-dot{background:#dc2626}'+
      '#auditPanel{position:fixed;right:18px;bottom:72px;z-index:81;width:min(360px,calc(100vw - 36px));max-height:min(74vh,560px);overflow:auto;border-radius:16px;border:1px solid var(--border-strong,#d0d5dd);background:var(--surface,#fff);color:var(--text,#0f172a);box-shadow:0 24px 56px rgba(0,0,0,.25);display:none;font-family:Inter,system-ui,Arial,sans-serif}'+
      '#auditPanel.open{display:block}'+
      '#auditPanel .ap-head{display:flex;align-items:center;gap:10px;padding:16px 16px 14px;border-bottom:1px solid var(--border,#e2e5ea)}'+
      '#auditPanel .ap-head b{font-size:.84rem;flex:1}'+
      '#auditPanel .ap-score{font:700 1rem "DM Mono",monospace;color:#0a8f5b;flex:none}'+
      '#auditPanel .ap-close{border:0;background:none;color:var(--text-muted,#64748b);cursor:pointer;font-size:1rem;line-height:1;padding:4px;flex:none}'+
      '#auditPanel .ap-pagesel{display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid var(--border,#e2e5ea);background:var(--bg-subtle,#f6f8fa)}'+
      '#auditPanel .ap-pagesel label{font-size:.68rem;font-weight:700;color:var(--text-muted,#64748b);text-transform:uppercase;letter-spacing:.04em;flex:none}'+
      '#auditPanel .ap-pagesel select{flex:1;padding:6px 8px;border:1px solid var(--border-strong,#d0d5dd);border-radius:7px;background:var(--surface,#fff);color:var(--text,#0f172a);font:inherit;font-size:.76rem}'+
      '#auditPanel .ap-urlrow{display:none;gap:7px;padding:12px 16px;border-bottom:1px solid var(--border,#e2e5ea);background:var(--bg-subtle,#f6f8fa)}'+
      '#auditPanel .ap-urlrow.show{display:flex}'+
      '#auditPanel .ap-urlrow input{flex:1;min-width:0;padding:7px 9px;border:1px solid var(--border-strong,#d0d5dd);border-radius:7px;background:var(--surface,#fff);color:var(--text,#0f172a);font:inherit;font-size:.76rem}'+
      '#auditPanel .ap-urlrow button{flex:none;padding:7px 12px;border:0;border-radius:7px;background:var(--primary,#2563eb);color:#fff;font-size:.72rem;font-weight:700;cursor:pointer}'+
      '#auditPanel .ap-urlnote{display:none;padding:0 16px 10px;color:var(--text-muted,#64748b);font-size:.64rem;line-height:1.5;background:var(--bg-subtle,#f6f8fa);border-bottom:1px solid var(--border,#e2e5ea)}'+
      '#auditPanel .ap-urlnote.show{display:block}'+
      '#auditPanel .ap-lead{margin:10px 8px 4px;padding:14px;border-radius:12px;background:var(--primary-soft,#eaf1ff);border:1px solid var(--primary,#2563eb);font-size:.76rem;line-height:1.6;color:var(--text,#0f172a)}'+
      '#auditPanel .ap-lead b{display:block;margin-bottom:5px;font-size:.8rem}'+
      '#auditPanel .ap-lead a{color:var(--primary,#2563eb);font-weight:700}'+
      '#auditPanel .ap-list{padding:8px;min-height:60px}'+
      '#auditPanel .ap-loading{display:flex;align-items:center;gap:8px;padding:20px 12px;color:var(--text-muted,#64748b);font-size:.78rem}'+
      '#auditPanel .ap-spin{width:13px;height:13px;border-radius:50%;border:2px solid var(--border-strong,#d0d5dd);border-top-color:var(--primary,#2563eb);animation:apspin .7s linear infinite;flex:none}'+
      '@keyframes apspin{to{transform:rotate(360deg)}}'+
      '#auditPanel .ap-item{display:flex;gap:9px;padding:9px 8px;border-radius:10px}'+
      '#auditPanel .ap-icon{flex:none;width:17px;height:17px;border-radius:50%;display:grid;place-items:center;font-size:.6rem;font-weight:700;margin-top:1px}'+
      '#auditPanel .ap-item.pass .ap-icon{background:#e7f8f0;color:#0a8f5b}'+
      '#auditPanel .ap-item.fail .ap-icon{background:#fdeaea;color:#dc2626}'+
      '#auditPanel .ap-item.skip .ap-icon{background:var(--bg-subtle,#f1f4f8);color:var(--text-muted,#64748b)}'+
      '#auditPanel .ap-item.skip .ap-text b,#auditPanel .ap-item.skip .ap-text span{color:var(--text-muted,#64748b)}'+
      '#auditPanel .ap-text b{display:block;font-size:.76rem;font-weight:600}'+
      '#auditPanel .ap-text span{display:block;margin-top:2px;color:var(--text-muted,#64748b);font-size:.7rem;line-height:1.5}'+
      '#auditPanel .ap-error{margin:10px;padding:12px;border-radius:10px;background:#fdeaea;color:#dc2626;font-size:.74rem;line-height:1.6}'+
      '#auditPanel .ap-foot{padding:11px 16px 14px;border-top:1px solid var(--border,#e2e5ea);color:var(--text-muted,#64748b);font-size:.66rem;line-height:1.6}'+
      '#auditPanel .ap-foot a,#auditPanel .ap-foot button{color:var(--primary,#2563eb);font-weight:600;background:none;border:0;padding:0;cursor:pointer;font-size:inherit}'+
      '@media(max-width:480px){#auditBadge{right:12px;bottom:12px}#auditPanel{right:12px;left:12px;width:auto;bottom:66px}}';
    var style=document.createElement('style');
    style.textContent=css;
    document.head.appendChild(style);
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]}); }

  function init(){
    injectStyles();

    var onPlayground=/playground\.html$/.test(location.pathname);
    var moreDemosHref=onPlayground ? '#agent-section' : 'playground.html';
    var myFile=currentFile();

    var badge=document.createElement('button');
    badge.id='auditBadge';
    badge.type='button';
    badge.setAttribute('aria-label','Run a live self-audit on this page');
    badge.setAttribute('aria-expanded','false');
    badge.innerHTML='<span class="ab-dot"></span><span id="auditBadgeText">Live audit</span>';
    document.body.appendChild(badge);

    var selectOptions=PAGES.map(function(p){
      var sel=p.file===myFile?' selected':'';
      return '<option value="'+p.file+'"'+sel+'>'+p.label+(p.file===myFile?' (this page)':'')+'</option>';
    }).join('')+'<option value="__custom__">🔗 Audit any website…</option>';

    var panel=document.createElement('div');
    panel.id='auditPanel';
    panel.innerHTML=
      '<div class="ap-head"><b>Live self-audit</b><span class="ap-score" id="apScore">—</span><button class="ap-close" id="apClose" type="button" aria-label="Close">&times;</button></div>'+
      '<div class="ap-pagesel"><label for="apPageSelect">Audit</label><select id="apPageSelect">'+selectOptions+'</select></div>'+
      '<div class="ap-urlrow" id="apUrlRow"><input type="text" id="apUrlInput" placeholder="yoursite.com" aria-label="Website URL to audit"><button type="button" id="apUrlGo">Run free audit</button></div>'+
      '<div class="ap-urlnote" id="apUrlNote">Fetched live via a public reader service (r.jina.ai) so this can reach any site, not just this portfolio — nothing is stored.</div>'+
      '<div class="ap-list" id="apList"></div>'+
      '<div class="ap-foot">Real checks, run live against the selected page — not a canned demo. Cross-page audits fetch that page\'s HTML (same-origin) and skip the two checks that only make sense on the page you\'re actually viewing. Scoped to what\'s reliably verifiable client-side, not a full Lighthouse/axe audit. <button type="button" id="apRerun">Re-run</button> &middot; <button type="button" id="apExport">Export report</button> &middot; <a href="'+moreDemosHref+'">More demos</a></div>';
    document.body.appendChild(panel);

    var list=panel.querySelector('#apList');
    var scoreEl=panel.querySelector('#apScore');
    var pageSelect=panel.querySelector('#apPageSelect');
    var urlRow=panel.querySelector('#apUrlRow');
    var urlNote=panel.querySelector('#apUrlNote');
    var urlInput=panel.querySelector('#apUrlInput');
    var urlGoBtn=panel.querySelector('#apUrlGo');
    var cache={};
    var lastResults=null, lastFile=null, lastIsExternal=false;

    function setBadge(score,passCount,total){
      document.getElementById('auditBadgeText').textContent = total ? (score+'% · '+passCount+'/'+total) : 'Live audit';
      badge.classList.toggle('ok',total>0 && score===100);
      badge.classList.toggle('warn',total>0 && score<100);
    }

    function renderList(results,file,isExternal){
      lastResults=results;
      lastFile=file||myFile;
      lastIsExternal=!!isExternal;
      list.innerHTML='';
      var passCount=0, scored=0;
      results.forEach(function(r){
        var item=document.createElement('div');
        if(r.skip){
          item.className='ap-item skip';
          item.innerHTML='<span class="ap-icon">–</span><span class="ap-text"><b>'+escapeHtml(r.label)+'</b><span>'+escapeHtml(r.detail)+'</span></span>';
        }else{
          scored++;
          if(r.pass) passCount++;
          item.className='ap-item '+(r.pass?'pass':'fail');
          item.innerHTML='<span class="ap-icon">'+(r.pass?'✓':'✕')+'</span><span class="ap-text"><b>'+escapeHtml(r.label)+'</b><span>'+escapeHtml(r.detail)+'</span></span>';
        }
        list.appendChild(item);
      });
      var score=scored>0?Math.round((passCount/scored)*100):0;
      scoreEl.textContent=score+'%';
      setBadge(score,passCount,scored);
      if(isExternal){
        var lead=document.createElement('div');
        lead.className='ap-lead';
        var failCount=scored-passCount;
        var headline = failCount>0
          ? 'That\'s '+failCount+' of '+scored+' checks failing on a live site — the kind of thing that quietly costs conversions and trust.'
          : 'Clean pass on these checks — nice. A full audit goes deeper than what\'s safely automatable from a browser.';
        lead.innerHTML='<b>Want this fixed, or a deeper audit?</b>'+escapeHtml(headline)+' <a href="work-with-me.html">See how a quality audit works</a> or <a href="mailto:mhrpanda13@gmail.com?subject=Quality%20audit%20request&amp;body=Hi%20Mihir%2C%20I%27d%20like%20to%20talk%20about%20a%20quality%20audit%20for%3A%20'+encodeURIComponent(lastFile)+'">book a free 15-min call</a>.';
        list.appendChild(lead);
      }
    }

    function showLoading(label){
      lastResults=null;
      list.innerHTML='<div class="ap-loading"><span class="ap-spin"></span>Fetching '+escapeHtml(label)+'…</div>';
      scoreEl.textContent='…';
    }

    function showFetchError(file){
      lastResults=null;
      list.innerHTML='<div class="ap-error">Couldn\'t fetch '+escapeHtml(file)+' from here. This works once the site is served over HTTP(S) (same-origin fetch) — opening pages directly as local files blocks cross-file requests in some browsers. Try again once this is live, or switch back to "this page."</div>';
      scoreEl.textContent='—';
      setBadge(0,0,0);
    }

    function showUrlError(url,reason){
      lastResults=null;
      list.innerHTML='<div class="ap-error">Couldn\'t audit '+escapeHtml(url)+' — '+escapeHtml(reason)+' This uses a free third-party reader service that can occasionally be slow or rate-limited; try again in a moment, or try a different URL.</div>';
      scoreEl.textContent='—';
      setBadge(0,0,0);
    }

    function normalizeUrl(raw){
      var v=(raw||'').trim();
      if(!v) return null;
      if(!/^https?:\/\//i.test(v)) v='https://'+v;
      try{ return new URL(v).href; }catch(e){ return null; }
    }

    function runForUrl(raw){
      var url=normalizeUrl(raw);
      if(!url){ showUrlError(raw||'(empty)','that doesn\'t look like a valid URL.'); return; }
      showLoading(url.replace(/^https?:\/\//,''));
      var controller = ('AbortController' in window) ? new AbortController() : null;
      var timer = controller ? setTimeout(function(){ controller.abort(); },15000) : null;
      fetch('https://r.jina.ai/'+url,{headers:{'X-Respond-With':'html'},signal: controller?controller.signal:undefined})
        .then(function(resp){
          if(timer) clearTimeout(timer);
          if(!resp.ok) throw new Error('reader service returned HTTP '+resp.status+'.');
          return resp.text();
        })
        .then(function(html){
          var doc=new DOMParser().parseFromString(html,'text/html');
          if(!doc || !doc.body || doc.body.children.length===0) throw new Error('got an empty response — that site may block automated readers.');
          renderList(runChecks(doc,false),url,true);
        })
        .catch(function(err){
          var reason = (err && err.name==='AbortError') ? 'the request took too long and timed out.' : (err && err.message) ? err.message : 'the request failed.';
          showUrlError(url,reason);
        });
    }

    function runFor(file){
      if(file===myFile){
        renderList(runChecks(document,true),file,false);
        return;
      }
      var pageMeta=PAGES.filter(function(p){return p.file===file})[0];
      showLoading(pageMeta?pageMeta.label:file);
      if(cache[file]){
        renderList(runChecks(cache[file],false),file,false);
        return;
      }
      fetch(file).then(function(resp){
        if(!resp.ok) throw new Error('HTTP '+resp.status);
        return resp.text();
      }).then(function(html){
        var doc=new DOMParser().parseFromString(html,'text/html');
        cache[file]=doc;
        renderList(runChecks(doc,false),file,false);
      }).catch(function(){
        showFetchError(file);
      });
    }

    function exportReport(){
      if(!lastResults){ return; }
      var pageMeta=PAGES.filter(function(p){return p.file===lastFile})[0];
      var label=lastIsExternal?lastFile:(pageMeta?pageMeta.label:lastFile);
      var scored=lastResults.filter(function(r){return !r.skip});
      var passCount=scored.filter(function(r){return r.pass}).length;
      var score=scored.length>0?Math.round((passCount/scored.length)*100):0;
      var lines=[];
      lines.push('# Live self-audit report');
      lines.push('');
      lines.push(lastIsExternal ? ('External site: '+label) : ('Page: '+label+' ('+lastFile+')'));
      lines.push('Generated: '+new Date().toString());
      lines.push('Score: '+score+'% ('+passCount+'/'+scored.length+' checks passed)');
      lines.push('');
      lines.push('## Results');
      lines.push('');
      lastResults.forEach(function(r){
        var mark=r.skip?'–':(r.pass?'PASS':'FAIL');
        lines.push('- ['+mark+'] '+r.label);
        lines.push('  '+r.detail);
      });
      lines.push('');
      lines.push('---');
      lines.push('Generated client-side by the live self-audit widget at '+location.href+'. Real checks against live DOM/page content — not a canned demo, and not a full Lighthouse/axe audit.');
      var blob=new Blob([lines.join('\n')],{type:'text/markdown'});
      var url=URL.createObjectURL(blob);
      var a=document.createElement('a');
      a.href=url;
      var safeName=lastIsExternal ? lastFile.replace(/^https?:\/\//,'').replace(/[^a-z0-9.-]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,60) : lastFile.replace(/\.html?$/,'');
      a.download='audit-report-'+safeName+'.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function(){ URL.revokeObjectURL(url); },1000);
    }

    function syncUrlMode(){
      var isCustom=pageSelect.value==='__custom__';
      urlRow.classList.toggle('show',isCustom);
      urlNote.classList.toggle('show',isCustom);
      if(isCustom){
        list.innerHTML='<div class="ap-loading">Enter a URL above and run a free audit.</div>';
        scoreEl.textContent='—';
        urlInput.focus();
      }
    }

    function openPanel(){
      panel.classList.add('open');
      badge.setAttribute('aria-expanded','true');
      if(pageSelect.value==='__custom__'){ syncUrlMode(); }
      else{ runFor(pageSelect.value); }
    }
    function closePanel(){
      panel.classList.remove('open');
      badge.setAttribute('aria-expanded','false');
    }

    badge.addEventListener('click',function(){
      if(panel.classList.contains('open')) closePanel(); else openPanel();
    });
    panel.querySelector('#apClose').addEventListener('click',closePanel);
    panel.querySelector('#apRerun').addEventListener('click',function(){
      if(pageSelect.value==='__custom__'){
        if(urlInput.value.trim()) runForUrl(urlInput.value);
        return;
      }
      delete cache[pageSelect.value];
      runFor(pageSelect.value);
    });
    panel.querySelector('#apExport').addEventListener('click',exportReport);
    pageSelect.addEventListener('change',function(){
      syncUrlMode();
      if(pageSelect.value!=='__custom__') runFor(pageSelect.value);
    });
    urlGoBtn.addEventListener('click',function(){ runForUrl(urlInput.value); });
    urlInput.addEventListener('keydown',function(e){ if(e.key==='Enter') runForUrl(urlInput.value); });
    document.addEventListener('click',function(e){
      if(panel.classList.contains('open') && !panel.contains(e.target) && !badge.contains(e.target)) closePanel();
    });
    document.addEventListener('keydown',function(e){
      if(e.key==='Escape' && panel.classList.contains('open')){ closePanel(); badge.focus(); }
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  }else{
    init();
  }
})();
