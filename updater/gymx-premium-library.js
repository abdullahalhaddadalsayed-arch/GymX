/* GymX v0.5 premium library: original male front/back anatomical illustrations, tappable muscle regions, target muscle details. */
(() => {
  "use strict";
  const groups = ["Chest", "Back", "Shoulders", "Arms", "Core", "Legs"];
  const shapes = {
    front: {
      Chest: [
        '<path d="M84 84 Q101 78 109 90 L109 113 Q96 121 80 111 Q73 94 84 84Z"/>',
        '<path d="M111 90 Q124 77 143 84 Q151 96 140 111 Q124 119 111 113Z"/>'
      ],
      Shoulders: [
        '<ellipse cx="73" cy="79" rx="17" ry="19"/>','<ellipse cx="154" cy="79" rx="17" ry="19"/>'
      ],
      Arms: [
        '<path d="M56 94 Q70 94 70 114 L61 160 Q51 177 39 165 L44 120Z"/>',
        '<path d="M168 95 Q182 97 184 117 L197 159 Q196 175 185 177 L168 127Z"/>'
      ],
      Core: ['<path d="M91 123 Q110 132 135 122 L139 178 Q111 193 87 176Z"/>'],
      Legs: [
        '<path d="M84 201 Q100 195 113 205 L106 277 Q99 289 86 278 L78 229Z"/>',
        '<path d="M117 205 Q136 195 148 204 L157 270 Q152 289 137 278 L126 236Z"/>',
        '<path d="M91 285 Q103 288 102 310 L103 336 Q98 350 91 337 L87 314Z"/>',
        '<path d="M141 283 Q150 285 151 314 L153 337 Q147 346 138 333 L136 308Z"/>'
      ]
    },
    back: {
      Shoulders: ['<ellipse cx="78" cy="78" rx="20" ry="19"/>','<ellipse cx="155" cy="78" rx="20" ry="19"/>'],
      Back: ['<path d="M95 71 Q116 89 133 71 L151 115 Q136 138 133 158 L114 173 L96 156 Q90 132 80 111Z"/>'],
      Arms: [
        '<path d="M58 96 Q76 91 76 121 L57 170 Q44 180 40 164 L46 124Z"/>',
        '<path d="M168 93 Q182 93 190 126 L199 160 Q194 180 179 171 L161 121Z"/>'
      ],
      Core: ['<path d="M94 150 Q114 163 136 148 L138 183 Q113 193 91 181Z"/>'],
      Legs: [
        '<path d="M86 201 Q100 195 114 202 L109 272 Q99 284 89 272Z"/>',
        '<path d="M118 202 Q137 192 151 204 L152 267 Q144 284 132 268Z"/>',
        '<ellipse cx="95" cy="309" rx="11" ry="30"/>',
        '<ellipse cx="146" cy="309" rx="11" ry="30"/>'
      ]
    }
  };
  function diagram(view, selected, tappable=true) {
    const side = view === "back" ? "back" : "front";
    const url = side === "back" ? "gymx-body-back.webp" : "gymx-body-front.webp";
    let regions = "";
    for (const [name, parts] of Object.entries(shapes[side])) {
      const active = selected === name ? " active" : "";
      regions += '<g class="gymx-region' + active + '"' +
        (tappable ? ' data-act="filter-muscle" data-muscle="' + name + '" tabindex="0" role="button"' : '') +
        ' aria-label="' + name + ' muscle group"><title>' + name + '</title>' +
        parts.join('') + '</g>';
    }
    return '<svg class="body-map gymx-anatomy-map" viewBox="0 0 220 370" role="img" aria-label="' +
      side + ' view male anatomical muscle selector">' +
      '<image href="' + url + '" x="0" y="0" width="220" height="370" preserveAspectRatio="xMidYMid meet"/>' +
      regions + '</svg>';
  }

  function activeMuscle(main) {
    const chip = main.querySelector('[data-act="filter-muscle"].active');
    return chip?.getAttribute("data-muscle") || "All";
  }

  function patchLibrary() {
    const main = document.querySelector("main.body");
    if (!main || !main.querySelector("h1")?.textContent.includes("Explore exercises")) return;
    main.classList.add("gymx-v05-library");
    const card = [...main.querySelectorAll(".card")].find(x => x.querySelector("h3")?.textContent.includes("Muscle selector"));
    if (card) card.classList.add("gymx-body-card");
    const old = main.querySelector("svg.body-map:not(.gymx-anatomy-map)");
    if (old) {
      const selected = activeMuscle(main);
      const view = main.querySelector('.body-view [data-view].active')?.getAttribute('data-view') || "front";
      const wrapper = document.createElement("div");
      wrapper.innerHTML = diagram(view,selected);
      old.replaceWith(wrapper.firstElementChild);
    }
    if (!main.querySelector(".gymx-guide-intro")) {
      const intro = document.createElement("div");
      intro.className = "gymx-guide-intro";
      const bold = document.createElement("strong");
      bold.textContent = "TAP A MUSCLE";
      const desc = document.createElement("span");
      desc.textContent = "Select a muscle on the human diagram, then browse exercises with photos and movement references.";
      intro.append(bold,desc);
      const target = main.querySelector("h1");
      if(target) target.after(intro);
    }
  }

  function patchDetails() {
    const modal = document.querySelector("#modal-layer .modal");
    if(!modal || !modal.querySelector(".modal-header")?.textContent.includes("EXERCISE DETAILS")) return;
    modal.classList.add("gymx-v05-details");
    if(modal.querySelector(".gymx-target-card")) return;
    const button = modal.querySelector('[data-act="add-exercise-session"][data-id]');
    const id = button?.getAttribute("data-id");
    const ex = id && typeof EXERCISES !== "undefined" ? EXERCISES.find(e => String(e.id)===id) : null;
    if(!ex) return;
    const group = groups.includes(ex.muscle) ? ex.muscle : null;
    const front = ["Chest","Arms","Core","Legs"].includes(group);
    const view = front ? "front" : "back";
    const card = document.createElement("div");
    card.className = "gymx-target-card";
    const top = document.createElement("div");
    top.className = "gymx-target-top";
    const info = document.createElement("div");
    const eyebrow = document.createElement("div");
    eyebrow.className = "gymx-target-title";
    eyebrow.textContent = "TARGET MUSCLE GROUP";
    const title = document.createElement("div");
    title.className = "gymx-target-muscle";
    title.textContent = group || ex.muscle || "Full body";
    const note = document.createElement("p");
    note.className = "gymx-target-note";
    note.textContent = "Highlighted area is a simplified muscle-group reference. Use the written guide and exercise photos for the movement.";
    info.append(eyebrow,title,note);
    const mini = document.createElement("div");
    mini.className = "gymx-mini-map";
    mini.innerHTML = diagram(view,group,false);
    top.append(info,mini);
    card.append(top);
    const chips = modal.querySelector(".chips");
    if(chips) chips.after(card); else modal.querySelector(".modal-header")?.after(card);
  }

  let pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending=false;
      patchLibrary();
      patchDetails();
    });
  }
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  document.addEventListener("keydown",event => {
    if(event.key !== "Enter" && event.key !== " ") return;
    const region=event.target.closest?.("g.gymx-region[data-muscle]");
    if(!region) return;
    event.preventDefault();
    region.dispatchEvent(new MouseEvent("click",{bubbles:true}));
  });
  schedule();
})();