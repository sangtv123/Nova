import { signal } from '@nova/signals';
import { Button } from '../../nova-ui/components/Button';

export function ButtonPage() {
  const loading = signal(false);

  function simulateLoad() {
    loading.value = true;
    setTimeout(() => { loading.value = false; }, 2000);
  }

  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Button</h1>
      <p class="nova-ui-page-desc">Trigger an operation. Matches NG-ZORRO nz-button.</p>

      <div class="nova-section">
        <h2 class="nova-section-title">Type</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview">
            <Button type="primary">Primary</Button>
            <Button>Default</Button>
            <Button type="dashed">Dashed</Button>
            <Button type="text">Text</Button>
            <Button type="link">Link</Button>
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">5 button variants</span>
          </div>
        </div>
      </div>

      <div class="nova-section">
        <h2 class="nova-section-title">Size</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview" style="align-items:center">
            <Button type="primary" size="large">Large</Button>
            <Button type="primary">Default</Button>
            <Button type="primary" size="small">Small</Button>
          </div>
        </div>
      </div>

      <div class="nova-section">
        <h2 class="nova-section-title">Danger & Ghost</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview">
            <Button danger>Danger</Button>
            <Button ghost>Ghost</Button>
            <Button type="primary" shape="round">Rounded</Button>
            <Button type="primary" shape="circle">✓</Button>
          </div>
        </div>
      </div>

      <div class="nova-section">
        <h2 class="nova-section-title">Loading State</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview">
            <Button
              type="primary"
              loading={() => loading.value}
              onClick={simulateLoad}
            >
              {() => loading.value ? 'Loading...' : 'Click to Load'}
            </Button>
            <Button loading>Always Loading</Button>
          </div>
        </div>
      </div>

      <div class="nova-section">
        <h2 class="nova-section-title">Disabled</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview">
            <Button type="primary" disabled>Primary (disabled)</Button>
            <Button disabled>Default (disabled)</Button>
            <Button danger disabled>Danger (disabled)</Button>
          </div>
        </div>
      </div>

      <div class="nova-section">
        <h2 class="nova-section-title">Block</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="width:100%">
            <Button type="primary" block>Block Primary</Button>
            <Button block>Block Default</Button>
          </div>
        </div>
      </div>

      <table class="nova-api-table">
        <thead><tr><th>Prop</th><th>Description</th><th>Type</th><th>Default</th></tr></thead>
        <tbody>
          <tr><td><code>type</code></td><td>Button variant</td><td><code>'primary' | 'default' | 'dashed' | 'text' | 'link'</code></td><td><code>'default'</code></td></tr>
          <tr><td><code>size</code></td><td>Size of button</td><td><code>'small' | 'default' | 'large'</code></td><td><code>'default'</code></td></tr>
          <tr><td><code>loading</code></td><td>Show loading spinner</td><td><code>boolean</code></td><td><code>false</code></td></tr>
          <tr><td><code>block</code></td><td>Full width</td><td><code>boolean</code></td><td><code>false</code></td></tr>
          <tr><td><code>disabled</code></td><td>Disabled state</td><td><code>boolean</code></td><td><code>false</code></td></tr>
          <tr><td><code>danger</code></td><td>Danger state</td><td><code>boolean</code></td><td><code>false</code></td></tr>
          <tr><td><code>ghost</code></td><td>Ghost state</td><td><code>boolean</code></td><td><code>false</code></td></tr>
          <tr><td><code>shape</code></td><td>Button shape</td><td><code>'circle' | 'round'</code></td><td>—</td></tr>
        </tbody>
      </table>
    </div>
  );
}
