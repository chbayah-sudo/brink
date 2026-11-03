// Minimal one-page site (SSI-style layout). Copy is placeholder — replace freely.
// The previous full site is saved on branch backup-live-2026-11-03.

const paragraphs = [
  "Human cognition is the bottleneck of the AI era.",
  "Machines get faster every year. The person working next to them does not. We think that gap is the most important human problem of our time.",
  "Brink is building a non-invasive brain-computer interface for cognition: it measures how much you can think right now, sees when that capacity is running out, and over time helps expand it.",
  "Most brain-computer interface companies work on communication, a faster pipe from your thoughts to a computer. We work on the thing underneath it: how well you can think in the first place.",
  "We start by reading cognitive load and headroom with a small wearable, checked against what you actually do, and learn what each person's baseline looks like.",
  "We are a small team in San Francisco with backgrounds in neurotechnology, wearables, and cognitive science.",
  "If you want to work on this, or invest in it, we want to hear from you.",
];

export default function Home() {
  return (
    <>
      <style>{`
        html, body { background: #111214 !important; }
        .ssi { min-height: 100vh; background: #111214; color: #e6e6e6;
          font-family: var(--font-ibm-plex-mono), ui-monospace, SFMono-Regular, Menlo, monospace; }
        .ssi main { max-width: 800px; margin: 0 auto; padding: 72px 24px 48px; }
        .ssi h1 { font-size: 32px; font-weight: 700; line-height: 1.25; margin: 0 0 28px; letter-spacing: 0; }
        .ssi .lead { font-weight: 700; }
        .ssi p { font-size: 18px; line-height: 1.5; margin: 0 0 22px; }
        .ssi nav { margin-top: 48px; display: flex; gap: 14px; font-size: 18px; }
        .ssi nav a { color: #6fe36a; text-decoration: none; }
        .ssi nav a:hover { text-decoration: underline; }
        .ssi footer { margin-top: 24px; font-size: 15px; color: #e6e6e6; }
        @media (max-width: 600px) { .ssi h1 { font-size: 26px; } .ssi p, .ssi nav { font-size: 16px; } }
      `}</style>
      <div className="ssi">
        <main>
          <h1>Brink.</h1>
          <p className="lead">{paragraphs[0]}</p>
          {paragraphs.slice(1).map((t) => (
            <p key={t}>{t}</p>
          ))}
          <nav>
            <a href="mailto:contact@neurabrink.bio?subject=Joining%20Brink">Apply</a>
            <a href="mailto:contact@neurabrink.bio?subject=Investing%20in%20Brink">Invest</a>
            <a href="mailto:contact@neurabrink.bio">Contact</a>
          </nav>
          <footer>NEURABRINK, Inc. © 2026</footer>
        </main>
      </div>
    </>
  );
}
