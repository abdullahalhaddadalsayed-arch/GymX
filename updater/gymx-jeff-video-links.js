/* GymX — Jeff Nippard video links (external YouTube only; no videos copied).
 * Six videos have verified Jeff Nippard authorship and muscle-specific relevance.
 * A handful of exercise technique links include YouTube timestamps.
 * Every other exercise gets a clearly labelled Jeff channel search instead of invented URLs.
 */
(() => {
  "use strict";
  if (typeof EXERCISES === "undefined" || !Array.isArray(EXERCISES)) return;

  const exercises = new Map(EXERCISES.map(ex=>[String(ex.id),ex]));
  const playlist = Object.freeze({
    Chest: {id:"7qFp5khuoFA",title:"Jeff Nippard · Chest and back workout"},
    Back: {id:"didU4ZwAkPI",title:"Jeff Nippard · Back-focused workout"},
    Shoulders:{id:"FbWfA_s0XL8",title:"Jeff Nippard · Shoulder-focused workout"},
    Arms:{id:"LV9OeFhQpRI",title:"Jeff Nippard · Arm workout"},
    Legs:{id:"Y4Vv2ASsyhs",title:"Jeff Nippard · Science-based leg workout"},
    Core:{id:"Tn-XvYG9x7w",title:"Jeff Nippard · Training your abs"}
  });

  // Direct links are relevant demonstrations within the video,
  // not presented as exclusive, standalone exercise tutorials.
  function technique(ex) {
    const n=String(ex?.name||"").toLowerCase();
    if(/(?:incline dumbbell press)/.test(n))
      return {id:"PEiIOW7HGnA",title:"Jeff demonstrates incline dumbbell press form"};
    if(/(?:lat pulldown|lat pull.down)/.test(n))
      return {id:"PEiIOW7HGnA",title:"Jeff demonstrates lat pulldown form"};
    if(/(?:lateral raise)/.test(n))
      return {id:"SgyUoY0IZ7A",s:100,title:"Jeff discusses dumbbell lateral raises"};
    if(/(?:seated dumbbell shoulder press|dumbbell shoulder press)/.test(n))
      return {id:"SgyUoY0IZ7A",s:325,title:"Jeff discusses dumbbell shoulder presses"};
    if(/(?:face pull)/.test(n))
      return {id:"SgyUoY0IZ7A",s:661,title:"Jeff discusses rope face pulls"};
    if(/(?:upright (?:barbell )?row)/.test(n))
      return {id:"SgyUoY0IZ7A",s:595,title:"Jeff discusses upright rows"};
    if(/(?:front dumbbell raise|front raise)/.test(n))
      return {id:"SgyUoY0IZ7A",s:405,title:"Jeff discusses front raises"};
    return null;
  }

  function muscleGroup(ex) {
    const m=String(ex?.muscle||"").toLowerCase();
    const name=String(ex?.name||"").toLowerCase();
    if(/chest|pector/.test(m))return "Chest";
    if(/lat|back|trapezi|rhomboid/.test(m))return "Back";
    if(/shoulder|deltoid/.test(m))return "Shoulders";
    if(/bicep|tricep|arm|forearm/.test(m))return "Arms";
    if(/quad|hamstring|leg|calf|calves|glute/.test(m))return "Legs";
    if(/core|abdom|oblique/.test(m))return "Core";
    if(/cardio|running|treadmill|cycling|bike|rowing machine/.test(m+" "+name))return null;
    return Object.keys(playlist).includes(ex?.muscle)?ex.muscle:null;
  }

  function link(video) {
    return "https://www.youtube.com/watch?v="+video.id+(video.s?"&t="+video.s+"s":"");
  }
  function channelSearch(ex) {
    const term=String(ex?.name||"exercise").replace(/[^A-Za-z0-9 ,()+\-]/g," ").trim().slice(0,90);
    return "https://www.youtube.com/@jeffnippard/search?query="+encodeURIComponent(term);
  }
  function openYouTube(url) {
    try {
      if(typeof window.GymXNative?.openJeffVideo === "function") {
        window.GymXNative.openJeffVideo(url);
      } else {
        window.open(url,"_blank","noopener,noreferrer");
      }
    } catch (_) {
      // Even if an Android intent isn't available, leave a usable HTTPS link.
      const link=document.createElement("a");
      link.href=url;link.target="_blank";link.rel="noopener noreferrer";
      link.click();
    }
  }
  function el(tag,cls,text) {
    const n=document.createElement(tag);
    if(cls)n.className=cls;
    if(text!==undefined)n.textContent=text;
    return n;
  }

  let scheduled=false;
  function attach() {
    const modal=document.querySelector("#modal-layer .modal");
    if(!modal || !modal.querySelector(".modal-header")?.textContent.includes("EXERCISE DETAILS"))return;
    const control=modal.querySelector('[data-act="add-exercise-session"][data-id]');
    if(!control)return;
    const id=String(control.getAttribute("data-id"));
    if(modal.querySelector(".gymx-jeff-video-card")?.dataset.exerciseId===id)return;
    const ex=exercises.get(id);
    if(!ex)return;

    const old=modal.querySelector(".gymx-jeff-video-card");
    if(old)old.remove();
    const group=muscleGroup(ex);
    const specific=technique(ex);
    const recommendation=specific || (group?playlist[group]:null);

    const card=el("section","gymx-jeff-video-card");
    card.dataset.exerciseId=id;
    const header=el("div","gymx-jeff-video-heading");
    header.append(el("span","gymx-jeff-video-icon","▶"));
    header.append(el("strong","","JEFF NIPPARD · VIDEO GUIDES"));
    card.append(header);

    const hint=el("p","gymx-jeff-video-note",
      recommendation
        ? specific
          ? "Related technique segment on Jeff Nippard's official YouTube channel."
          : "Relevant muscle-group workout from Jeff Nippard. It may not demonstrate this exact exercise."
        : "Search Jeff Nippard's channel for this exercise. An exact video has not been verified."
    );
    card.append(hint);

    if(recommendation) {
      const videoButton=el("button","gymx-jeff-video-primary",
        (specific?"Watch technique clip":"Watch "+group+" workout")+" ↗");
      videoButton.type="button";
      videoButton.setAttribute("aria-label",recommendation.title+" on YouTube");
      videoButton.addEventListener("click",e=>{e.preventDefault();openYouTube(link(recommendation));});
      card.append(videoButton);
    }
    const searchButton=el("button","gymx-jeff-video-secondary","Search Jeff's channel for this exercise ↗");
    searchButton.type="button";
    searchButton.addEventListener("click",e=>{e.preventDefault();openYouTube(channelSearch(ex));});
    card.append(searchButton);
    card.append(el("p","gymx-jeff-video-footer",
      "Opens YouTube · Internet required · GymX is independent of Jeff Nippard."));
    const target=modal.querySelector(".gx-detail-muscles,.gymx-target-card,.gx-detail-summary,.modal-header");
    if(target)target.after(card);else modal.prepend(card);
  }
  function schedule() {
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;attach();});
  }
  new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true});
  schedule();
})();