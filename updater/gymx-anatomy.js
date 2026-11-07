/* GymX Anatomical Library 0.5 — presentation-only enhancement.
   Anatomy supplied by @emmorts/body-muscles (Apache-2.0), bundled offline by CI.
   Workout state, exercise IDs and saved history are deliberately untouched. */
(() => {
  "use strict";
  const known = new Set(["Chest","Back","Shoulders","Arms","Legs","Core"]);
  const engine = window.BodyMuscles;
  const originalDiagram = window.diagramSvg;
  if (typeof originalDiagram !== "function") {
    console.warn("GymX anatomy: base diagram function missing");
    return;
  }
  if (!engine?.BodyChart || !engine?.ViewSide) {
    console.warn("GymX anatomy dependency unavailable: retaining original diagram");
    return;
  }

  let chart = null, host = null, signature = "";
  const escapeAttr = input => String(input).replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;");
  window.diagramSvg = (view, selection) => {
    const side = view === "back" ? "back" : "front";
    const sel = known.has(selection) ? selection : "All";
    return '<div class="gx-anatomy" data-view="'+side+'" data-selected="'+escapeAttr(sel)+'">'+
      '<div class="gx-anatomy-frame" role="group" aria-label="Interactive male anatomical muscle selector"></div>'+
      '<div class="gx-figure-foot"><span class="gx-status-dot"></span> TAP MUSCLES TO FILTER EXERCISES</div>'+
      '</div>';
  };

  function resolveGroup(id,name) {
    let group;
    try { group = engine.MUSCLE_METADATA?.[id]?.group || engine.getMuscleMetadata?.(id)?.group; } catch (_) {}
    if (known.has(group)) return group;
    const value = String(group || "")+" "+String(id || "")+" "+String(name || "");
    if (/pec|chest|pectoral/i.test(value)) return "Chest";
    if (/lat|trap|back|spine|rhomboid/i.test(value)) return "Back";
    if (/deltoid|shoulder/i.test(value)) return "Shoulders";
    if (/bicep|tricep|forearm|arm/i.test(value)) return "Arms";
    if (/abdom|oblique|core|rectus/i.test(value)) return "Core";
    if (/glute|quad|hamstring|calf|calves|thigh|adductor|leg/i.test(value)) return "Legs";
    return null;
  }

  function applyFilter(group) {
    if (!group) return;
    const chips = [...document.querySelectorAll('button[data-act="filter-muscle"]')];
    const button = chips.find(b => b.dataset.muscle === group);
    if (button) button.click(); // existing GymX handler controls the actual data filter
  }

  function selectionState(group) {
    if (!known.has(group)) return {};
    try { return engine.setGroupSelection({},group,"select"); } catch (_) { return {}; }
  }

  function dispose() {
    if (chart) {
      try { chart.destroy(); } catch (_) {}
    }
    chart = null; host = null; signature = "";
  }

  function refresh() {
    const root = document.querySelector(".gx-anatomy");
    if (!root) { if (chart) dispose(); return; }
    const target = root.querySelector(".gx-anatomy-frame");
    const key = root.dataset.view + ":" + root.dataset.selected;
    if (!target) return;
    if (chart && host === target && signature === key) return;
    dispose();
    host = target; signature = key;
    try {
      chart = new engine.BodyChart(target, {
        view: root.dataset.view === "back" ? engine.ViewSide.BACK : engine.ViewSide.FRONT,
        bodyState: selectionState(root.dataset.selected),
        onMuscleClick: (id, name) => applyFilter(resolveGroup(id,name))
      });
      target.setAttribute("data-loaded","true");
    } catch (err) {
      console.warn("GymX anatomical chart unavailable",err);
      target.innerHTML = originalDiagram(root.dataset.view,root.dataset.selected);
      target.querySelectorAll('[data-act="filter-muscle"]').forEach(el => el.addEventListener("click", e => {
        e.preventDefault(); e.stopPropagation(); applyFilter(el.getAttribute("data-muscle"));
      }));
    }
  }

  let pending = false;
  const schedule = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; refresh(); });
  };
  new MutationObserver(schedule).observe(document.body, {subtree:true,childList:true});
  schedule();
})();