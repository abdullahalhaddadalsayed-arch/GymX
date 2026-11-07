/* GymX external instructional videos: Jeff Nippard's verified YouTube channel.
 * Curated links jump to named movements in Jeff's published videos.
 * Other exercises search his channel rather than pretending an exact video match.
 * No copied video content, no downloaded YouTube media, no workout data changes.
 */
(() => {
  "use strict";
  const CHANNEL = "https://www.youtube.com/@JeffNippard";
  const searchUrl = term => CHANNEL + "/search?query=" + encodeURIComponent(term);
  const ids = {
    chest:"fGm-ef-4PVk",
    back:"jLvqKgW-_G8",
    shoulder:"SgyUoY0IZ7A",
    quads:"kIXcoivzGf8",
    biceps:"GNO4OtYoCYk",
    triceps:"OpRMRhr0Ycc"
  };
  // Published chapter titles and timestamps, each checked against Jeff's YouTube descriptions.
  // Keep the most specific regex before broader movement families.
  const segments = [
    // CHEST
    [/incline.*smith.*(bench|press)|smith.*incline.*(bench|press)/i,"chest",586,"Incline Smith machine press"],
    [/smith.*(flat|bench).*press/i,"chest",568,"Smith machine bench press"],
    [/incline.*dumbbell.*press/i,"chest",256,"Incline dumbbell press"],
    [/decline.*dumbbell.*press/i,"chest",265,"Decline dumbbell press"],
    [/(flat|dumbbell bench).*dumbbell.*press|^dumbbell bench press$/i,"chest",215,"Flat dumbbell press"],
    [/incline.*bench press|incline.*barbell.*press/i,"chest",153,"Incline bench press"],
    [/decline.*bench press|decline.*barbell.*press/i,"chest",176,"Decline bench press"],
    [/^(barbell )?bench press|barbell bench press/i,"chest",107,"Bench press"],
    [/machine.*chest.*press|chest.*press.*machine/i,"chest",276,"Machine chest press"],
    [/pec.*deck|butterfly/i,"chest",669,"Pec deck"],
    [/cable.*(fly|crossover)|crossover.*cable/i,"chest",614,"Cable fly/crossover"],
    [/dumbbell.*fly|fly.*dumbbell/i,"chest",692,"Dumbbell fly"],
    [/floor.*press/i,"chest",789,"Floor press"],
    [/deficit.*push.?up/i,"chest",405,"Deficit push-up"],
    [/push.?up/i,"chest",352,"Push-up"],
    [/dip/i,"chest",308,"Dips"],
    // BACK
    [/chest.supported.*row/i,"back",533,"Chest-supported row"],
    [/one.arm.*dumbbell.*row|one arm.*dumbbell.*row/i,"back",446,"One-arm dumbbell row"],
    [/meadows.*row/i,"back",388,"Meadows row"],
    [/pendlay.*row/i,"back",351,"Pendlay row"],
    [/barbell.*row|bent.*over.*row/i,"back",299,"Barbell row"],
    [/seated.*cable.*row|cable.*row/i,"back",562,"Cable row"],
    [/neutral.*(lat )?pulldown/i,"back",239,"Neutral-grip lat pulldown"],
    [/lat.*pulldown|pulldown.*lat|pull.?down/i,"back",218,"Lat pulldown"],
    [/chin.?up/i,"back",203,"Chin-up"],
    [/pull.?up/i,"back",166,"Pull-up"],
    [/deadlift/i,"back",100,"Deadlift (back hypertrophy discussion)"],
    // SHOULDERS
    [/reverse.*pec.*deck/i,"shoulder",626,"Reverse pec deck"],
    [/face.*pull/i,"shoulder",661,"Rope face pull"],
    [/reverse.*(fly|flye)/i,"shoulder",696,"Reverse dumbbell fly"],
    [/side.*lateral.*raise|standing.*dumbbell.*lateral.*raise/i,"shoulder",100,"Dumbbell lateral raise"],
    [/cable.*lateral.*raise/i,"shoulder",477,"Cable lateral raise"],
    [/lateral.*raise/i,"shoulder",100,"Lateral raise"],
    [/front.*raise/i,"shoulder",405,"Front raise"],
    [/upright.*row/i,"shoulder",595,"Upright row"],
    [/dumbbell.*shoulder.*press|seated.*dumbbell.*press/i,"shoulder",325,"Dumbbell overhead press"],
    [/machine.*shoulder.*press/i,"shoulder",349,"Machine shoulder press"],
    [/shoulder.*press|military.*press|overhead.*press/i,"shoulder",230,"Overhead press"],
    // QUADS
    [/smith.*squat/i,"quads",325,"Smith machine squat"],
    [/hack.*squat/i,"quads",276,"Hack squat"],
    [/bulgarian.*split.*squat/i,"quads",574,"Bulgarian split squat"],
    [/goblet.*squat/i,"quads",530,"Goblet squat"],
    [/front.*squat/i,"quads",184,"Front squat"],
    [/barbell.*squat|back.*squat|full.*squat/i,"quads",121,"Back squat"],
    [/leg.*extension/i,"quads",425,"Leg extension"],
    [/leg.*press/i,"quads",350,"Leg press"],
    [/lunge/i,"quads",399,"Lunge"],
    // BICEPS
    [/preacher.*hammer.*curl/i,"biceps",855,"Preacher hammer curl"],
    [/hammer.*curl/i,"biceps",786,"Hammer curl"],
    [/incline.*curl/i,"biceps",320,"Incline curl"],
    [/preacher.*curl/i,"biceps",265,"Preacher curl"],
    [/cable.*curl/i,"biceps",612,"Cable curl"],
    [/spider.*curl/i,"biceps",491,"Spider curl"],
    [/barbell.*curl|ez.*bar.*curl/i,"biceps",116,"Barbell curl"],
    [/dumbbell.*curl|alternate.*curl|seated.*curl/i,"biceps",217,"Dumbbell curl"],
    // TRICEPS
    [/rope.*push.?down|push.?down.*rope/i,"triceps",60,"Rope triceps pressdown"],
    [/push.?down|triceps.*pressdown/i,"triceps",129,"Triceps pressdown"],
    [/overhead.*(extension|triceps).*cable|cable.*overhead.*extension/i,"triceps",193,"Overhead cable extension"],
    [/overhead.*dumbbell.*extension|dumbbell.*overhead.*extension/i,"triceps",390,"Dumbbell overhead extension"],
    [/skull.*crush/i,"triceps",410,"Skullcrusher"],
    [/kickback/i,"triceps",600,"Triceps kickback"],
    [/bench.*dip/i,"triceps",680,"Bench dips"],
    [/close.?grip.*bench/i,"triceps",728,"Close-grip bench press"],
    [/triceps.*dip/i,"triceps",645,"Triceps dips"],
  ];

  const catalog = typeof EXERCISES !== "undefined" && Array.isArray(EXERCISES)
    ? new Map(EXERCISES.map(ex=>[String(ex.id),ex])) : new Map();

  function choose(ex) {
    const name=String(ex.name||"Exercise").trim();
    const rawGroup=[ex.muscle,...(ex.primaryMuscles||[])].filter(Boolean).join(" ").toLowerCase();
    const group = /biceps/.test(rawGroup)?"biceps":/triceps/.test(rawGroup)?"triceps":
      /shoulder|deltoid/.test(rawGroup)?"shoulder":
      /quadriceps|quad/.test(rawGroup)?"quads":/chest|pectoral/.test(rawGroup)?"chest":
      /back|lat|trap|rhomboid/.test(rawGroup)?"back":null;

    // Matching the title AND target family prevents similarly named but different exercises
    // from being presented as the same video.
    for(const [pattern,video,t,label] of segments) {
      if(pattern.test(name) && (group===video ||
          (video==="back" && /deadlift|row|pulldown|pull.up/.test(name.toLowerCase())) ||
          (video==="chest" && /press|fly|dip|push.up/.test(name.toLowerCase()) && /chest/.test(rawGroup)))) {
        return {url:"https://www.youtube.com/watch?v="+ids[video]+"&t="+t+"s",
          label:"Watch Jeff cover this exercise", detail:label,
          mode:"chapter"};
      }
    }
    const q=name + " " + (ex.muscle||"") + " exercise";
    return {url:searchUrl(q), label:"Find this exercise on Jeff's channel",
      detail:"Search results; exact demonstration not verified",mode:"search"};
  }

  function create(tag,cls,value) {
    const node=document.createElement(tag);
    if(cls) node.className=cls;
    if(value!==undefined) node.textContent=value;
    return node;
  }
  function mount() {
    const modal=document.querySelector("#modal-layer .modal");
    if(!modal || !modal.querySelector(".modal-header")?.textContent.includes("EXERCISE DETAILS")) return;
    const action=modal.querySelector('[data-act="add-exercise-session"][data-id]');
    if(!action)return;
    const id=String(action.getAttribute("data-id"));
    const ex=catalog.get(id);
    if(!ex || modal.querySelector("#gx-jeff-video")) return;

    const match=choose(ex);
    const block=create("section","gx-jeff-video");
    block.id="gx-jeff-video";
    const heading=create("div","gx-jeff-heading");
    heading.append(create("span","gx-jeff-dot"));
    heading.append(create("strong","", "VIDEO TUTORIAL · JEFF NIPPARD"));
    block.append(heading);
    const link=create("a","gx-jeff-button",match.label);
    link.setAttribute("href",match.url);
    link.setAttribute("target","_blank");
    link.setAttribute("rel","noopener noreferrer");
    link.setAttribute("aria-label",match.label+" for "+ex.name+" (opens YouTube)");
    link.append(create("span","gx-jeff-arrow","↗"));
    block.append(link);
    block.append(create("div","gx-jeff-detail",match.mode==="chapter"
      ? "Opens at: "+match.detail+" · Jeff Nippard's video"
      : "Searches Jeff's channel for "+ex.name));
    const footer=create("p","gx-jeff-disclaimer",
      "Opens YouTube · internet required · videos belong to Jeff Nippard. GymX is not affiliated.");
    block.append(footer);
    if(match.mode==="chapter"){
      const more=create("a","gx-jeff-secondary","More videos from Jeff's channel");
      more.href=searchUrl(ex.name);
      more.target="_blank";more.rel="noopener noreferrer";
      block.append(more);
    }
    const title=modal.querySelector(".gx-detail-kicker,.modal-header");
    title.after(block);
  }

  let pending=false;
  const schedule=()=>{
    if(pending)return;
    pending=true;
    requestAnimationFrame(()=>{pending=false;mount();});
  };
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  schedule();
})();