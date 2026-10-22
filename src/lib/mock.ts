// Dev-only in-memory backend (VITE_MOCK=1). Never shipped: api.ts only imports it
// behind a build-time flag. It imitates the row-level security rules closely
// enough to click through every screen without a Supabase project.
//
// Pick who you are with ?as=participant | unlocked | facilitator | nonmember (remembered for the tab).

import { ApiError, type Api, type SessionUser } from "./api";
import { missingFields } from "./capitals";
import { CYCLE } from "./config";
import type { ConfigRow, ProfileDraft, ProfileRow } from "./types";

type Who = "participant" | "unlocked" | "facilitator" | "nonmember";
const KEY = "mock.as";
function who(): Who {
  const q = new URLSearchParams(location.search).get("as") as Who | null;
  if (q) { try { sessionStorage.setItem(KEY, q); } catch { /* ignore */ } return q; }
  try { return (sessionStorage.getItem(KEY) as Who | null) ?? "participant"; } catch { return "participant"; }
}
const ME = "00000000-0000-4000-8000-00000000000a";
let signedIn = (() => { try { return sessionStorage.getItem("mock.signedIn") !== "0"; } catch { return true; } })();
const listeners = new Set<(u: SessionUser | null) => void>();
const wait = (ms = 180) => new Promise((r) => setTimeout(r, ms));

const config: ConfigRow = { cycle: CYCLE, required_profiles: 3, submissions_open: true, gallery_opens_at: new URLSearchParams(location.search).get("opens") === "later" ? "2026-10-24T12:00:00Z" : null };

const blankRow = (id: string, author: string): ProfileRow => ({
  id, cycle: CYCLE, author_id: author, status: "draft", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), submitted_at: null, edited_at: null,
  name: null, org_type: null, org_type_other: null, description: null, tried_before: null, ring: null,
  capital_natural_rating: null, capital_natural_note: null, capital_cultural_rating: null, capital_cultural_note: null,
  capital_human_rating: null, capital_human_note: null, capital_social_rating: null, capital_social_note: null,
  capital_political_rating: null, capital_political_note: null, capital_financial_rating: null, capital_financial_note: null,
  capital_built_rating: null, capital_built_note: null, connections: [],
  needs: null, values_held: null, fears: null, influence_level: null, influence_note: null, stake: null, roles: [], connection_to_labs: null,
});

const seed: Partial<ProfileRow>[] = [
  { name: "DC Public Library", org_type: "library", ring: "inner_circle", description: "The city's library system, with branches in every ward. Its staff are often the first stop for people looking for work, a computer, or a quiet place to study. It hosts The Labs' sessions and lends its reach.", capital_natural_rating: "low", capital_cultural_rating: "high", capital_human_rating: "high", capital_social_rating: "high", capital_political_rating: "medium", capital_financial_rating: "medium", capital_built_rating: "high", capital_built_note: "Branches, meeting rooms, laptops to lend", needs: "Proof that programs reach residents who don't already use the library.", values_held: "Free access for everyone; trust built over decades.", fears: "Being seen as a vendor's venue rather than a public good.", influence_level: "high", stake: "A stronger case for funding digital-skills programming.", connections: [{ name: "Workforce investment council", capital: "financial", direction: "gets", note: "Funds the digital-skills classes" }, { name: "Ward 8 tenant association", capital: "social", direction: "both", note: "" }, { name: "Regional hospital system", capital: "human", direction: "gives", note: "Patrons apply for its entry-level roles" }], roles: ["serving", "contributing"], tried_before: "Ran a job-search class series in 2023 that filled slowly; staff say the time slot was the problem.", connection_to_labs: "Host partner. Could co-design outreach in branches with low program use." },
  { name: "Ward 8 tenant association", org_type: "community_group", ring: "wider_field", description: "Residents organizing around housing conditions in a few large buildings east of the river. Meets monthly; strong word of mouth.", capital_natural_rating: "low", capital_cultural_rating: "high", capital_human_rating: "medium", capital_social_rating: "high", capital_political_rating: "medium", capital_financial_rating: "low", capital_built_rating: "low", needs: "Skills that turn into income without leaving the neighborhood.", influence_level: "medium", stake: "Members' time is scarce; a program that wastes it costs trust.", connections: [{ name: "DC Public Library", capital: "built", direction: "gets", note: "Meets in the Anacostia branch" }], roles: ["serving"], connection_to_labs: "Could recruit Upskillers and shape what a Pod works on." },
  { name: "Regional hospital system", org_type: "employer", ring: "wider_field", description: "One of the largest employers in the area, always hiring for entry-level clinical support and admin roles.", capital_natural_rating: "low", capital_cultural_rating: "medium", capital_human_rating: "high", capital_social_rating: "medium", capital_political_rating: "high", capital_financial_rating: "high", capital_built_rating: "high", needs: "A steady pipeline of people ready for the first week on the job.", influence_level: "high", stake: "Vacancies cost them more than training would.", connections: [{ name: "Workforce investment council", capital: "political", direction: "both", note: "" }, { name: "Community college", capital: "human", direction: "gets", note: "Hires its certificate graduates" }], roles: ["contributing"], connection_to_labs: "Employer partner for a Showcase project." },
  { name: "Workforce investment council", org_type: "workforce_agency", ring: "inner_circle", description: "Sets workforce priorities and oversees federal training dollars for the city.", capital_natural_rating: "low", capital_cultural_rating: "low", capital_human_rating: "medium", capital_social_rating: "medium", capital_political_rating: "high", capital_financial_rating: "high", capital_built_rating: "medium", needs: "Outcomes they can report.", influence_level: "high", stake: "Credibility of the city's workforce plan.", connections: [{ name: "DC Public Library", capital: "financial", direction: "gives", note: "" }, { name: "Regional hospital system", capital: "political", direction: "both", note: "Sits on the council" }], roles: ["sustaining"], tried_before: "Funded two sector-based training programs; one closed when the grant ended.", connection_to_labs: "Could recognize The Labs as an eligible provider." },
];

const others = ["00000000-0000-4000-8000-0000000000b1", "00000000-0000-4000-8000-0000000000b2", "00000000-0000-4000-8000-0000000000b3"];
const rows: ProfileRow[] = [];
seed.forEach((s, i) => {
  const r = { ...blankRow(`seed-${i}`, others[i % others.length] as string), ...s, status: "submitted" as const, submitted_at: new Date(Date.now() - i * 3.6e6).toISOString() };
  rows.push(r);
});
rows.push({ ...blankRow("seed-draft", others[0] as string), name: "Community college (draft)", org_type: "training_provider" });

function initMine() {
  const w = who();
  if (w === "nonmember") return;
  const mineSubmitted = w === "unlocked" ? 3 : w === "participant" ? 1 : 0;
  for (let i = 0; i < mineSubmitted; i++) {
    const s = seed[i % seed.length] as Partial<ProfileRow>;
    rows.push({ ...blankRow(`mine-${i}`, ME), ...s, name: `${s.name} (my view)`, status: "submitted", submitted_at: new Date().toISOString() });
  }
  if (w === "participant") rows.push({ ...blankRow("mine-draft", ME), name: "Neighborhood barber shops", org_type: "other", org_type_other: "Small business", description: "Where a lot of men in the neighborhood hear about jobs first." });
}
initMine();

let n = 0;
const mine = () => rows.filter((r) => r.author_id === ME);
const unlocked = () => (!config.gallery_opens_at || Date.now() >= Date.parse(config.gallery_opens_at)) && mine().filter((r) => r.status === "submitted").length >= config.required_profiles;
const facilitator = () => who() === "facilitator";
const visible = (r: ProfileRow) => r.author_id === ME || facilitator() || (r.status === "submitted" && unlocked());
const user = (): SessionUser | null => (signedIn ? { id: ME, email: "you@example.org" } : null);
function setSignedIn(v: boolean) { signedIn = v; try { sessionStorage.setItem("mock.signedIn", v ? "1" : "0"); } catch { /* ignore */ } listeners.forEach((l) => l(user())); }
function find(id: string) { const r = rows.find((x) => x.id === id); if (!r || !visible(r)) throw new ApiError("We couldn't find that profile, or it isn't open to you yet.", undefined, "notfound"); return r; }
// A flaky network every so often, so the retry path gets exercised: ?flaky
const flaky = () => new URLSearchParams(location.search).has("flaky") && Math.random() < 0.4;

export const mockApi: Api = {
  async getUser() { await wait(60); return user(); },
  onAuthChange(cb) { listeners.add(cb); return () => listeners.delete(cb); },
  async signInWithGoogle(redirectTo) { await wait(); setSignedIn(true); location.assign(redirectTo); },
  async googleSignInUrl(redirectTo) { await wait(); setSignedIn(true); return redirectTo; },
  async signOut() { await wait(); setSignedIn(false); },
  async hasOlosAccount() { await wait(); return who() !== "nonmember"; },
  async isFacilitator() { await wait(); return facilitator(); },
  async hasUnlocked() { await wait(); return unlocked(); },
  async getConfig() { await wait(); return { ...config }; },
  async listMine() { await wait(); return mine().map((r) => ({ ...r })); },
  async listAll(includeDrafts) { await wait(300); return rows.filter(visible).filter((r) => includeDrafts || r.status === "submitted").map((r) => ({ ...r })); },
  async getProfile(id) { await wait(); return { ...find(id) }; },
  async createDraft() { await wait(); if (who() === "nonmember" || !config.submissions_open) throw new ApiError("You don't have permission to do that.", "42501", "denied"); const r = blankRow(`new-${++n}-${Date.now()}`, ME); rows.push(r); return { ...r }; },
  async saveDraft(id, patch) {
    await wait(250);
    if (flaky()) throw new ApiError("We couldn't reach the server.", undefined, "network");
    const r = find(id);
    if (r.author_id !== ME || !config.submissions_open) throw new ApiError("This profile can't be edited any more.", undefined, "locked");
    Object.assign(r, patch, { updated_at: new Date().toISOString(), ...(r.status === "submitted" ? { edited_at: new Date().toISOString() } : {}) });
    return { ...r };
  },
  async submit(id, full: ProfileDraft) {
    await wait(400);
    const r = find(id);
    if (r.author_id !== ME || r.status !== "draft") throw new ApiError("This profile can't be submitted.", undefined, "locked");
    if (missingFields(full).length) throw new ApiError("Some required fields are still empty.", "23514", "missing");
    Object.assign(r, full, { status: "submitted", submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    return { ...r };
  },
  async deleteDraft(id) { await wait(); const i = rows.findIndex((x) => x.id === id && x.author_id === ME && x.status === "draft"); if (i < 0) throw new ApiError("This draft couldn't be deleted.", undefined, "locked"); rows.splice(i, 1); },
  async authorNames() {
    await wait();
    if (!facilitator()) return [];
    return [{ author_id: ME, display_name: "You" }, { author_id: others[0] as string, display_name: "Jordan Avery" }, { author_id: others[1] as string, display_name: "Sam Okafor" }, { author_id: others[2] as string, display_name: "Riley Chen" }];
  },
};
