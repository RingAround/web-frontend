import Link from "next/link";
import { Arrow, CheckGlyph, PhoneGlyph } from "@/components/icons";
import { Logo } from "@/components/logo";

const ROLES = [
  "Property managers",
  "Facilities managers",
  "Office managers",
  "Small business owners",
  "Procurement & purchasing",
  "Operations leads",
  "HOA boards",
  "Restaurant operators",
  "Retail store managers",
  "Real estate investors",
];

const CALLS = [
  {
    name: "Brightline Cleaning Co.",
    status: "quote",
    detail: "$320 flat · Fri 8–11am · supplies included",
  },
  {
    name: "Evergreen Maid Service",
    status: "calling",
    detail: "Asking about weekend availability",
  },
  {
    name: "Harbor Home Care",
    status: "retry",
    detail: "Voicemail · retrying at 2:00pm",
  },
  {
    name: "Pine & Co. Cleaners",
    status: "declined",
    detail: "Booked through Nov 10",
  },
  {
    name: "Summit Clean Pros",
    status: "queued",
    detail: "Opens at 9:00am local",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Describe the job once",
    body: "Four questions: what you need, where, when, and your budget. Add special instructions like “licensed & insured only” or “ask if they bring supplies.”",
  },
  {
    n: "02",
    title: "Approve the shortlist",
    body: "RingAround finds relevant local providers near the job site. You see who will be contacted, how many calls, and the limits — nothing happens until you press Start.",
  },
  {
    n: "03",
    title: "We make the calls",
    body: "An AI agent calls during business hours, introduces itself honestly as an assistant calling for a customer, and asks for pricing and availability.",
  },
  {
    n: "04",
    title: "Compare real quotes",
    body: "Price, what’s included, earliest date, and conditions — normalized side by side, with every quote marked firm, estimate, or conditional.",
  },
];

const PERSONAS = [
  {
    role: "Property manager",
    ask: "Turnover clean for Unit 4B before Friday’s move-in.",
    win: "Get three bids without leaving the leasing office.",
  },
  {
    role: "Facilities manager",
    ask: "Spring maintenance on three rooftop HVAC units.",
    win: "Comparable scopes, not three different conversations.",
  },
  {
    role: "Restaurant owner",
    ask: "Kitchen hood cleaning before next month’s inspection.",
    win: "Stay on the line with customers, not vendors.",
  },
  {
    role: "Office manager",
    ask: "Carpet cleaning for 6,000 sq ft, after hours only.",
    win: "Special instructions travel with every call.",
  },
  {
    role: "Procurement lead",
    ask: "Three bids for parking lot restriping, two sites.",
    win: "A clean paper trail of who said what, and when.",
  },
  {
    role: "HOA board member",
    ask: "Annual landscaping contract for 40 homes.",
    win: "Bring a real comparison to the next meeting.",
  },
];

const QUOTES = [
  {
    name: "Brightline Cleaning Co.",
    price: "$320",
    basis: "flat rate",
    includes: "Deep clean, inside appliances, supplies",
    earliest: "Fri, 8–11am",
    terms: "50% deposit to hold slot",
    type: "Firm",
  },
  {
    name: "Evergreen Maid Service",
    price: "$280–$360",
    basis: "est. 4–5 hrs",
    includes: "Deep clean, supplies; windows +$40",
    earliest: "Sat, 9am",
    terms: "Final price after walkthrough",
    type: "Estimate",
  },
  {
    name: "Harbor Home Care",
    price: "$295",
    basis: "flat rate",
    includes: "Deep clean; customer provides supplies",
    earliest: "Thu, 1pm",
    terms: "Only if unit is vacant",
    type: "Conditional",
  },
];

const PROMISES = [
  {
    title: "You approve every round",
    body: "No call goes out until you review the shortlist and press Start. Bigger rounds need a fresh yes.",
  },
  {
    title: "Honest on every call",
    body: "The agent says it’s an AI assistant calling on behalf of a customer. It never pretends to be you.",
  },
  {
    title: "Never invents a number",
    body: "Quotes come only from what a business actually said. No answer is recorded as “no quote,” not guessed.",
  },
  {
    title: "Hard limits, built in",
    body: "Call caps, business-hours only, and your service area. Businesses that opt out are never called again.",
  },
  {
    title: "No booking behind your back",
    body: "RingAround gathers quotes. Booking, paying, or signing anything always stays with you.",
  },
  {
    title: "Straight reporting",
    body: "“5 calls, 2 answered, 1 usable quote” — you see exactly what happened, not a rosy summary.",
  },
];

const PLAN_FEATURES = [
  "Up to 200 quotes every month",
  "Four-question requests with special instructions",
  "Saved locations for your properties, stores, or sites",
  "Shortlist review before any call goes out",
  "AI calls during business hours, always disclosed",
  "Side-by-side comparison, labeled firm, estimate, or conditional",
  "A full record of who was contacted and what they said",
];

const FAQS = [
  {
    q: "Who does RingAround call?",
    a: "Local businesses that match your request near the job site. You see the full shortlist and can remove anyone before outreach starts.",
  },
  {
    q: "Does the business know it’s talking to an AI?",
    a: "Yes. The agent identifies itself as an AI assistant requesting a quote on behalf of a customer, every time.",
  },
  {
    q: "Are the quotes guaranteed?",
    a: "No — and we say so. Each quote is labeled firm, estimate, or conditional, with the caveats the business gave. Final pricing is between you and the provider.",
  },
  {
    q: "Can I get quotes for a property that isn’t my main address?",
    a: "Yes. Save as many locations as you manage and pick one per request — your default never changes unless you change it.",
  },
  {
    q: "Are calls recorded?",
    a: "Not by default. RingAround captures the quote details, not audio.",
  },
  {
    q: "What does it cost?",
    a: "$20 a month for up to 200 quotes — about 10¢ a quote if you use them all.",
  },
];

function StatusPill({ status }) {
  const map = {
    quote: ["Quote", "bg-sage-soft text-sage"],
    calling: ["Calling", "bg-signal-soft text-signal"],
    retry: ["Retry", "bg-amber-soft text-amber"],
    declined: ["Declined", "bg-paper-2 text-ink-soft"],
    queued: ["Queued", "bg-paper-2 text-ink-soft"],
  };
  const [label, cls] = map[status];
  return (
    <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  );
}

function CallIcon({ status }) {
  if (status === "calling") {
    return (
      <span className="ring-pulse grid h-9 w-9 shrink-0 place-items-center rounded-full bg-signal text-paper">
        <PhoneGlyph />
      </span>
    );
  }
  const tone =
    status === "quote"
      ? "bg-sage text-paper"
      : status === "retry"
        ? "bg-amber-soft text-amber"
        : "bg-paper-2 text-ink-soft";
  return (
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${tone}`}>
      {status === "quote" ? <CheckGlyph /> : <PhoneGlyph />}
    </span>
  );
}

function HeroBoard() {
  return (
    <div className="relative isolate">
      {/* radiating rings */}
      <svg viewBox="0 0 600 600" className="spin-slow pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[150%] max-w-none -translate-x-1/2 -translate-y-1/2 text-ink" aria-hidden="true">
        {[90, 150, 210, 270].map((r, i) => (
          <circle key={r} cx="300" cy="300" r={r} fill="none" stroke="currentColor" strokeOpacity={0.12 - i * 0.02} strokeWidth="1" strokeDasharray={i % 2 ? "2 8" : "none"} />
        ))}
        <circle cx="300" cy="30" r="5" fill="var(--signal)" />
        <circle cx="510" cy="300" r="3.5" fill="var(--sage)" />
        <circle cx="140" cy="480" r="3.5" fill="var(--ink)" fillOpacity="0.4" />
      </svg>

      <div className="rise rounded-[28px] border border-line bg-white/80 p-2 shadow-[0_30px_80px_-30px_rgb(21_20_15/0.35)] backdrop-blur" style={{ animationDelay: "0.25s" }}>
        {/* request summary */}
        <div className="rounded-[22px] bg-ink p-5 text-paper">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/50">Example request</span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-signal">
              <span className="h-1.5 w-1.5 rounded-full bg-signal" /> Live
            </span>
          </div>
          <p className="mt-3 font-display text-2xl leading-tight">Turnover deep clean, 2-bed unit</p>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-xs">
            <div>
              <dt className="text-paper/45">Where</dt>
              <dd className="mt-0.5">Unit 4B, Pine St</dd>
            </div>
            <div>
              <dt className="text-paper/45">When</dt>
              <dd className="mt-0.5">By Friday AM</dd>
            </div>
            <div>
              <dt className="text-paper/45">Budget</dt>
              <dd className="mt-0.5">$250–$400</dd>
            </div>
          </dl>
        </div>

        {/* calls */}
        <ul className="divide-y divide-line/70 px-3 py-1">
          {CALLS.map((c) => (
            <li key={c.name} className="flex items-center gap-3 py-3">
              <CallIcon status={c.status} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="truncate text-xs text-ink-soft">
                  {c.status === "calling" ? (
                    <>
                      {c.detail}
                      <span className="dots ml-0.5">
                        <span>.</span>
                        <span>.</span>
                        <span>.</span>
                      </span>
                    </>
                  ) : (
                    c.detail
                  )}
                </p>
              </div>
              <StatusPill status={c.status} />
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-end rounded-[18px] bg-paper-2/70 px-4 py-3 text-xs">
          <span className="text-ink-soft">
            <b className="font-semibold text-ink">2 of 5</b> calls placed · cap 5
          </span>
        </div>
      </div>

      {/* floating quote chip */}
      <div className="rise absolute -bottom-6 -left-4 hidden rounded-2xl border border-line bg-white px-4 py-3 shadow-xl sm:block md:-left-10" style={{ animationDelay: "0.7s" }}>
        <p className="font-mono text-[10px] uppercase tracking-wider text-sage">New quote</p>
        <p className="mt-0.5 font-display text-2xl leading-none">$320</p>
        <p className="mt-1 text-[11px] text-ink-soft">Brightline · supplies incl.</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col overflow-x-clip">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-line/60 bg-paper/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#top" aria-label="RingAround home">
            <Logo />
          </a>
          <div className="hidden items-center gap-8 text-sm text-ink-soft md:flex">
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#who" className="hover:text-ink">Who it’s for</a>
            <a href="#trust" className="hover:text-ink">Guardrails</a>
            <a href="#pricing" className="hover:text-ink">Pricing</a>
            <a href="#faq" className="hover:text-ink">FAQ</a>
          </div>
          <Link href="/sign-in" className="group inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-signal">
            Get early access <Arrow />
          </Link>
        </nav>
      </header>

      <main id="top">
        {/* HERO */}
        <section className="grain relative">
          <div className="mx-auto grid max-w-6xl items-center gap-16 px-4 pb-24 pt-16 sm:px-6 md:pt-24 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-32">
            <div>
              <p className="rise inline-flex items-center gap-2 rounded-full border border-line bg-white/60 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                AI quote agent for operators
              </p>
              <h1 className="rise mt-6 font-display text-[3.2rem] leading-[0.95] tracking-tight sm:text-7xl lg:text-[5.4rem]" style={{ animationDelay: "0.08s" }}>
                Stop chasing quotes.
                <br />
                <em className="text-signal">We’ll ring around.</em>
              </h1>
              <p className="rise mt-7 max-w-xl text-lg leading-relaxed text-ink-soft" style={{ animationDelay: "0.16s" }}>
                Describe the job once. RingAround finds local providers, calls them with your approval, and hands back quotes you can actually compare — so you can get back to running the property, the store, or the building.
              </p>
              <div className="rise mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "0.24s" }}>
                <Link href="/sign-in" className="group inline-flex items-center gap-2 rounded-full bg-signal px-6 py-3.5 font-medium text-white shadow-[0_10px_30px_-10px_var(--signal)] transition hover:bg-ink">
                  Get early access <Arrow />
                </Link>
                <a href="#how" className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-6 py-3.5 font-medium transition hover:border-ink">
                  See how it works
                </a>
              </div>
              <ul className="rise mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft" style={{ animationDelay: "0.3s" }}>
                {["$20/mo for up to 200 quotes", "You approve every call", "Always says it’s an AI"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-signal" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mx-auto w-full max-w-md lg:max-w-none">
              <HeroBoard />
            </div>
          </div>
        </section>

        {/* ROLES MARQUEE */}
        <section aria-label="Built for" className="border-y border-line bg-ink py-5 text-paper">
          <div className="flex overflow-hidden">
            <div className="marquee flex shrink-0 items-center gap-10 whitespace-nowrap pr-10">
              {[...ROLES, ...ROLES].map((r, i) => (
                <span key={i} className="flex items-center gap-10 font-display text-2xl italic text-paper/80">
                  {r}
                  <span className="h-1.5 w-1.5 rounded-full bg-signal not-italic" />
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* PROBLEM */}
        <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32">
          <div className="grid gap-12 md:grid-cols-[1fr_1.2fr] md:gap-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">The quote grind</p>
              <h2 className="mt-4 font-display text-5xl leading-[1.02] tracking-tight md:text-6xl">
                Getting three bids shouldn’t take three days.
              </h2>
            </div>
            <div className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2">
              {[
                ["Phone tag", "Voicemails, callbacks at bad times, and “let me check and get back to you.”"],
                ["Apples to oranges", "One quotes hourly, one flat, one “depends” — none mention what’s included."],
                ["Lost in the inbox", "Notes on sticky pads, prices in texts, and nobody remembers who said Friday."],
                ["Time you don’t have", "Every hour on hold is an hour not spent on tenants, customers, or your team."],
              ].map(([t, b]) => (
                <div key={t} className="bg-paper p-7">
                  <p className="font-semibold">{t}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="scroll-mt-16 bg-white/60">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">How it works</p>
                <h2 className="mt-4 max-w-2xl font-display text-5xl leading-[1.02] tracking-tight md:text-6xl">
                  Four questions in. <em>Comparable quotes out.</em>
                </h2>
              </div>
              <p className="max-w-sm text-ink-soft">No forms that go on forever. If something’s unclear, the agent asks one focused follow-up — not twenty.</p>
            </div>

            <ol className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <li key={s.n} className="group relative rounded-3xl border border-line bg-paper p-7 transition hover:-translate-y-1 hover:shadow-[0_20px_50px_-25px_rgb(21_20_15/0.35)]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-signal">{s.n}</span>
                    <span className="relative grid h-10 w-10 place-items-center">
                      {[...Array(3)].map((_, k) => (
                        <span key={k} className="absolute rounded-full border border-ink/20" style={{ inset: `${k * 6}px` }} />
                      ))}
                      <span className={`h-2 w-2 rounded-full ${i === 3 ? "bg-sage" : "bg-ink"}`} />
                    </span>
                  </div>
                  <h3 className="mt-10 font-display text-3xl leading-tight">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* COMPARISON */}
        <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.4fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">The payoff</p>
              <h2 className="mt-4 font-display text-5xl leading-[1.02] tracking-tight">
                One table. <em>Every caveat.</em>
              </h2>
              <p className="mt-6 leading-relaxed text-ink-soft">
                RingAround normalizes price basis, scope, timing, and conditions so you can decide in minutes — and labels each quote honestly, so “around $300” never masquerades as a firm price.
              </p>
              <div className="mt-8 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-sage-soft px-3 py-1.5 font-medium text-sage">Firm — stated price</span>
                <span className="rounded-full bg-amber-soft px-3 py-1.5 font-medium text-amber">Estimate — a range</span>
                <span className="rounded-full bg-signal-soft px-3 py-1.5 font-medium text-signal">Conditional — strings attached</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_30px_80px_-40px_rgb(21_20_15/0.4)]">
              <div className="flex items-center justify-between border-b border-line px-6 py-4">
                <div>
                  <p className="text-sm font-semibold">Turnover deep clean · Unit 4B</p>
                  <p className="text-xs text-ink-soft">5 calls · 3 answered · 3 quotes</p>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">Example results</span>
              </div>
              <div className="divide-y divide-line">
                {QUOTES.map((q, i) => (
                  <div key={q.name} className="grid gap-4 px-6 py-5 sm:grid-cols-[1.3fr_0.8fr_1fr] sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{q.name}</p>
                        {i === 0 && (
                          <span className="rounded-full bg-ink px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-paper">Best fit</span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-ink-soft">{q.includes}</p>
                    </div>
                    <div>
                      <p className="font-display text-3xl leading-none">{q.price}</p>
                      <p className="mt-1 text-xs text-ink-soft">{q.basis}</p>
                    </div>
                    <div className="text-xs">
                      <p>
                        <span className="text-ink-soft">Earliest </span>
                        {q.earliest}
                      </p>
                      <p className="mt-1 text-ink-soft">{q.terms}</p>
                      <span
                        className={`mt-2 inline-block rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${
                          q.type === "Firm"
                            ? "bg-sage-soft text-sage"
                            : q.type === "Estimate"
                              ? "bg-amber-soft text-amber"
                              : "bg-signal-soft text-signal"
                        }`}
                      >
                        {q.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-line bg-paper/60 px-6 py-4 text-xs text-ink-soft">
                Prices and availability are what each business told our agent. Not guaranteed until confirmed with the provider.
              </div>
            </div>
          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section id="who" className="scroll-mt-16 bg-ink text-paper">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Who it’s for</p>
            <h2 className="mt-4 max-w-3xl font-display text-5xl leading-[1.02] tracking-tight md:text-6xl">
              Built for whoever gets handed <em className="text-signal">“can you get a few quotes?”</em>
            </h2>
            <p className="mt-6 max-w-2xl text-paper/65">
              Owners, property and facilities managers, office and operations leads, purchasing teams — if sourcing local vendors lands on your desk, RingAround takes the phone work off it.
            </p>

            <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {PERSONAS.map((p) => (
                <article key={p.role} className="group flex flex-col rounded-3xl border border-paper/10 bg-paper/[0.04] p-7 transition hover:border-signal/60 hover:bg-paper/[0.07]">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/50">{p.role}</p>
                  <p className="mt-5 flex-1 font-display text-[1.7rem] leading-snug">“{p.ask}”</p>
                  <p className="mt-6 flex items-start gap-2 text-sm text-paper/70">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                    {p.win}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-14 grid gap-6 border-t border-paper/10 pt-10 text-sm sm:grid-cols-3">
              {[
                ["Multiple locations", "Save every building, store, or unit. Pick the address per request — your default stays put."],
                ["Special instructions", "“After 6pm only,” “COI required,” “ask about supplies” — carried into every call."],
                ["A clear record", "Who was contacted, when, and exactly what they said. Easy to share with an owner or board."],
              ].map(([t, b]) => (
                <div key={t}>
                  <p className="font-semibold">{t}</p>
                  <p className="mt-2 leading-relaxed text-paper/60">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRUST */}
        <section id="trust" className="scroll-mt-16 mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Guardrails</p>
            <h2 className="mt-4 font-display text-5xl leading-[1.02] tracking-tight md:text-6xl">
              An agent that calls <em>on your behalf</em> should behave like it.
            </h2>
          </div>
          <div className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {PROMISES.map((p, i) => (
              <div key={p.title} className="border-t border-ink pt-6">
                <span className="font-mono text-xs text-ink-soft">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="scroll-mt-16 bg-white/60">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Pricing</p>
                <h2 className="mt-4 max-w-2xl font-display text-5xl leading-[1.02] tracking-tight md:text-6xl">
                  One plan. <em>Simple math.</em>
                </h2>
              </div>
              <p className="max-w-sm text-ink-soft">Twenty dollars covers up to two hundred quotes a month — about a dime a quote when you use them all.</p>
            </div>

            <div className="mt-16 grid overflow-hidden rounded-[32px] border border-line bg-white shadow-[0_30px_80px_-40px_rgb(21_20_15/0.4)] lg:grid-cols-[1fr_1.15fr]">
              <div className="relative overflow-hidden bg-ink p-8 text-paper sm:p-12">
                <svg viewBox="0 0 400 400" className="pointer-events-none absolute -right-28 -top-28 w-96 text-paper" aria-hidden="true">
                  {[70, 120, 170].map((r) => (
                    <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="currentColor" strokeOpacity="0.1" />
                  ))}
                </svg>
                <p className="relative font-mono text-[11px] uppercase tracking-[0.2em] text-paper/50">Monthly plan</p>
                <p className="relative mt-6 flex items-end gap-2">
                  <span className="font-display text-[7rem] leading-[0.8]">$20</span>
                  <span className="pb-1 text-paper/60">/ month</span>
                </p>
                <p className="relative mt-8 text-xl">
                  Up to <span className="text-signal">200 quotes</span> every month
                </p>
                <div className="relative mt-6 grid w-fit grid-cols-[repeat(20,0.375rem)] gap-1.5" aria-hidden="true">
                  {Array.from({ length: 200 }, (_, i) => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full bg-paper/25" />
                  ))}
                </div>
                <p className="relative mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-paper/45">≈ 10¢ a quote at full use</p>
                <Link href="/sign-in" className="group relative mt-10 inline-flex items-center gap-2 rounded-full bg-signal px-6 py-3.5 font-medium text-white transition hover:bg-paper hover:text-ink">
                  Get early access <Arrow />
                </Link>
              </div>
              <div className="flex flex-col p-8 sm:p-12">
                <p className="font-semibold">Everything’s included</p>
                <ul className="mt-6 space-y-4">
                  {PLAN_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-ink-soft">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sage-soft text-sage">
                        <CheckGlyph className="h-3 w-3" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="mt-10 border-t border-line pt-6 text-sm leading-relaxed text-ink-soft lg:mt-auto">
                  Quotes are what each business tells our agent. Prices and availability aren’t guaranteed until you confirm with the provider.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-16">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 md:grid-cols-[0.8fr_1.2fr] md:py-32">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">FAQ</p>
              <h2 className="mt-4 font-display text-5xl leading-[1.02] tracking-tight">Good questions.</h2>
            </div>
            <div className="divide-y divide-line border-y border-line">
              {FAQS.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer items-center justify-between gap-6 text-lg font-medium">
                    {f.q}
                    <span className="faq-plus grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-xl leading-none transition-transform">+</span>
                  </summary>
                  <p className="mt-3 max-w-xl leading-relaxed text-ink-soft">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="px-4 py-24 sm:px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-signal px-6 py-20 text-center text-white sm:px-12">
            <svg viewBox="0 0 800 800" className="pointer-events-none absolute left-1/2 top-1/2 w-[140%] max-w-none -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
              {[120, 200, 280, 360].map((r) => (
                <circle key={r} cx="400" cy="400" r={r} fill="none" stroke="white" strokeOpacity="0.18" />
              ))}
            </svg>
            <div className="relative">
              <h2 className="mx-auto max-w-3xl font-display text-5xl leading-[1.02] tracking-tight sm:text-7xl">
                Your next three quotes are a few questions away.
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-white/85">
                $20 a month for up to 200 quotes. Join early access and hand off the phone work.
              </p>
              <Link href="/sign-in" className="group mt-10 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 font-medium text-paper transition hover:bg-white hover:text-ink">
                Get early access <Arrow />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo className="text-ink" />
          <p>RingAround requests quotes; it doesn’t book, pay, or sign on your behalf.</p>
          <p>© 2026 RingAround</p>
        </div>
      </footer>
    </div>
  );
}
