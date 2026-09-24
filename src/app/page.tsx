const steps = [
  {
    number: "01",
    title: "Share what you need",
    body: "Post an item request with the route and date you have in mind.",
  },
  {
    number: "02",
    title: "Meet someone headed there",
    body: "We find travelers whose plans line up with your journey.",
  },
  {
    number: "03",
    title: "Agree, then hand it over",
    body: "Settle the details together. Payment stays protected until delivery.",
  },
];

function BrandMark() {
  return (
    <a className="brand" href="#top" aria-label="Courier home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 36 36" fill="none">
          <path
            d="M18 3.75c5.45 0 9.87 4.42 9.87 9.87 0 7.4-9.87 18.63-9.87 18.63S8.13 21.02 8.13 13.62c0-5.45 4.42-9.87 9.87-9.87Z"
            fill="currentColor"
          />
          <path d="M13 14.2h10m-10 4h7" stroke="#FCF8EF" strokeWidth="2" strokeLinecap="round" />
          <circle cx="18" cy="10.8" r="1.1" fill="#FCF8EF" />
        </svg>
      </span>
      <span>courier</span>
    </a>
  );
}

function RouteIllustration() {
  return (
    <svg className="route-illustration" viewBox="0 0 620 370" fill="none" aria-hidden="true">
      <path d="M85 228C157 98 235 301 312 176c77-126 137 73 223-62" stroke="#E0B752" strokeWidth="3" strokeDasharray="7 9" />
      <circle cx="85" cy="228" r="9" fill="#145B4C" stroke="#FCF8EF" strokeWidth="5" />
      <circle cx="535" cy="114" r="9" fill="#145B4C" stroke="#FCF8EF" strokeWidth="5" />
      <circle cx="312" cy="176" r="6" fill="#D58C51" stroke="#FCF8EF" strokeWidth="4" />
      <path d="M274 149c-11 4-18 16-14 27l8 23 11 1 10-18 19-6-2-11-22-2-10-14Z" fill="#145B4C" />
      <path d="m273 199-10 20m18-19 8 21m4-45 18-7" stroke="#145B4C" strokeWidth="5" strokeLinecap="round" />
      <path d="m303 158 13 9-15 5" fill="#D58C51" />
      <path d="M78 252c-8 6-12 14-12 23h38c0-9-4-17-12-23l-7-6-7 6Z" fill="#EAE4D8" />
      <path d="M525 139c-8 6-12 14-12 23h38c0-9-4-17-12-23l-7-6-7 6Z" fill="#EAE4D8" />
    </svg>
  );
}

export default function Home() {
  return (
    <main id="top">
      <header className="site-header page-shell">
        <BrandMark />
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#for-travelers">For travelers</a>
          <a href="#our-promise">Our promise</a>
        </nav>
        <a className="nav-action" href="#get-started">
          Get started <span aria-hidden="true">↗</span>
        </a>
      </header>

      <section className="hero page-shell" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> A little closer, together</p>
          <h1 id="hero-title">Good things<br />are <em>going places.</em></h1>
          <p className="hero-description">
            Need something from far away? Meet a traveler already heading your way. A thoughtful
            handoff can make the whole world feel a little smaller.
          </p>
          <div className="hero-actions" id="get-started">
            <a className="button button-primary" href="#how-it-works">
              I need something <span aria-hidden="true">↗</span>
            </a>
            <a className="button button-secondary" href="#for-travelers">
              I’m travelling <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="hero-note">
            <span className="note-icon" aria-hidden="true">✳</span>
            <span>Made for the things that matter, carried with care.</span>
          </div>
        </div>

        <div className="hero-art" role="img" aria-label="Illustration showing a parcel travelling from Lagos to London">
          <div className="sun-wash" />
          <RouteIllustration />
          <div className="route-label route-label-origin"><span className="route-pin" /> Lagos</div>
          <div className="route-label route-label-destination"><span className="route-pin" /> London</div>
          <div className="parcel-card">
            <span className="parcel-emoji" aria-hidden="true">✿</span>
            <span className="parcel-text"><strong>A little something</strong><small>On its way with Ada</small></span>
            <span className="parcel-check" aria-label="Carefully matched">✓</span>
          </div>
          <div className="art-caption"><span className="caption-spark">✳</span> One good connection goes a long way.</div>
        </div>
      </section>

      <section className="trust-strip" id="our-promise">
        <div className="page-shell trust-inner">
          <p>THE JOURNEY MATTERS AS MUCH AS THE ARRIVAL</p>
          <div><span aria-hidden="true">◎</span> People-first matching</div>
          <div><span aria-hidden="true">◇</span> Clear, agreed terms</div>
          <div><span aria-hidden="true">⌂</span> Delivery confirmed by you</div>
        </div>
      </section>

      <section className="how-section page-shell" id="how-it-works">
        <div className="section-heading">
          <p className="eyebrow">A simple way to send</p>
          <h2>From “I wish I had that”<br />to <em>“it’s right here.”</em></h2>
        </div>
        <div className="steps-grid">
          {steps.map((step) => (
            <article className="step-card" key={step.number}>
              <span className="step-number">{step.number}</span>
              <span className="step-rule" />
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="traveler-section" id="for-travelers">
        <div className="page-shell traveler-inner">
          <div className="traveler-emblem" aria-hidden="true">
            <span>↗</span>
            <i className="emblem-dot emblem-dot-one" />
            <i className="emblem-dot emblem-dot-two" />
            <i className="emblem-dot emblem-dot-three" />
          </div>
          <div className="traveler-copy">
            <p className="eyebrow">Already on your way?</p>
            <h2>Make room for<br /><em>one more good thing.</em></h2>
            <p>Share your route, meet a request that fits your trip, and agree on the details before you set off.</p>
            <a className="text-link" href="#get-started">See how carrying works <span aria-hidden="true">→</span></a>
          </div>
          <div className="traveler-aside">
            <div className="aside-mark">“</div>
            <p>Sometimes the best part of a journey is knowing you helped someone feel closer to home.</p>
            <span>THE COURIER WAY</span>
          </div>
        </div>
      </section>

      <footer className="site-footer page-shell">
        <BrandMark />
        <p>Good things, carried together.</p>
        <span>© {new Date().getFullYear()} Courier</span>
      </footer>
    </main>
  );
}
