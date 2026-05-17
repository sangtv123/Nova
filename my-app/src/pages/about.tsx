import { ContactIsland } from '../islands/ContactIsland';
import { PipesDemoIsland } from '../islands/PipesDemoIsland';

export function AboutPage() {
  return (
    <div class="page about-page">
      <section class="content-section">
        <h2 class="title">About Nova</h2>
        <div class="card">
          <p>Nova is an ultra-fast, AI-friendly web framework built from the ground up for modern web development.</p>
          <p>By moving away from the Virtual DOM, Nova provides exceptional performance while maintaining a delightful developer experience with JSX/TSX.</p>
          
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-value">&lt;5kb</span>
              <span class="stat-label">Runtime Size</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">0</span>
              <span class="stat-label">VDOM Overhead</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">100%</span>
              <span class="stat-label">Signals Powered</span>
            </div>
          </div>
        </div>
      </section>

      <section class="content-section">
        <PipesDemoIsland />
      </section>

      <section class="content-section">
        <ContactIsland />
      </section>
    </div>
  );
}
