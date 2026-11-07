/* GymX photo-library enhancement for the current v0.4 app.
 * Uses only images that the Free Exercise DB import already packages locally.
 * Never fetches third-party pictures. Keeps old workout IDs and history unchanged. */
(() => {
  "use strict";
  if (typeof EXERCISES === "undefined" || !Array.isArray(EXERCISES)) return;
  const catalog = new Map(EXERCISES.map(ex => [String(ex.id), ex]));
  const css = document.createElement("style");
  css.textContent = [
    ".exercise-row .ex-icon.gymx-photo-icon{position:relative;overflow:hidden;flex-shrink:0;}",
    ".exercise-row .ex-icon.gymx-photo-icon > img{display:block;width:100%;height:100%;object-fit:cover;border-radius:inherit;background:#171e20;}",
    ".exercise-row .ex-icon.gymx-photo-icon > svg{display:none;}",
    ".gymx-guide-frame{min-width:0;position:relative;background:#111819;border:1px solid rgba(176,244,86,.20);border-radius:12px;overflow:hidden;}",
    ".freedb-photos .gymx-guide-frame img{width:100%;height:190px;object-fit:contain;border:none;border-radius:0;display:block;}",
    ".gymx-guide-frame > .gymx-frame-label{position:absolute;top:8px;left:8px;display:block;font-size:10px;font-weight:800;letter-spacing:.08em;padding:5px 8px;border-radius:6px;background:#c5fa48;color:#102011;}",
    ".gymx-guide-caption{font-size:12px;line-height:1.45;color:#b9c8c3;margin-top:7px;}",
    ".gymx-library-hint{padding:10px 12px;background:#18241a;border-radius:10px;border:1px solid #3c5730;color:#e4eedc;margin:12px 0;font-size:12px;}",
    ".gymx-photo-icon .ex-badge{display:none;}"
  ].join("\n");
  document.head.appendChild(css);

  let scheduled = false;
  function updateImages() {
    scheduled = false;
    const root = document;
    root.querySelectorAll(".exercise-row:not([data-gymx-photo-checked])").forEach(row => {
      row.setAttribute("data-gymx-photo-checked", "1");
      const action = row.querySelector("[data-id]");
      const icon = row.querySelector(".ex-icon");
      if (!action || !icon) return;
      const ex = catalog.get(String(action.getAttribute("data-id")));
      const src = ex?.imagesLocal?.[0];
      if (typeof src !== "string" || !src.startsWith("freedb-images/")) return;
      const img = document.createElement("img");
      img.loading = "lazy";
      img.decoding = "async";
      img.alt = ex.name + " exercise photo";
      img.addEventListener("error", () => { img.remove(); icon.classList.remove("gymx-photo-icon"); }, {once:true});
      img.src = src;
      icon.classList.add("gymx-photo-icon");
      icon.appendChild(img);
    });
    root.querySelectorAll(".freedb-photos:not([data-gymx-frames-ready])").forEach(group => {
      group.setAttribute("data-gymx-frames-ready", "1");
      const images = [...group.querySelectorAll(":scope > img")];
      images.forEach((img, i) => {
        const wrapper = document.createElement("div");
        wrapper.className = "gymx-guide-frame";
        img.replaceWith(wrapper);
        wrapper.appendChild(img);
        const label = document.createElement("span");
        label.className = "gymx-frame-label";
        label.textContent = i === 0 ? "POSITION 1" : "POSITION 2";
        wrapper.appendChild(label);
      });
      if (images.length > 1) {
        const caption = document.createElement("p");
        caption.className = "gymx-guide-caption";
        caption.textContent = "Two reference positions for this exercise. Follow the written movement instructions for the correct direction and technique.";
        group.after(caption);
      }
    });
    const main = root.querySelector("main.body");
    if (main && /Explore exercises/.test(main.textContent || "") && !main.querySelector(".gymx-library-hint")) {
      const heading = main.querySelector(".h1");
      const note = document.createElement("p");
      note.className = "gymx-library-hint";
      note.textContent = "Exercise photos are displayed in the library when available. Open an exercise to view its movement positions.";
      if (heading) heading.after(note);
    }
  }
  const schedule = () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateImages); }
  };
  new MutationObserver(schedule).observe(document.body, {subtree:true,childList:true});
  schedule();
})();