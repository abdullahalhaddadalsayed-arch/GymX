# GymX source revisit — 2026-11-08

Status: **evidence-only review; no GymX APK assets changed, no new APK release**.

## Scope

- Reviewed four user-provided sources against the 54 GymX exercises without exercise-specific static movement images (the other 832 exercise-specific thumbnails remain).
- Metadata comparison against **1,324** records in `hasaneyldrm/exercises-dataset` pinned at commit `7455efae41b330c265e7cd4b78dfa848e7ce5ebd`.
- The source comparison deliberately **does not download, repackage, or use the third-party images or GIFs**.

## Result of 54-exercise metadata comparison

- **1** exact name and compatible equipment: `ex012` Chest Dip -> `0251` chest dip (body weight).
- **2** close names and compatible equipment at the name-matching stage: `ex010` Decline Chest Press -> `1300` lever decline chest press (leverage machine); `at021` Flutter Kick -> `0459` flutter kicks (body weight). **After examining the uploaded JPGs, the Flutter Kick media association was rejected** because the pictured position conflicts with written instructions and GymX context.
- **3** similar names but mismatched equipment (no automatic mapping): `at024` Glute Bridge March (resistance band) vs `3561` body weight; `at047` Pushup Walk (resistance band) vs `0659` push-up (wall), body weight; `at074` Step Up Lunges (platform) vs `2796` dumbbell step-up lunge (dumbbell).
- **48** no reliable name+equipment match.
- **0** licensed image imports and **0** missing movement images resolved.

Results are title/equipment candidates only, not item identification, technique review, or media rights verification. Per-exercise CSV/JSON available in GitHub Actions artifact `GymX-54-external-metadata-review` from the review workflow.

## Source-specific decisions

| Source | Source URL | Decision |
|---|---|---|
| Kaggle workout/exercise images | https://www.kaggle.com/datasets/hasyimabdillah/workoutexercises-images | **Hold.** The page is public but available access did not provide a verifiable grant to bundle/redistribute the images in GymX. Some use cases are image classification datasets, not necessarily START/END guides. No images copied. |
| MuscleWiki | https://musclewiki.com/ | **Conditional external API only.** Under 2026-10-08 API terms, media cannot be downloaded for permanent offline use. Text metadata can be cached for up to 30 days and thumbnails at most 24h, subject to terms and plan. Not appropriate for GymX bundled offline exercise photos. See https://api.musclewiki.com/api-terms |
| hasaneyldrm/exercises-dataset | https://github.com/hasaneyldrm/exercises-dataset | **Metadata-only candidate.** MIT covers code/data/text. Images/GIFs are © Gym visual and explicitly excluded from MIT. Attribution/rights clearance required separately; no media copied. See repo LICENSE and NOTICE. |
| Dribbble workout designs | https://dribbble.com/search/workout | **Design-reference only.** General inspiration for dark cards, layouts, typography and progress charts; no image, illustration or design copying. See https://dribbble.com/terms |

## User-uploaded archive inspection — November 8, 2026

The user provided `exercises-dataset-main.zip` (~133 MB) from hasaneyldrm/exercises-dataset. We inspected the ZIP itself (not only GitHub file names):

- **1,324 source exercises**, **1,324 JPG thumbnails**, **1,324 GIF animations**, English and multilingual exercise instructions.
- The embedded `LICENSE` explicitly limits MIT to code/tooling, dataset structure and text/translations. The `images/` and `videos/` directories are © Gym visual and are **not** MIT-licensed. `NOTICE.md` confirms that cloning or receiving the ZIP does not grant reuse or redistribution rights.
- GymX remains a public GitHub repository distributing APKs, so these JPGs/GIFs are **not** included in the published app. No media imported.
- Visual inspection of six suggested thumbnails gave more specific outcomes than name similarity alone:
  - **Chest Dip** (`ex012` -> `0251`): parallel-bar dip depiction matches the exercise/equipment; **metadata candidate only** until media separately licensed.
  - **Decline Chest Press** (`ex010` -> `1300`): lever chest press machine depicted, but precise decline-machine geometry cannot be established. **Pending variant confirmation**, no images imported.
  - **Flutter Kick** (`at021` -> `0459`): **REJECT image association**. Source JPG depicts a prone, bench-supported leg movement, while source English instructions describe supine floor flutter kicks and GymX identifies the exercise under Core. The source media and metadata conflict.
  - **Glute Bridge March** (`at024` -> `3561`): illustrated movement has no resistance band, unlike GymX's specified variant. **Reject automatic mapping**.
  - **Pushup Walk** (`at047` -> `0659`): illustrated exercise is a wall push-up, not the GymX resistance-band Pushup Walk. **Reject automatic mapping**.
  - **Step Up Lunges** (`at074` -> `2796`): image shows dumbbells; GymX entry specifies platform without dumbbells. **Reject automatic mapping**.
- Revised manual assessment: **1 plausible exact metadata match, 1 pending variant, 4 rejected, 48 no reliable candidates**. All media licensing remains unconfirmed for use in GymX.
- The inspected ZIP could support a **separately licensed media import** later, or metadata-only work after careful item fit checks. Do not treat the author's redistribution permission as a transferable license.

## Next image pass

1. Preserve the 832 existing exercise-specific thumbnails and 45 individually reviewed exercise pose guides.
2. Prioritize original, rights-cleared START/END stills for the remaining 54, using exact equipment and range-of-motion review.
3. Consider further metadata enrichment (names/instructions/target muscles) only after line-by-line comparison and preserving all 886 GymX exercise IDs and user history.
4. Maintain no GIFs/animations per GymX requirements.
5. Do not use exact title similarity alone as proof of a visual exercise match.

## Reproducible check

`python updater/external_source_audit.py --source /tmp/exercises.json --out external-source-review`

The workflow fetches the pinned upstream metadata only and produces two machine-readable reports.
