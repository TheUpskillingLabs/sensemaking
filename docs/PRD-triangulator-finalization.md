# PRD — The Triangulator: Design Finalization & Cycle Integration

| | |
|---|---|
| **Status** | Draft for owner review — 2026-07-07 |
| **Owner** | Brendan Whitaker |
| **Scope** | Finalize the standalone Triangulator's design (4 areas) **and** spec the seams that connect it into the OLOS Build Cycle |
| **Vessel** | The current standalone tool — `triangles/index.html` (single file, 9,806 lines, vanilla JS). No React port in this PRD. |
| **Related** | `README.md` · OLOS `docs/SENSEMAKING_FLOW.md`, `docs/ORTELIUS_KNOWLEDGE_GRAPH.md`, `docs/SECTOR_MODEL.md` · the UX review artifact (session 2026-07-07) |
| **Decision** | **Hybrid, seam-first.** Ship the standalone tool (reskinned); build the *data seams* before any UI port. |

---

## 1. Summary

The Triangulator is the cycle's **sensemaking engine**: it takes a pool of field-gathered evidence and lets members triangulate it up Kees Dorst's Frame-Creation ladder into a **Problem Situation** and its **Themes** — the groundwork a pod stands on. Today it is a mature, polished, **standalone** tool that already emits a deployable GitHub-Pages site. But it is an *island*: it reads a hand-exported CSV, writes to `localStorage`, and hands off to a pod repo by manual zip-and-commit.

This PRD finalizes the tool's design across four areas and specifies the three seams that dissolve the island — **without** rebuilding the canvas:

1. **On-ramp & scaffolding** — make the first run dead-simple; reveal the method by promotion, not up front.
2. **Extraction & upload intake** — let members upload sources (survey responses, articles, notes, data) and turn them into **extract cards** that feed the pool, via a bring-your-own-LLM loop (no in-app model).
3. **Repo-seed + "Meet the Pods" slides** — finalize the export *contract* and add an auto-provisioned Pod repo with a landing page **and a slide deck**.
4. **Formation & owner discovery** — connect the tool's Problem Situation to pod formation (paradox → cluster → pod) and to the modified Frame-Innovation project model (discover a **problem owner** via field mapping → form a **Project** of owner + frame + 3–5 people).

The guiding constraint throughout: **the standalone tool must never write state that a later feature has to migrate** (the additive invariant). Where a field can't be produced honestly by the single-user tool (the paradox's structural core, a candidate-owner ledger, a consent envelope), it is assembled **OLOS-side at ingest**, not bolted onto the export.

---

## 2. Principles (the non-negotiable constraints)

| Principle | What it forbids / requires |
|---|---|
| **Additive invariant** | Complexity arrives only by (a) promoting a node's stage, (b) attaching optional/nullable tags, (c) drawing more edges. If a feature needs to *migrate what the simple tool wrote*, it's designed wrong. Store the tool's canvas state **verbatim**; add relational/shared-graph structure only at the promotion boundary. |
| **Governance gate #11 — no in-app LLM** | The tool (and OLOS) never call a model server-side for member content. All AI assist is **copy-a-prompt → run in your own model → paste the result back**. Extraction, classify prompts, and field analysis all follow this. (Flag: `lib/llm/names.ts` in OLOS already violates this for cosmetic pod-naming — resolve separately.) |
| **Two-tier storage** | The tool **is** tier-1 (the private, forgiving personal canvas: `localStorage['olos.sensemaking.v2']`, and later `sensemaking_sessions.state`). The shared sector graph (`asset_links` + nodes, signed edges, consent) is tier-2, accreted only when artifacts are *promoted*. |
| **Survey-first** | The field survey is the bedrock and the priority. Its first missing consumer is **extraction** — build that next. Its biggest un-owned gap is **distribution** (the survey today has no share mechanics). |
| **Ceiling, not floor** | A first-timer sees exactly one thing — a hunch and the evidence for/against it. The seven evidence types, the higher tiers, the classify phase are all **progressive reveals**, never entry requirements. |

**Non-goals for this PRD:** a React/Supabase port of the canvas; a live multiplayer (FigJam-style) canvas; in-app AI of any kind; the Ortelius AI read-surfaces (semantic search, auto-clustering) — all gated by #11 and out of scope here. The multiplayer canvas is a *later* spike, scoped to the shared Paradox Sprint only.

---

## 3. Where we are — built vs. designed

Verified against code, not docs.

| Component | State | Note |
|---|---|---|
| Field survey (instrument + intake) | **Built** | OLOS `00053_field_survey_intake.sql`, `app/(survey)/survey/[slug]/survey-flow.tsx`, `POST /api/surveys/[slug]/responses`. Missing: **share mechanics**, `/s/[slug]` short link, moderation UI. |
| Extraction / upload → extracts | **Not built** | No `extracts`/`sources` tables, no upload endpoint, no prompt-builder. Gate-free. **This PRD, Area 2.** |
| Triangulator canvas | **Built (standalone)** | `triangles/index.html`. `localStorage`, own tier vocabulary, single-user. **This PRD, Areas 1 & 4.** |
| Export → landing page | **Built (emitter)** | `buildModularExportFiles()` / `exportModular()` emit two self-contained files, `index.html` + `slides.html`, rendered at export time. Hostable anywhere, but built first to be *edited* — see 7a. |
| Repo provisioning (OLOS side) | **Not built** | `lib/integrations/` is **only** `luma.ts`. `pods.github_repo_url` is a hand-typed string. **This PRD, Area 3.** |
| "Meet the Pods" slides | **Built** | `slides.html` — one of the two files the deck & site export produces. (The intro deck that used to teach the workflow has been removed.) |
| Pod formation | **Built (mis-seeded)** | `voting/finalize`, `pods` — but seeded by free-text `problem_statement_id`, not a paradox/cluster. No `clusters` table. **This PRD, Area 4.** |
| Project / problem-owner layer | **Partial** | Project schema nests; `actants`/`problem_owner` and the proposal gate are doc-only. **This PRD, Area 4.** |
| Ortelius graph / AI reads | **Gated** | Signed edges, actants, OPP, semantic search — blocked by governance #11. Out of scope. |

---

## 4. Personas & the journey

- **Contributor (public, often anonymous)** — answers the field survey. Never signs in. Cares: "did my observation land, and does it matter?"
- **Upskiller (cohort participant)** — the core user of the Triangulator. Extracts, swipes, triangulates, forms/join a pod, discovers an owner, ships. Cares: "am I building on something real, not vibes?"
- **Pod (~12)** — the collective that owns a paradox and its shared repo.
- **Project team (3–5)** — the durable unit formed around a discovered owner + a frame.
- **Poderator** — shepherds pods; needs visibility, not another tool to run.

**The end-to-end journey and its three break-points** (the discontinuities this PRD closes):

`Distribute survey → Register → ` **`⟂ Extract (Area 2)`** ` → Swipe → Triangulate (Area 1) → Map the Problem Situation → ` **`⟂ Paradox Sprint / cluster-vote (Area 4)`** ` → Pod forms → ` **`⟂ Seed Pod repo + slides (Area 3)`** ` → Frame Sprint → discover owner → form Project (Area 4)`

---

## 5. Area 1 — On-ramp & scaffolding

**Problem.** The tool is deep. A first-timer today lands in the full seven-step machine. The method should be the ceiling, not the floor. *(Updated July 2026: the sandboxed tutorial and the per-screen spotlight tours no longer exist — both were dormant and were deleted in the pre-sprint cleanup. The intro deck and corner coach went with them. The action bar is now the whole on-ramp.)*

**Requirements.**

- **1.1 (MUST) Seed Mode is the front door.** ~~First run enters `mode: 'seed'` as a **linear, guided wizard**, not the free canvas.~~ **Reversed, July 2026 — owner's call for the Sensemaking Sprint.** Seed Mode has been removed: Patterns and Themes are unlocked from the first card, and there is no graduation step. The reasoning is that this requirement was written for a first-timer meeting the tool *alone*; in a facilitated room the poderator introduces the ladder, and a one-way gate in the middle of the thing being taught is a wall rather than a scaffold.

  **This is a live disagreement with the PRD, not an oversight.** If the tool is ever shipped for unaccompanied first-timers again, the progressive on-ramp this requirement asks for needs rebuilding — and the ceiling-not-floor principle in §2 still argues for it. The old implementation is at `git show be5a1cc^:index.html`.
- **1.2 (MUST) A worked example precedes a blank canvas.** Before a member's first real board, offer the sandboxed worked example (the existing *neighborhood food access* tutorial). It is fully dismissible and never touches saved state. Returning members skip it by default (respect the expertise-reversal effect).
- **1.3 (MUST) Progressive reveal of tiers and types.** Signals and one Evidence tier are visible from the start. Pattern/Theme/Super-theme tiers surface only as the member reaches them (connecting two of a tier reveals the next — already the mechanic; make the *unreached* tiers visually quiet, not absent-and-confusing). The **seven evidence types stay hidden until after the situation is mapped** (`enterClassifyPhase` / `classifyPhase`, already gated) — keep that.
- **1.4 (SHOULD) Loop, not pipeline, is legible.** The step indicator (Concept → Sources → Sort → Validate → Map → Classify → Deepen) already says "this is a loop." Make "revisit any step" a first-class, obvious affordance, not fine print.
- **1.5 (SHOULD) Empty/first-run states.** Every screen has a purposeful empty state that tells the member the one next action (e.g., the board with zero signals invites "import your pool or start from the sample").
- **1.6 (COULD) Naming.** Resolve the member-facing name (see §10). "Triangulator-inator" is a great codename; the shipped name is a decision.

**Acceptance criteria.**
- A first-time member can go from landing to a named first Evidence card **without ever seeing the seven evidence types or tiers above Evidence.**
- ~~Seed Mode is completable in < 5 minutes on the sample pool.~~ (Void — see 1.1.)
- Exiting the worked example leaves saved state byte-identical.

---

## 6. Area 2 — Extraction & upload intake

**Problem.** This is the seam the whole cycle depends on and it does not exist. The survey stores raw, deliberately title-less `observation` text. Members also need to bring **other sources** — articles, interview notes, datasets, policies — and turn them into discrete, atomic **extract cards** (insights / observations / facts). The Triangulator today only ingests a `title,summary,source_url` CSV via `parseCsv()` (index.html:3384); something must *produce* those rows. And it must happen with **no in-app LLM**.

**The loop (BYO-LLM, governance-safe).**

1. **Gather** — a member is assigned (or picks) a subset of survey responses, and/or uploads their own source files. ~15 min/day, spread across participants.
2. **Copy the prompt** — the app builds a **deterministic prompt** over that subset (the existing "✨ LLM Field Analysis" / per-card ✨ pattern — a copy-to-clipboard, XML-tagged prompt). No model is called in-app.
3. **Run it in their own model** — the member pastes into their own LLM.
4. **Paste the result back** — the member pastes structured output; the app **parses it into extract cards** and adds them to the pool. A JSON (or CSV) schema makes paste-and-parse deterministic.

> **Design rule (from adversarial review):** there is **no in-app "AI-suggested tag/highlight."** The suggest step is the copy-prompt round-trip; the human owns every extract. An in-app highlight-suggester would be an in-app LLM call and is barred.

**Requirements.**

- **2.1 (MUST) Two evidence origins.** An extract traces to **either** a `survey_response` (field, bottom-up) **or** an uploaded `source` (literature/data, carrying its `source_url`). Provenance is always preserved.
- **2.2 (MUST) Upload sources.** Members can upload/paste article text, notes, or a file; the app treats it as a `source` and runs the same extract loop over it.
- **2.3 (MUST) Extract card shape.** `extract { id, origin_ref, origin_kind, title, summary, source_url?, kind? }` where `kind ∈ {insight, observation, fact}` (optional, nullable — additive). This is exactly the `title,summary,source_url` shape `parseCsv` already consumes, so the pool → board handoff is a no-op on the tool side.
- **2.4 (MUST) Paste-and-parse.** The "paste your model's output" box accepts the app's defined JSON/CSV schema and yields extract cards deterministically, with a clear error state when the paste doesn't match ("this doesn't look like the extract format — re-run the copied prompt").
- **2.5 (SHOULD) Dedup & light moderation.** Near-duplicate extracts are flagged (not auto-deleted — every response is retained as sector data; curation is a temporal overlay).
- **2.6 (SHOULD) The pool → board bridge.** The tool's "Open a shared folder" / CSV import becomes, in the integrated path, a fetch of the pooled extracts (see §9 Seam 1). Standalone, the CSV import stays.

**Acceptance criteria.**
- A member can turn 10 raw survey observations into 10 extract cards on the board using only their own LLM and two copy/paste actions.
- A member can upload an article and produce extract cards from it, with the article retained as a `source` with its URL.
- No network call to any model is made by the app at any point.

---

## 7. Area 3 — Repo-seed + "Meet the Pods" slides

**Problem.** The owner's headline ask: the Triangulator should emit a file a pod uses to seed its **Pod GitHub repo** with a **landing page** and initial **"Meet the Pods" slides**. Good news: the tool already thinks this way. Its intro deck teaches the exact workflow — *export a `.zip`, unzip into the Pod's shared repo, commit; Git merges everyone's maps; **Meet the Pods** — your Themes are what you present to the community.* And `buildModularExportFiles()` already emits a self-rendering GitHub-Pages site. So the **landing site is ~70% done.** Two gaps: (a) the part that makes the file *pod-forming* can't be produced by a single-user tool, and (b) there is **no slide artifact** and **no auto-provisioning** on the OLOS side.

**7a. ~~The export contract (`project.jsonld`) — finalize it.~~ — REVERSED, July 2026**

> **Reversed by the owner.** The deck & site export is now **two self-contained files**
> — `index.html` and `slides.html`. `project.jsonld`, `extracts.csv`, `site-data.js`,
> `assets/`, `content/*.md` and the site README are gone; the page is rendered at export
> time rather than hydrated in the browser.
>
> **Why.** These two files are the cohort's **first vibecoding exercise**. The owner's
> note: *"far too complex… meant to be an entry level set of two files for them to begin
> practicing vibecoding. So adding separate css files and markdowns etc etc is
> complicating it."* Ten files, three serialisations of the same content, and an
> `index.html` that was nine lines of `<script src>` is a static-site framework, not a
> starting line.
>
> **What this section still has right.** A machine-readable seed contract is the correct
> shape for OLOS ingest, and the split between "what the tool can honestly emit" and
> "what OLOS assembles" below still holds. It just does not belong in the *showcase*
> export. The **working folder** export already carries `state.json` — a complete,
> re-importable board — and is the natural home for a seed contract when OLOS needs one.
>
> **To restore the emitter:** `git show <sha>^:index.html` and lift `buildProjectJsonld()`,
> `buildExtractsCsv()`, `SITE_VIEWER_JS` and `buildSiteDataJs()`. The removal record in
> `docs/CLEANUP-2026-07.md` names the commit.

The original requirement, preserved:

Make `project.jsonld` the **canonical seed contract**: the machine-readable source of truth, with `situation.md` / `themes.md` as the human body. Split fields by who can honestly produce them:

```
pod_seed (extends the existing schema.org JSON-LD, additively)
  problem_situation : { title, description, frame, paradox }          ← the tool emits today
  evidence_trail    : [ { title, summary, source_url, verified } ]    ← the tool emits today
  themes            : [ { title, description } ]                       ← the tool emits today
  stakeholders      : [ { name, stake, value, is_candidate_owner } ]  ← OLOS assembles at ingest
  paradox_core      : { statement, regime_sustained, opp_ref }        ← OLOS assembles at ingest
  provenance        : { cycle_id, consent_envelope, ai_assisted:false } ← OLOS assembles at ingest
```

> **Do not add the OLOS-assembled fields to the standalone export.** The tool has no signed valence edges (only unsigned `childIds`), so it cannot compute the paradox's structural core (the OPP); its stakeholder map is free-text, so it has no `is_candidate_owner`; it is single-user, so it has no consent envelope. Emitting these from the standalone would be writing state a later feature must migrate — an additive-invariant violation. They are populated OLOS-side at ingest / promotion.

**7b. "Meet the Pods" slides — new artifact.**

- **3.1 (MUST) Generate a slide deck** from the same situation fields — one slide each for: the paradox, the frame ("if the situation is seen *as if* X…"), the top 2–3 themes, the stakeholder/field map, and a "join this pod" closer. **Built** as `slides.html`, self-contained, shipped alongside `index.html`.
- **3.2 (SHOULD)** ~~The landing page stays the existing self-rendering site (`index.html` + `viewer.js` + `site-data.js`)~~ — **superseded with 7a.** The landing page is now a single finished `index.html`: inline stylesheet, narrative as real HTML, web map as inline SVG, no script. Reskinning to OLOS tokens is now a one-file edit to `SITE_STYLE_CSS`.

**7c. Provisioning (OLOS seam) — new.**

- **3.3 (MUST) A repo-seed route.** `npm i @octokit/rest` → `lib/integrations/github.ts` with an enabled-guard mirroring `luma.ts` → `POST /api/pods/[pod_id]/seed-repo` that: generates from a template repo, commits the site + slides, enables Pages, and writes `pods.github_repo_url` (column already exists, `00001`). A **GitHub App** on the `TheUpskillingLabs` org (`contents:write`, `pages:write`, `administration:write`), server-side only.
- **3.4 (MUST) Consent gate — repo-seed is NOT gate-free.** Publishing evidence-derived content to a **public** Pages site is a commons-publication act. It requires **opt-in publication consent per included extract**; it is **not** contained in baseline participation consent, and **anonymous submissions cannot be published.** The seed action filters `evidence_trail` to consented extracts and blocks if the paradox depends on non-consented material.
- **3.5 (MUST) Sequencing.** The octokit plumbing may land early, but the **seed action runs only after** a pod exists that was born from a real cluster (Area 4), so it never seeds an empty/fabricated pod ("empty-until-real").

**Acceptance criteria.**
- From a mapped Problem Situation, a member (or OLOS) produces a folder containing a working landing page **and** a "Meet the Pods" deck, both rendering offline and on Pages.
- `POST /seed-repo` creates a repo, pushes the folder, enables Pages, and stores the URL on the pod — gated on per-extract publication consent.
- No non-consented or anonymous-only evidence appears on the public site.

---

## 8. Area 4 — Formation & owner discovery (modified Frame Innovation)

**Problem.** Two things must connect that don't: (1) the tool's **Problem Situation** must become a **pod** through the real voting mechanism, and (2) the pod must then **discover a problem owner** and form a **Project**. Dorst starts *with* a problem owner; our model **discovers** one via context + field mapping — a coherent, arguably *more* faithful departure, but only if we build what the a-priori owner used to supply.

**The two nested layers.**

| Layer | Size | Forms around | Dorst mapping | Today |
|---|---|---|---|---|
| **Pod** | ~12 | a **paradox / cluster** from triangulation | Archaeology → Paradox | Seeded by free-text `problem_statement_id` — **wrong seed** |
| **Project** | 3–5 | a discovered **problem owner + a frame** | Field → owner discovery; Themes → Frame | `actants`/owner layer **not built** |

**Requirements.**

- **4.1 (MUST) Pods born from clusters.** Add a `clusters` table; retarget the existing budget-ballot from `problem_statements` to clusters (`votes.problem_statement_id → cluster_id`; `pods.cluster_id`). This is a **repoint of existing voting, not a rebuild.** A pod is born carrying its cluster's hypotheses + evidence. Every losing cluster is retained as Ortelius sector data.
- **4.2 (MUST) Field-actor ledger for owner discovery.** Add `actants (id, cycle_id, kind, role, name, stake, value)` and a `solution_proposal_actants` join. `role ∈ {inner_circle, wider_field, problem_owner}` (matches the tool's Player roles). This is the structured home for `is_candidate_owner` that §7 references.
- **4.3 (MUST) The proposal gate.** A `solution_proposal` requires **≥ 1 actant of role `problem_owner`** — one `count(*) ≥ 1` guard before the UPSERT. "You can't propose an intervention until you can say who it's for."
- **4.4 (MUST) Resolve the 12-vs-3–5 config.** It's config, not contradiction. Set `pod_min` deliberately per cycle (today's seeded default is 5, unenforced); set `project_max` to **5** (today 7) to honor "no more than five." One Pod (~12) incubates 2–3 Projects (3–5 each).
- **4.5 (SHOULD) Submitting a situation to the ballot.** The tool used to carry a `submit-for-voting` control that only stamped a timestamp and navigated to a read-only artifact screen; it was removed in the July 2026 cleanup because it did nothing and competed with the real terminal action. If the integrated path needs to hand a situation/cluster to the OLOS ballot, it should be built against the ballot, not restored as a stub. Standalone, the Git-merge workflow is the offline mode.

**Acceptance criteria.**
- A cluster that clears the vote threshold + pod floor becomes a pod carrying its evidence.
- A project cannot be proposed without at least one named problem-owner actant.
- Losing clusters persist as sector context.

---

## 9. Integration seams & data-model additions (OLOS)

Three seams dissolve the island. Each is independently shippable and gate-free except where noted.

- **Seam 1 — Extract pool contract.** `GET /api/extracts?survey=<slug>&status=pooled` returns the `title,summary,source_url` rows the tool's `parseCsv` already consumes. (Note: the endpoint serializes to **CSV text**, or the tool gains a tiny JSON reader — `parseCsv` takes CSV, not a JSON array.) This is the single seam between survey and canvas.
- **Seam 2 — Verbatim state storage.** `sensemaking_sessions (participant_id, cycle_id, state jsonb, updated_at)` stores the tool's `localStorage` blob **verbatim** — dumb storage, client owns semantics. Kills the "private schema drifting" risk *now*; the migration debt to tier-2 is **deferred to the promotion boundary, not erased** (be honest about this).
- **Seam 3 — Repo-seed.** Per §7c.

**New tables (all minimal, additive):** `sources`, `extracts`, `sensemaking_sessions`, `clusters`, `actants`, `solution_proposal_actants`. Migrations claim numbers `00054+` per the repo's numbering convention.

---

## 10. Design decisions to finalize (needs owner sign-off)

These are the open calls in the *current* triangulator. Recommended resolution given; **★ = needs your decision.**

| # | Decision | Recommendation |
|---|---|---|
| D1 ★ | **Member-facing name** | Keep "Triangulator" as the product name; drop "-inator" for shipped copy (keep as affectionate internal codename). Retain the "after Kees Dorst · by Levy Strategic Design for The Upskilling Labs" credit line. |
| D2 ★ | **Swipe lanes at intake** | Add the third "this complicates things" lane at swipe so paradox-seeding starts at intake (matches the `supports/complicates/refutes` edge model). Binary keep/discard is simpler but throws away the complication signal the paradox needs. |
| D3 ★ | **Standpoint weighting** | Yes — `standpoint[]` (field-worker vs. passing observer) should weight an extract's significance in the pool ranking. Structured, not free-text. (It's collected today but unread.) |
| D4 | **Vocabulary alignment** | Keep the tool's richer ladder (Signal→…→Super-theme) in the standalone; map tiers 4–6 onto Ortelius's single `theme` stage **only at promotion**. Do not rename in the standalone (that's a migration). |
| D5 | **"Second"/corroboration term** | Defer — belongs to the shared-pool phase (tier-2), out of standalone scope. Park as "second." |
| D6 ★ | **Losing-cluster members** | UX rule: members whose cluster didn't win **join a winning pod**, and their hypotheses fold in as related evidence. Confirm. |
| D7 | **Slides format** | `slides.html` self-rendering template (consistent with the existing viewer, offline-safe, no build step) over Marp. |
| D8 ★ | **Distribution** | Treat survey **share mechanics** (QR, copy-link, native share, `/s/[slug]`) as item #0 — highest leverage, lowest cost, currently un-owned. Confirm it jumps the queue. |

---

## 11. Execution plan (build order)

Critical-path, gate-free first. **[T]** = standalone tool (`triangles`); **[O]** = OLOS. Sizes S/M/L.

| # | Item | Repo | Size | Gate |
|---|---|---|---|---|
| 0 | Survey **share mechanics** + `/s/[slug]` | O | S | free |
| 1 | `sources` + `extracts` tables + upload + **BYO-prompt** endpoints | O | M | free |
| 2 | Extract-pool API as the tool's CSV contract (Seam 1) | O | S | free |
| 3 | ~~**On-ramp:** Seed Mode wizard + worked-example gating (Area 1)~~ — see 1.1 | T | M | free |
| 4 | **Extraction UX:** copy-prompt / paste-and-parse in the tool (Area 2) | T | M | free |
| 5 | Reskin tool to OLOS light tokens + self-host type; iframe/host it | T | S–M | free |
| 6 | Verbatim state storage `sensemaking_sessions` (Seam 2) | O | S | free |
| 7 | **Finalize `project.jsonld` contract** + `slides.html` deck (Area 3a/3b) | T | M | free |
| 8 | `clusters` + retarget the budget-ballot (Area 4.1) | O | M | free |
| 9 | `actants` + owner-discovery ledger + proposal gate (Area 4.2–4.3) | O | M | free |
| 10 | GitHub App + `/seed-repo` action + **consent gate** (Area 3c) | O | M | consent-gated; after #8–#9 |
| 11 | Signed edges + Ortelius promotion + AI read-surfaces | O | L | **blocked by #11** |

Items 0–10 are gate-free (10 gates on publication consent). Only #11 is blocked by the governance framework.

---

## 12. Risks & dependencies

- **Legal / live:** consent copy still says only "research and project-development" though the consent version bumped to the AI-training envelope; the anonymity-scrub machinery (scheduled scrub, free-text redaction, cohort-size gate) is a stated precondition for `allow_anonymous` and is **not built** though anonymous is on by default. Two exposures; attorney review pending.
- **Governance contradiction:** `lib/llm/names.ts` calls a model server-side to name pods/projects — "no in-app LLM" is already false in code. Carve an explicit cosmetic-naming exception or route through the copy-prompt pattern.
- **Additive-invariant debt is deferred, not resolved,** by verbatim storage — realized at the tier-2 promotion boundary. Decide the offline-Git vs. shared-Supabase reconciliation before any UI port.
- **Model-fit:** the tool has no signed valence edges → the paradox/OPP primitive has no data home until promotion; the 7-tier ladder collapses onto one Ortelius `theme` stage. Map only at promotion.
- **Multiplayer** (FigJam-style live canvas) is deliberately out of scope; if pursued, scope it to the shared Paradox Sprint, on Supabase Realtime (native, in-trust-boundary) not a third-party vendor (a #11 data surface).

---

## 13. Success metrics

- **Funnel:** survey responses (and share-driven reach), extracts produced/day, canvases reaching a named Theme, situations mapped, pods seeded from clusters, projects with a named owner.
- **First-run:** time-to-first-Evidence-card. (The Seed Mode completion metric is void — see 1.1.)
- **Integrity:** % of pods born from a triangulated cluster (target 100%); % of published repos with only consented evidence (must be 100%).

---

## 14. Appendix — current tool map (for builders)

Key functions/state in `triangles/index.html`:

- **Screens / navigation:** `goToScreen(name)` — `concept | setup | sorting | board | workspace`; step indicator via `renderStepIndicator`. (`intro` and `artifact` were removed July 2026; `normalizeState()` redirects boards saved on either.)
- **Modes:** removed July 2026. `appState.mode` is still written as `'pod'` so older saved boards parse, but nothing reads it; `isSeedMode()` and `graduateToPod()` are gone.
- **Data model:** `appState.cards[]` (unified tiered: `tier`, `childIds`), `appState.situations[]`, `appState.nodes`; persistence key `olos.sensemaking.v2`.
- **Intake:** `parseCsv()` (3384); columns `title,summary,source_url`; sample loader `load-sample-btn`.
- **Canvas:** `connectNodes(a,b)` (5197), `createCardBetween()` (4975).
- **Classify:** `enterClassifyPhase()` / `appState.classifyPhase` — the seven evidence types, staged.
- **Situation:** `frame`, `paradox`, stakeholder map, voices-needed, status-quo-beneficiaries.
- **Export:** `buildModularExportFiles()` / `exportModular()` (8829) → `index.html`, `assets/style.css`, `assets/viewer.js`, `data/project.jsonld`, `data/extracts.csv`, `data/site-data.js`, `content/situation.md`, `content/themes.md`. Plus the Git-handoff modal.
- **AI assist:** every ✨ button builds an XML-tagged prompt → clipboard (BYO-LLM). No in-app model.

**Glossary (Dorst, as used here):** *Problem Situation* — the open, dynamic condition mapped from the evidence. *Paradox* — the structural deadlock at its core (an obligatory passage point sustaining a regime). *Theme* — a deeper universal bridging human experience and structural condition. *Frame* — "if the situation is approached *as if* X, then Y." *Field vs. Context* — the wider network of actors/values vs. the immediate players. *Problem owner* — the actor who could own the situation or adopt a resolution (here: **discovered**, not assumed).
