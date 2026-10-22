/* Two worked examples for the tutorial, from a made-up case so they don't seed
   anyone's DC profiles: the Millbrook Kitchen Collective, a shared commercial
   kitchen in a small, fictional city, that trains cooks and helps food
   businesses get started. Everything here is invented. */

import { CAPITALS, ratingField } from "./capitals";
import type { CapitalKey, Connection, CustomerRole, Level, OrgType, Ring } from "./types";

export const CASE = {
  org: "Millbrook Kitchen Collective",
  short: "the Kitchen Collective",
  blurb: "A made-up case: the Millbrook Kitchen Collective is a shared commercial kitchen in a small city that trains cooks and helps food businesses get started. Imagine you're in its cohort, mapping the players around it. Nothing here is real, so it won't color what you write about DC.",
};

export interface Example {
  id: string;
  intro: string;
  name: string;
  org_type: OrgType;
  org_type_other: string | null;
  description: string;
  tried_before: string | null;
  ring: Ring;
  ratings: Record<CapitalKey, Level>;
  notes: Partial<Record<CapitalKey, string>>;
  connections: Connection[];
  needs: string;
  values_held: string | null;
  fears: string | null;
  influence_level: Level;
  influence_note: string | null;
  stake: string;
  customer_role: CustomerRole;
  connection: string;
  /** Captions that differ from the defaults, by step key. */
  captions: Partial<Record<string, string>>;
}

export const EXAMPLES: Example[] = [
  {
    id: "market",
    intro: "First, a player close to the center: the farmers' market where the Collective's cooks sell on Saturdays.",
    name: "Riverside Farmers' Market",
    org_type: "other",
    org_type_other: "Market",
    description: "A Saturday market on a city lot by the river, run by a volunteer board. Forty stalls in summer, a dozen in winter. It's where new food businesses from the Collective sell for the first time, and where a lot of Millbrook finds out they exist.",
    tried_before: null,
    ring: "inner_circle",
    ratings: { natural: "high", cultural: "high", human: "medium", social: "high", political: "low", financial: "low", built: "medium" },
    notes: { natural: "The river lot; produce from the valley", social: "Regulars know the vendors by name", financial: "Stall fees cover the insurance and not much else" },
    connections: [
      { name: "Millbrook Kitchen Collective", capital: "built", direction: "gets", note: "Vendors prep in the Collective's kitchen the night before" },
      { name: "Hillside Growers Co-op", capital: "natural", direction: "gets", note: "Most of the produce stalls" },
      { name: "City Parks Department", capital: "built", direction: "gets", note: "Permits the lot, year to year" },
    ],
    needs: "Vendors who can keep showing up through winter, and a longer lease on the lot.",
    values_held: "Local first. A stall should be someone from Millbrook.",
    fears: "Turning into a weekend attraction for people from out of town, with prices to match.",
    influence_level: "medium",
    influence_note: "Everyone knows it; it decides little.",
    stake: "Without a steady stream of new vendors, the winter market dies, and the lease goes with it.",
    customer_role: "both",
    connection: "It's where the Collective's cooks start selling, and it could help pick which products to train for.",
    captions: {
      org_type: "The list has the common kinds. A market isn't one of them, so this one is Other, and you say what kind.",
      ring: "The market already works with the Collective every week, so it's inner circle.",
      customer_role: "The market is served by the Collective's new vendors and contributes by giving them somewhere to sell. That's both.",
    },
  },
  {
    id: "foundation",
    intro: "Second, a player further out: the community foundation that has funded food programs in Millbrook before.",
    name: "Westbank Community Foundation",
    org_type: "funder",
    org_type_other: null,
    description: "The county's community foundation. It pools donations from local families and businesses and makes grants of a few thousand to a few hundred thousand dollars a year, mostly to health, schools, and job programs. A small staff and a board of long-time residents.",
    tried_before: "Funded a culinary job-training certificate at the community college in 2021. Closed after two years when placements came in under the grant's target. Staff there say the students were good; the restaurants that had promised to hire were short on hours that winter.",
    ring: "wider_field",
    ratings: { natural: "low", cultural: "medium", human: "medium", social: "high", political: "high", financial: "high", built: "low" },
    notes: { social: "Its board knows every employer in the county", political: "A call from the foundation gets returned", financial: "The largest local grantmaker" },
    connections: [
      { name: "Millbrook Kitchen Collective", capital: "financial", direction: "gives", note: "A small planning grant last year" },
      { name: "Millbrook Public Schools", capital: "financial", direction: "gives", note: "Its biggest grantee" },
      { name: "County Workforce Board", capital: "political", direction: "both", note: "Two board members sit on both" },
    ],
    needs: "Grantees that can report what happened to the people in their programs, in numbers its board will accept.",
    values_held: "Stewardship. It sees donors' money as a trust.",
    fears: "Funding something that fades when the grant ends, and having to explain that to donors.",
    influence_level: "high",
    influence_note: null,
    stake: "Its standing with donors rests on grants that visibly work.",
    customer_role: "paying",
    connection: "Could fund the Collective's next cohort, but only if it can see who got hired and what they're making.",
    captions: {
      org_type: "Funder is on the list because the two-customers idea needs it.",
      tried_before: "This is the archaeology. The foundation tried something like this before. Say what, and what got in the way. That history is evidence for the whole group.",
      ring: "The foundation gave one small grant and isn't in the room week to week. Wider field.",
      customer_role: "The foundation contributes. It isn't the one whose life the work changes.",
      connection: "In the real form this question is about The Labs. Here it's about the Collective, but the shape is the same: could they connect, and what would each side want?",
    },
  },
];

/** The order the form asks things, as steps the player can walk through. */
export type StepKind = "text" | "select" | "segment" | "choice" | "connection";
export interface Step { key: string; kind: StepKind; caption: string; chars?: number }

const DEFAULT_CAPTIONS: Record<string, string> = {
  name: "Name the player. Use the name people in the neighborhood use.",
  org_type: "Pick the closest type from the list.",
  org_type_other: "When the list doesn't fit, say what kind of player this is in a word or two.",
  description: "Who they are, in your own words: what they do or make, and how they show up here. A few lines is plenty.",
  tried_before: "If they've tried something in this area before, say what, and how it went. Optional, but it's evidence.",
  ring: "Inner circle if they already work with the organization at the center. Wider field if they could be affected or could help but aren't involved yet.",
  capitals: "Rate how much of each of the seven kinds of wealth this player has: low, medium, high, or not sure. Add a note where it helps. Watch the shape take form as you go.",
  connections: "Now the heart of it: who are they connected to? One row per connection. If you know which capital moves between them and which way, say so. That's optional, and it's what lets us draw the field later.",
  needs: "What do they need? One or two sentences.",
  values_held: "What do they value? Optional.",
  fears: "What do they fear or want to avoid? Optional.",
  influence_level: "How much say do they have over what happens around the organization at the center?",
  stake: "What's at stake for them, if anything? What do they stand to gain or lose?",
  customer_role: "Are they served by the work, contributing to it, both, or neither? Optional. Not sure is a real answer.",
  connection: "Last, could they connect to the organization at the center? How, or why not?",
};

export function stepsFor(ex: Example): Step[] {
  const cap = (k: string) => ex.captions[k] ?? DEFAULT_CAPTIONS[k] ?? "";
  const steps: Step[] = [
    { key: "name", kind: "text", caption: cap("name") },
    { key: "org_type", kind: "select", caption: cap("org_type") },
  ];
  if (ex.org_type === "other") steps.push({ key: "org_type_other", kind: "text", caption: cap("org_type_other") });
  steps.push({ key: "description", kind: "text", caption: cap("description") });
  if (ex.tried_before) steps.push({ key: "tried_before", kind: "text", caption: cap("tried_before") });
  steps.push({ key: "ring", kind: "choice", caption: cap("ring") });
  CAPITALS.forEach((c, i) => steps.push({ key: ratingField(c.key), kind: "segment", caption: i === 0 ? cap("capitals") : `${c.label}: ${c.prompt.toLowerCase()}.` }));
  ex.connections.forEach((_, i) => steps.push({ key: `connection:${i}`, kind: "connection", caption: i === 0 ? cap("connections") : i === 1 ? "Add as many as you know of. One is fine if that's what you know." : "You can always come back and add to this." }));
  steps.push({ key: "needs", kind: "text", caption: cap("needs") });
  if (ex.values_held) steps.push({ key: "values_held", kind: "text", caption: cap("values_held") });
  if (ex.fears) steps.push({ key: "fears", kind: "text", caption: cap("fears") });
  steps.push({ key: "influence_level", kind: "segment", caption: cap("influence_level") });
  steps.push({ key: "stake", kind: "text", caption: cap("stake") });
  steps.push({ key: "customer_role", kind: "choice", caption: cap("customer_role") });
  steps.push({ key: "connection", kind: "text", caption: cap("connection") });
  return steps;
}
