/* GymX Premium Library & Exercise Details, presentation-only.
 * Existing workout history, plans, exercises, native ML and settings are untouched.
 */
(() => {
  "use strict";
  const catalog = typeof EXERCISES !== "undefined" && Array.isArray(EXERCISES)
    ? new Map(EXERCISES.map(ex => [String(ex.id),ex])) : new Map();
  const add = (parent,tag,className,content) => {
    const el=document.createElement(tag);
    if(className) el.className=className;
    if(content !== undefined) el.textContent=content;
    parent.appendChild(el);
    return el;
  };
  function improveLibrary() {
    const main = document.querySelector(".shell main.body");
    if(!main || !main.textContent.includes("Explore exercises") || main.dataset.gxDesign) return;
    main.dataset.gxDesign="true";
    const heading=main.querySelector("h1");
    if(!heading) return;
    const bar=document.createElement("div");
    bar.className="gx-library-intro";
    add(bar,"span","gx-intro-pill",catalog.size.toLocaleString()+" EXERCISES");
    heading.after(bar);
    const muscleCard=[...main.querySelectorAll(".card")].find(c=>c.textContent.includes("Muscle selector"));
    if(muscleCard) muscleCard.classList.add("gx-body-card");
  }
  function improveFrames(modal) {
    const holder=modal.querySelector(".freedb-photos");
    if(!holder || holder.dataset.gxMotionReady) return;
    holder.dataset.gxMotionReady="true";
    const images=[...holder.querySelectorAll("img")];
    images.forEach((img,i)=>{
      let frame=img.closest(".gymx-guide-frame");
      if(!frame){
        frame=document.createElement("div");
        frame.className="gymx-guide-frame";
        img.replaceWith(frame);
        frame.appendChild(img);
      }
      let label=frame.querySelector(".gymx-frame-label");
      if(!label) label=add(frame,"span","gymx-frame-label");
      label.textContent=i===0?"START":"END";
      img.alt=(i===0?"Starting position: ":"Ending position: ")+img.alt;
    });
    const caption=holder.nextElementSibling;
    if(caption?.classList?.contains("gymx-guide-caption")) {
      caption.textContent = images.length>1
        ? "Two reference positions. Confirm the full motion with the written exercise instructions."
        : "Exercise reference photo. Use the instructions for correct form.";
    }
  }
  function improveExercise(){
    const modal=document.querySelector("#modal-layer .modal");
    if(!modal || modal.dataset.gxDesign || !modal.textContent?.includes("EXERCISE DETAILS")) return;
    const action=modal.querySelector('[data-act="add-exercise-session"][data-id]');
    if(!action) return;
    modal.dataset.gxDesign="true";
    modal.classList.add("gx-modal-detail");
    const ex=catalog.get(String(action.dataset.id));
    const header=modal.querySelector(".modal-header");
    if(header) {
      const kicker=document.createElement("div");
      kicker.className="gx-detail-kicker";
      kicker.textContent="MOVEMENT GUIDE · GYMX";
      header.after(kicker);
    }
    const poster=modal.querySelector(".freedb-poster,.movement-hero,.poster");
    if(poster){
      const summary=document.createElement("div");
      summary.className="gx-detail-summary";
      [["TARGET MUSCLE",ex?.muscle||"Exercise"],["EQUIPMENT",ex?.equipment||"Equipment"]].forEach(pair=>{
        const cell=add(summary,"div","gx-detail-stat");
        add(cell,"small","",pair[0]);add(cell,"strong","",pair[1]);
      });
      poster.after(summary);
      const muscles=[...(ex?.primaryMuscles||[]),...(ex?.secondaryMuscles||[])].filter(Boolean).slice(0,8);
      if(muscles.length){
        const box=document.createElement("section");box.className="gx-detail-muscles";
        add(box,"div","gx-title","TARGETED MUSCLES");
        const holder=add(box,"div","gx-muscle-tags");
        [...new Set(muscles)].forEach((muscle,i)=>add(holder,"span","gx-muscle-tag",(i===0?"PRIMARY · ":"")+muscle));
        summary.after(box);
      }
    }
    improveFrames(modal);
  }
  let scheduled=false;
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      improveLibrary();
      improveExercise();
    });
  }
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  schedule();
})();