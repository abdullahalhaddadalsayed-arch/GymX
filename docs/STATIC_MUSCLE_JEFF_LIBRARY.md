# GymX library v0.6 — static anatomy, hierarchy and Jeff-only references

## Visuals and media policy
- Static START/END exercise photos remain highest priority when **visually reviewed**. Publisher-provided pairs remain labeled as unverified positions where appropriate.
- If an exercise has no suitable exercise-specific image (currently 54 records), show a realistic static male muscle reference in the thumbnail and details.
- For biceps, quads and shoulders, use the **front-facing male sample supplied by the GymX project owner**, cropped into a compact, static WebP sprite. Do **not** treat those stills as an exercise demonstration.
- For other muscle regions and the back, use the existing licensed Jsplice/MuscleMap front/back realistic body photography with an approximate green anatomy overlay. Its position is an illustrative region and not proof of exclusive muscle activation.
- Do **not** import GIFs, APNGs, video clips, moving exercise images or user-uploaded frames from copyrighted third-party demo sets.
- Jeff's videos are **external YouTube links only**.

## Muscle library filtering
The main-group selector comes first. Selecting a specific group then enables its sub-group selector.

Back sub-groups, as requested:
1. Lats — Upper
2. Lats — Lower
3. Lower Back — Spinal Erectors
4. Traps

The upper/lower-lat headings describe intended exercise emphasis **not independently distinct lat muscles**. Exercises without sufficient information to determine a specific region stay visible under the main Back group, but are not forced into upper or lower. No image-availability filter is shown.

Additional sub-groups:
- Chest: upper/mid/lower.
- Shoulders: front/side/rear delts.
- Biceps: long/short head, brachialis, brachioradialis.
- Triceps: long/lateral/medial head.
- Forearms: flexors/extensors.
- Core: upper/lower abs, obliques.
- Quads: rectus femoris, vastus lateralis/medialis/intermedius.
- Hamstrings: biceps femoris, semitendinosus/semimembranosus.
- Glutes: maximus/medius/minimus.
- Calves: gastrocnemius/soleus.

Specific exercise labels are assigned conservatively based on supplied names and primary-muscle metadata. They are not physiological isolation or medical claims.

## Jeff Nippard catalogue
- The library contains **All exercises** and **Jeff Nippard** tabs.
- Jeff mode shows only GymX exercises whose title is included in the explicit, curated name/variant allowlist for the nine videos provided by the project owner.
- Main-group, sub-group and source-video filters are available inside Jeff mode.
- Each matched row shows a direct external link to the relevant one of the nine videos. This is a **video reference**, not a claim that it shows that exact exercise at a particular timestamp.
- An exercise with a similar muscle group but without a documented matching movement name is excluded.
- Matches may not represent every variation mentioned in the nine videos; broader inclusion requires transcription and manual review.

## Engineering
- Source installer: `updater/install_static_muscle_jeff.py`
- Client modules: `updater/gymx-muscle-jeff-library.js`, `updater/gymx-static-human-fallback.js`, and `updater/gymx-static-muscle-jeff.css`
- Original app exercise IDs, local history and machine recognition remain unchanged.
- Build checks: SHA256 of user-supplied reference sprite; no `.gif`, `.apng` or `.webm` files; JavaScript syntax; Android debug and signed APK build.
- On-device QA still required: selector state after search, Jeff source links, and green overlays alignment.

## Video IDs
`S6rqpxVGKZ4`, `928aRhhPP8I`, `hRZ5MM6gmlE`, `GNO4OtYoCYk`, `SgyUoY0IZ7A`, `kIXcoivzGf8`, `OpRMRhr0Ycc`, `fGm-ef-4PVk`, `jLvqKgW-_G8`.
