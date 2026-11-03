// Minimal one-page site matching ssi.inc's exact type and spacing. Copy is placeholder — replace freely.
// The previous full site is saved on branch backup-live-2026-11-03.

const paragraphs = [
  "Building human superintelligence is the most important technical problem of our time.",
  "We have started a straight-shot non-invasive BCI lab, with one goal and one product: a human superintelligence.",
  "It’s called Brink.",
  "Human superintelligence is our mission, our name, and our entire product roadmap, because it is our sole focus. Our team, investors, and business model are all aligned to achieve human superintelligence.",
  "We approach capabilities as technical problems to be solved through revolutionary engineering and scientific breakthroughs. We plan to advance capabilities as fast as possible.",
  "This way, we can scale in peace.",
  "Our singular focus means no distraction by management overhead or product cycles, and our business model means security and progress are insulated from short-term commercial pressures.",
  "We are an American company with deep roots and the ability to recruit top technical talent and scientists.",
  "We are assembling a lean, cracked team of the world’s best engineers, scientists and researchers dedicated to focusing on human superintelligence and nothing else.",
  "If that’s you, we offer an opportunity to do your life’s work and help solve the most important technical challenge of our age.",
  "Now is the time. Join us.",
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
