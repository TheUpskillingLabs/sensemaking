# The field, drawn live (planned, not built)

**Status:** deferred until the relational data exists. Decided 2026-10-21.

## The idea

The gallery gets a live picture of the field in the visual language of The Labs' home page (the ambassadors site's `src/scripts/orbnet.ts`). The Labs is the orb at the centre and every player is a mark around it. The point of the picture is the **relationships**: the flows of the seven capitals between players. Each tie says what kind of relationship it is: which capital moves, in which direction, and how strongly. For example, a funder sends financial capital to a training provider, which sends human capital back out to residents.

So the picture answers questions a list can't:

- Where does each capital come from, and where does it pool?
- Which players are bridges, and which are cut off?
- Which flows run through The Labs today, and which could?
- Where is a capital thin across the whole field?

## Why it waits

Today each stakeholder profile is one person's view of one player. There are no player records shared across profiles, and no ties between players. A picture of flows needs both.

## What the data needs first

1. **Players as entities.** One record per real organization, with the profiles that describe it linked to it. Duplicates need merging: several people will profile "DC Public Library".
2. **Relationships between players.** One record per tie: from player, to player, capital (one of the seven), direction, strength or confidence, and who asserted it (which profile, which person). Flows are claims from many independent views. Disagreement between them is data, not noise.
3. **The Labs as a player,** so flows to and from it can be drawn and compared.
4. **Row-level security that keeps the independence rule.** Relationships stay hidden from a participant until they've submitted their own required profiles, like profiles today.

## How it should look and behave

The ambassadors site already established these rules:

- **Marks:** one glyph per player type, sized by influence.
- **Distance:** the Ring answer sets how far a player sits from the orb (inner circle or wider field).
- **Flows:** particles moving along the ties, coloured by capital.
- **Inspecting:** point at or tap any mark or tie and a card says what it is. Nothing follows the cursor.
- **Words in the light:** no scrims or panels over the picture.
- **Motion controls:** a Pause control, a static picture under reduced motion, and a list view of the same data for screen readers and for close reading.
- **Projection:** works projected in a room, which is the first place it will be used.
