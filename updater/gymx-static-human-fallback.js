/* GymX static realistic human fallback (reference photograph supplied by project user).
 * Only replaces original symbolic placeholders for exercises lacking specific photos.
 * Reuses shipped licensed real male front/back anatomical images for unsupported views.
 * No animations, no GIFs, no AI-derived form demonstrations.
 */
(() => {
 "use strict";
 const exById=typeof EXERCISES==="undefined"?new Map():new Map(EXERCISES.map(x=>[String(x.id),x]));
 function available(){
   return window.GYMX_IMAGE_CATALOG?.exercises || {};
 }
 function eligible(ex){
   const item=available()[String(ex.id)];
   return item?.kind==="exercise_schematic_reference" ||
          item?.reviewStatus==="original_schematic_not_technique_guide" ||
          item?.kind==="equipment_reference" || item?.kind==="muscle_reference";
 }
 function context(ex){
   const taxonomy=window.GYMX_TAXONOMY;
   let main=taxonomy?.mainGroup(ex) || ex.muscle || "Chest";
   const sub=taxonomy?.subgroup(ex) || "";
   if(main==="Full Body") main="Core";
   const useBack=main==="Back" || main==="Hamstrings" || main==="Glutes";
   const sprite=main==="Biceps"?"arms":main==="Shoulders"?"shoulders":main==="Quads"?"legs":null;
   return {main,sub,side:useBack?"back":"front",sprite};
 }
 const green="#b5ff53";
 const shapes={
   front:{
     Chest:['M76 70Q94 64 109 74L109 103Q95 111 79 103Z','M110 74Q128 64 145 71L141 103Q124 112 110 103Z'],
     Biceps:['M50 94Q61 90 67 104L61 143L46 155L41 133Z','M170 94Q160 90 153 104L159 143L174 155L179 133Z'],
     Triceps:['M50 94Q62 90 67 104L60 149L43 157Z','M170 94Q158 90 153 104L160 149L177 157Z'],
     Forearms:['M42 154L57 151L48 197L34 192Z','M178 154L163 151L172 197L186 192Z'],
     Shoulders:['M64 63Q51 67 47 91L66 100L81 74Z','M154 63Q167 67 171 91L153 100L138 74Z'],
     Core:['M84 110Q110 118 137 110L135 164Q110 175 85 164Z'],
     Quads:['M83 177Q99 171 108 188L102 246L86 267L76 232Z','M112 188Q121 171 136 177L145 232L136 267L117 246Z'],
     Calves:['M86 266L102 260L98 302L86 304Z','M135 266L119 260L123 302L136 304Z']
   },
   back:{
     Back:['M77 76Q97 91 111 93L110 156L84 158L64 120Z','M143 76Q123 91 111 93L112 156L138 158L156 120Z'],
     "Lats — Upper":['M79 84L111 96L109 123L72 119Z','M141 84L111 96L113 123L149 119Z'],
     "Lats — Lower":['M72 120L109 125L108 168L87 162Z','M148 120L113 125L114 168L133 162Z'],
     "Lower Back — Spinal Erectors":['M106 151L112 151L113 208L102 207Z','M116 151L122 151L125 207L114 207Z'],
     Traps:['M79 70L110 90L139 70L147 93L113 107L73 93Z'],
     Hamstrings:['M84 178L109 187L102 251L84 266L76 228Z','M112 187L138 178L145 228L136 265L118 251Z'],
     Glutes:['M76 177Q95 164 110 182L109 215L77 225Z','M112 182Q127 164 147 177L145 225L113 215Z'],
     Shoulders:['M63 65Q49 70 48 94L69 103L82 75Z','M156 65Q170 70 173 94L152 103L139 75Z']
   }
 };
 function staticFigure(ex,small){
   const {main,sub,side,sprite}=context(ex);
   const parent=document.createElement("div");
   parent.className="gx-real-human"+(small?" small":"");
   parent.setAttribute("role","img");
   parent.setAttribute("aria-label",ex.name+": "+(sub||main)+" highlighted muscle reference; not a technique demonstration");
   if(sprite){
     parent.classList.add("gx-user-reference","gx-user-"+sprite);
     const span=document.createElement("span");
     span.className="gx-human-caption";span.textContent=sub||main;
     if(!small)parent.append(span);
     return parent;
   }
   const svgNS="http://www.w3.org/2000/svg";
   const svg=document.createElementNS(svgNS,"svg");
   svg.setAttribute("viewBox","0 0 220 330");
   svg.setAttribute("preserveAspectRatio","xMidYMid meet");
   svg.setAttribute("aria-hidden","true");
   const image=document.createElementNS(svgNS,"image");
   image.setAttribute("href","gx-human-"+side+".webp");
   image.setAttribute("x","0");image.setAttribute("y","0");
   image.setAttribute("width","220");image.setAttribute("height","330");
   svg.append(image);
   const focus=(shapes[side]||{})[sub] || (shapes[side]||{})[main] || shapes.front.Core;
   for(const d of focus){
     const shape=document.createElementNS(svgNS,"path");
     shape.setAttribute("d",d);shape.setAttribute("fill",green);
     shape.setAttribute("fill-opacity","0.58");
     shape.setAttribute("stroke","#d6ffae");
     shape.setAttribute("stroke-width","1.2");
     svg.append(shape);
   }
   parent.append(svg);
   if(!small){
     const cap=document.createElement("span");
     cap.className="gx-human-caption";cap.textContent=sub||main;
     parent.append(cap);
   }
   return parent;
 }
 function library(){
   const main=document.querySelector("main.body");
   if(!main || !main.querySelector("h1")?.textContent.includes("Explore exercises"))return;
   for(const row of main.querySelectorAll("#exercise-results .exercise-row")){
     const id=row.querySelector("[data-id]")?.dataset.id;
     const ex=exById.get(String(id));
     if(!ex || !eligible(ex) || row.dataset.gxRealHuman===String(id))continue;
     const icon=row.querySelector(".ex-icon");if(!icon)continue;
     row.dataset.gxRealHuman=String(id);
     icon.replaceChildren(staticFigure(ex,true));
     icon.classList.add("gx-real-human-thumb");
   }
 }
 function details(){
   const modal=document.querySelector("#modal-layer .modal");
   if(!modal || !modal.querySelector(".modal-header")?.textContent.includes("EXERCISE DETAILS"))return;
   const id=modal.querySelector('[data-act="add-exercise-session"][data-id]')?.dataset.id;
   const ex=exById.get(String(id));
   if(!ex)return;
   const sub=window.GYMX_TAXONOMY?.subgroup(ex);
   const title=modal.querySelector(".gymx-target-muscle");
   if(title && title.dataset.gxSubgroup!==String(id)){
     title.textContent=(window.GYMX_TAXONOMY?.mainGroup(ex)||ex.muscle)+ (sub?" · "+sub:"");
     title.dataset.gxSubgroup=String(id);
   }
   if(!eligible(ex) || modal.dataset.gxRealHuman===String(id))return;
   const old=modal.querySelector(".gx-audit-guide,.gx-pending-photo,.gx-audit-frame");
   if(!old)return;
   const section=document.createElement("section");
   section.className="gx-human-reference-card";
   const head=document.createElement("div");head.className="gx-human-card-head";
   head.textContent="TARGET MUSCLE · STATIC HUMAN REFERENCE";
   const note=document.createElement("p");note.className="gx-human-card-note";
   note.textContent="No verified exercise-specific START / END photos are available for this movement. The green highlight indicates an approximate target area, not exercise technique.";
   section.append(head,staticFigure(ex,false),note);
   old.replaceWith(section);
   modal.dataset.gxRealHuman=String(id);
 }
 let queued=false;
 function run(){
   queued=false;library();details();
 }
 new MutationObserver(()=>{
   if(queued)return;queued=true;requestAnimationFrame(run);
 }).observe(document.body,{subtree:true,childList:true});
 run();
})();
