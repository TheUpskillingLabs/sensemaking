import type { CapitalKey, Connection, EditableField, FlowDirection, Level, OrgType, ProfileRow, Ring, Role } from "./types";

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
  { value: "unsure", label: "Not sure" },
];
export const LEVEL_LABEL: Record<Level, string> = { low: "Low", medium: "Medium", high: "High", unsure: "Not sure" };
/** A rating that places a point on the shape; "not sure" doesn't. */
export const isRated = (v: Level | null | undefined): v is "low" | "medium" | "high" => v === "low" || v === "medium" || v === "high";

/** Alphabetical, so the order doesn't suggest an answer. */
export const ORG_TYPES: { value: OrgType; label: string }[] = [
  { value: "community_group", label: "Community group" },
  { value: "employer", label: "Employer" },
  { value: "funder", label: "Funder" },
  { value: "library", label: "Library" },
  { value: "training_provider", label: "Training provider" },
  { value: "workforce_agency", label: "Workforce agency" },
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

/** What a player does in relation to the work, said the same way for all three. Any mix; "unsure" stands alone. */
export const ROLES: { value: Role; label: string; hint: string }[] = [
  { value: "serving", label: "Serving", hint: "They serve the same people or place The Labs does." },
  { value: "contributing", label: "Contributing", hint: "They host it, hire from it, refer people, or give their time." },
  { value: "sustaining", label: "Sustaining", hint: "They pay for it, or otherwise keep it going." },
  { value: "unsure", label: "Not sure", hint: "That's fine. Say what you'd need to know." },
];
export const ROLE_LABEL: Record<Role, string> = { serving: "Serving", contributing: "Contributing", sustaining: "Sustaining", unsure: "Not sure" };
/** "Serving and sustaining", "Not sure", or "" when there's no tie. */
export function rolesLabel(roles: Role[] | null | undefined): string {
  const r = roles ?? [];
  if (r.includes("unsure")) return "Not sure";
  const names = ROLES.filter((o) => o.value !== "unsure" && r.includes(o.value)).map((o) => o.label.toLowerCase());
  if (!names.length) return "";
  const s = names.length === 1 ? names[0] as string : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
  return s.charAt(0).toUpperCase() + s.slice(1);
}
/** Toggle one role; "unsure" clears the others and the others clear it. */
export function toggleRole(roles: Role[], r: Role): Role[] {
  if (roles.includes(r)) return roles.filter((x) => x !== r);
  return r === "unsure" ? ["unsure"] : [...roles.filter((x) => x !== "unsure"), r];
}

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
  if (blank(p.connection_to_labs)) out.push({ field: "connection_to_labs", label: "Could they connect to The Labs" });
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
