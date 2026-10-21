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
