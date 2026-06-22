const STEPS = [
  { n: 1, title: "Pick a game", body: "Choose a sport tab and open a matchup." },
  { n: 2, title: "Compare the best price", body: "See which book pays the most for the same pick." },
  { n: 3, title: "Explain this bet", body: "Tap the purple button for a plain-English walkthrough." },
  { n: 4, title: "Learn what must happen to win", body: "Payout examples, implied chance, and risk notes." },
  { n: 5, title: "Bet elsewhere — only if legal", body: "We don't take wagers. Use a licensed sportsbook you understand." },
] as const;

export function HowItWorksStrip() {
  return (
    <section className="how-it-works" aria-label="How Bettin2Win works">
      <div className="how-it-works-head">
        <h2>How Bettin2Win works</h2>
        <p>Scout the lines here. Place bets only on licensed books — and only when you understand the risk.</p>
      </div>
      <ol className="how-it-works-steps">
        {STEPS.map((step) => (
          <li key={step.n} className="how-it-works-step">
            <span className="how-it-works-num" aria-hidden>
              {step.n}
            </span>
            <div>
              <strong>{step.title}</strong>
              <span>{step.body}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}