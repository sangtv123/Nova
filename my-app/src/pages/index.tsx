import { CounterIsland } from '../islands/CounterIsland';

export function IndexPage() {
  return (
    <div class="page index-page">
      <section class="hero-section">
        <h2 class="title">Next-Gen Web Framework</h2>
        <p class="subtitle">Experience the raw speed of signals and no virtual DOM overhead.</p>
        
        <div class="features-grid">
          <div class="feature-card">
            <h3>⚡ Signals Reactivity</h3>
            <p>Fine-grained updates that are incredibly fast and memory efficient.</p>
          </div>
          <div class="feature-card">
            <h3>🏝️ Island Architecture</h3>
            <p>Send zero JavaScript for static content. Hydrate only what's interactive.</p>
          </div>
          <div class="feature-card">
            <h3>🎯 No Virtual DOM</h3>
            <p>Directly compile TSX to efficient native DOM operations.</p>
          </div>
        </div>
      </section>

      <section class="island-section">
        <CounterIsland initialCount={0} />
      </section>
    </div>
  );
}
