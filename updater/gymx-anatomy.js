/* GymX Realistic Male Body Selector — offline original assets.
 * Interactive muscle zones sit over matching front/back photorealistic illustrations.
 * Uses existing data-act=filter-muscle events, so exercise filters and saved data are untouched.
 */
(() => {
  "use strict";
  const original = window.diagramSvg;
  if(typeof original !== "function") return;
  const FRONT = {
    Chest: [
      "M61 90 Q81 82 97 95 L97 139 Q77 145 62 134 Z",
      "M98 95 Q115 82 133 90 L132 134 Q116 145 98 139 Z"
    ],
    Shoulders: [
      "M56 82 Q40 83 35 105 L46 123 Q62 118 68 101 Z",
      "M137 82 Q153 83 159 105 L147 123 Q131 118 125 101 Z"
    ],
    Arms: [
      "M36 112 Q27 142 25 183 L35 214 L44 201 L51 126 Z",
      "M158 112 Q167 142 169 183 L159 214 L150 201 L143 126 Z"
    ],
    Core: [
      "M72 140 Q97 151 123 140 L118 211 Q100 224 76 209 Z"
    ],
    Legs: [
      "M64 237 Q81 232 97 244 L87 385 L57 384 Z",
      "M98 243 Q114 232 132 238 L139 384 L110 385 Z"
    ]
  };
  const BACK = {
    Back: [
      "M65 91 Q95 108 127 91 L145 128 L124 203 L97 219 L70 203 L49 128 Z"
    ],
    Shoulders: [
      "M55 83 Q37 83 32 105 L45 125 L68 102 Z",
      "M139 83 Q157 83 162 105 L149 125 L126 102 Z"
    ],
    Arms: [
      "M36 114 Q25 143 26 189 L37 213 L50 133 Z",
      "M158 114 Q169 143 168 189 L157 213 L144 133 Z"
    ],
    Core: [
      "M80 174 L114 174 L124 218 L97 229 L70 218 Z"
    ],
    Legs: [
      "M64 228 Q83 218 97 238 L88 391 L56 390 Z",
      "M98 238 Q114 218 132 228 L139 390 L107 391 Z"
    ]
  };
  const toSafe = s => String(s).replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;");
  const group = (name,paths,selected) => {
    const cls = name === selected ? "gx-zone active" : "gx-zone";
    return '<g role="button" tabindex="0" aria-label="Filter '+name+' exercises" data-act="filter-muscle" data-muscle="'+name+'" class="'+cls+'">'+
      paths.map(d=>'<path d="'+d+'"/>').join("")+
      '</g>';
  };
  window.diagramSvg = (view,selected) => {
    const back = view === "back";
    const zones = back ? BACK : FRONT;
    const url = back ? "gx-human-back.webp" : "gx-human-front.webp";
    const active = Object.keys(zones).includes(selected) ? selected : "";
    return '<div class="gx-anatomy">'+
      '<div class="gx-human-stage">'+
        '<div class="gx-human-map">'+
          '<img class="gx-human-model" alt="'+(back?"Realistic male back anatomy":"Realistic male front anatomy")+'" src="'+url+'" width="194" height="440" draggable="false"/>'+
          '<svg class="gx-human-hotspots" viewBox="0 0 194 440" role="group" aria-label="Tap a highlighted muscle area to filter exercises">'+
          Object.keys(zones).map(name=>group(name,zones[name],active)).join("")+
          '</svg>'+
        '</div>'+
      '</div>'+
      '<div class="gx-figure-foot"><span class="gx-status-dot"></span> '+(selected!=="All" ? toSafe(selected).toUpperCase()+" SELECTED · " : "")+'TAP A MUSCLE TO FILTER</div>'+
    '</div>';
  };
  document.addEventListener("keydown",event=>{
    const el=event.target.closest?.(".gx-zone");
    if(!el || (event.key!=="Enter" && event.key!==" ")) return;
    event.preventDefault();
    el.dispatchEvent(new MouseEvent("click",{bubbles:true}));
  });
})();