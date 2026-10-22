/* "Where the questions come from": the reading behind the profile, as one essay.
   Written for Build Cycle C04 at a high-school reading level; about nine
   minutes to read in full, two to five to skim (the brief, the leads, the
   italic lines). Sources were opened and checked on 2026-10-21 and 2026-10-22.

   Inline markup in paragraphs: **bold**, *italic*, and [^n] for note n. */

import type { TopicId } from "./reading";

export interface Section {
  id: string;
  title: string;
  /** The big line that carries the section's point. */
  lead: string;
  body: string[];
  terms?: string[];
  forProfile?: string;
  talk?: string;
  /** The editor's "Why we ask" hint that opens this section. */
  topic?: TopicId;
}

export interface Note { n: number; text: string }

export const ESSAY = {
  title: "Where the questions come from",
  readingTime: "About a 9-minute read, or 2 to skim",
  note: [
    "This is a short guide to the ideas behind the profile you're about to write. You don't need it to write a good profile; what you've seen with your own eyes matters most. But every question in the form is there for a reason, and this is the reason.",
    "One more thing. This is version one of how The Labs thinks about its own work, written for Build Cycle C04. It is not settled. If a section seems wrong, or half right, or leaves out something you know from experience, that's useful. Bring it to sensemaking day, drop it in the cohort channel, or grab a facilitator. The thinking here gets better the same way the profiles do: many people looking at the same field and comparing notes.",
  ],
  brief: [
    "The Labs cares about *work*: making real things that last. Jobs come second. Wages come third.",
    "Most programs around us count jobs, wages, and devices. Those numbers matter, but they miss what gets made.",
    "Start from what a neighborhood already has, not what it lacks.",
    "Hard problems need a new way of looking before they need a fix. Step one: look at what's been tried. Step two: map who's involved. That's what your profiles are for.",
    "Every nonprofit has two kinds of customers: the people it serves and the people who contribute. Where they want different things, there's something worth talking about.",
  ],
  closing: "All of it starts with three profiles, written on your own, from what you know. And this guide is one of the things we'll revise once we've read them. If a section held up, say so. If it didn't, say that louder.",
  checked: "Links checked October 2026.",
};

export const SECTIONS: Section[] = [
  {
    id: "work",
    title: "Work first, then jobs, then wages",
    lead: "The Labs puts the making of real things ahead of the job that pays for it.",
    body: [
      "Almost everyone who comes to The Labs is thinking about a job, and that makes sense. A job is how most of us pay rent. But a job is a container, and containers change. What's inside the container is work, and that's what we're here to get better at.",
      "The philosopher Hannah Arendt sorted what people do into three kinds. **Labor** keeps us alive: cooking, cleaning, the things that get used up and have to be done again tomorrow. **Work** makes things that last: a building, a tool, a piece of software, a way of doing something that other people pick up and keep. **Action** is what we do and say together, in public, that starts something new.[^1]",
      "When The Labs says “work,” it means Arendt's kind: making durable things, paid or not, inside a company or a neighborhood group or a kitchen. That puts The Labs in the **real economy**, the economy of stuff: things grown, built, fixed, delivered, coded, taught, and cared for, and the value added at each step. It's the part of the economy you can point at, not the part that trades bets on it.[^2]",
      "Why talk about the *future* of work? Because the tools are changing fast, and the evidence is calmer than the headlines. A large MIT study found that new technology hasn't wiped out work. It removes some jobs, creates others, and mostly helps workers rather than replacing them. The real problem is that the gains have gone to a few, and people without a four-year degree have the fewest clear paths to better work.[^3] So the question isn't whether work will exist. It's what a person needs to stay good at real work while the tools keep changing. Researchers have a name for that: **adaptive expertise**, knowing something well enough to handle a situation you've never seen and to invent a new way when the old one stops working.[^4] That's what The Labs means by upskilling.",
    ],
    terms: ["labor, work, action", "real economy", "adaptive expertise"],
    forProfile: "Ask what this player does or makes, then who they hire, then what they pay. Say so if the answer to any of these is nothing.",
    talk: "Does putting work ahead of jobs match your experience, or does it feel like a luxury? Both answers are useful.",
  },
  {
    id: "field-counts",
    title: "The field we're standing in counts other things",
    lead: "The programs around The Labs mostly count jobs, wages, and devices, and it helps to know exactly what they count.",
    body: [
      "Two languages dominate this field. The first is **workforce development**. In the U.S. it runs under a 2014 law, and every program it funds reports the same five numbers: how many people had a job six months after leaving, how many a year after, what they typically earned, how many got a credential, and how many showed a skill gain.[^5]",
      "The second is **digital equity**. A 2021 law defines it as everyone having the technology they need “for full participation” in society and the economy. It pays for devices, internet, training, and tech support, with special attention to older adults, veterans, people with disabilities, people learning English, and households with low incomes.[^6]",
      "Both matter. You can't do much work without a laptop or a bus pass, and a credential can open a door. But look at what gets counted. A workforce program counts the job, not what the person built once they had it. A digital-equity program counts the device, not what was made with it. Neither has a column for work in Arendt's sense. The Labs lives inside this world and is partly funded by it, while trying to point at something it doesn't measure yet. That's an honest tension, not a complaint, and we'd rather name it than pretend it isn't there.",
    ],
    terms: ["workforce development", "digital equity", "the five WIOA numbers"],
    forProfile: "Many players describe themselves in one of these two languages. Notice what that language leaves out.",
    talk: "Should there be a sixth number? If so, what would it count?",
  },
  {
    id: "assets",
    topic: "ced",
    title: "Start from what's already here",
    lead: "Build on what a neighborhood has, not on what it lacks.",
    body: [
      "The old habit in community programs is to find what a neighborhood lacks and bring something in from outside to fill it. Two researchers in Chicago, John Kretzmann and John McKnight, watched those programs come and go and argued for the opposite: start with what a place already has, its people, its groups, its institutions, and build from there. They called it **asset-based community development**, and their 1993 guide is still the standard.[^7]",
      "The Labs works the same way. Who already works here? What do they already make, fix, and sell? Which employers already hire? Which training already exists? Who already trusts whom? This is **community economic development**: a neighborhood improving its own economy, with the people who live there making the decisions.[^8] When one person gains a skill, the neighborhood holds a little more skill than it did, and the next person or employer who needs it finds it there.",
    ],
    terms: ["asset-based community development", "community economic development"],
    forProfile: "You're writing down one piece of what this part of DC already has, and who gets a say.",
    talk: "What does this neighborhood have that's easy to miss?",
  },
  {
    id: "capitals",
    topic: "capitals",
    title: "Seven kinds of wealth",
    lead: "Money is one kind of wealth. There are six more, and they feed each other.",
    body: [
      "Two researchers, Cornelia and Jan Flora, studied towns that got stronger and towns that didn't, and found seven kinds of wealth. They call them **capitals**.[^9] **Natural** is land, water, and parks. **Cultural** is traditions, language, and identity; what decides whether a program feels like it belongs. **Human** is people's skills, knowledge, and health, the one upskilling works on most directly. **Social** is who knows whom; most people hear about work from someone they know. **Political** is having a say in decisions, like which training gets funded. **Financial** is wages, grants, loans, and who controls them. **Built** is buildings, transit, and technology. A class is only as reachable as the bus that goes there.[^10]",
      "Their most useful finding is called **spiraling up**. Build one kind of capital and it tends to pull the others up with it. Neighbors who trust each other share leads on work; skills follow, then better work, then money and voice. It spirals down the same way. Lose an employer and you can lose wages, then people, then the trust the next effort would have needed.[^11]",
    ],
    terms: ["the seven capitals", "spiraling up"],
    forProfile: "Rate all seven. One person's ratings describe one player. Everyone's together show what this part of DC is rich in and what's missing.",
    talk: "Which capital is this neighborhood richest in? Which is thinnest? Do we agree?",
  },
  {
    id: "frames",
    topic: "frames",
    title: "Change the question before you answer it",
    lead: "Some problems need a new way of looking before they need a fix.",
    body: [
      "People have run job training in this city for decades, and some gaps haven't moved. Kees Dorst, a design professor, says the trick with stubborn problems is to change how you look at them first. He calls the new way of looking a **frame**. It usually sounds like, “What if we treated this as if it were…?”[^12]",
      "His best-known example is Kings Cross, a nightlife district in Sydney with 30,000 people out on a weekend night and a lot of fights. Everyone had treated it as a crime problem: more police, more cameras, more rules. It didn't work. Dorst's team asked: what if we ran this area like a music festival? Festivals handle huge excited crowds and keep them safe. Seen that way, the ideas came fast: softer lighting, a street closed to cars, food stalls and places to sit, street performers, better night buses, more toilets, volunteer guides, and a safe space with first aid and a ride home.[^13]",
      "The Labs is a frame too. “How do we place more people in jobs?” is the workforce question. “What if we treated a neighborhood as a place where people already do real work, and asked what would make that work better and more lasting?” leads somewhere else. Dorst's method has nine steps. This exercise is the first two.[^14]",
    ],
    terms: ["frame", "frame innovation"],
    forProfile: "You're not solving anything yet. You're looking.",
    talk: "Have you seen a new way of looking at a problem change what people did? What was it?",
  },
  {
    id: "archaeology",
    topic: "archaeology",
    title: "Step one: look back before you plan",
    lead: "Before you fix something, find out how people tried to fix it before.",
    body: [
      "Dorst calls this step **archaeology**. Who tried what? What happened? What did everyone assume?[^15] Workforce and digital-equity programs leave a lot of history: grants that ran three years and stopped, device giveaways, partnerships that looked good on paper, classes that filled and classes that didn't. That history saves you from repeating what's been tried. More importantly, it points at the real reason a gap keeps coming back, which is rarely the reason in the final report.[^16]",
    ],
    terms: ["archaeology"],
    forProfile: "If this player has tried something here before, say what, and how it went. That's evidence, not background.",
    talk: "What's been tried here before? If it stopped, why?",
  },
  {
    id: "map",
    topic: "field",
    title: "Step two: map who's involved",
    lead: "Name everyone connected to the problem, in two rings.",
    body: [
      "The **inner circle** is already involved with The Labs or the people it serves. The **wider field** is everyone else: employers who could hire, agencies that could refer, groups that could host, and people nobody has thought to ask.[^17]",
      "Each player wants something different. An employer wants people who can start Monday. A training provider wants a full class. A library wants its space used. A funder wants numbers to report. One at a time, that's a list. Laid out together, patterns show up: two groups that want the same thing without knowing it, a need nobody is meeting, a player quietly connected to everyone. New ideas come from the patterns.[^18]",
      "This whole app is a field map. The inner-circle-or-wider-field question puts each player in one or the other. And there's a reason you can't see anyone else's profiles until you've finished your own: when many people map the same field on their own, the patterns that show up in all of them are ones we can trust.[^19]",
    ],
    terms: ["inner circle", "wider field", "field map"],
    forProfile: "Choose inner circle or wider field honestly, and write what this player wants and what they worry about.",
    talk: "Is there anyone in the wider field nobody has asked yet? Who?",
  },
  {
    id: "customers",
    topic: "customers",
    title: "Two kinds of customers",
    lead: "A nonprofit has the people it serves and the people who contribute, and they don't always want the same thing.",
    body: [
      "Peter Drucker, who spent his life studying how organizations work, said a nonprofit has two kinds of customers.[^20] The **primary customer** is “the person whose life is changed through your work.” For The Labs, that's an Upskiller. The **supporting customers** are everyone who has to be satisfied for the work to continue: funders who pay, partners who host, employers who hire, mentors who volunteer their time.[^21]",
      "A shoe store gets one clear signal: if people like the shoes, they buy more. A nonprofit doesn't, because the person served and the person contributing are almost never the same. It has to keep two groups happy at once.[^22]",
      "This is where section 2 comes back. The supporting customers around The Labs mostly want the workforce numbers and the digital-equity numbers, by the end of the grant year. The Upskiller may need something neither counts: time to finish something real, a mentor who knows the tool, a bus pass. Where what the people served need differs from what the contributors count, programs quietly bend out of shape. That's also where the best ideas hide.[^23]",
    ],
    terms: ["primary customer", "supporting customers"],
    forProfile: "Say whether this player is served, contributing, both, or neither, and what each side wants. A library that hosts Upskillers and runs a digital-equity grant is both.",
    talk: "Have you seen a program bend toward its funder and away from the people in it? What happened?",
  },
  {
    id: "next",
    title: "What happens next",
    lead: "On sensemaking day we read the field together, then start the rest of the method.",
    body: [
      "We'll open the gallery and look for players many of us saw and players only one of us saw. We'll look at which capitals are strong and which are thin. And we'll look for the tensions: served versus contributing, and the work The Labs is pointed at versus the numbers the field counts. From there the Build Cycle moves into the rest of Dorst's method: finding a frame that makes the problem look different, and building something to test it.",
    ],
  },
];

export const NOTES: Note[] = [
  { n: 1, text: "Hannah Arendt, *The Human Condition* (1958), chapters III–V. Hard reading. Two free, plainer accounts: the *Stanford Encyclopedia of Philosophy* entry on Arendt, section 4.2 — https://plato.stanford.edu/entries/arendt/ ; and Jared Henderson, “Work: The Human Condition, Chapter 4” (2024) — https://jaredhenderson.substack.com/p/work-the-human-condition-chapter" },
  { n: 2, text: "“Real economy,” Wikipedia — https://en.wikipedia.org/wiki/Real_economy . Putting work first, then jobs, then wages is The Labs' own position, not Arendt's." },
  { n: 3, text: "MIT Task Force on the Work of the Future, *The Work of the Future* (2020). MIT's summary of the findings — https://news.mit.edu/2020/work-of-future-final-report-1117" },
  { n: 4, text: "Giyoo Hatano and Kayoko Inagaki, “Two courses of expertise” (1986). A plain summary: “Adaptive expertise,” Wikipedia — https://en.wikipedia.org/wiki/Adaptive_expertise" },
  { n: 5, text: "U.S. Department of Labor, “WIOA Performance: Results At-A-Glance.” The law is the Workforce Innovation and Opportunity Act. — https://www.dol.gov/agencies/eta/performance/wioa-performance" },
  { n: 6, text: "Congressional Research Service, *The Digital Equity Act of 2021* (2021). Two pages with the definitions and who's covered. — https://www.everycrsreport.com/reports/IF11901.html" },
  { n: 7, text: "John P. Kretzmann and John L. McKnight, *Building Communities from the Inside Out* (1993). Free PDF from the ABCD Institute, DePaul University. — https://resources.depaul.edu/abcd-institute/publications/Pages/basic-manual.aspx" },
  { n: 8, text: "Roberto Gallardo, *Community Economic Development Key Concepts*, Mississippi State University Extension. A short guide. — https://extension.msstate.edu/publications/community-economic-development-key-concepts" },
  { n: 9, text: "Lionel J. Beaulieu, *The Community Capitals Framework*, NDSU Extension (2024). Six pages with a table of examples. PDF. — https://ndsu.edu/agriculture/sites/default/files/2024-06/cv2243.pdf" },
  { n: 10, text: "Same as note 9. The work examples here are ours." },
  { n: 11, text: "Mary Emery and Cornelia Butler Flora, “Spiraling-Up,” *Community Development* 37(1), 2006. The original paper; harder reading, and this link is a library record. — https://vtechworks.lib.vt.edu/handle/10919/69153 . Plainer: Lionel J. Beaulieu, *Promoting Community Vitality & Sustainability* (2014), PDF — https://srdc.msstate.edu/sites/default/files/2023-05/Community-Capitals-Framework-Writeup-Oct-2014.pdf" },
  { n: 12, text: "Kees Dorst, “Frame Creation and Design in the Expanded Field,” *She Ji* 1(1), 2015. Free, written for professionals. — https://doi.org/10.1016/j.sheji.2015.07.003" },
  { n: 13, text: "Kees Dorst, “Designing Out Crime,” *The Conversation*, republished at *This Is Design Thinking* (2016). Dorst's own short account of Kings Cross. — https://thisisdesignthinking.net/2016/05/designing-out-crime/ . The full story: Kees Dorst, *Frame Innovation*, MIT Press (2015). Costs money; try a library. — https://mitpressbookstore.mit.edu/book/9780262550963" },
  { n: 14, text: "Allison Huang, “Frame Innovation for Social Impact,” Medium (2017). All nine steps, one line each. — https://medium.com/@allisonyhuang/frame-innovation-for-social-impact-70d821e897a4" },
  { n: 15, text: "Same as note 14." },
  { n: 16, text: "Jacqueline Antalik, “How Frame Creation can inspire innovation,” OXD (2025). How one design team uses archaeology. — https://oxd.com/insights/how-frame-creation-can-inspire-innovation/" },
  { n: 17, text: "Same as note 12." },
  { n: 18, text: "Same as note 13." },
  { n: 19, text: "Two hands-on mapping tools: Washington State University Extension, *Ripple Effects Mapping for Evaluation* (2011), PDF — https://wpcdn.web.wsu.edu/extension/uploads/sites/54/2013/12/REM.Complete.pdf ; and the ABCD Institute's *Asset-Based Community Development toolkit* — https://resources.depaul.edu/abcd-institute/resources/Pages/tool-kit.aspx" },
  { n: 20, text: "Peter F. Drucker, “The New Society of Organizations,” *Harvard Business Review* (1992). Paywalled; libraries often have it. — https://hbr.org/1992/09/the-new-society-of-organizations" },
  { n: 21, text: "Peter F. Drucker, *Drucker on Being Customer-Centric*, Drucker Institute. Two pages in Drucker's own words. PDF. — https://drucker.institute/wp-content/uploads/2018/08/Reading_Drucker-on-Being-Customer-Centric.pdf" },
  { n: 22, text: "Mark R. Kramer, “Who Exactly Are the ‘Customers’ of a Nonprofit Organization?”, *Chronicle of Philanthropy* (2001). PDF. — https://www.issuelab.org/resources/1839/1839.pdf" },
  { n: 23, text: "William Foster, Peter Kim, and Barbara Christiansen, “Ten Nonprofit Funding Models,” *SSIR* (2009); needs a free account — https://ssir.org/articles/entry/ten_nonprofit_funding_models . Ann Goggins Gregory and Don Howard, “The Nonprofit Starvation Cycle,” *SSIR* (2009), via Bridgespan — https://bridgespan.org/insights/the-nonprofit-starvation-cycle" },
];

export const sectionFor = (topic: TopicId): Section => SECTIONS.find((s) => s.topic === topic) as Section;
export const noteRefs = (s: Section): number[] => Array.from(new Set(s.body.join(" ").match(/\[\^(\d+)\]/g)?.map((m) => Number(m.slice(2, -1))) ?? []));
