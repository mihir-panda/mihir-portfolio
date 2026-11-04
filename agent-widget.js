(function(){
  'use strict';

  /* knowledge base lives in agent-kb.js (loaded before this file) so the
     floating widget and the Playground's embedded agent never drift apart */
  const matchIntent = window.matchAgentIntent;

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }

  function injectStyles(){
    const css=
      '#agentBadge{position:fixed;left:18px;bottom:18px;z-index:80;display:flex;align-items:center;justify-content:center;width:54px;height:54px;padding:0;border-radius:50%;border:1px solid var(--border-strong,#d0d5dd);background:var(--btn-bg,#0f172a);color:var(--btn-text,#fff);box-shadow:0 10px 28px rgba(0,0,0,.25);cursor:pointer;transition:transform .15s ease,box-shadow .15s ease}'+
      '#agentBadge:hover{transform:translateY(-2px) scale(1.05);box-shadow:0 14px 32px rgba(0,0,0,.3)}'+
      '#agentBadge svg{width:22px;height:22px;flex:none}'+
      '#agentBadge .af-icon-close{display:none}'+
      '#agentBadge.is-open .af-icon-chat{display:none}'+
      '#agentBadge.is-open .af-icon-close{display:block}'+
      '#agentBadge .af-badge-dot{position:absolute;top:1px;right:1px;width:11px;height:11px;border-radius:50%;background:#22c55e;border:2px solid var(--btn-bg,#0f172a);animation:afdotpulse 2.2s ease-in-out infinite}'+
      '#agentBadge.is-open .af-badge-dot{display:none}'+
      '@keyframes afdotpulse{0%{box-shadow:0 0 0 0 rgba(34,197,94,.45)}70%{box-shadow:0 0 0 7px rgba(34,197,94,0)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}}'+
      '#agentFloatPanel{position:fixed;left:18px;bottom:76px;z-index:81;width:min(360px,calc(100vw - 36px));max-height:min(78vh,560px);display:none;flex-direction:column;border:1px solid var(--border-strong,#d0d5dd);border-radius:18px;overflow:hidden;background:#0b0f18;box-shadow:0 24px 56px rgba(0,0,0,.3)}'+
      '#agentFloatPanel.open{display:flex}'+
      '#agentFloatPanel .af-head{display:flex;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid rgba(255,255,255,.08)}'+
      '#agentFloatPanel .af-dots{display:flex;gap:5px}'+
      '#agentFloatPanel .af-dots i{width:7px;height:7px;border-radius:50%;background:#3a4454}'+
      '#agentFloatPanel .af-dots i:first-child{background:#ff8f6b}'+
      '#agentFloatPanel .af-dots i:nth-child(2){background:#f6cf5e}'+
      '#agentFloatPanel .af-title{flex:1;color:#dce9ff;font:600 .68rem "DM Mono",monospace;letter-spacing:.03em}'+
      '#agentFloatPanel .af-close{border:0;background:none;color:#8ea0bd;cursor:pointer;font-size:1rem;line-height:1;padding:4px}'+
      '#agentFloatPanel .af-chat{display:flex;flex-direction:column;gap:14px;padding:18px;overflow-y:auto;flex:1;min-height:180px}'+
      '#agentFloatPanel .af-placeholder{margin:auto;color:#55617a;font-size:.78rem;text-align:center;max-width:240px}'+
      '#agentFloatPanel .msg{max-width:84%;display:flex;flex-direction:column;gap:6px}'+
      '#agentFloatPanel .msg.user{align-self:flex-end;align-items:flex-end}'+
      '#agentFloatPanel .msg.agent{align-self:flex-start;align-items:flex-start}'+
      '#agentFloatPanel .msg-bubble{padding:9px 13px;border-radius:12px;font-size:.8rem;line-height:1.55}'+
      '#agentFloatPanel .msg.user .msg-bubble{background:#2b5fd6;color:#fff;border-bottom-right-radius:4px}'+
      '#agentFloatPanel .msg.agent .msg-bubble{background:#161c29;color:#dce9ff;border:1px solid rgba(255,255,255,.07);border-bottom-left-radius:4px}'+
      '#agentFloatPanel .msg-trace{display:flex;flex-direction:column;gap:3px;padding:8px 11px;border-radius:9px;background:rgba(91,157,255,.06);border:1px solid rgba(91,157,255,.14);font:500 .62rem/1.6 "DM Mono",monospace;color:#7fa6e0}'+
      '#agentFloatPanel .typing-dots{display:inline-flex;gap:4px;padding:10px 13px;border-radius:12px;background:#161c29;border:1px solid rgba(255,255,255,.07)}'+
      '#agentFloatPanel .typing-dots i{width:5px;height:5px;border-radius:50%;background:#5b9dff;animation:afbounce 1s ease-in-out infinite}'+
      '#agentFloatPanel .typing-dots i:nth-child(2){animation-delay:.15s}'+
      '#agentFloatPanel .typing-dots i:nth-child(3){animation-delay:.3s}'+
      '@keyframes afbounce{0%,80%,100%{opacity:.35;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}'+
      '#agentFloatPanel .af-suggestions{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 12px}'+
      '#agentFloatPanel .af-chip{padding:6px 11px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(255,255,255,.04);color:#aebcd4;font-size:.68rem;font-weight:600;cursor:pointer}'+
      '#agentFloatPanel .af-chip:hover{background:rgba(255,255,255,.08);color:#fff}'+
      '#agentFloatPanel .af-form{display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.08)}'+
      '#agentFloatPanel .af-form input{flex:1;padding:9px 11px;border:1px solid rgba(255,255,255,.14);border-radius:9px;background:#131722;color:#fff;font:inherit;font-size:.78rem}'+
      '#agentFloatPanel .af-form input::placeholder{color:#55617a}'+
      '#agentFloatPanel .af-form button{flex:none;padding:0 14px;border:0;border-radius:9px;background:#e6edf3;color:#0a0c10;font-weight:700;font-size:.76rem;cursor:pointer}'+
      '#agentFloatPanel .af-note{padding:9px 14px;border-top:1px solid rgba(255,255,255,.06);color:#6b7a91;font-size:.64rem;line-height:1.5}'+
      '#agentFloatPanel .af-note a{color:#7fa6e0;font-weight:600}'+
      '@media(max-width:480px){#agentBadge{left:12px;bottom:12px}#agentFloatPanel{left:12px;right:12px;width:auto;bottom:66px}}';
    const style=document.createElement('style');
    style.textContent=css;
    document.head.appendChild(style);
  }

  function init(){
    injectStyles();

    const badge=document.createElement('button');
    badge.id='agentBadge';
    badge.type='button';
    badge.title='Ask me anything';
    badge.setAttribute('aria-label','Ask the portfolio agent a question');
    badge.setAttribute('aria-expanded','false');
    badge.innerHTML='<svg class="af-icon-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><svg class="af-icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg><span class="af-badge-dot"></span>';
    document.body.appendChild(badge);

    const panel=document.createElement('div');
    panel.id='agentFloatPanel';
    panel.innerHTML=
      '<div class="af-head"><span class="af-dots"><i></i><i></i><i></i></span><span class="af-title">PORTFOLIO-AGENT</span><button type="button" class="af-close" aria-label="Close">&times;</button></div>'+
      '<div class="af-chat" id="afChat"><p class="af-placeholder">Ask about my experience, skills, or a project — or try a suggestion below.</p></div>'+
      '<div class="af-suggestions" id="afSuggestions">'+
        '<button type="button" class="af-chip" data-q="How many years of experience do you have?">Years of experience?</button>'+
        '<button type="button" class="af-chip" data-q="What tools do you use for automation?">Automation toolkit?</button>'+
        '<button type="button" class="af-chip" data-q="Are you available for freelance work?">Open to freelance?</button>'+
      '</div>'+
      '<form class="af-form" id="afForm">'+
        '<input type="text" id="afInput" aria-label="Ask the agent a question" placeholder="Ask a question…" autocomplete="off">'+
        '<button type="submit">Ask</button>'+
      '</form>'+
      '<div class="af-note">Scripted agent, not a live model — every fact is real. <a href="playground.html#agent-section">See it full-size on the Playground</a>.</div>';
    document.body.appendChild(panel);

    const chat=panel.querySelector('#afChat');
    const form=panel.querySelector('#afForm');
    const input=panel.querySelector('#afInput');
    const suggestions=panel.querySelector('#afSuggestions');
    let busy=false;

    function scrollDown(){ chat.scrollTop=chat.scrollHeight; }
    function clearPlaceholder(){ const p=chat.querySelector('.af-placeholder'); if(p) p.remove(); }

    function appendUser(text){
      clearPlaceholder();
      const div=document.createElement('div');
      div.className='msg user';
      const bubble=document.createElement('div');
      bubble.className='msg-bubble';
      bubble.textContent=text;
      div.appendChild(bubble);
      chat.appendChild(div);
      scrollDown();
    }
    function appendTyping(){
      const div=document.createElement('div');
      div.className='msg agent';
      div.innerHTML='<div class="typing-dots"><i></i><i></i><i></i></div>';
      chat.appendChild(div);
      scrollDown();
      return div;
    }
    async function appendAgent(intent){
      const typing=appendTyping();
      await wait(500);
      typing.remove();

      const wrap=document.createElement('div');
      wrap.className='msg agent';
      chat.appendChild(wrap);

      const traceEl=document.createElement('div');
      traceEl.className='msg-trace';
      wrap.appendChild(traceEl);
      for(const line of intent.trace){
        const l=document.createElement('span');
        l.textContent=line;
        traceEl.appendChild(l);
        scrollDown();
        await wait(220);
      }
      await wait(200);
      const bubble=document.createElement('div');
      bubble.className='msg-bubble';
      bubble.textContent=intent.answer;
      wrap.appendChild(bubble);
      scrollDown();
    }
    async function ask(question){
      if(busy||!question.trim()) return;
      busy=true;
      input.disabled=true;
      appendUser(question.trim());
      const intent=matchIntent(question);
      await appendAgent(intent);
      input.disabled=false;
      busy=false;
      input.focus();
    }

    form.addEventListener('submit',e=>{
      e.preventDefault();
      const q=input.value;
      input.value='';
      ask(q);
    });
    suggestions.querySelectorAll('.af-chip').forEach(btn=>{
      btn.addEventListener('click',()=>ask(btn.dataset.q));
    });

    function open(){ panel.classList.add('open'); badge.classList.add('is-open'); badge.setAttribute('aria-expanded','true'); input.focus(); }
    function close(){ panel.classList.remove('open'); badge.classList.remove('is-open'); badge.setAttribute('aria-expanded','false'); }
    badge.addEventListener('click',()=>{ panel.classList.contains('open') ? close() : open(); });
    panel.querySelector('.af-close').addEventListener('click',close);
    document.addEventListener('click',e=>{
      if(panel.classList.contains('open') && !panel.contains(e.target) && !badge.contains(e.target)) close();
    });
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape' && panel.classList.contains('open')){ close(); badge.focus(); }
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  }else{
    init();
  }
})();
