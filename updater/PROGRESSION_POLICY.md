# GymX progressive overload notification — specification for a later release

**Status:** Design only. Do not send notifications or change weights automatically.

## Evidence basis

- ACSM (2009): for healthy adults using a target repetition range, consider increasing resistance by approximately 2–10% when 1–2 additional reps above target are achievable in two successive training sessions. [PMID 19204579](https://pubmed.ncbi.nlm.nih.gov/19204579/)
- ACSM (2026): progressive overload is individualized; strength and hypertrophy gains do not require training every set to failure. RIR (repetitions in reserve) and quality of execution can help individualize choices. [Current position stand](https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/).

These are programming guidelines, not a medical or individualized coaching prescription.

## Proposed implementation: double progression, conservative by default

1. Per exercise/variant/equipment, configure a user-selected **working-set** target (e.g., 3 sets of 8–12 repetitions) and the available weight increments. Exclude warmups and cardio.
2. Evaluate the last **two distinct sessions** performed with the **same load, set count and exercise variant**. Ignore duplicate sets and partial workouts.
3. Mark "possibly ready" only if **every prescribed working set** reached the **top of the rep range** in both sessions; where the target is fixed rather than a range, require the appropriate +1 or +2 reps. A few easy first sets alone are not sufficient.
4. Optionally request a single post-exercise confirmation: **Form controlled? Pain free? Could you have done 1–3 more clean reps?** If not confirmed, show only a low-certainty suggestion, never "You must increase."
5. If ready, recommend the **smallest practical weight increase**, typically **2–5% for smaller lifts** or up to **5–10% for larger lifts**, constrained by available machine/dumbbell increments. Do not demand unavailable increments. The ACSM range is 2–10%, not a mandatory increase for every person.
6. On the next session with higher load, aim again near the **bottom of the selected rep range**. Permit the user to decline, delay, or ignore the suggestion.
7. Suppress a prompt after a deliberate deload, reported pain, poor form, missed reps, a long training break, changed exercise variant, missing logs, or an inconsistent weight unit.
8. Only trigger **one local reminder per exercise milestone** after genuine additional performance evidence. Never push recurring guilt or pressure messages.
9. Merely using the **same weight for N days** is *not* enough. Improvement in repetitions, tempo, range of motion, control, recovery or deliberate maintenance may occur without changing the displayed load.

## Example

Bench press: 3 × 8–12 at 60 kg.
- Week 1: 12 / 12 / 11 — not yet ready.
- Week 2: 12 / 12 / 12 — first qualifying session.
- Week 3: 12 / 12 / 12 — second qualifying session.
- If quality of form and recovery are acceptable, suggest trying the next appropriate small increment (e.g., 62.5 kg) rather than forcing it. New target: build back from 8–12 reps.

## Work required before enabling notifications

- Confirm the meaning of recorded weights (per hand vs combined, kg vs lb, equipment-specific stacks).
- Add target rep range and working-set flag to exercise planning.
- Optionally collect session effort and form confirmation; do not infer either from reps alone.
- Implement a deterministic, testable local recommendation engine with opt-in reminders, cool-down and dismiss controls.
- Keep it local-first and compatible with existing session history.
