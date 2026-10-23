/* A stakeholder group, averaged from the profiles in it.

   Ratings: low = 1, medium = 2, high = 3. "Not sure" and blank are left out
   of the average and counted separately, so a guess never moves the mean.
   Alongside each mean we keep the spread (how many said low, medium, high,
   not sure), because on sensemaking day disagreement is as useful as the
   average. Connections are merged by name (case and spacing ignored) and
   counted, so a player many people connected to rises to the top. */

import { CAPITALS, ORG_TYPE_LABEL, RING_LABEL, ROLES, ratingField, typeLabel } from "./capitals";
import type { CapitalKey, FlowDirection, Level, ProfileRow, Ring, Role } from "./types";

export const LEVEL_VALUE: Record<"low" | "medium" | "high", number> = { low: 1, medium: 2, high: 3 };

export interface Spread { low: number; medium: number; high: number; unsure: number; blank: number }
export interface Averaged { mean: number | null; spread: Spread; rated: number }

function average(levels: (Level | null)[]): Averaged {
  const spread: Spread = { low: 0, medium: 0, high: 0, unsure: 0, blank: 0 };
  let sum = 0, rated = 0;
  for (const l of levels) {
    if (l === "low" || l === "medium" || l === "high") { spread[l] += 1; sum += LEVEL_VALUE[l]; rated += 1; }
    else if (l === "unsure") spread.unsure += 1;
    else spread.blank += 1;
  }
  return { mean: rated ? sum / rated : null, spread, rated };
}

/** "Medium-high (2.4)" style label for a mean on the 1–3 scale. */
export function meanLabel(m: number | null): string {
  if (m === null) return "Not rated";
  const word = m < 1.34 ? "Low" : m < 1.67 ? "Low to medium" : m < 2.34 ? "Medium" : m < 2.67 ? "Medium to high" : "High";
  return word;
}
/** How much people disagreed: none, some, a lot. Uses the range of answers given. */
export function agreement(s: Spread): "agree" | "mixed" | "split" | null {
  const given = [s.low, s.medium, s.high].filter((n) => n > 0).length;
  if (s.low + s.medium + s.high < 2) return null;
  if (given === 1) return "agree";
  if (s.low > 0 && s.high > 0) return "split";
  return "mixed";
}

export interface MergedConnection { name: string; count: number; capitals: { capital: CapitalKey; direction: FlowDirection | null; count: number }[] }

export interface GroupSummary {
  size: number;
  capitals: Record<CapitalKey, Averaged>;
  influence: Averaged;
  rings: Record<Ring, number> & { unset: number };
  roles: Record<Role, number> & { none: number };
  types: { label: string; count: number }[];
  connections: MergedConnection[];
}

const norm = (s: string) => s.trim().toLocaleLowerCase().replace(/\s+/g, " ");

export function summarize(profiles: ProfileRow[]): GroupSummary {
  const capitals = Object.fromEntries(CAPITALS.map((c) => [c.key, average(profiles.map((p) => p[ratingField(c.key)] as Level | null))])) as Record<CapitalKey, Averaged>;
  const influence = average(profiles.map((p) => p.influence_level));
  const rings = { inner_circle: 0, wider_field: 0, unset: 0 };
  for (const p of profiles) { if (p.ring) rings[p.ring] += 1; else rings.unset += 1; }
  const roles = { serving: 0, contributing: 0, sustaining: 0, unsure: 0, none: 0 };
  for (const p of profiles) { const r = p.roles ?? []; if (!r.length) roles.none += 1; for (const x of r) roles[x] += 1; }
  const typeCounts = new Map<string, number>();
  for (const p of profiles) { const t = p.org_type ? typeLabel(p) : "No type"; typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1); }
  const types = [...typeCounts].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const byName = new Map<string, MergedConnection>();
  const memberNames = new Set(profiles.map((p) => norm(p.name ?? "")));
  for (const p of profiles) {
    const seen = new Set<string>();
    for (const c of p.connections ?? []) {
      const key = norm(c.name ?? ""); if (!key || seen.has(key)) continue; seen.add(key);
      const m = byName.get(key) ?? { name: c.name.trim(), count: 0, capitals: [] };
      m.count += 1;
      if (c.capital) {
        const f = m.capitals.find((x) => x.capital === c.capital && x.direction === c.direction);
        if (f) f.count += 1; else m.capitals.push({ capital: c.capital, direction: c.direction, count: 1 });
      }
      byName.set(key, m);
    }
  }
  const connections = [...byName.entries()]
    .filter(([key]) => !memberNames.has(key))
    .map(([, m]) => ({ ...m, capitals: m.capitals.sort((a, b) => b.count - a.count) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return { size: profiles.length, capitals, influence, rings, roles, types, connections };
}

export const RING_NAMES = RING_LABEL;
/** "2 employers", "1 library", "3 libraries". */
export function countOf(n: number, label: string): string {
  const l = label.toLowerCase();
  if (n === 1) return `1 ${l}`;
  const plural = /[^aeiou]y$/.test(l) ? l.slice(0, -1) + "ies" : /(s|x|ch|sh)$/.test(l) ? l + "es" : l + "s";
  return `${n} ${plural}`;
}
export const ROLE_NAMES = Object.fromEntries(ROLES.map((r) => [r.value, r.label])) as Record<Role, string>;
export const TYPE_NAMES = ORG_TYPE_LABEL;

/* ── QR codes on printed cards ──
   Each card's code is the profile's own address in the app, so a phone
   camera opens the profile, and the group scanner reads the id out of it. */

export const profileUrl = (id: string) => `${location.origin}/profiles/${id}`;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
/** The profile id inside a scanned code, if it's one of ours. Mock ids (seed-0) are accepted in dev. */
export function idFromCode(text: string): string | null {
  const m = text.match(/\/(?:p|profiles)\/([^/?#\s]+)/i);
  if (m && m[1]) return m[1].toLowerCase();
  const u = text.match(UUID);
  return u ? u[0].toLowerCase() : null;
}

/** The text a card's QR code carries: "SP:" and the first ten characters of the profile's id, in
    capitals. That fits the smallest QR code there is (21 x 21 squares), so each square prints big and
    reads from a photo of a whole cluster. Ten characters of a random id never collide in one cycle. */
export const shortId = (id: string) => id.replace(/-/g, "").slice(0, 10).toUpperCase();
export const cardCode = (id: string) => `SP:${shortId(id)}`;
/** Match a scanned code to one of the profiles this person can see. */
export function matchCode(text: string, byShort: Map<string, string>): string | null {
  const m = text.trim().match(/^SP:([0-9A-Z]+)$/i);
  if (m && m[1]) return byShort.get(m[1].toUpperCase()) ?? null;
  const id = idFromCode(text); // older cards carried the full address
  return id && [...byShort.values()].includes(id) ? id : null;
}
