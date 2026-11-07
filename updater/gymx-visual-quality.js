/* GymX quality refresh: high-resolution licensed human anatomy and honest movement fallback.
   Built after the 36 reviewed movement guides, preserving all app data and IDs. */
(() => {
  "use strict";
  const known = new Set(["Chest","Back","Shoulders","Arms","Core","Legs"]);
  const groups = {
    front: {
      Chest: ["M76 72 Q94 67 109 76 L109 104 Q97 113 79 103 Z", "M111 76 Q128 66 145 72 L142 104 Q126 112 111 104 Z"],
      Shoulders: ["M65 65 Q51 69 49 91 L67 100 L83 74 Z","M153 65 Q168 69 171 91 L153 101 L138 74 Z"],
      Arms: ["M49 96 Q60 93 69 104 L61 144 L45 158 Q38 150 41 128 Z","M171 96 Q160 93 151 104 L159 144 L175 158 Q182 150 179 128 Z","M42 159 L58 153 L45 197 L37 185 Z","M178 159 L162 153 L175 197 L183 185 Z"],
      Core: ["M84 110 Q110 120 137 110 L134 164 Q108 176 86 162 Z"],
      Legs: ["M86 177 Q100 171 109 187 L102 246 L86 269 L76 233 Z","M111 187 Q120 171 134 177 L144 233 L135 268 L117 246 Z","M86 266 L102 261 L98 301 L86 303 Z","M135 266 L119 261 L123 301 L136 303 Z"]
    },
    back: {
      Back: ["M75 77 Q111 95 144 77 L154 120 L137 166 L111 178 L84 165 L65 119 Z"],
      Shoulders: ["M62 68 Q49 73 48 92 L68 103 L82 77 Z","M159 68 Q171 73 173 92 L153 103 L138 77 Z"],
      Arms: ["M51 97 Q61 96 69 105 L61 148 L47 159 L40 145 Z","M169 97 Q159 96 151 105 L159 148 L173 159 L180 145 Z","M46 160 L59 151 L46 195 L35 186 Z","M174 160 L161 151 L174 195 L185 186 Z"],
      Core: ["M89 157 Q111 169 132 156 L135 183 L113 189 L87 182 Z"],
      Legs: ["M83 177 Q98 174 109 190 L102 249 L85 268 L77 227 Z","M113 190 Q125 174 140 177 L144 228 L136 270 L119 249 Z","M87 265 L103 264 L99 302 L88 302 Z","M136 265 L120 264 L125 302 L137 302 Z"]
    }
  };
  const safe = v => String(v).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
  const catalog = typeof EXERCISES !== "undefined" ? new Map(EXERCISES.map(ex=>[String(ex.id),ex])) : new Map();
  const reviewed = new Set((window.GYMX_REVIEWED_GUIDES?.guides || []).map(x=>x.sourceId));

  function diagram(view,selection,interactive) {
    const side=view==="back"?"back":"front";
    const selected=known.has(selection)?selection:"";
    const clickable=interactive!==false;
    const parts=Object.entries(groups[side]).map(([muscle,paths])=>
      '<g class="gx-quality-zone gymx-region'+(selected===muscle?' active':'')+'"'+
      (clickable?' role="button" tabindex="0" data-act="filter-muscle" data-muscle="'+muscle+'"':' aria-hidden="true"')+
      '><title>'+muscle+'</title>'+paths.map(d=>'<path d="'+d+'"/>').join("")+'</g>').join("");
    return '<svg class="body-map gymx-anatomy-map gx-hires-body" data-gx-quality="1" viewBox="0 0 220 330" '+
      'role="img" aria-label="High-resolution male '+side+' anatomy muscle selector" preserveAspectRatio="xMidYMid meet">'+
      '<rect x="0" y="0" width="220" height="330" rx="16" fill="#0f181d"/>'+
      '<image class="gx-hires-photo" x="0" y="0" width="220" height="330" preserveAspectRatio="xMidYMid meet" href="gx-human-'+side+'.webp"/>'+parts+
      '</svg>';
  }

  // Top-level render function is replaced by the original app on each page change;
  // override it once while retaining the existing click handlers.
  window.diagramSvg = (view,selected) => diagram(view,selected,true);

  // The original fallback was a stylized person that could be mistaken for a form guide.
  // For non-reviewed exercises, retain written instructions, but do not imply START/END validation.
  const originalPoster = window.exercisePoster;
  if (typeof originalPoster === "function") {
    window.exercisePoster = function(ex) {
      const valid=ex && reviewed.has(ex.sourceId) &&
        Array.isArray(ex.imagesLocal) && ex.imagesLocal.length>=2;
      if (valid) return originalPoster(ex);
      const name=safe(ex?.name || "Exercise");
      return '<div class="poster gx-pending-photo" role="status">'+
        '<div class="gx-pending-symbol" aria-hidden="true">↗</div>'+
        '<div class="gx-pending-overline">MOVEMENT VISUALS</div>'+
        '<strong>START / END images being prepared</strong>'+
        '<p>We have not verified a movement-photo pair for '+name+'. Follow the written instructions below.</p>'+
        '</div>';
    };
  }

  function reconcile() {
    // Older layers can render cached low-res maps. Replace only those.
    const main=document.querySelector("main.body");
    if(main && main.querySelector("h1")?.textContent.includes("Explore exercises")){
      const selector=main.querySelector(".gx-anatomy, svg.body-map:not(.gx-hires-body)");
      if(selector){
        const view=main.querySelector('.body-view [data-view].active')?.getAttribute("data-view")||"front";
        const selected=main.querySelector('button[data-act="filter-muscle"].active')?.getAttribute("data-muscle")||"All";
        selector.outerHTML=diagram(view,selected,true);
      }
    }
    const modal=document.querySelector("#modal-layer .modal");
    if(!modal || !modal.querySelector(".modal-header")?.textContent.includes("EXERCISE DETAILS"))return;
    const mini=modal.querySelector(".gymx-mini-map");
    if(mini && !mini.querySelector(".gx-hires-body")) {
      const label=modal.querySelector(".gymx-target-muscle")?.textContent.trim()||"All";
      const view=["Chest","Arms","Core","Legs"].includes(label)?"front":"back";
      mini.innerHTML=diagram(view,label,false);
    }
    const button=modal.querySelector('[data-act="add-exercise-session"][data-id]');
    const id=button?.getAttribute("data-id");
    const ex=catalog.get(String(id));
    if(!ex || modal.dataset.gxPhotoQuality===id) return;
    const hasPair=reviewed.has(ex.sourceId)&&Array.isArray(ex.imagesLocal)&&ex.imagesLocal.length>=2;
    if(!hasPair){
      const poster=modal.querySelector(".freedb-poster,.poster:not(.gx-pending-photo)");
      if(poster){
        const box=document.createElement("div");
        box.className="poster gx-pending-photo";
        box.setAttribute("role","status");
        const symbol=document.createElement("div");
        symbol.className="gx-pending-symbol";
        symbol.setAttribute("aria-hidden","true");
        symbol.textContent="↗";
        const caption=document.createElement("div");
        caption.className="gx-pending-overline";
        caption.textContent="MOVEMENT VISUALS";
        const title=document.createElement("strong");
        title.textContent="START / END images being prepared";
        const note=document.createElement("p");
        note.textContent="This exercise has no individually reviewed movement-photo pair. See the written instructions below.";
        box.append(symbol,caption,title,note);
        poster.replaceWith(box);
      }
      const badges=modal.querySelectorAll(".gx-guide-review-badge,.gx-guide-motion,.gx-guide-source");
      badges.forEach(el=>el.remove());
    }
    modal.dataset.gxPhotoQuality=id;
  }
  let queued=false;
  const schedule=()=>{
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;reconcile();});
  };
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  document.addEventListener("keydown",e=>{
    if(e.key!=="Enter"&&e.key!==" ")return;
    const region=e.target.closest?.(".gx-quality-zone[data-muscle]");
    if(!region)return;
    e.preventDefault();
    region.dispatchEvent(new MouseEvent("click",{bubbles:true}));
  });
  schedule();
})();