/* GymX static image quality layer (after 36 individually reviewed guides).
 * 1. Source-matched RepDB 512x512 WebP illustrations take priority for non-reviewed exercises.
 * 2. Existing individually reviewed photo pairs are preserved unchanged.
 * 3. Other existing photos are references only (never mislabeled START/END).
 * 4. No image -> honest written-instructions fallback.
 * No GIFs, video embedding, or changes to GymX user storage.
 */
(() => {
  "use strict";
  const info=window.GYMX_IMAGE_CATALOG;
  if (!info || !info.exercises || typeof EXERCISES==="undefined") return;
  const data=info.exercises;
  const catalogue=new Map(EXERCISES.map(x=>[String(x.id),x]));
  const verified=new Set((window.GYMX_REVIEWED_GUIDES?.guides||[]).map(x=>x.sourceId));
  function e(tag,cls,label) {
    const x=document.createElement(tag);
    if(cls)x.className=cls;
    if(label!==undefined)x.textContent=label;
    return x;
  }
  function image(url,alt) {
    const im=e("img");
    im.src=url;im.alt=alt;
    im.loading="lazy";im.decoding="async";
    im.addEventListener("error",()=>{
      im.closest(".gx-audit-frame")?.classList.add("gx-audit-image-failed");
      im.hidden=true;
    },{once:true});
    return im;
  }
  function validLegacy(ex) {
    return (ex.imagesLocal||[]).filter(p=>typeof p==="string"&&p.startsWith("freedb-images/"));
  }
  function reviewStatus(ex) {
    return verified.has(ex?.sourceId) && validLegacy(ex).length>=2;
  }
  function shownMedia(ex) {
    const item=data[String(ex.id)];
    if(reviewStatus(ex)) return {kind:"reviewed",list:validLegacy(ex).slice(0,2)};
    if(item?.images?.start && item?.images?.peak)
      return {kind:"publisher",list:[item.images.start,item.images.peak],repdb:item};
    if(item?.images?.main)
      return {kind:"publisher-single",list:[item.images.main],repdb:item};
    if(item?.thumbnail && /_reference$/.test(item.kind||""))
      return {kind:"category",list:[item.thumbnail],category:item.kind};
    if(validLegacy(ex).length)
      return {kind:"legacy",list:validLegacy(ex).slice(0,2)};
    return {kind:"missing",list:[]};
  }
  function library() {
    const root=document.querySelector("main.body");
    if(!root || !root.querySelector("h1")?.textContent.includes("Explore exercises"))return;
    for(const row of root.querySelectorAll(".exercise-row")) {
      const a=row.querySelector("[data-id]");
      const ex=a&&catalogue.get(String(a.dataset.id));
      const icon=row.querySelector(".ex-icon");
      if(!ex || !icon)continue;
      const state=shownMedia(ex);
      const first=state.list[0];
      if(!first) {
        if(row.dataset.gxStaticThumbnail===String(ex.id))continue;
        row.dataset.gxStaticThumbnail=String(ex.id);
        icon.classList.add("gx-audit-no-photo");
        // Explicitly no photo, preserve original non-human category icon.
        continue;
      }
      const was=row.dataset.gxStaticThumbnail;
      if(was===first)continue;
      row.dataset.gxStaticThumbnail=first;
      icon.classList.remove("gx-audit-no-photo");
      icon.classList.toggle("gx-audit-category-icon",state.kind==="category");
      let existing=icon.querySelector("img.gx-audit-thumbnail");
      if(existing)existing.remove();
      if(state.kind==="reviewed")continue; // preserve photo quality as installed.
      const im=image(first,ex.name+" static exercise preview");
      im.className="gx-audit-thumbnail";
      im.addEventListener("load",()=>{
        icon.classList.add("gymx-photo-icon");
        for(const old of [...icon.querySelectorAll("img:not(.gx-audit-thumbnail)")])old.hidden=true;
      },{once:true});
      icon.appendChild(im);
    }
  }
  function mediaCard(ex,state) {
    const card=e("section","gx-audit-guide");
    card.dataset.gxAuditExercise=String(ex.id);
    const header=e("div","gx-audit-head");
    const kicker=e("strong","",state.kind==="legacy"?"EXERCISE REFERENCE PHOTOS":
      state.kind==="missing"?"MOVEMENT GUIDE":
      state.kind==="category"?"TARGET MUSCLE / EQUIPMENT REFERENCE":"STATIC MOVEMENT POSITIONS");
    const pill=e("span","gx-audit-pill",state.kind==="publisher"?"REPDB · TWO POSITIONS":
      state.kind==="publisher-single"?"REPDB · ONE POSITION":
      state.kind==="category"?"EQUIPMENT / MUSCLE ART":
      state.kind==="legacy"?"REFERENCE ONLY":"PHOTOS UNAVAILABLE");
    header.append(kicker,pill);
    card.append(header);
    if(state.list.length) {
      const grid=e("div","gx-audit-grid");
      if(state.list.length===1)grid.classList.add("single");
      for(let i=0;i<state.list.length;i++){
        const frame=e("div","gx-audit-frame");
        const badge=e("span","gx-audit-label",
          state.kind==="category"?(state.category==="equipment_reference"?"EQUIPMENT":"MUSCLE"):
          state.kind.startsWith("publisher")?
          (state.list.length>1?i===0?"POSITION 1":"POSITION 2":"STATIC POSITION"):
          (state.list.length>1?"REFERENCE "+(i+1):"REFERENCE"));
        frame.append(badge,image(state.list[i],ex.name+" "+badge.textContent.toLowerCase()));
        grid.append(frame);
      }
      card.append(grid);
    }
    let note;
    if(state.kind==="publisher")
      note="These two static poses are labeled start and peak by RepDB. GymX has matched the exercise title and equipment, but has not independently verified the movement direction. Follow the written instructions.";
    else if(state.kind==="publisher-single")
      note="A static RepDB exercise illustration is available. This is not a complete START/END demonstration; follow the written instructions.";
    else if(state.kind==="legacy")
      note="These are existing reference photos; their movement order has not been independently checked. Do not treat them as a verified START/END sequence.";
    else if(state.kind==="category")
      note="This licensed visual shows the equipment or muscle group only. It is not an exercise demonstration. No verified movement photos are available yet; follow the written instructions.";
    else
      note="No suitable static movement image is available for this exercise. Use the written instructions. An incorrect picture will not be substituted.";
    card.append(e("p","gx-audit-disclaimer",note));
    if(state.kind.startsWith("publisher") || state.kind==="category"){
      const credit=e("a","gx-audit-attribution","Exercise images by RepDB (repdb.co)");
      credit.href="https://repdb.co"; credit.target="_blank";credit.rel="noopener noreferrer";
      card.append(credit);
    }
    return card;
  }
  function details(){
    const modal=document.querySelector("#modal-layer .modal");
    if(!modal || !modal.querySelector(".modal-header")?.textContent.includes("EXERCISE DETAILS"))return;
    const a=modal.querySelector('[data-act="add-exercise-session"][data-id]');
    const ex=a&&catalogue.get(String(a.dataset.id));
    if(!ex)return;
    if(modal.dataset.gxStaticFor===String(ex.id))return;
    modal.dataset.gxStaticFor=String(ex.id);
    const state=shownMedia(ex);
    // Don't interfere with 36 individually reviewed photo guides.
    if(state.kind!=="reviewed"){
      const card=mediaCard(ex,state);
      const original=modal.querySelector(".poster,.freedb-poster,.gx-pending-photo");
      if(original)original.replaceWith(card);
      else {
        const header=modal.querySelector(".modal-header");
        if(header)header.after(card);
      }
      // Remove any now-stale label/badge added by earlier unreviewed layers.
      modal.querySelectorAll(".gx-guide-review-badge:not(.verified),.gx-guide-source:not(.verified),.gx-guide-motion:not(.verified)").forEach(x=>x.remove());
      modal.querySelectorAll(".freedb-photos:not(.gx-reviewed-photos)").forEach(x=>{
        if(!card.contains(x))x.remove();
      });
    }
  }
  function credits(){
    const modal=document.querySelector("#modal-layer .modal");
    if(!modal || !modal.textContent?.includes("Settings & backups") || modal.querySelector(".gx-image-credits"))return;
    const panel=e("div","gx-image-credits");
    panel.append(e("strong","","EXERCISE IMAGE CREDITS"));
    panel.append(e("p","","New static exercise illustrations: RepDB free tier (used with attribution). Existing reviewed photos: Free Exercise DB. Some older photo rights remain under review."));
    const link=e("a","","Exercise images by RepDB (repdb.co)");
    link.href="https://repdb.co";link.target="_blank";link.rel="noopener noreferrer";
    panel.append(link);
    modal.append(panel);
  }
  let scheduled=false;
  function work(){
    scheduled=false;
    library();details();credits();
  }
  new MutationObserver(()=>{
    if(!scheduled){scheduled=true;requestAnimationFrame(work);}
  }).observe(document.body,{childList:true,subtree:true});
  work();
})();