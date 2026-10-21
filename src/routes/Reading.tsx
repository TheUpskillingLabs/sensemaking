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
      "Community economic development is development done by and with a community rather than to it. Residents take part in the decisions, local assets are the starting point, and the goal is economic, social, ecological and cultural well-being together, not income alone.",
      "It's the tradition The Labs works in. Upskilling isn't only about one person's next job. It also builds what a place can do for itself.",
    ],
    here: "When you profile a player, you're mapping part of the local economy The Labs belongs to: who holds which assets, and who decides.",
    sources: [
      { kind: "Start here", title: "Community Economic Development Key Concepts", by: "Roberto Gallardo, Mississippi State University Extension", href: "https://extension.msstate.edu/publications/community-economic-development-key-concepts", note: "Short and practical. Defines CED as a process that lets residents mobilize and build assets to improve their quality of life sustainably." },
      { kind: "Go deeper", title: "Community economic development", by: "Wikipedia", href: "https://en.wikipedia.org/wiki/Community_economic_development", note: "An overview of principles and history, with references to follow." },
    ],
  },
  {
    id: "capitals",
    title: "The Community Capitals Framework",
    body: [
      "Cornelia and Jan Flora's Community Capitals Framework says a community's well-being rests on seven kinds of resources, or capitals: natural, cultural, human, social, political, financial and built. Each can be invested in or drawn down.",
      "Their key finding is the “spiraling up” effect. Investing in one capital, often social capital, tends to build others, and losses can spiral down the same way. That's why the profiles ask about all seven, not just money.",
    ],
    here: "The “What they bring” ratings in each profile use these seven capitals. Thin or strong capitals across everyone's profiles show where the field is rich and where it's starved.",
    sources: [
      { kind: "Start here", title: "The Community Capitals Framework", by: "Lionel J. Beaulieu, Purdue University · NDSU Extension (2024)", href: "https://ndsu.edu/agriculture/sites/default/files/2024-06/cv2243.pdf", note: "A clear six-page introduction with a table defining each capital and examples. PDF." },
      { kind: "Source", title: "Promoting Community Vitality & Sustainability: The Community Capitals Framework", by: "Lionel J. Beaulieu · Southern Rural Development Center (2014)", href: "https://srdc.msstate.edu/sites/default/files/2023-05/Community-Capitals-Framework-Writeup-Oct-2014.pdf", note: "The original write-up, including a section on spiraling up. PDF." },
      { kind: "Go deeper", title: "Spiraling-Up: Mapping Community Transformation with Community Capitals Framework", by: "Mary Emery & Cornelia Butler Flora · Community Development 37(1), 2006", href: "https://vtechworks.lib.vt.edu/handle/10919/69153", note: "The paper behind spiraling up. This is a catalogue record; the full text is in the journal." },
    ],
  },
  {
    id: "frames",
    title: "Frame innovation",
    body: [
      "Kees Dorst's frame innovation is a way of working on open, complex problems that don't yield to ordinary problem solving. Instead of jumping to solutions, you change how the problem is seen. You find a new frame (“if we look at it as…, then…”) that opens moves nobody could see before.",
      "Dorst lays it out in nine steps: archaeology, paradox, context, field, themes, frames, futures, transformation and integration. This exercise covers the early ones: what's been tried, and who's involved.",
    ],
    here: "Build Cycles use frame innovation to get from a messy situation to a frame a team can build on. Everyone's profiles are raw material for the paradox and themes steps that come next.",
    sources: [
      { kind: "Start here", title: "Frame Innovation for Social Impact", by: "Allison Huang · Medium (2017)", href: "https://medium.com/@allisonyhuang/frame-innovation-for-social-impact-70d821e897a4", note: "A plain-language walk through the nine steps, one line each." },
      { kind: "Source", title: "Frame Creation and Design in the Expanded Field", by: "Kees Dorst · She Ji 1(1), 2015", href: "https://doi.org/10.1016/j.sheji.2015.07.003", note: "Dorst's own short account of frame creation and why it travels beyond design. Free to read." },
      { kind: "Go deeper", title: "Frame Innovation: Create New Thinking by Design", by: "Kees Dorst · MIT Press", href: "https://mitpressbookstore.mit.edu/book/9780262550963", note: "The book, with the full method and case studies. Paid." },
    ],
  },
  {
    id: "archaeology",
    title: "Archaeology: dig before you design",
    body: [
      "The first step looks backward. You investigate the problem as it's currently understood, and the earlier attempts to solve it: who tried what, what happened, and what assumptions kept getting repeated.",
      "Old fixes leave traces. They show which frames have already been used up, and they often point to the paradox that keeps the problem stuck.",
    ],
    here: "When you describe a player, note what they've already tried in this space, and what they keep running into. That history is evidence.",
    sources: [
      { kind: "Start here", title: "How Frame Creation can inspire innovation", by: "Jacqueline Antalik · OXD (2025)", href: "https://oxd.com/insights/how-frame-creation-can-inspire-innovation/", note: "A practitioner's account that starts with archaeology: what's been tried before, how it worked, and what drives decision-makers." },
      { kind: "Source", title: "Frame Innovation for Social Impact", by: "Allison Huang · Medium (2017)", href: "https://medium.com/@allisonyhuang/frame-innovation-for-social-impact-70d821e897a4", note: "Archaeology: “investigate in depth the apparent problem, as well as earlier attempts to solve it.”" },
    ],
  },
  {
    id: "field",
    title: "Field mapping: who's in the game",
    body: [
      "Dorst's context and field steps widen the view in two rings. The inner circle is everyone already involved in the problem situation. The wider field is every player who could be connected to the problem or a solution, including people nobody has asked yet.",
      "Mapping the field is where new frames come from. Each player brings their own needs, values and fears. The deeper patterns that run across them, which Dorst calls themes, are what a good frame speaks to.",
    ],
    here: "This whole app is a field map. The Ring question puts each player in the inner circle or the wider field. Many people mapping the same field independently is what makes the patterns trustworthy.",
    sources: [
      { kind: "Tool", title: "Ripple Effects Mapping for Evaluation", by: "Washington State University Extension (2011)", href: "https://wpcdn.web.wsu.edu/extension/uploads/sites/54/2013/12/REM.Complete.pdf", note: "A visual mapping method that codes what each player contributes against the seven capitals. PDF." },
      { kind: "Tool", title: "Asset-Based Community Development toolkit", by: "ABCD Institute, DePaul University", href: "https://resources.depaul.edu/abcd-institute/resources/Pages/tool-kit.aspx", note: "Capacity inventories and asset-mapping guides: start from what a community has, not what it lacks." },
    ],
  },
  {
    id: "customers",
    title: "Every nonprofit business has at least two customers",
    body: [
      "Peter Drucker asked every organization, “Who is our customer?” For a nonprofit, he split the answer. The primary customer is “the person whose life is changed through your work.” Supporting customers are “volunteers, members, partners, funders, referral sources, employees and others” who must also be satisfied. And “the primary customer is never the only customer.”",
      "In a business, the person who benefits usually pays, so one customer gives one signal. In a nonprofit, the person whose life changes and the person who pays are usually different, so every line of work has at least two customers who value different things. Drucker's advice is to keep one primary customer in focus while still earning the supporting customers' trust.",
    ],
    here: "Many players in your profiles are someone's primary customer or someone's funder, sometimes both. Where what the people served need and what funders reward pull apart, you've probably found a paradox.",
    sources: [
      { kind: "Start here", title: "Drucker on Being Customer-Centric", by: "Peter F. Drucker · Drucker Institute reading", href: "https://drucker.institute/wp-content/uploads/2018/08/Reading_Drucker-on-Being-Customer-Centric.pdf", note: "Two pages, adapted from The Five Most Important Questions. The primary/supporting distinction in Drucker’s own words. PDF." },
      { kind: "Source", title: "Who Exactly Are the “Customers” of a Nonprofit Organization?", by: "Mark R. Kramer · Chronicle of Philanthropy (2001)", href: "https://www.issuelab.org/resources/1839/1839.pdf", note: "Argues every nonprofit has three indispensable customers: clients, donors and volunteers or staff. PDF." },
      { kind: "Go deeper", title: "Ten Nonprofit Funding Models", by: "William Foster, Peter Kim & Barbara Christiansen · SSIR (2009)", href: "https://ssir.org/articles/entry/ten_nonprofit_funding_models", note: "Who pays, and why, sorted into ten patterns. Free with an SSIR account." },
      { kind: "Go deeper", title: "The Nonprofit Starvation Cycle", by: "Ann Goggins Gregory & Don Howard · SSIR (2009), via Bridgespan", href: "https://bridgespan.org/insights/the-nonprofit-starvation-cycle", note: "What happens when funders' expectations, not the work, set the budget." },
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
        <p className="lede rv">You don't need any of this to write a good profile. Your own view of the field is the point. But if you want to know where the questions come from, start here.</p>
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
