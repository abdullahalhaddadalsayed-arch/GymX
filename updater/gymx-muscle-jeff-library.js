/* GymX v0.6 static muscle taxonomy and source-grounded Jeff Nippard library.
 * Only explicitly enumerated exercises enter the Jeff section. No GIF/media playback.
 * All original workout/exercise IDs remain intact; no migrations required.
 */
(() => {
 "use strict";
 if(typeof EXERCISES === "undefined" || !Array.isArray(EXERCISES)) return;
 const MAIN = ["All","Chest","Back","Shoulders","Biceps","Triceps","Forearms","Core","Quads","Hamstrings","Glutes","Calves","Cardio","Full Body"];
 const SUB = {
   Chest:["Upper Chest","Mid Chest","Lower Chest"],
   Back:["Lats — Upper","Lats — Lower","Lower Back — Spinal Erectors","Traps"],
   Shoulders:["Front Delts","Side Delts","Rear Delts"],
   Biceps:["Long Head","Short Head","Brachialis","Brachioradialis"],
   Triceps:["Long Head","Lateral Head","Medial Head"],
   Forearms:["Flexors","Extensors"],
   Core:["Upper Abs","Lower Abs","Obliques"],
   Quads:["Rectus Femoris","Vastus Lateralis","Vastus Medialis","Vastus Intermedius"],
   Hamstrings:["Biceps Femoris","Semitendinosus","Semimembranosus"],
   Glutes:["Glute Max","Glute Med","Glute Min"],
   Calves:["Gastrocnemius","Soleus"]
 };
 const VIDEOS = [
   ["S6rqpxVGKZ4","25 Best Exercises","Full Body"],
   ["928aRhhPP8I","One-Year Upper Body Workout","Upper Body"],
   ["hRZ5MM6gmlE","One-Year Leg Workout","Lower Body"],
   ["GNO4OtYoCYk","Biceps Exercise Ranking","Biceps"],
   ["SgyUoY0IZ7A","Shoulder Exercise Ranking","Shoulders"],
   ["kIXcoivzGf8","Quad Exercise Ranking","Quads"],
   ["OpRMRhr0Ycc","Triceps Exercise Ranking","Triceps"],
   ["fGm-ef-4PVk","Chest Exercise Ranking","Chest"],
   ["jLvqKgW-_G8","Back Exercise Ranking","Back"]
 ];
 // Each entry is an actual movement named in one of the supplied videos or their
 // documented chapter summaries. Names are exact/explicit variants; do not derive
 // a Jeff endorsement/rank merely because another movement trains that muscle.
 const MENTIONED = {
  S6rqpxVGKZ4:[
    ["squat","barbell squat","barbell full squat","back squat"],
    ["pull up","pullup","pull ups","weighted pull up"],
    ["incline barbell bench press","incline bench press"],
    ["romanian deadlift","barbell romanian deadlift"],
    ["chest supported t bar row","chest supported row"],
    ["dumbbell lateral raise","side lateral raise"],
    ["preacher curl","dumbbell preacher curl"],
    ["overhead cable triceps extension"]
  ],
  "928aRhhPP8I":[
    ["incline barbell bench press"],
    ["seated cable fly","cable chest fly"],
    ["weighted pull up","pull up","pullups"],
    ["high cable lateral raise","cable lateral raise"],
    ["deficit pendlay row","pendlay row"],
    ["overhead cable triceps extension"],
    ["bayesian cable curl","cable bayesian curl"]
  ],
  hRZ5MM6gmlE:[
    ["lying leg curl","lying leg curls"],
    ["pendulum squat"],
    ["romanian deadlift","barbell romanian deadlift"],
    ["leg extension","leg extensions"],
    ["hip adduction machine","hip adduction"],
    ["standing calf raise","standing calf raises"]
  ],
  GNO4OtYoCYk:[
    ["bayesian curl","face away bayesian curl"],
    ["dumbbell preacher curl","preacher curl","machine preacher curl"],
    ["preacher hammer curl"],
    ["ez bar curl","ez barbell curl"],
    ["dumbbell biceps curl","dumbbell curl","standing dumbbell curl"],
    ["incline dumbbell curl","incline curl"],
    ["cable biceps curl","cable curl","standing cable curl"],
    ["hammer curl","hammer curls"],
    ["barbell curl"],
    ["spider curl"],
    ["drag curl"],
    ["chin up","chin ups"]
  ],
  SgyUoY0IZ7A:[
    ["dumbbell overhead press","dumbbell shoulder press"],
    ["machine shoulder press","seated shoulder press machine"],
    ["front raise","dumbbell front raise"],
    ["cable lateral raise","high cable lateral raise"],
    ["dumbbell lateral raise","side lateral raise"],
    ["seated machine lateral raise"],
    ["upright row"],
    ["reverse pec deck"],
    ["face pull","rope face pull"],
    ["bent over reverse dumbbell fly","reverse dumbbell fly"],
    ["reverse cable crossover","reverse cable fly"]
  ],
  kIXcoivzGf8:[
    ["hack squat","machine hack squat"],
    ["barbell squat","barbell full squat","back squat"],
    ["smith machine squat"],
    ["leg extension","leg extensions"],
    ["leg press"],
    ["bulgarian split squat"],
    ["front squat"],
    ["goblet squat"],
    ["walking lunge","dumbbell walking lunge"]
  ],
  OpRMRhr0Ycc:[
    ["triceps pressdown","cable triceps pushdown","triceps pushdown"],
    ["rope triceps pushdown","rope triceps pressdown"],
    ["overhead cable triceps extension"],
    ["katana cable triceps extension"],
    ["overhead dumbbell triceps extension"],
    ["skullcrusher","barbell skullcrusher"],
    ["close grip bench press","close grip barbell bench press"],
    ["bench dip","bench dips"],
    ["dumbbell triceps kickback","triceps kickback"],
    ["machine dips","triceps dip machine"]
  ],
  "fGm-ef-4PVk":[
    ["machine chest press"],
    ["seated cable fly","cable chest fly"],
    ["barbell bench press","bench press"],
    ["incline barbell bench press","incline bench press"],
    ["dumbbell bench press","flat dumbbell press"],
    ["incline dumbbell press"],
    ["chest dip","chest dips","weighted dips"],
    ["push up","push ups","pushups"],
    ["pec deck fly","pec deck"],
    ["cable crossover","cable chest fly"],
    ["dumbbell fly","dumbbell chest fly"],
    ["decline chest press","decline bench press"]
  ],
  "jLvqKgW-_G8":[
    ["lat pulldown","wide grip lat pulldown","neutral grip lat pulldown"],
    ["one arm lat pulldown"],
    ["meadows row"],
    ["chest supported row","chest supported machine row"],
    ["seated cable row","seated cable rows","cable row"],
    ["pull up","pull ups","pullups","wide grip pull up"],
    ["single arm dumbbell row","one arm dumbbell row"],
    ["pendlay row","deficit pendlay row"],
    ["barbell bent over row","barbell row"],
    ["dumbbell pullover"],
    ["face pull","rope face pull"],
    ["deadlift","conventional deadlift"],
    ["chin up","chin ups"]
  ]
 };
 const normalized=s=>String(s||"").toLowerCase().replace(/&/g," and ").replace(/\bdb\b/g,"dumbbell").replace(/[\-–—_]+/g," ").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
 const index=new Map();
 for(const [id,sets] of Object.entries(MENTIONED))
   for(const aliases of sets)
     for(const alias of aliases) {
       const key=normalized(alias);
       if(!index.has(key)) index.set(key,new Set());
       index.get(key).add(id);
     }
 const refs=ex=>[...(index.get(normalized(ex.name))||[])];
 const mainGroup=ex=>{
   const p=(Array.isArray(ex.primaryMuscles)?ex.primaryMuscles:[]).join(" ").toLowerCase();
   const n=normalized(ex.name),m=String(ex.muscle||"").toLowerCase(),t=p+" "+n;
   if(m==="back")return "Back";
   if(m==="chest")return "Chest";
   if(m==="shoulders")return "Shoulders";
   if(m==="core" || m==="abs")return "Core";
   if(m==="cardio")return "Cardio";
   if(m==="arms" || /bicep|tricep|brachialis|forearm/.test(m)){
     if(/tricep|pressdown|pushdown|skullcrush|overhead.*extension|kickback/.test(t))return "Triceps";
     if(/forearm|wrist|reverse curl|farmer/.test(t))return "Forearms";
     return "Biceps";
   }
   if(m==="legs" || /hamstring|quad|glut|calf/.test(m)){
     if(/calf|soleus|gastrocnemius/.test(t))return "Calves";
     if(/hamstring|leg curl|romanian deadlift|stiff leg/.test(t))return "Hamstrings";
     if(/glute|hip thrust|hip abduct|hip adduct|bridge/.test(t))return "Glutes";
     return "Quads";
   }
   return m==="full body"?"Full Body": (MAIN.find(x=>x.toLowerCase()===m)||"Full Body");
 };
 const subgroup=ex=>{
   const main=mainGroup(ex), n=normalized(ex.name);
   const p=Array.isArray(ex.primaryMuscles)?ex.primaryMuscles.join(" ").toLowerCase():"";
   const s=n+" "+p;
   switch(main){
     case "Back":
       if(/erector|back extension|hyperextension|good morning|deadlift/.test(s))return "Lower Back — Spinal Erectors";
       if(/trap|shrug|face pull|high pull/.test(s))return "Traps";
       if(/upper lat/.test(s))return "Lats — Upper";
       if(/lower lat/.test(s))return "Lats — Lower";
       // Pulling movements work both areas. Do not pretend an upper/lower
       // subdivision can be established from the exercise name alone.
       return "";
     case "Biceps":
       if(/brachioradialis|reverse curl/.test(s))return "Brachioradialis";
       if(/brachialis|hammer curl/.test(s))return "Brachialis";
       if(/long head/.test(s))return "Long Head";
       if(/short head/.test(s))return "Short Head";
       return "";
     case "Triceps":
       if(/long head|overhead/.test(s))return "Long Head";
       if(/lateral head/.test(s))return "Lateral Head";
       if(/medial head/.test(s))return "Medial Head";
       return "";
     case "Shoulders":
       if(/rear|reverse.*fly|reverse.*pec|face pull|posterior delt/.test(s))return "Rear Delts";
       if(/side|lateral raise|upright row/.test(s))return "Side Delts";
       if(/front|anterior delt|overhead press|shoulder press/.test(s))return "Front Delts";
       return "";
     case "Chest":
       if(/incline|upper pec|upper chest/.test(s))return "Upper Chest";
       if(/decline|lower chest/.test(s))return "Lower Chest";
       if(/flat|bench press|pec deck/.test(s))return "Mid Chest";
       return "";
     case "Core":
       if(/oblique|twist|rotation|side plank/.test(s))return "Obliques";
       if(/leg raise|reverse crunch/.test(s))return "Lower Abs";
       if(/crunch|sit up|situp/.test(s))return "Upper Abs";
       return "";
     case "Glutes":
       if(/glute med|hip abduct/.test(s))return "Glute Med";
       if(/glute min/.test(s))return "Glute Min";
       if(/glute|hip thrust|bridge/.test(s))return "Glute Max";
       return "";
     case "Calves":
       if(/seated calf|soleus/.test(s))return "Soleus";
       if(/standing calf|gastrocnemius/.test(s))return "Gastrocnemius";
       return "";
     case "Quads":
       for(const v of SUB.Quads) if(s.includes(v.toLowerCase()))return v;
       return "";
     case "Hamstrings":
       for(const v of SUB.Hamstrings) if(s.includes(v.toLowerCase()))return v;
       return "";
     case "Forearms":
       if(/flexor|wrist curl/.test(s))return "Flexors";
       if(/extensor|reverse wrist/.test(s))return "Extensors";
       return "";
     default: return "";
   }
 };
 const selected={main:"All",sub:"All",mode:"all",video:"All"};
 window.GYMX_TAXONOMY={MAIN,SUB,mainGroup,subgroup,refs,VIDEOS};
 let oldFiltered=typeof window.filteredExercises==="function"?window.filteredExercises:null;
 // Wrap the existing library search/equipment filters. Other screens are unchanged.
 if(oldFiltered && !oldFiltered.gxSubgroupWrapped){
   const wrapped=function(){
     const base=oldFiltered.apply(this,arguments);
     if(typeof ui==="undefined" || ui.page!=="library")return base;
     return base.filter(ex=>(selected.main==="All"||mainGroup(ex)===selected.main)
       &&(selected.sub==="All"||subgroup(ex)===selected.sub)
       &&(selected.mode==="all"||refs(ex).length>0)
       &&(selected.video==="All"||refs(ex).includes(selected.video)));
   };
   wrapped.gxSubgroupWrapped=true;
   window.filteredExercises=wrapped;
 }
 const el=(tag,className,text)=>{
   const x=document.createElement(tag);
   if(className)x.className=className;
   if(text!==undefined)x.textContent=text;
   return x;
 };
 const createSelect=(label,options,value)=>{
   const holder=el("label","gx-muscle-select");
   holder.append(el("span","",label));
   const sel=document.createElement("select");
   for(const [key,name] of options) {
     const opt=document.createElement("option");
     opt.value=key;opt.textContent=name;
     opt.selected=key===value;
     sel.append(opt);
   }
   holder.append(sel);return {holder,sel};
 };
 function apply(){if(typeof ui!=="undefined"){ui.libMuscle="All";window.render?.();}}
 function library(){
   const main=document.querySelector("main.body");
   if(!main || !main.querySelector("h1")?.textContent.includes("Explore exercises")) return;
   if(main.querySelector("#gx-curated-filters"))return;
   const panel=el("section","gx-curated-panel");
   panel.id="gx-curated-filters";
   const tabs=el("div","gx-curated-tabs");
   for(const [mode,label] of [["all","All exercises"],["jeff","Jeff Nippard"]]){
     const btn=el("button","gx-curated-tab"+(selected.mode===mode?" active":""),label);
     btn.type="button";
     btn.addEventListener("click",()=>{
       selected.mode=mode; selected.video="All"; apply();
     });
     tabs.append(btn);
   }
   panel.append(tabs);
   if(selected.mode==="jeff"){
     panel.append(el("p","gx-curated-help","Only exercises explicitly named in your nine Jeff Nippard videos. Videos open on YouTube; no clips, GIFs or animations are stored."));
   }
   const line=el("div","gx-muscle-filter-line");
   const group=createSelect("Main muscle group",MAIN.map(x=>[x,x]),selected.main);
   group.sel.id="gx-main-group";
   group.sel.addEventListener("change",()=>{
     selected.main=group.sel.value;selected.sub="All";apply();
   });
   line.append(group.holder);
   const opts=(SUB[selected.main]||[]).map(x=>[x,x]);
   const sub=createSelect("Sub-group",[["All","All sub-groups"],...opts],selected.sub);
   sub.sel.id="gx-sub-group";
   sub.sel.disabled=opts.length===0;
   sub.sel.addEventListener("change",()=>{selected.sub=sub.sel.value;apply();});
   line.append(sub.holder);panel.append(line);
   if(selected.mode==="jeff"){
     const video=createSelect("Source video",[["All","All nine videos"],...VIDEOS.map(v=>[v[0],v[1]])],selected.video);
     video.sel.id="gx-jeff-video";
     video.sel.addEventListener("change",()=>{selected.video=video.sel.value;apply();});
     panel.append(video.holder);
   }
   const p=el("p","gx-curated-caution","Sub-groups indicate likely muscle emphasis, not exclusive activation. Where the exercise description does not establish a specific head or region, it remains under its main group.");
   panel.append(p);
   const search=main.querySelector(".searchbox");
   if(search) search.before(panel);
   else main.querySelector("h1")?.after(panel);
   // Existing group chips remain for the diagram but are visually hidden
   // to avoid showing two conflicting filter systems.
   main.classList.add("gx-hierarchical-library");
   for(const row of main.querySelectorAll("#exercise-results .exercise-row")) {
     const id=row.querySelector("[data-id]")?.dataset.id;
     const ex=EXERCISES.find(x=>String(x.id)===String(id));
     if(!ex)continue;
     const label=el("small","gx-library-subtitle",
       [mainGroup(ex),subgroup(ex)||"Specific region not confirmed"].join(" · "));
     row.querySelector(".meta")?.append(label);
     if(selected.mode==="jeff"){
       const hits=refs(ex);
       if(hits.length){
         const first=VIDEOS.find(v=>v[0]===hits[0]);
         const link=el("a","gx-jeff-row-source","Jeff · "+(first?first[1]:"Video"));
         link.href="https://www.youtube.com/watch?v="+hits[0];
         link.target="_blank";link.rel="noopener noreferrer";
         link.addEventListener("click",e=>{
           if(typeof window.GymXNative?.openJeffVideo==="function"){
             e.preventDefault();window.GymXNative.openJeffVideo(link.href);
           }
         });
         row.querySelector(".meta")?.append(link);
       }
     }
   }
   const heading=[...main.querySelectorAll("h2,h3")].find(x=>/^\d+\s+exercises/.test((x.textContent||"").trim()));
   if(heading && typeof window.filteredExercises==="function")
      heading.textContent=window.filteredExercises().length+" exercises";
 }
 document.addEventListener("click",e=>{
   const b=e.target.closest?.('[data-act="filter-muscle"]');
   if(!b || typeof ui==="undefined" || ui.page!=="library")return;
   e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
   const val=b.dataset.muscle||"All";
   selected.main=val==="Arms"?"Biceps":val==="Legs"?"Quads":MAIN.includes(val)?val:"All";
   selected.sub="All";apply();
 },true);
 let pending=false;
 function schedule(){
   if(pending)return;
   pending=true;requestAnimationFrame(()=>{pending=false;library();});
 }
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
 schedule();
})();