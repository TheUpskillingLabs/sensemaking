import { Link } from "react-router-dom";
import { Words, useTitle } from "../components/bits";

/* Background reading: the ideas behind this exercise, in plain words, each with
   a few sources that were opened and checked (2026-10-21). Prefer free,
   authoritative sources; say so when something is paywalled or needs an account. */

interface Source { title: string; by: string; href: string; kind: "Start here" | "Source" | "Tool" | "Go deeper"; note?: string }
interface Topic { id: string; title: string; body: string[]; here: string; sources: Source[] }

const TOPICS: Topic[] = [
  {
    id: "ced",
    title: "Community economic development",
    body: [
      "Community economic development (CED) means a neighborhood or town improving its own economy, with the people who live there making the decisions. It starts from what the place already has, like skills, buildings, groups and businesses, instead of waiting for help from outside.",
      "The goal is bigger than money. It's also about health, culture, the environment and how people get along. The Labs works this way: helping people learn new skills also makes the whole community stronger.",
    ],
    here: "Each profile you write maps one piece of the local economy around The Labs: who has what, and who gets to decide.",
    sources: [
      { kind: "Start here", title: "Community Economic Development Key Concepts", by: "Roberto Gallardo, Mississippi State University Extension", href: "https://extension.msstate.edu/publications/community-economic-development-key-concepts", note: "A short guide. It describes CED as residents building up what they have to make life better over the long run." },
      { kind: "Go deeper", title: "Community economic development", by: "Wikipedia", href: "https://en.wikipedia.org/wiki/Community_economic_development", note: "A general overview with links to learn more." },
    ],
  },
  {
    id: "capitals",
    title: "The seven community capitals",
    body: [
      "Two researchers, Cornelia and Jan Flora, said a community has seven kinds of wealth, which they call capitals. Natural: land, water and parks. Cultural: traditions, language and identity. Human: people's skills, knowledge and health. Social: friendships, networks and trust. Political: having a say in decisions. Financial: money, loans and grants. Built: buildings, roads and technology.",
      "Their big idea is called “spiraling up.” When a community builds one kind of capital, it often helps build the others. For example, stronger friendships between neighbors can lead to new skills and new jobs. It can also spiral down the same way.",
    ],
    here: "The “What they bring” part of each profile asks you to rate these seven capitals. When we put everyone's ratings together, we can see which ones are strong in our area and which ones are missing.",
    sources: [
      { kind: "Start here", title: "The Community Capitals Framework", by: "Lionel J. Beaulieu, Purdue University · NDSU Extension (2024)", href: "https://ndsu.edu/agriculture/sites/default/files/2024-06/cv2243.pdf", note: "Six pages with a table that explains each capital with examples. PDF." },
      { kind: "Source", title: "Promoting Community Vitality & Sustainability: The Community Capitals Framework", by: "Lionel J. Beaulieu · Southern Rural Development Center (2014)", href: "https://srdc.msstate.edu/sites/default/files/2023-05/Community-Capitals-Framework-Writeup-Oct-2014.pdf", note: "The longer original, including a section on spiraling up. PDF." },
      { kind: "Go deeper", title: "Spiraling-Up: Mapping Community Transformation with Community Capitals Framework", by: "Mary Emery & Cornelia Butler Flora · Community Development 37(1), 2006", href: "https://vtechworks.lib.vt.edu/handle/10919/69153", note: "The research paper that introduced spiraling up. Harder reading. This page is a library record; the full paper is in the journal." },
    ],
  },
  {
    id: "frames",
    title: "Frame innovation",
    body: [
      "Some problems are so tangled that the usual fixes don't work. Kees Dorst, a design professor, says the trick is to look at the problem in a new way before trying to solve it. He calls that new way of looking a “frame.” A frame often sounds like “What if we treated this like…?”",
      "Here's a real example from his book. A nightlife district had a problem with fights and crime. Instead of treating it only as a crime problem, a team asked, “What if we ran the area like a music festival?” Festivals are good at keeping big crowds safe and happy, so that frame opened up new ideas.",
      "Dorst's method has nine steps. This exercise covers the first ones: looking at what has already been tried, and figuring out who is involved.",
    ],
    here: "Build Cycles use this method to go from a messy situation to an idea a team can actually build. Everyone's profiles are the raw material for the next steps.",
    sources: [
      { kind: "Start here", title: "Frame Innovation for Social Impact", by: "Allison Huang · Medium (2017)", href: "https://medium.com/@allisonyhuang/frame-innovation-for-social-impact-70d821e897a4", note: "All nine steps explained in plain language, one line each." },
      { kind: "Source", title: "Frame Creation and Design in the Expanded Field", by: "Kees Dorst · She Ji 1(1), 2015", href: "https://doi.org/10.1016/j.sheji.2015.07.003", note: "Dorst's own article about frames. Free, but written for professionals." },
      { kind: "Go deeper", title: "Frame Innovation: Create New Thinking by Design", by: "Kees Dorst · MIT Press", href: "https://mitpressbookstore.mit.edu/book/9780262550963", note: "The full book, with the festival example and others. Costs money; try a library." },
    ],
  },
  {
    id: "archaeology",
    title: "Archaeology: look back before you plan",
    body: [
      "The first step in Dorst's method is called “archaeology,” like digging up history. Before you try to fix a problem, you find out how people have tried to fix it before. Who tried what? What happened? What did everyone assume?",
      "Old attempts leave clues. They show which ideas have already been tried, and they often point to the real reason the problem keeps coming back.",
    ],
    here: "When you write about a player, mention anything they have already tried in this area and what got in their way. That history counts as evidence.",
    sources: [
      { kind: "Start here", title: "How Frame Creation can inspire innovation", by: "Jacqueline Antalik · OXD (2025)", href: "https://oxd.com/insights/how-frame-creation-can-inspire-innovation/", note: "A designer explains how her team uses archaeology: asking what was tried before and how it went." },
      { kind: "Source", title: "Frame Innovation for Social Impact", by: "Allison Huang · Medium (2017)", href: "https://medium.com/@allisonyhuang/frame-innovation-for-social-impact-70d821e897a4", note: "Archaeology in one line: investigate the problem and earlier attempts to solve it." },
    ],
  },
  {
    id: "field",
    title: "Field mapping: who's involved",
    body: [
      "Next, Dorst asks you to list everyone connected to the problem, in two circles. The inner circle is the people and groups already involved. The wider field is everyone else who could be affected or could help, including people nobody has asked yet.",
      "Each player wants different things, and each worries about different things. When you look across all of them, you start to see patterns. Those patterns are where new ideas come from.",
    ],
    here: "This whole app is a field map. The “Ring” question puts each player in the inner circle or the wider field. Because many people map the same field on their own, the patterns we find are more trustworthy.",
    sources: [
      { kind: "Tool", title: "Ripple Effects Mapping for Evaluation", by: "Washington State University Extension (2011)", href: "https://wpcdn.web.wsu.edu/extension/uploads/sites/54/2013/12/REM.Complete.pdf", note: "A hands-on way to draw who is involved and what each one adds, using the seven capitals. PDF." },
      { kind: "Tool", title: "Asset-Based Community Development toolkit", by: "ABCD Institute, DePaul University", href: "https://resources.depaul.edu/abcd-institute/resources/Pages/tool-kit.aspx", note: "Worksheets for mapping what a community already has, instead of what it lacks." },
    ],
  },
  {
    id: "customers",
    title: "Why nonprofits have two kinds of customers",
    body: [
      "Peter Drucker was a famous thinker about how organizations work. He said every organization should ask, “Who is our customer?” For a nonprofit, he said there are two kinds. The primary customer is “the person whose life is changed through your work.” Supporting customers are the other people who have to be happy for the work to continue, like volunteers, partners and funders (the people who give money).",
      "Think about a store. The person who buys the shoes is the person who wears them, so the store gets one clear signal: if people like the shoes, they buy more. A nonprofit is different. The person helped and the person paying are usually not the same. So a nonprofit has to keep two groups happy, and they don't always want the same thing.",
    ],
    here: "Many players you profile are either someone the work helps, or someone who pays for it, or both. When what the people being helped need is different from what funders want, you may have found a key tension worth talking about.",
    sources: [
      { kind: "Start here", title: "Drucker on Being Customer-Centric", by: "Peter F. Drucker · Drucker Institute", href: "https://drucker.institute/wp-content/uploads/2018/08/Reading_Drucker-on-Being-Customer-Centric.pdf", note: "Two pages in Drucker's own words about primary and supporting customers. PDF." },
      { kind: "Source", title: "Who Exactly Are the “Customers” of a Nonprofit Organization?", by: "Mark R. Kramer · Chronicle of Philanthropy (2001)", href: "https://www.issuelab.org/resources/1839/1839.pdf", note: "A short article arguing every nonprofit really has three customers: the people it helps, its donors, and its volunteers or staff. PDF." },
      { kind: "Go deeper", title: "Ten Nonprofit Funding Models", by: "William Foster, Peter Kim & Barbara Christiansen · SSIR (2009)", href: "https://ssir.org/articles/entry/ten_nonprofit_funding_models", note: "Ten common ways nonprofits get paid, and why funders give. Needs a free account." },
      { kind: "Go deeper", title: "The Nonprofit Starvation Cycle", by: "Ann Goggins Gregory & Don Howard · SSIR (2009), via Bridgespan", href: "https://bridgespan.org/insights/the-nonprofit-starvation-cycle", note: "What goes wrong when funders expect nonprofits to spend almost nothing on running themselves." },
    ],
  },
];

export default function Reading() {
  useTitle("Background reading");
  return (
    <div className="page page-narrow reading">
      <div className="page-head">
        <p className="eyebrow rv">Build Cycle C04 · Background reading</p>
        <h1 className="h1 rv"><Words text="The ideas behind the map" /></h1>
        <p className="lede rv">You don't need to read any of this to write a good profile. What matters most is your own view. But if you're curious where the questions come from, start here.</p>
        <nav className="toc rv" aria-label="On this page">
          {TOPICS.map((t) => <a key={t.id} href={`#${t.id}`}>{t.title}</a>)}
        </nav>
      </div>

      {TOPICS.map((t) => (
        <section key={t.id} id={t.id} className="topic" aria-labelledby={`h-${t.id}`}>
          <h2 className="h2 rv" id={`h-${t.id}`}>{t.title}</h2>
          {t.body.map((p, i) => <p key={i} className="rv">{p}</p>)}
          <p className="here rv"><strong>In this app:</strong> {t.here}</p>
          <ul className="sources">
            {t.sources.map((s) => (
              <li key={s.href + s.title} className="source rv">
                <span className={`kind kind-${s.kind.replace(/\s+/g, "-").toLowerCase()}`}>{s.kind}</span>
                <a href={s.href} target="_blank" rel="noopener noreferrer">{s.title}<span className="sr-only"> (opens in a new tab)</span></a>
                <span className="by">{s.by}</span>
                {s.note && <span className="snote">{s.note}</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="small muted rv" style={{ marginTop: 48 }}>Links checked October 2026. <Link to="/" viewTransition>← Back to my profiles</Link></p>
    </div>
  );
}
