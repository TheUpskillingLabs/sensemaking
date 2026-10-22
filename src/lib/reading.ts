/* The editor's "Why we ask" hints: one short answer beside four questions, each
   opening the matching section of the reading essay (src/lib/essay.ts). */

export type TopicId = "ced" | "capitals" | "frames" | "archaeology" | "field" | "customers";
export interface Topic { id: TopicId; title: string; why: string }

export const TOPICS: Topic[] = [
  { id: "ced", title: "Community economic development", why: "Profiles map the local economy around The Labs: who has what, and who decides. Communities grow strongest when the people who live there build on what they already have." },
  { id: "capitals", title: "The seven community capitals", why: "A community has seven kinds of wealth, not just money. Rating all seven shows what each player adds, and, across everyone's profiles, what our area is rich in or missing." },
  { id: "frames", title: "Frame innovation", why: "Tangled problems rarely give way to the usual fixes. Seeing the problem a new way comes first, and everyone's profiles are the raw material for that." },
  { id: "archaeology", title: "Archaeology: look back before you plan", why: "Before fixing a problem, look at what's already been tried. If you know what this player has attempted, and what got in the way, mention it. That history is evidence." },
  { id: "field", title: "Field mapping: who's involved", why: "The inner circle is who's already involved. The wider field is everyone else who could be affected or could help. Mapping both is where new ideas come from." },
  { id: "customers", title: "Why nonprofits have two kinds of customers", why: "A nonprofit has two kinds of customers: the people it serves and the people who contribute. Noticing which one a player is, or both, helps us spot where their wants clash." },
];

export const topic = (id: TopicId): Topic => TOPICS.find((t) => t.id === id) as Topic;
