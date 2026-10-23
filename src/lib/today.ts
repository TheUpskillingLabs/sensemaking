/* The run of show for sensemaking day, one block at a time, with what to do in
   the app at each step. Static: the facilitation guide is the source; this is
   what a phone in the room shows. Times are Washington, DC. */

export const DAY = "2026-10-24";
export const TZ = "America/New_York";

export interface Block {
  start: string;  // "HH:MM"
  end: string;
  title: string;
  who: "Everyone" | "Pods" | "Facilitators";
  /** What to do, in plain words. */
  what: string[];
  /** What the block leaves behind. */
  produces: string;
  /** What to do in the app, if anything. */
  app?: { text: string; to?: string; href?: string }[];
}

export const BLOCKS: Block[] = [
  {
    start: "10:00", end: "10:15", title: "Setup", who: "Facilitators",
    what: ["Print the cards from the gallery (6 per sheet) the moment the room opens. Fifteen minutes is tight: early arrivals can help cut from 10:15.", "Lay the cards out on one shared table, grouped by organization type.", "Put the seven tension sheets on the wall, a blank sheet beside each, plus a \"new\" sheet and a holding sheet for the survey stickies."],
    produces: "Cards on the table, tensions on the wall.",
    app: [{ text: "Print cards", to: "/print" }],
  },
  {
    start: "10:15", end: "10:30", title: "Doors open", who: "Everyone",
    what: ["Find a seat and read a few cards you didn't write.", "Early? Help cut the last sheets of cards.", "Lunch isn't provided today. The break is 11:50 to 12:30."],
    produces: "Everyone in the room, cards read.",
  },
  {
    start: "10:30", end: "10:47", title: "The opening", who: "Everyone",
    what: ["The opening. Where The Labs came from, the regional association, OLOS, what C04 is for, and how today runs."],
    produces: "Everyone knows why we're here and how the day runs.",
    app: [{ text: "The deck: The Labs, and Greater Washington", href: "/deck/" }],
  },
  {
    start: "10:47", end: "11:00", title: "The tensions", who: "Everyone",
    what: ["The seven tensions from the October 3 retreat are on the wall, one sheet each.", "Is one missing? Add it to the \"new\" sheet with a name and one sentence. Are two the same? Merge them.", "Name the nonnegotiables: what The Labs won't change this cycle. They go on the sheet by the door.", "Thirteen minutes, then everyone up."],
    produces: "The tensions everyone will test today.",
  },
  {
    start: "11:00", end: "11:45", title: "Archaeology together", who: "Everyone",
    what: ["On your feet. Two things happen at once; move between them.", "The survey wall: take a sticky from the holding sheet (one per survey response), read the response, and put it under the tension it supports. None of them? The \"new\" sheet. A How Might We is a prompt, not evidence: it goes beside the tension, not under it.", "The card table: group the cards into stakeholder groups, players who act alike toward The Labs, whatever their type. Argue out loud. As each cluster settles, a facilitator photographs it into the app and the room names it.", "At 11:22, swap: if you've been at the wall, go to the table."],
    produces: "Every survey response under a tension. Every card in a stakeholder group, in the app.",
    app: [{ text: "Make a group from a photo", to: "/groups/new" }, { text: "See the groups so far", to: "/groups" }],
  },
  {
    start: "11:45", end: "11:50", title: "Pick a tension, form pods", who: "Everyone",
    what: ["Stand by the tension you want to work on.", "The facilitator sets today's minimum from the headcount. A tension below it merges with its neighbour or is parked. A crowd splits in two.", "Pods are provisional. You can move at 2:50.", "Take your tension sheet, its stickies, two flipchart sheets, a third colour of stickies and a laptop with the survey to a table."],
    produces: "Provisional pods, one per tension.",
  },
  {
    start: "11:50", end: "12:30", title: "Lunch", who: "Everyone",
    what: ["Not provided today. Bring your own, or go out and come back.", "Back at 12:30."],
    produces: "",
  },
  {
    start: "12:30", end: "13:00", title: "The paradox", who: "Pods",
    what: ["Archaeology, from the wall: three short lists on a flipchart. What The Labs has already tried on this tension. What else it could have tried. What it won't do.", "Write the tension as a clash of rationalities: \"The Labs needs X, because… The Labs also needs Y, because… Both are true.\" Under it, how many survey stickies support it, and one quote. None? Write \"untested; a hunch from the retreat\" and carry on.", "Then turn the paradox sheet face down. It comes back at 2:05."],
    produces: "The paradox in because clauses, with its evidence counted. Shelved.",
  },
  {
    start: "13:00", end: "14:05", title: "Context, field, themes", who: "Pods",
    what: ["The paradox stays face down. This hour is about the players, not the problem.", "1:00 Pick your groups. Open Groups in the app and choose the two to five stakeholder groups caught in your tension. One column each on the second flipchart. Groups are shared; another pod can use the same one.", "1:10 What each group does. One sticky each: what they do when things get hard, the strategy they're running now, what they'd never do. Inner-circle groups first.", "1:25 What each group's currency is. Read the group's averaged capitals in the app. What do they trade in, what do they have power over, what do they want? Two or three stickies per group.", "1:40 Themes. Read all the stickies together. For each: what deeper factor sits under this? Write themes in the third colour on a separate sheet. Merge duplicates. Circle any theme that holds for groups that have little else in common. Those are the universals."],
    produces: "A themes sheet with the universals circled.",
    app: [{ text: "Open the groups", to: "/groups" }],
  },
  {
    start: "14:05", end: "14:50", title: "Uncover the paradox, write the proposal", who: "Pods",
    what: ["Turn the paradox sheet over. Put the group names left and right of it: who pulls toward X, who toward Y. Groups on both sides means this is a paradox worth a pod. No outside player on either side means it's housekeeping; say so.", "Rewrite the because clauses now that they can name groups.", "Which circled themes bear on this paradox? Write them on the sheet. None? The field was read too narrowly; note which groups are missing.", "Check the retreat readout now, not before. Same clusters is confirmation; a split or merge is a finding.", "Fill in the proposal page. Attach the How Might Wes from the wall as first probes. Fifteen minutes.", "Swap pages with the next pod: one hard question each, written on the page."],
    produces: "A one-page Research Pod proposal.",
  },
  {
    start: "14:50", end: "15:30", title: "Pitch, challenge, sign up", who: "Everyone",
    what: ["Three minutes per pod, from the page. Two questions from the room.", "Three tests, out loud: Is there a player on each side? Is there evidence or an honest \"untested\"? Is there at least one circled theme?", "Pods that share a paradox merge on the spot.", "Write your name on the page of the pod you'd join. Moving is expected. Names are a seed; recruiting continues in the community for a week."],
    produces: "Each pod confirmed, merged or parked. Names on pages.",
  },
  {
    start: "15:30", end: "15:45", title: "Wrap", who: "Everyone",
    what: ["Agree who types up each page, where it gets posted (OLOS and #c04-all), and when pods first meet.", "Homework: each pod comes back by November 14 with candidate frames (\"if we approached this as if it were…, then…\") and what players said about them."],
    produces: "What gets posted, by whom, by when.",
  },
  {
    start: "15:45", end: "16:00", title: "Cleanup", who: "Facilitators",
    what: ["Photograph every page and the whole wall before anything comes down."],
    produces: "A photo record of the day.",
  },
];

const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return (h ?? 0) * 60 + (m ?? 0); };

/** Minutes since midnight in DC right now, and whether today is the day. */
export function clock(now = new Date()): { minutes: number; isDay: boolean } {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(now);
  const get = (k: string) => parts.find((p) => p.type === k)?.value ?? "00";
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  return { minutes: Number(get("hour")) % 24 * 60 + Number(get("minute")), isDay: date === DAY };
}

/** Index of the block the room is in, or null outside the day. */
export function currentBlock(now = new Date()): number | null {
  const { minutes, isDay } = clock(now);
  if (!isDay) return null;
  const i = BLOCKS.findIndex((b) => minutes >= toMin(b.start) && minutes < toMin(b.end));
  return i === -1 ? null : i;
}

/** "10:30" → "10:30 am"; "13:00" → "1:00 pm". */
export function label(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const hh = h ?? 0;
  return `${hh % 12 || 12}:${String(m ?? 0).padStart(2, "0")} ${hh < 12 ? "am" : "pm"}`;
}
