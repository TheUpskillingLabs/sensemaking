import type { CapitalKey, EditableField, Level, OrgType, ProfileRow, Ring } from "./types";

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
  { value: "other", label: "Other" },
];
export const ORG_TYPE_LABEL: Record<OrgType, string> = Object.fromEntries(ORG_TYPES.map((o) => [o.value, o.label])) as Record<OrgType, string>;

export const RINGS: { value: Ring; label: string; hint: string }[] = [
  { value: "inner_circle", label: "Inner circle", hint: "Directly involved with The Labs or the people it serves." },
  { value: "wider_field", label: "Wider field", hint: "Part of the surrounding ecosystem, less directly involved." },
];
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
  if (!p.org_type) out.push({ field: "org_type", label: "Type" });
  else if (p.org_type === "other" && blank(p.org_type_other)) out.push({ field: "org_type_other", label: "What type of player" });
  if (blank(p.description)) out.push({ field: "description", label: "Who they are" });
  if (!p.ring) out.push({ field: "ring", label: "Ring" });
  for (const c of CAPITALS) if (!p[ratingField(c.key)]) out.push({ field: ratingField(c.key), label: `${c.label} capital` });
  if (blank(p.needs)) out.push({ field: "needs", label: "What they need" });
  if (!p.influence_level) out.push({ field: "influence_level", label: "Influence" });
  if (blank(p.stake)) out.push({ field: "stake", label: "Stake" });
  if (blank(p.connection_to_labs)) out.push({ field: "connection_to_labs", label: "How they could connect to The Labs" });
  return out;
}
