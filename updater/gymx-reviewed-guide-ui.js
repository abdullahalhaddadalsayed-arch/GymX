/* GymX: QA-reviewed two-position movement guides, curated per exercise.
 * This UI never claims that unreviewed photos are verified start/end poses. */
(() => {
  "use strict";
  const data = window.GYMX_REVIEWED_GUIDES;
  if (!data || !Array.isArray(data.guides) || typeof EXERCISES === "undefined") return;
  const reviewed = new Map(data.guides.map(g=>[g.sourceId,g]));
  const exercises = new Map(EXERCISES.map(e=>[String(e.id),e]));
  const match = id => {
    const e=exercises.get(String(id));
    return e ? reviewed.get(e.sourceId) : null;
  };
  let reviewedOnly = false;
  let queued = false;

  function node(tag, cls, text) {
    const el=document.createElement(tag);
    if(cls) el.className=cls;
    if(text!==undefined) el.textContent=text;
    return el;
  }
  function updateLibrary() {
    const root=document.querySelector("main.body");
    if (!root || !root.querySelector("h1")?.textContent.includes("Explore exercises")) return;
    const results=root.querySelector("#exercise-results");
    if(!results) return;

    let section=root.querySelector("#gx-review-toolbar");
    if(!section) {
      section=node("div","gx-review-toolbar");
      section.id="gx-review-toolbar";
      const header=node("div","gx-review-heading");
      header.append(node("span","gx-review-status","MOVEMENT GUIDES"));
      header.append(node("span","gx-review-total",data.verifiedCount+" photo-reviewed"));
      const btn=node("button","gx-review-filter","Only reviewed guides");
      btn.id="gx-review-only";
      btn.type="button";
      btn.addEventListener("click",()=>{
        reviewedOnly=!reviewedOnly;
        refresh();
      });
      section.append(header,btn,node("div","gx-review-count"));
      const search=root.querySelector(".searchbox");
      if(search) search.after(section); else results.before(section);
    }
    const button=section.querySelector("#gx-review-only");
    if(button) {
      button.classList.toggle("active",reviewedOnly);
      button.setAttribute("aria-pressed",String(reviewedOnly));
      button.textContent=reviewedOnly ? "✓ Showing reviewed guides" : "Only reviewed guides";
    }
    let shown=0,verified=0;
    for(const row of results.querySelectorAll(".exercise-row")) {
      const action=row.querySelector("[data-id]");
      const guide=action && match(action.getAttribute("data-id"));
      const badge=row.querySelector(".gx-review-card-badge");
      if (guide && !badge) {
        const b=node("span","gx-review-card-badge","START / END ✓");
        const textCell=row.querySelector(".meta") || action || row;
        textCell.appendChild(b);
      } else if(!guide && badge) badge.remove();
      if(guide) verified++;
      const visible = !reviewedOnly || !!guide;
      row.style.display=visible?"":"none";
      if(visible) shown++;
    }
    const stat=section.querySelector(".gx-review-count");
    if(stat) stat.textContent=reviewedOnly
      ? shown+" reviewed exercises match your current filters"
      : verified+" reviewed movement guides in these results; other exercises have reference photos and instructions.";
  }

  function setLabel(frame,text) {
    let label=frame.querySelector(".gymx-frame-label");
    if(!label) {
      label=node("span","gymx-frame-label");
      frame.appendChild(label);
    }
    label.textContent=text;
  }

  function frameFor(img) {
    let frame=img.closest(".gymx-guide-frame");
    if(frame) return frame;
    frame=node("div","gymx-guide-frame");
    img.replaceWith(frame);
    frame.appendChild(img);
    return frame;
  }

  function updateDetails() {
    const modal=document.querySelector("#modal-layer .modal");
    if(!modal || !modal.querySelector(".modal-header")?.textContent.includes("EXERCISE DETAILS")) return;
    const action=modal.querySelector('[data-act="add-exercise-session"][data-id]');
    if(!action) return;
    const id=String(action.getAttribute("data-id"));
    if(modal.dataset.gxReviewedMounted===id) return;
    const guide=match(id);
    const holder=modal.querySelector(".freedb-photos");
    if(!holder) {
      modal.dataset.gxReviewedMounted=id;
      return;
    }
    const images=[...holder.querySelectorAll("img")];
    if(images.length<2) {
      modal.dataset.gxReviewedMounted=id;
      return;
    }

    const frames=images.slice(0,2).map(frameFor);
    const wrapper=holder.closest(".poster") || holder.parentElement;
    const existingBanner=wrapper?.querySelector(".gx-guide-review-badge");
    if(existingBanner) existingBanner.remove();
    const banner=node("div","gx-guide-review-badge");
    if(guide) {
      banner.classList.add("verified");
      banner.textContent="✓ PHOTO-REVIEWED MOVEMENT  ·  2 POSITIONS";
    } else {
      banner.textContent="REFERENCE PHOTOS  ·  MOVEMENT ORDER NOT REVIEWED";
    }
    wrapper?.insertBefore(banner,holder);
    const oldNote=holder.parentElement?.querySelector(".gymx-guide-caption");

    if(guide) {
      holder.classList.add("gx-reviewed-photos");
      const order=[frames[guide.startIndex],frames[guide.endIndex]];
      holder.replaceChildren(...order);
      [["START",guide.startCue],["END",guide.endCue]].forEach(([lbl,cue],i)=>{
        const f=order[i];
        setLabel(f,lbl);
        let caption=f.querySelector(".gx-guide-pose-cue");
        if(!caption) { caption=node("div","gx-guide-pose-cue"); f.append(caption); }
        caption.textContent=cue;
        const pic=f.querySelector("img");
        if(pic) pic.alt=lbl+" position for "+exercises.get(id).name+": "+cue;
      });
      if(oldNote) oldNote.textContent="START → END shows one motion phase. Return under control to complete the repetition.";
      const motion=node("div","gx-guide-motion");
      const dot=node("span","gx-guide-arrow","↗");
      const phrase=node("strong","",guide.motion);
      motion.append(dot,phrase,node("span","gx-guide-qualified","Photo order visually reviewed against the exercise."));
      wrapper?.appendChild(motion);
      const small=node("p","gx-guide-source","Reference photos: Free Exercise DB (Unlicense). Follow written instructions and equipment safety guidance.");
      wrapper?.appendChild(small);
    } else {
      frames.forEach((f,i)=>setLabel(f,"REFERENCE "+(i+1)));
      if(oldNote) oldNote.textContent="Two reference photographs are available, but their START/END order has not been individually reviewed.";
    }
    modal.dataset.gxReviewedMounted=id;
  }

  function refresh() { updateLibrary(); updateDetails(); }
  function schedule() {
    if (queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;refresh();});
  }
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  schedule();
})();