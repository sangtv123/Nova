export function DividerPage() {
  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Divider</h1>
      <p class="nova-ui-page-desc">A divider line separates content into clear groups. Styled with SCSS.</p>

      <div class="nova-section">
        <h2 class="nova-section-title">Horizontal</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="gap:0">
            <p style="margin:0">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista probare, quae sunt a te dicta? Refert tamen, quo modo.</p>
            <div class="n-divider n-divider--horizontal"></div>
            <p style="margin:0">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista probare, quae sunt a te dicta? Refert tamen, quo modo.</p>
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">Default horizontal divider</span>
          </div>
        </div>
      </div>

      <div class="nova-section">
        <h2 class="nova-section-title">With Text</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="gap:0">
            <div class="n-divider n-divider--horizontal"><span class="n-divider-text">Center Text</span></div>
            <div class="n-divider n-divider--horizontal n-divider--left"><span class="n-divider-text">Left Text</span></div>
            <div class="n-divider n-divider--horizontal n-divider--right"><span class="n-divider-text">Right Text</span></div>
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">Support text alignment</span>
          </div>
        </div>
      </div>

      <div class="nova-section">
        <h2 class="nova-section-title">Vertical</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview" style="align-items:center">
            <span>Link 1</span>
            <div class="n-divider n-divider--vertical"></div>
            <span>Link 2</span>
            <div class="n-divider n-divider--vertical"></div>
            <span>Link 3</span>
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">Inline vertical divider</span>
          </div>
        </div>
      </div>

      <div class="nova-section">
        <h2 class="nova-section-title">Dashed</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="gap:0">
            <div class="n-divider n-divider--horizontal n-divider--dashed"></div>
            <div class="n-divider n-divider--horizontal n-divider--dashed"><span class="n-divider-text">Dashed with Text</span></div>
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">Dashed line style</span>
          </div>
        </div>
      </div>

      <table class="nova-api-table">
        <thead><tr><th>Class</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>.n-divider</code></td><td>Base divider class</td></tr>
          <tr><td><code>.n-divider--horizontal</code></td><td>Horizontal divider</td></tr>
          <tr><td><code>.n-divider--vertical</code></td><td>Vertical divider</td></tr>
          <tr><td><code>.n-divider--dashed</code></td><td>Dashed line</td></tr>
          <tr><td><code>.n-divider--left | right</code></td><td>Text alignment</td></tr>
          <tr><td><code>.n-divider-text</code></td><td>Wrapper for text content</td></tr>
        </tbody>
      </table>
    </div>
  );
}
