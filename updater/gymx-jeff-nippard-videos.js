/* GymX → Jeff Nippard videos: links to official-channel videos and relevant chapters.
 * No YouTube media is downloaded or rehosted. This feature requires internet.
 * Exact chapter matches are distinguished from topic overviews and channel searches.
 */
(() => {
  "use strict";
  if (typeof EXERCISES === "undefined" || !Array.isArray(EXERCISES)) return;
  const byId=new Map(EXERCISES.map(x=>[String(x.id),x]));
  const CHANNEL="https://www.youtube.com/@jeffnippard";
  const source={
    chest:{id:"fGm-ef-4PVk",title:"The Best And Worst Chest Exercises (Ranked By Science)"},
    back:{id:"jLvqKgW-_G8",title:"The Best And Worst Back Exercises (Ranked By Science)"},
    shoulder:{id:"SgyUoY0IZ7A",title:"The Best And Worst Shoulder Exercises"},
    biceps:{id:"GNO4OtYoCYk",title:"The Best And Worst Biceps Exercises"},
    triceps:{id:"OpRMRhr0Ycc",title:"The Best & Worst TRICEPS Exercises (Ranked Using Science)"},
    quadriceps:{id:"kIXcoivzGf8",title:"The Best & Worst QUAD Exercises (Ranked Using Science)"},
    glutes:{id:"3ryh7PNhz3E",title:"The Best & Worst Glute Exercises (According To Science)"}
  };
  // Timestamp seconds are transcribed from Jeff's official video chapter descriptions.
  // Ordering matters: specific exercise variants before generic names.
  const chapters=[
    {group:"chest",name:"Incline Dumbbell Press",regex:/incline.*dumbbell.*press/,time:256},
    {group:"chest",name:"Incline Bench Press",regex:/(incline.*(?:barbell|bench).*press|incline smith machine press)/,time:153},
    {group:"chest",name:"Flat Dumbbell Press",regex:/dumbbell.*(?:bench|chest).*press|flat.*dumbbell.*press/,time:215},
    {group:"chest",name:"Machine Chest Press",regex:/machine.*chest.*press|chest.*press.*machine/,time:276},
    {group:"chest",name:"Barbell Bench Press",regex:/(?:barbell.*bench.*press|flat.*bench.*press|bench press)/,time:107},
    {group:"chest",name:"Pec Deck",regex:/pec.?deck|butterfly/,time:669},
    {group:"chest",name:"Cable Crossover",regex:/cable.*(?:crossover|cross.over)/,time:614},
    {group:"chest",name:"Dumbbell Flye",regex:/dumbbell.*(?:fly|flye)/,time:692},
    {group:"chest",name:"Push-Up",regex:/push.?ups?/,time:352},
    {group:"chest",name:"Dips",regex:/\bdips?\b/,time:308},
    {group:"back",name:"One-Arm Dumbbell Row",regex:/one.?arm.*dumbbell.*row|single.?arm.*dumbbell.*row/,time:446},
    {group:"back",name:"Barbell Row",regex:/barbell.*row|bent.?over.*row/,time:299},
    {group:"back",name:"Cable Row",regex:/seated.*cable.*row|cable.*row/,time:562},
    {group:"back",name:"Lat Pulldown",regex:/lat.*pull.?down/,time:218},
    {group:"back",name:"Pull-Up",regex:/pull.?ups?/,time:166},
    {group:"back",name:"Chin-Up",regex:/chin.?ups?/,time:203},
    {group:"back",name:"Face Pull",regex:/face.?pull/,time:590},
    {group:"back",name:"Deadlift",regex:/\bdeadlift\b/,time:100},
    {group:"biceps",name:"Hammer Curl",regex:/hammer.*curl/,time:786},
    {group:"biceps",name:"Incline Curl",regex:/incline.*curl/,time:320},
    {group:"biceps",name:"Preacher Curl",regex:/preacher.*curl/,time:265},
    {group:"biceps",name:"EZ-Bar Curl",regex:/ez.?bar.*curl/,time:165},
    {group:"biceps",name:"Dumbbell Curl",regex:/dumbbell.*curl|alternat(?:e|ing).*curl/,time:217},
    {group:"biceps",name:"Barbell Curl",regex:/barbell.*curl/,time:116},
    {group:"biceps",name:"Cable Curl",regex:/cable.*curl/,time:612},
    {group:"triceps",name:"Rope Pressdown",regex:/(rope.*(?:pressdown|pushdown)|(?:pressdown|pushdown).*rope)/,time:60},
    {group:"triceps",name:"Bar Pressdown",regex:/(triceps.*(?:pushdown|pressdown)|(?:pushdown|pressdown).*triceps)/,time:129},
    {group:"triceps",name:"Overhead Cable Extension",regex:/(overhead.*cable.*extension|cable.*overhead.*extension)/,time:193},
    {group:"triceps",name:"Overhead Dumbbell Extension",regex:/(overhead.*dumbbell.*extension|dumbbell.*overhead.*extension)/,time:390},
    {group:"triceps",name:"Skullcrusher",regex:/skull.?crush/,time:410},
    {group:"triceps",name:"Bench Dips",regex:/bench.*dips?/,time:680},
    {group:"triceps",name:"Close-Grip Bench Press",regex:/close.?grip.*bench.*press/,time:728},
    {group:"quadriceps",name:"Hack Squat",regex:/hack.*squat/,time:276},
    {group:"quadriceps",name:"Smith Machine Squat",regex:/smith.*squat/,time:325},
    {group:"quadriceps",name:"Leg Extension",regex:/leg.*extension/,time:425},
    {group:"quadriceps",name:"Leg Press",regex:/leg.*press/,time:350},
    {group:"quadriceps",name:"Bulgarian Split Squat",regex:/bulgarian.*squat|bulgarian.*split/,time:574},
    {group:"quadriceps",name:"Front Squat",regex:/front.*squat/,time:184},
    {group:"quadriceps",name:"Goblet Squat",regex:/goblet.*squat/,time:530},
    {group:"quadriceps",name:"Back Squat",regex:/barbell.*squat|full.*squat|back.*squat/,time:121},
    {group:"glutes",name:"Romanian Deadlift",regex:/romanian.*deadlift/,time:701},
    {group:"glutes",name:"Hip Thrust",regex:/hip.*thrust/,time:126},
    {group:"glutes",name:"Glute Bridge",regex:/glute.*bridge/,time:283},
    {group:"glutes",name:"Bulgarian Split Squat",regex:/bulgarian.*(?:squat|split)/,time:376},
    {group:"glutes",name:"Cable Kickback",regex:/kick.?back/,time:443}
  ];
  function muscleTopic(ex) {
    const group=String(ex.muscle||"").toLowerCase();
    const primary=Array.isArray(ex.primaryMuscles)?ex.primaryMuscles.join(" ").toLowerCase():"";
    const name=String(ex.name||"").toLowerCase();
    const text=group+" "+primary;
    if(/chest|pectoral/.test(text))return "chest";
    if(/biceps/.test(text))return "biceps";
    if(/triceps/.test(text))return "triceps";
    if(/shoulder|deltoid/.test(text))return "shoulder";
    if(/quadriceps|quad/.test(text))return "quadriceps";
    if(/glutes|gluteus/.test(text))return "glutes";
    if(/back|latissimus|lats|trapezius|middle back/.test(text))return "back";
    // Broad category fallbacks for exercises lacking detailed source muscles.
    if(group==="arms") return /tricep|pressdown|pushdown|extension|kickback|dip/.test(name)?"triceps":"biceps";
    if(group==="legs") return /hip thrust|glute|bridge/.test(name)?"glutes":/leg curl|hamstring|calf/.test(name)?null:"quadriceps";
    return null;
  }
  function choice(ex) {
    const group=muscleTopic(ex);
    const name=String(ex.name||"");
    const nameLo=name.toLowerCase();
    if(group && source[group]) {
      const chapter=chapters.find(c=>c.group===group&&c.regex.test(nameLo));
      if(chapter) return {
        quality:"chapter",label:"Exercise chapter · "+chapter.name,
        title:source[group].title,
        url:"https://www.youtube.com/watch?v="+source[group].id+"&t="+chapter.time+"s",
        note:"Official Jeff Nippard video · opens at the relevant exercise section."
      };
      return {
        quality:"topic",label:"Related "+group+" training video",
        title:source[group].title,
        url:"https://www.youtube.com/watch?v="+source[group].id,
        note:"Muscle-group overview. This video may not show the exact exercise variation."
      };
    }
    return {
      quality:"search",label:"Search this exercise on Jeff's channel",
      title:name,
      url:CHANNEL+"/search?query="+encodeURIComponent(name),
      note:"No confirmed direct video match. Search results open within Jeff Nippard's channel."
    };
  }
  function addVideo(modal) {
    if (!modal || !modal.querySelector(".modal-header")?.textContent.includes("EXERCISE DETAILS")) return;
    const action=modal.querySelector('[data-act="add-exercise-session"][data-id]');
    const id=action?.getAttribute("data-id");
    const ex=byId.get(String(id));
    if(!ex || modal.querySelector('.gx-jeff-video[data-for="'+CSS.escape(String(id))+'"]'))return;
    const found=choice(ex);
    const card=document.createElement("section");
    card.className="gx-jeff-video";
    card.dataset.for=String(id);
    card.setAttribute("aria-label","Jeff Nippard training video resource");
    const heading=document.createElement("div");
    heading.className="gx-jeff-header";
    const brand=document.createElement("span");
    brand.className="gx-jeff-creator";
    brand.textContent="JEFF NIPPARD  ·  YOUTUBE";
    const tag=document.createElement("span");
    tag.className="gx-jeff-match gx-jeff-"+found.quality;
    tag.textContent=found.quality==="chapter"?"Exercise section":found.quality==="topic"?"Muscle overview":"Channel search";
    heading.append(brand,tag);
    const title=document.createElement("div");
    title.className="gx-jeff-title";
    title.textContent=found.label;
    const sub=document.createElement("p");
    sub.className="gx-jeff-subtitle";
    sub.textContent=found.title;
    const link=document.createElement("a");
    link.className="gx-jeff-link";
    link.href=found.url;
    link.target="_self"; // Native GymX WebView intercepts YouTube navigation and opens YouTube/phone browser.
    link.rel="noopener noreferrer";
    link.setAttribute("aria-label","Open Jeff Nippard's YouTube training video for "+ex.name);
    link.textContent=found.quality==="search"?"Search Jeff's channel ↗":"Watch Jeff Nippard ↗";
    const note=document.createElement("p");
    note.className="gx-jeff-note";
    note.textContent=found.note+" · Internet connection required.";
    card.append(heading,title,sub,link,note);
    const target=modal.querySelector(".gymx-target-card");
    const summary=modal.querySelector(".gx-detail-summary");
    const guide=modal.querySelector(".gx-guide-motion");
    if(guide)guide.after(card);
    else if(target)target.after(card);
    else if(summary)summary.after(card);
    else modal.querySelector(".modal-header")?.after(card);
  }
  let pending=false;
  const schedule=()=> {
    if(pending)return;
    pending=true;
    requestAnimationFrame(()=>{
      pending=false;
      const layer=document.querySelector("#modal-layer .modal");
      if(layer)addVideo(layer);
    });
  };
  new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true});
  schedule();
})();