/* Shared knowledge base for the portfolio agent — used by both the
   embedded agent on playground.html and the floating widget
   (agent-widget.js) on the other pages. Keep this as the single
   source of truth so the two never drift out of sync. */
(function(){
  'use strict';

  const KB=[
    {id:'greeting',keywords:['hi','hello','hey','howdy','yo'],
      trace:['parse_intent → "greeting"','tool: none — conversational opener, no resume lookup needed'],
      answer:'Hey! I can answer questions about Mihir\'s QA experience, skills, projects, or availability. Try one of the suggestions below, or ask your own — things like "What\'s your experience?" or "Tell me about the Availity project" work well.'},
    {id:'about-agent',keywords:['who are you','what are you','what can you do','what can i ask','how do you work'],
      trace:['parse_intent → "meta_about_agent"','tool: none — explaining own scope, not a resume lookup'],
      answer:"I'm a scripted agent, not a live language model — I match your question against a small knowledge base built from Mihir's real resume data (experience, skills, projects, certifications, availability) and show the matching steps as I go. Ask about any of those, or his contact details."},
    {id:'thanks',keywords:['thanks','thank you','appreciate it'],
      trace:['parse_intent → "closing_pleasantry"','tool: none'],
      answer:"You're welcome! Feel free to ask anything else, or reach out directly at mhrpanda13@gmail.com."},
    {id:'experience',keywords:['experience','years','how long','background'],
      trace:['parse_intent → "experience_summary"','tool: query_resume({section:"summary"})','→ matched 1 record'],
      answer:"I have 2.5+ years of hands-on QA experience — currently a Software Quality Engineer at Infosys (Nov 2025–present), testing the Availity healthcare portal, and before that a Software Test Engineer at Dietary Business Intelligence Pvt. Ltd. (Feb 2023–Dec 2024)."},
    {id:'skills',keywords:['tools','skills','tech stack','automation','technologies','stack'],
      trace:['parse_intent → "skills_lookup"','tool: query_resume({section:"technical_skills"})','→ matched 4 categories'],
      answer:"My core stack: Playwright + TypeScript and Java Selenium (WebDriver, TestNG, Maven, ATAF) for UI automation, Postman + Rest Assured for API testing, SQL for backend validation, and Jenkins/Git for CI/CD. I also use ChatGPT, Copilot, and Gemini to speed up test design and bug analysis."},
    {id:'availity',keywords:['availity','healthcare','current project','current role','infosys'],
      trace:['parse_intent → "project_lookup"','tool: query_resume({project:"Availity"})','→ matched 1 record (ongoing)'],
      answer:"Availity is my current project at Infosys — a US patient-management healthcare portal. I've designed and executed 300+ manual and automated tests (functional, regression, exploratory, UAT, cross-browser) using Playwright with TypeScript and Java Selenium ATAF. It's still ongoing."},
    {id:'projects',keywords:['zyler','asterdocs','confluxhr','erp','document management','hr platform','projects'],
      trace:['parse_intent → "project_lookup"','tool: query_resume({section:"projects"})','→ matched 3 records'],
      answer:"Three past projects worth noting: Zyler ERP Suite (automated 50+ workflows, improved stability 45%), AsterDocs document management (100% requirement coverage on upload/approval workflows), and ConfluxHR (automated REST API validation, 98% defect resolution)."},
    {id:'certs',keywords:['certification','certified','certificate','qualifications'],
      trace:['parse_intent → "certifications_lookup"','tool: query_resume({section:"certifications"})','→ matched 4 records'],
      answer:"Healthcare Certification (TestYantra, Sep 2025), SelectorsHub Certification Program (2025), Lean Six Sigma Green Belt (HRD University, 2024), and Certified Software Tester (QSpiders, 2023)."},
    {id:'education',keywords:['education','degree','college','university','study'],
      trace:['parse_intent → "education_lookup"','tool: query_resume({section:"education"})'],
      answer:"Civil Engineering from Sophitorium College of Engineering, Khorda (Biju Patnaik University of Technology), 2018–2021, CGPA 8.5 — yes, a civil engineering background into SDET work."},
    {id:'freelance',keywords:['freelance','hire','available','availability','contract','work with you'],
      trace:['parse_intent → "availability_check"','tool: query_contact({type:"freelance"})'],
      answer:'Yes — open to freelance and contract QA/automation work, remote-friendly. Best way in is the "Start a project" button up top, or email mhrpanda13@gmail.com directly.'},
    {id:'location',keywords:['location','based','where are you','live','remote'],
      trace:['parse_intent → "location_lookup"','tool: query_resume({field:"location"})'],
      answer:"Based in Bengaluru, Karnataka, India — and remote-friendly for freelance work."},
    {id:'different',keywords:['different','why you','stand out','unique','better'],
      trace:['parse_intent → "positioning_lookup"','tool: query_resume({section:"summary"})'],
      answer:"Equal parts manual and automation depth — I pair exploratory testing instincts with a real coding background (Playwright, Java Selenium, SQL), and I use AI tools day-to-day to speed up test design and bug analysis rather than just talking about them."},
    {id:'contact',keywords:['email','contact','reach','linkedin','github'],
      trace:['parse_intent → "contact_lookup"','tool: query_contact({type:"all"})'],
      answer:"Email: mhrpanda13@gmail.com · LinkedIn: linkedin.com/in/mihirpanda-sdet · GitHub: github.com/mihir-panda"},
    {id:'resume-download',keywords:['download','resume','cv','pdf'],
      trace:['parse_intent → "resume_download"','tool: query_links({type:"resume_pdf"})','→ matched 1 link'],
      answer:'You can grab my resume as a PDF — there\'s a "Download CV" link in the nav on every page. There\'s also a full readable web version on the Resume page if you\'d rather read it there first.'}
  ];

  const FALLBACK={
    trace:['parse_intent → no confident match','tool: query_resume({query:"<raw>"}) → 0 matches above threshold'],
    answer:"I don't have a scripted answer for that one — this is a small demo, not a full model. Email mhrpanda13@gmail.com and ask directly, or try one of the suggested questions above."
  };

  function matchAgentIntent(query){
    const q=query.toLowerCase();
    let best=null,bestScore=0;
    KB.forEach(intent=>{
      let score=0;
      intent.keywords.forEach(k=>{
        const re=new RegExp('\\b'+k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i');
        if(re.test(q)) score++;
      });
      if(score>bestScore){ bestScore=score; best=intent; }
    });
    return best||FALLBACK;
  }

  window.AGENT_KB=KB;
  window.AGENT_FALLBACK=FALLBACK;
  window.matchAgentIntent=matchAgentIntent;
})();
