/* GymX: single consistent static muscle display, visible tap targets, clean library.
 * Runs last, after legacy display plugins. Preserves exercise data and storage.
 */
(() => {
 "use strict";
 const tax=window.GYMX_TAXONOMY;
 const exercises=typeof EXERCISES!=="undefined"?new Map(EXERCISES.map(x=>[String(x.id),x])):new Map();
 const NS="http://www.w3.org/2000/svg";
 const positions={
   front:{
     Chest:["M81 87Q96 80 110 90L110 120Q94 131 78 117Z","M112 90Q126 79 142 87L145 117Q128 131 112 120Z"],
     Shoulders:["M80 83Q70 86 66 102L78 118L93 90Z","M145 83Q156 86 161 102L147 118L132 90Z"],
     Biceps:["M64 115Q72 113 76 127L69 167L59 178L53 148Z","M157 115Q165 113 171 148L168 176L156 165L149 126Z"],
     Triceps:["M73 117L80 130L75 169L65 179L67 147Z","M150 118L145 130L152 169L163 178L158 147Z"],
     Forearms:["M58 171L70 169L66 213L54 227L49 202Z","M167 169L180 171L186 202L173 227L160 213Z"],
     Core:["M96 128Q113 134 130 128L136 186L92 187Z"],
     Quads:["M88 212Q103 204 112 221L106 292L86 300L81 250Z","M114 221Q125 203 141 212L145 250L139 300L119 291Z"],
     Calves:["M92 292L110 300L108 356L98 370L89 347Z","M126 300L142 292L145 347L134 370L125 355Z"]
   },
   back:{
     Back:["M65 98Q89 107 109 111L109 196L84 187L59 133Z","M157 98Q135 107 115 111L115 196L141 187L166 133Z"],
     Traps:["M80 77L112 104L143 77L158 106L113 125L68 105Z"],
     Shoulders:["M79 82Q65 87 62 111L78 124L96 97Z","M146 82Q160 87 163 111L147 124L130 97Z"],
     Triceps:["M65 118L78 124L73 181L60 183Z","M158 118L146 124L152 181L165 183Z"],
     Glutes:["M84 213Q98 204 111 218L108 259L83 253Z","M113 218Q127 205 141 213L142 253L117 259Z"],
     Hamstrings:["M84 259L109 262L107 315L92 341L81 307Z","M116 262L142 259L145 307L132 341L118 315Z"],
     Calves:["M91 334L107 333L109 383L97 393Z","M130 333L145 334L136 393L124 383Z"]
   }
 };
 const crop={
   Chest:[38,54,148,152],Shoulders:[34,62,154,155],
   Biceps:[34,83,155,165],Triceps:[34,84,155,168],Forearms:[25,128,176,156],
   Core:[57,112,113,132],Quads:[54,183,119,149],Calves:[55,270,121,120],
   Back:[36,79,151,165],Traps:[48,57,129,116],
   Hamstrings:[50,224,129,158],Glutes:[46,183,134,145]
 };
 const bodySource=side=>side==="back"?"gx-human-back.webp":"gymx-user-front-base.webp";
 function svgFor(side,group,thumbnail) {
   const svg=document.createElementNS(NS,"svg");
   svg.classList.add("gx-fixed-figure");
   if(thumbnail)svg.classList.add("gx-fixed-thumb");
   svg.setAttribute("viewBox",thumbnail?(crop[group]||[40,70,145,180]).join(" "):"0 0 225 402");
   svg.setAttribute("preserveAspectRatio",thumbnail?"xMidYMid slice":"xMidYMid meet");
   svg.setAttribute("role","img");
   svg.setAttribute("aria-label",(group||"Muscle")+" highlighted on static male "+side+"-view reference");
   const image=document.createElementNS(NS,"image");
   image.setAttribute("href",bodySource(side));
   image.setAttribute("x","0");image.setAttribute("y","0");
   image.setAttribute("width","225");image.setAttribute("height","402");
   image.setAttribute("preserveAspectRatio","xMidYMid meet");
   svg.append(image);
   const regions=positions[side]||{};
   // Body selector always highlights the mapped regions lightly so they remain visible and tappable.
   for(const [name,paths] of Object.entries(regions)) {
     const el=document.createElementNS(NS,"g");
     el.classList.add("gx-fixed-zone");
     if(name===group)el.classList.add("active");
     if(!thumbnail) {
       el.dataset.act="filter-muscle";
       el.dataset.muscle=name==="Traps"?"Back":name;
       el.setAttribute("role","button");
       el.setAttribute("tabindex","0");
       el.setAttribute("aria-label","Filter "+(name==="Traps"?"Back / Traps":name)+" exercises");
     }else {
       el.setAttribute("aria-hidden","true");
     }
     for(const d of paths) {
       const p=document.createElementNS(NS,"path");
       p.setAttribute("d",d);
       p.setAttribute("stroke-linejoin","round");
       el.append(p);
     }
     svg.append(el);
   }
   return svg;
 }
 function figureFor(ex,thumbnail) {
   const group=tax?.mainGroup?.(ex)||ex.muscle||"Chest";
   const sub=tax?.subgroup?.(ex)||"";
   const side=["Back","Hamstrings","Glutes"].includes(group)?"back":"front";
   const section=document.createElement("div");
   section.className="gx-fixed-human"+(thumbnail?" is-thumb":"");
   section.append(svgFor(side,group,thumbnail));
   if(!thumbnail) {
     const cap=document.createElement("span");cap.className="gx-fixed-caption";
     cap.textContent=(group==="Back"&&sub?sub:group+(sub?" · "+sub:""));
     section.append(cap);
   }
   return section;
 }
 function library() {
   const main=document.querySelector("main.body");
   if(!main||!main.querySelector("h1")?.textContent.includes("Explore exercises"))return;
   main.classList.add("gx-ui-cleaned");
   // These were added independently by old design layers, resulting in three introductions.
   main.querySelectorAll(".gx-library-intro,.gx-guide-intro,.gymx-guide-intro,.gymx-library-hint,.gx-figure-foot").forEach(n=>n.remove());
   for(const p of main.querySelectorAll("p,.hint,.small-note")) {
     const text=(p.textContent||"").trim();
     if(/^Browse [\d,]+ exercises by muscle/i.test(text)||
        /^Tap a highlighted area to filter exercises/i.test(text)||
        /^Select a muscle on the human diagram/i.test(text)) p.remove();
   }
   const selector=main.querySelector(".gymx-body-card,.gx-body-card");
   if(selector) {
     const existing=selector.querySelector("svg.body-map:not(.gx-repaired-body),.gx-anatomy,.gx-human-stage");
     const chosen=tax?.selected?.main||"All";
     const side=selector.querySelector(".body-view [data-view].active")?.dataset.view||"front";
     if(existing) {
       const fixed=svgFor(side,chosen,false);
       fixed.classList.add("body-map","gymx-anatomy-map","gx-hires-body","gx-repaired-body");
       existing.replaceWith(fixed);
     }
     const map=selector.querySelector(".gx-repaired-body");
     if(map) {
       // The UI owns the selected main group; update highlights even when the body isn't rebuilt.
       const selected=tax?.selected?.main||"All";
       for(const zone of map.querySelectorAll(".gx-fixed-zone")){
         const name=zone.dataset.muscle;
         zone.classList.toggle("active",selected!=="All"&&selected===name);
       }
     }
   }
   for(const row of main.querySelectorAll("#exercise-results .exercise-row")){
     const id=row.querySelector("[data-id]")?.getAttribute("data-id");
     const ex=exercises.get(String(id));
     const imageInfo=window.GYMX_IMAGE_CATALOG?.exercises?.[String(id)];
     const isFallback=imageInfo?.kind==="exercise_schematic_reference"||
       imageInfo?.kind==="equipment_reference"||imageInfo?.kind==="muscle_reference";
     if(!ex || !isFallback)continue;
     const icon=row.querySelector(".ex-icon");
     if(!icon || icon.dataset.gxFixedFor===String(id))continue;
     icon.dataset.gxFixedFor=String(id);
     icon.replaceChildren(figureFor(ex,true));
     icon.classList.add("gx-fixed-icon");
     icon.classList.remove("gx-audit-category-icon");
   }
 }
 function details() {
   const modal=document.querySelector("#modal-layer .modal");
   if(!modal||!modal.querySelector(".modal-header")?.textContent.includes("EXERCISE DETAILS"))return;
   const id=modal.querySelector('[data-act="add-exercise-session"][data-id]')?.dataset.id;
   const ex=exercises.get(String(id));if(!ex)return;
   const a=modal.querySelector(".gx-human-reference-card");
   if(a && a.dataset.gxFixedFor!==String(id)){
     const old=a.querySelector(".gx-real-human");
     if(old)old.replaceWith(figureFor(ex,false));
     a.dataset.gxFixedFor=String(id);
   }
   const mini=modal.querySelector(".gymx-target-card .gymx-mini-map");
   if(mini && mini.dataset.gxFixedFor!==String(id)){
     mini.replaceChildren(figureFor(ex,true));
     mini.dataset.gxFixedFor=String(id);
   }
   // One target-muscle illustration is enough: avoid the duplicate box in fallback views.
   if(a) modal.querySelector(".gymx-target-card")?.remove();
 }
 let pending=false;
 function run(){pending=false;library();details();}
 new MutationObserver(()=>{if(!pending){pending=true;requestAnimationFrame(run);}})
  .observe(document.body,{childList:true,subtree:true});
 document.addEventListener("keydown",e=>{
   if(!["Enter"," "].includes(e.key))return;
   const zone=e.target.closest?.(".gx-fixed-zone[role=button]");
   if(!zone)return;
   e.preventDefault();zone.dispatchEvent(new MouseEvent("click",{bubbles:true}));
 });
 run();
})();
