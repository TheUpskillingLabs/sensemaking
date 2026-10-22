import { CAPITALS, ratingField, typeLabel } from "./capitals";
import type { CapitalKey, CustomerRole, Level, OrgType, ProfileRow, Ring } from "./types";

/** Gallery filters. They live in the URL so a filtered view can be shared or printed. */
export interface Filters {
  type: OrgType | "";
  ring: Ring | "";
  role: CustomerRole | "";
  cap: CapitalKey | "";
  level: Level | "";
  q: string;
  drafts: boolean;
}

const TYPES: OrgType[] = ["library", "employer", "workforce_agency", "community_group", "training_provider", "funder", "other"];
const ROLES: CustomerRole[] = ["helped", "paying", "both", "neither", "unsure"];
const RINGS: Ring[] = ["inner_circle", "wider_field"];
const LEVELS: Level[] = ["low", "medium", "high", "unsure"];

export function readFilters(sp: URLSearchParams): Filters {
  const t = sp.get("type") ?? "", r = sp.get("ring") ?? "", c = sp.get("cap") ?? "", l = sp.get("level") ?? "", ro = sp.get("role") ?? "";
  return {
    type: (TYPES as string[]).includes(t) ? (t as OrgType) : "",
    ring: (RINGS as string[]).includes(r) ? (r as Ring) : "",
    role: (ROLES as string[]).includes(ro) ? (ro as CustomerRole) : "",
    cap: CAPITALS.some((x) => x.key === c) ? (c as CapitalKey) : "",
    level: (LEVELS as string[]).includes(l) ? (l as Level) : "",
    q: sp.get("q") ?? "",
    drafts: sp.get("drafts") === "1",
  };
}

export function writeFilters(f: Filters): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.type) sp.set("type", f.type);
  if (f.ring) sp.set("ring", f.ring);
  if (f.role) sp.set("role", f.role);
  if (f.cap) sp.set("cap", f.cap);
  if (f.level) sp.set("level", f.level);
  if (f.q.trim()) sp.set("q", f.q);
  if (f.drafts) sp.set("drafts", "1");
  return sp;
}

const norm = (s: string) => s.toLocaleLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

export function applyFilters(rows: ProfileRow[], f: Filters, canSeeDrafts: boolean): ProfileRow[] {
  const terms = norm(f.q).split(/\s+/).filter(Boolean);
  return rows.filter((p) => {
    if (p.status === "draft" && !(f.drafts && canSeeDrafts)) return false;
    if (f.type && p.org_type !== f.type) return false;
    if (f.ring && p.ring !== f.ring) return false;
    if (f.role && p.customer_role !== f.role) return false;
    if (f.cap && f.level && p[ratingField(f.cap)] !== f.level) return false;
    if (terms.length) {
      const hay = norm([p.name, typeLabel(p), p.description, p.tried_before, ...(p.connections ?? []).map((c) => c.name), p.needs, p.connection_to_labs].filter(Boolean).join(" "));
      if (!terms.every((t) => hay.includes(t))) return false;
    }
    return true;
  });
}

export function sortRows(rows: ProfileRow[]): ProfileRow[] {
  return [...rows].sort((a, b) => (a.name ?? "￿").localeCompare(b.name ?? "￿", undefined, { sensitivity: "base" }));
}
