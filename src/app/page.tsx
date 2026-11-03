// Minimal one-page site matching ssi.inc's exact type and spacing. Copy is placeholder — replace freely.
// The previous full site is saved on branch backup-live-2026-11-03.

const paragraphs = [
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
        html, body { background: #111213 !important; }
        .ssi { background: #111213; color: #d6d6d6; min-height: 100vh; padding: 50px 10px;
          font-family: "SF Mono", "SFMono-Regular", ui-monospace, Menlo, Consolas, "Liberation Mono", monospace;
          font-size: 0.9rem; line-height: 1.4; -webkit-font-smoothing: antialiased; }
        .ssi #maincontent { max-width: 42em; margin: 70px auto 15px; }
        .ssi h2 { font-size: 1.5em; font-weight: 700; margin: 0.83em 0 2px; line-height: 1.4; }
        .ssi p { margin: 1em 0; }
        .ssi b { font-weight: 700; }
        .ssi small { font-size: 0.833em; }
        .ssi a { color: #39ff14; text-decoration: none; }
        .ssi a:hover, .ssi a:focus { text-decoration: underline; }
      `}</style>
      <div className="ssi">
        <div id="maincontent">
          <h2>Brink.</h2>
          <p>
            <b>Human cognition is the bottleneck of the AI era.</b>
          </p>
          {paragraphs.map((t) => (
            <p key={t}>{t}</p>
          ))}
          <p>
            <br />
            <a href="mailto:contact@neurabrink.bio?subject=Joining%20Brink">Apply</a>{" "}
            <a href="mailto:contact@neurabrink.bio?subject=Investing%20in%20Brink">Invest</a>{" "}
            <a href="mailto:contact@neurabrink.bio">Contact</a>
          </p>
          <p>
            <small>NEURABRINK, Inc. © 2026</small>
          </p>
        </div>
      </div>
    </>
  );
}
