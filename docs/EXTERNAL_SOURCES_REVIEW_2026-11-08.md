# GymX source revisit — 2026-11-08

Status: **evidence-only review; no GymX APK assets changed, no new APK release**.

## Scope

- Reviewed four user-provided sources against the 54 GymX exercises without exercise-specific static movement images (the other 832 exercise-specific thumbnails remain).
- Metadata comparison against **1,324** records in `hasaneyldrm/exercises-dataset` pinned at commit `7455efae41b330c265e7cd4b78dfa848e7ce5ebd`.
- The source comparison deliberately **does not download, repackage, or use the third-party images or GIFs**.

## Result of 54-exercise metadata comparison

- **1** exact name and compatible equipment: `ex012` Chest Dip -> `0251` chest dip (body weight).
- **2** close names and compatible equipment; still require manual verification: `ex010` Decline Chest Press -> `1300` lever decline chest press (leverage machine); `at021` Flutter Kick -> `0459` flutter kicks (body weight).
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

## Next image pass

1. Preserve the 832 existing exercise-specific thumbnails and 45 individually reviewed exercise pose guides.
2. Prioritize original, rights-cleared START/END stills for the remaining 54, using exact equipment and range-of-motion review.
3. Consider further metadata enrichment (names/instructions/target muscles) only after line-by-line comparison and preserving all 886 GymX exercise IDs and user history.
4. Maintain no GIFs/animations per GymX requirements.
5. Do not use exact title similarity alone as proof of a visual exercise match.

## Reproducible check

`python updater/external_source_audit.py --source /tmp/exercises.json --out external-source-review`

The workflow fetches the pinned upstream metadata only and produces two machine-readable reports.
