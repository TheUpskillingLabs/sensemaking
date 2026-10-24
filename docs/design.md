# Design rules for Stakeholder Profiles

The world (ink, teal and forest light, grain, Geologica, the orb opening) is The Labs'. The app on top of it is a working tool. These rules keep it from sliding back into template defaults. Tokens live in `src/styles/labs.css`.

## Do
- **One signature:** each profile's seven capitals are drawn as a seven-pointed shape (`CapGlyph`). It stands in for status dots and colour strips everywhere.
- **Headings:** Geologica with the sharpness axis on (`font-variation-settings: "SHRP" 100` for display, 60 for sections). Emphasis comes from size and weight.
- **Colour has jobs:** teal is for action and for the capitals' shape; gold means draft; amber means a problem. Text is tinted from the ground, never neutral grey.
- **Corner radius by role:** fields 6px, buttons 8px, panels 12px, list items none.
- **Structure:** built from spacing and hairline rules. Lists are lists, not card grids.
- **Wide screens:** long pages (the editor, the reading page) get a sticky contents rail at 1100px and up.
- **Labels and buttons:** labels are sentence case, and buttons name their action ("Start a profile", "Submit profile").
- **Motion:** the opening and the arrival after it are the only motion that isn't a response to an action.

## Don't
- All-caps eyebrows above headings, or "Build Cycle C04 · …" kickers.
- Meta strings joined with middle dots. Write "Library, inner circle".
- A "→" appended to buttons or links.
- Gradient text, glow blobs, or coloured left borders on callouts.
- 01/02/03 numbering on anything that isn't a real sequence.
- Fade-up reveals on every section.

Sources: Anthropic's frontend-design skill; Impeccable (pbakaus/impeccable), craft floor, layout and typeset references; Laith0003/ux-skill, "How to detect AI slop"; The Fountain Institute, "7 tells that a UI is AI-generated"; ProPublica, "Inside ProPublica's article layout framework".

## The ambassadors site's creative direction, and what carries over

Read from `theupskillinglabs/ambassadors` (`src/scripts/orbnet.ts`, `smooth.ts`, `deck.ts`, `src/styles/colors_and_type.css`, `home.css`, `design/research/onboarding-experience.md`, and the retreat deck in `public/retreat/vision`).

**One motif, drawn as a world.** The home page and the decks share one picture of The Labs: an actor-network, "no given scale, only actors and their ties." Every actor has a mark: people are a pearl dot, places (libraries) a teal square, projects a red diamond, knowledge (playbooks, code) a gold ring. The three paths share the colours (learn teal, build red, share gold). Gold is the regional metal; silver belongs to the national org alone and shows only at the centre. A Lab is nothing but its ties; density is gravity, so a dense Lab pulls harder, glows, and bends the orbits under it. Innovation runs as sparks on a heartbeat: red out along a project's ties, teal up to the orb, silver back down to every Lab. The orb is the logo's, fitted to `orb-mark.png`, and the journey ends with the world's dust flying into the swoosh and the brand lockup laid exactly over the orb.

**Motion rules.** Everything goes one way. The home page's camera only ever goes down (the system, the weave, each thread, the next system one cycle on), never climbs back, and the world turns steadily the way its orbits turn, with no swings. Scroll drives the camera and never stops it; it only slows at the few moments that matter. Scroll-linked effects use CSS `animation-timeline: view()` / `scroll(root)` so the browser keeps pace with the finger. Smooth scrolling is Lenis at `lerp: 0.1`, anchors stopping clear of the fixed header, nested scrollers native, and nothing at all under `prefers-reduced-motion` (Lenis doesn't start; the world draws one still frame; without WebGL 2 the poster stays). UI transitions are short and few: 0.1–0.35s, one spring ease `cubic-bezier(0.32, 0.72, 0, 1)`. The deck's words arrive with `data-at` steps and staggered delays (0.35s + 0.11s per element, or a per-item `--d`); lists build themselves while the speaker talks.

**Rendering.** Plain WebGL 2, no library. Soft feathered marks into a high-range buffer, then bloom, a gentle shoulder that keeps the brand colours, grain only where there is light, a touch of chromatic fringing, screen-blended over the page so the title sits inside the light. Quality adapts to frame rate; it draws only while on screen.

**Tokens, as the brand states them.** Ink `#00141b`, navy `#03232a`, forest `#005f68`, teal `#0094a0` (focus and accents only), teal-deep `#007882` (text accents, links, CTAs on light), red `#e11d2a` (reserved for "Join The Labs"), paper `#f6f4ef`, metal gold `#cfab67`. On dark, text is white at 0.95 / 0.64 / 0.4. Three owner rules: one radius, 14px, on every rectangular container, no pills, genuine circles only for dots; warm paper is the only light page background and dark is for covers, bars, footers and slides; a 4px baseline. Geologica throughout; the display sizes use the `SHRP` axis on dark.

**Voice.** "The friend who went first. Dry, specific, generous. Speaks in names and dates, never adjectives." Inviting before anything else; no absolutes about the reader; commands only where the reader asked to be told what to do.

**Where this app already matches.** Ink, teal-deep for action, Geologica with the sharpness axis, the orb opening, grain, text tinted from the ground, lists over card grids, motion only as a response to an action.

**Where it diverges, and what to do.**
- Radius: this app uses 6/8/12 by role; the brand says one radius, 14px, and no pills. The pills here (`.rs-live`, `.state`) and the mixed radii should go to `--r: 14px` and square corners after Saturday. Not before: it touches every screen.
- Ink: `#021a20` here against the brand's `#00141b`. One line to change; do it with the radius pass.
- Marks: the capitals shape (`CapGlyph`) is this app's signature and it should stay. But the world's four marks map onto the app's data: profiles are places and people (square, dot), the connections between them are ties, and a stakeholder group is a dense cluster. The planned field visualization should be drawn in the world's language (marks, ties, gold dust for a group's orbit) so the app's picture of the ecosystem and the site's picture of The Labs are one picture.
- The deck at `/deck/` already uses the engine, so it inherits all of this. Keep slide words to one column, left, at the foot; the picture is right of centre; nothing is laid over the picture.

## The deck's grid

The deck (`public/deck/index.html`) is authored at 1920 × 1080. One authored pixel is `--u`, so everything below scales with the screen. Measured against every slide at its final step with `pw/audit.mjs`; the rules are what made all thirty fit.

**Baseline.** 4u, with type on 8u wherever it can be: kicker 22/28, heading 92/96, large heading 124/128, lead 35/44, quote 36/44, list items 32–34/40, small 22/28. Line heights are set in `u`, not as ratios, so lines land on the grid at every size.

**Spacing scale.** `--s0` 4 · `--s1` 8 · `--s15` 12 · `--s2` 16 · `--s3` 24 · `--s4` 32 · `--s5` 48 · `--s6` 64.

**Columns.** Gutter `--gut` is 112u each side; the content field is 1696u. The words column is 720u at the left edge. The picture zone starts one full gutter to the right of the words (x = 944u) and runs to the right gutter: 864u wide (`--pic-w`). Nothing drawn crosses the gutter between them.

**Rows.** Lockup at the top left, 44u tall under a 63u margin; its safe zone ends at `--top` = 152u. When the clock is on (timer slides), the picture zone starts at `--top-clock` = 236u instead. The foot (`--foot`, 124u) holds the pager and the progress rule. The words column is anchored at the foot and grows upward; it must never reach `--top`. If it does, cut copy, not spacing.

**Minimum space between kinds of element.**

| From → to | Space | Why |
| --- | --- | --- |
| Kicker → heading | 12u | One unit; the kicker labels the heading |
| Heading → anything | 24u | A block break |
| Lead → lead, lead → small | 16u | One passage |
| Block → block (lead → list, list → lead, cards → lead) | 24u | The column's rhythm |
| List item → list item (rules, spins) | 12u | Items read as one list |
| Card → card | 16u | Each card has its own rule and padding |
| Words → picture | ≥ 112u | One gutter; never less |
| Lockup → any content | ≥ 45u | Below 152u |
| Clock → picture | ≥ 24u | Picture starts at 236u when the clock is on |
| Picture → foot | 0 | Pictures end at the foot line |

**Pictures.** One per slide at most, in the picture zone, `right: var(--gut)`, height to the zone, width auto, `max-width: var(--pic-w)`. One hue plus one accent: dots and lines in soft white and teal, gold for the single thing to notice. Every unit chart carries its key (one dot, one answer). Numbers live in the app, not on the slide.
