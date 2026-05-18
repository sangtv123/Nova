export function IconPage() {
  // SVG Icons
  const SearchIcon = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
  );
  
  const SettingsIcon = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
  );
  
  const CheckIcon = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
  );
  
  const CloseIcon = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  );

  const InfoIcon = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
  );

  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Icon</h1>
      <p class="nova-ui-page-desc">Visual symbols used to represent objects or concepts. Styled with SCSS.</p>

      <div class="nova-section">
        <h2 class="nova-section-title">Sizes</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview" style="align-items:center;gap:20px">
            <span class="n-icon n-icon--xs"><SearchIcon /></span>
            <span class="n-icon n-icon--sm"><SearchIcon /></span>
            <span class="n-icon n-icon--md"><SearchIcon /></span>
            <span class="n-icon n-icon--lg"><SearchIcon /></span>
            <span class="n-icon n-icon--xl"><SearchIcon /></span>
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">Available in 5 sizes (xs, sm, md, lg, xl)</span>
          </div>
        </div>
      </div>

      <div class="nova-section">
        <h2 class="nova-section-title">Colors</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview" style="gap:20px">
            <span class="n-icon n-icon--lg n-icon--primary"><SettingsIcon /></span>
            <span class="n-icon n-icon--lg n-icon--success"><CheckIcon /></span>
            <span class="n-icon n-icon--lg n-icon--warning"><InfoIcon /></span>
            <span class="n-icon n-icon--lg n-icon--error"><CloseIcon /></span>
            <span class="n-icon n-icon--lg n-icon--secondary"><SearchIcon /></span>
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">Contextual colors</span>
          </div>
        </div>
      </div>

      <div class="nova-section">
        <h2 class="nova-section-title">Clickable</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview" style="gap:20px">
            <span class="n-icon n-icon--lg n-icon--clickable"><SearchIcon /></span>
            <span class="n-icon n-icon--lg n-icon--clickable"><SettingsIcon /></span>
            <span class="n-icon n-icon--lg n-icon--clickable"><CloseIcon /></span>
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">With hover background effect</span>
          </div>
        </div>
      </div>

      <div class="nova-section">
        <h2 class="nova-section-title">Filled / Avatar Style</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview" style="gap:20px">
            <span class="n-icon n-icon--lg n-icon--filled n-icon--primary"><SettingsIcon /></span>
            <span class="n-icon n-icon--lg n-icon--filled n-icon--success"><CheckIcon /></span>
            <span class="n-icon n-icon--lg n-icon--filled n-icon--warning"><InfoIcon /></span>
            <span class="n-icon n-icon--lg n-icon--filled n-icon--error"><CloseIcon /></span>
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">Icons inside a colored circle</span>
          </div>
        </div>
      </div>

      <div class="nova-section">
        <h2 class="nova-section-title">Animation</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview" style="gap:20px">
            <span class="n-icon n-icon--lg n-icon--spin"><SettingsIcon /></span>
            <span class="n-icon n-icon--lg n-icon--spin"><SearchIcon /></span>
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">Spinning animation</span>
          </div>
        </div>
      </div>

      <table class="nova-api-table">
        <thead><tr><th>Class</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>.n-icon</code></td><td>Base icon class</td></tr>
          <tr><td><code>.n-icon--xs | sm | md | lg | xl</code></td><td>Size variants</td></tr>
          <tr><td><code>.n-icon--primary | success | warning | error | secondary</code></td><td>Color variants</td></tr>
          <tr><td><code>.n-icon--clickable</code></td><td>Hover effect for interactive icons</td></tr>
          <tr><td><code>.n-icon--filled</code></td><td>Circled background style</td></tr>
          <tr><td><code>.n-icon--spin</code></td><td>Rotate animation</td></tr>
        </tbody>
      </table>
    </div>
  );
}
