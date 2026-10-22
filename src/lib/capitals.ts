import type { CapitalKey, Connection, CustomerRole, EditableField, FlowDirection, Level, OrgType, ProfileRow, Ring } from "./types";

/** The seven Community Capitals, in the order they're always shown. */
export const CAPITALS: { key: CapitalKey; label: string; prompt: string }[] = [
  { key: "natural", label: "Natural", prompt: "Land, water, parks, the physical environment" },
  { key: "cultural", label: "Cultural", prompt: "Traditions, identity, language, ways of knowing" },
  { key: "human", label: "Human", prompt: "Skills, knowledge, health and capacity of people" },
  { key: "social", label: "Social", prompt: "Networks, relationships, trust, belonging" },
  { key: "political", label: "Political", prompt: "Voice, access to power, influence on decisions" },
  { key: "financial", label: "Financial", prompt: "Money, funding, investment, credit" },
  { key: "built", label: "Built", prompt: "Buildings, infrastructure, technology, equipment" },
];

export const ratingField = (k: CapitalKey) => `capital_${k}_rating` as const;
export const noteField = (k: CapitalKey) => `capital_${k}_note` as const;

export const LEVELS: { value: Level; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];
export const LEVEL_LABEL: Record<Level, string> = { low: "Low", medium: "Medium", high: "High" };

export const ORG_TYPES: { value: OrgType; label: string }[] = [
  { value: "library", label: "Library" },
  { value: "employer", label: "Employer" },
  { value: "workforce_agency", label: "Workforce agency" },
  { value: "community_group", label: "Community group" },
  { value: "training_provider", label: "Training provider" },
  { value: "funder", label: "Funder" },
  { value: "other", label: "Other" },
];
export const ORG_TYPE_LABEL: Record<OrgType, string> = Object.fromEntries(ORG_TYPES.map((o) => [o.value, o.label])) as Record<OrgType, string>;

export const RINGS: { value: Ring; label: string; hint: string }[] = [
  { value: "inner_circle", label: "Inner circle", hint: "Already working with The Labs or the people it serves." },
  { value: "wider_field", label: "Wider field", hint: "Not involved yet, but could be affected or could help." },
];
/** Which way a capital moves along a connection, from this player's side. */
export const DIRECTIONS: { value: FlowDirection; label: string }[] = [
  { value: "gives", label: "This player gives it" },
  { value: "gets", label: "This player gets it" },
  { value: "both", label: "Both ways" },
];
export const DIRECTION_LABEL: Record<FlowDirection, string> = { gives: "gives", gets: "gets", both: "gives and gets" };
export const CAPITAL_LABEL: Record<CapitalKey, string> = Object.fromEntries(CAPITALS.map((c) => [c.key, c.label])) as Record<CapitalKey, string>;
export const blankConnection = (): Connection => ({ name: "", capital: null, direction: null, note: "" });
export const namedConnections = (c: Connection[] | null | undefined): Connection[] => (c ?? []).filter((x) => x.name.trim() !== "");
/** "Social capital, they give it" */
export function flowLabel(c: Connection): string {
  if (!c.capital) return "";
  return `${CAPITAL_LABEL[c.capital]} capital${c.direction ? `, ${DIRECTION_LABEL[c.direction]}` : ""}`;
}

/** Drucker's two kinds of customers, as one choice. */
export const CUSTOMER_ROLES: { value: CustomerRole; label: string; hint: string }[] = [
  { value: "helped", label: "Served", hint: "The Labs' work changes things for them." },
  { value: "paying", label: "Contributing", hint: "They fund it, host it, hire from it, or give their time." },
  { value: "both", label: "Both", hint: "Served by it, and helps keep it going." },
  { value: "unsure", label: "Not sure yet", hint: "That's fine. Say what you'd need to know." },
];
/* Database values stay helped/paying; the words people see are served/contributing. */
export const CUSTOMER_ROLE_LABEL: Record<CustomerRole, string> = { helped: "Served", paying: "Contributing", both: "Served and contributing", unsure: "Not sure yet" };

export const RING_LABEL: Record<Ring, string> = { inner_circle: "Inner circle", wider_field: "Wider field" };

export function typeLabel(p: Pick<ProfileRow, "org_type" | "org_type_other">): string {
  if (!p.org_type) return "";
  if (p.org_type === "other") return p.org_type_other?.trim() || "Other";
  return ORG_TYPE_LABEL[p.org_type];
}

/** Required to submit, in the order they appear on the page. Mirrors the check constraint. */
export interface Missing { field: EditableField; label: string }

const blank = (v: string | null | undefined) => !v || v.trim() === "";

export function missingFields(p: Pick<ProfileRow, EditableField>): Missing[] {
  const out: Missing[] = [];
  if (blank(p.name)) out.push({ field: "name", label: "Name of the player" });
  if (!p.org_type) out.push({ field: "org_type", label: "Type of player" });
  else if (p.org_type === "other" && blank(p.org_type_other)) out.push({ field: "org_type_other", label: "What type of player" });
  if (blank(p.description)) out.push({ field: "description", label: "Who they are" });
  if (!p.ring) out.push({ field: "ring", label: "Inner circle or wider field" });
  for (const c of CAPITALS) if (!p[ratingField(c.key)]) out.push({ field: ratingField(c.key), label: `${c.label} capital` });
  if (namedConnections(p.connections).length === 0) out.push({ field: "connections", label: "At least one connection" });
  if (blank(p.needs)) out.push({ field: "needs", label: "What they need" });
  if (!p.influence_level) out.push({ field: "influence_level", label: "Influence" });
  if (blank(p.stake)) out.push({ field: "stake", label: "What's at stake for them" });
  if (blank(p.connection_to_labs)) out.push({ field: "connection_to_labs", label: "How they could connect to The Labs" });
  return out;
}

/** "Saturday at 8:00 am" or "Saturday, October 25 at 8:00 am", in the reader's own time zone. */
export function opensLabel(iso: string | null | undefined, withDate = false): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const day = d.toLocaleDateString(undefined, withDate ? { weekday: "long", month: "long", day: "numeric" } : { weekday: "long" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${day} at ${time}`;
}
export const opensLater = (iso: string | null | undefined): boolean => Boolean(iso && Date.now() < Date.parse(iso));
