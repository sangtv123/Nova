export function TypographyPage() {
  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Typography</h1>
      <p class="nova-ui-page-desc">Basic text writing, including headings, paragraphs, and inline text. Styled with SCSS.</p>

      <div class="nova-section n-typography">
        <h2 class="nova-section-title">Headings</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="gap:0">
            <h1>h1. Nova Design</h1>
            <h2>h2. Nova Design</h2>
            <h3>h3. Nova Design</h3>
            <h4>h4. Nova Design</h4>
            <h5>h5. Nova Design</h5>
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">5 levels of headings</span>
          </div>
        </div>
      </div>

      <div class="nova-section n-typography">
        <h2 class="nova-section-title">Text Variants</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="gap:10px">
            <span class="n-typography-text">Default Text</span>
            <span class="n-typography-secondary">Secondary Text</span>
            <span class="n-typography-success">Success Text</span>
            <span class="n-typography-warning">Warning Text</span>
            <span class="n-typography-danger">Danger Text</span>
            <span class="n-typography-disabled">Disabled Text</span>
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">Contextual text colors</span>
          </div>
        </div>
      </div>

      <div class="nova-section n-typography">
        <h2 class="nova-section-title">Inline Elements</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="gap:10px">
            <p style="margin:0">This is a paragraph with <span class="n-typography-mark">marked</span> text.</p>
            <p style="margin:0">This is a paragraph with <span class="n-typography-code">code</span> text.</p>
            <p style="margin:0">This is a paragraph with <span class="n-typography-strong">strong</span> text.</p>
            <p style="margin:0">This is a paragraph with <span class="n-typography-italic">italic</span> text.</p>
            <p style="margin:0">This is a paragraph with <span class="n-typography-delete">deleted</span> text.</p>
            <p style="margin:0">This is a paragraph with <span class="n-typography-underline">underlined</span> text.</p>
            <p style="margin:0"><a class="n-typography-link">This is a link</a></p>
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">Common inline text styles</span>
          </div>
        </div>
      </div>

      <table class="nova-api-table">
        <thead><tr><th>Class</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>.n-typography</code></td><td>Wrapper class or base class</td></tr>
          <tr><td><code>h1 ~ h5</code></td><td>Heading elements inside .n-typography</td></tr>
          <tr><td><code>p</code></td><td>Paragraph element inside .n-typography</td></tr>
          <tr><td><code>.n-typography-text</code></td><td>Default text</td></tr>
          <tr><td><code>.n-typography-secondary</code></td><td>Secondary text color</td></tr>
          <tr><td><code>.n-typography-success | warning | danger</code></td><td>Contextual colors</td></tr>
          <tr><td><code>.n-typography-link</code></td><td>Link style with hover effect</td></tr>
          <tr><td><code>.n-typography-mark</code></td><td>Highlighted text</td></tr>
          <tr><td><code>.n-typography-code</code></td><td>Inline code style</td></tr>
        </tbody>
      </table>
    </div>
  );
}
