import { Dropdown } from '../../nova-ui/components/Dropdown';
import { signal } from '@nova/signals';

export function DropdownPage() {
  const selectedHover = signal('');
  const selectedClick = signal('');

  const menu1 = (
    <>
      <div class="n-dropdown-item" data-key="item-1">1st menu item</div>
      <div class="n-dropdown-item" data-key="item-2">2nd menu item</div>
      <div class="n-dropdown-item n-dropdown-item--selected" data-key="item-3">3rd menu item (selected)</div>
      <div class="n-dropdown-divider"></div>
      <div class="n-dropdown-item n-dropdown-item--danger" data-key="danger">Danger item</div>
      <div class="n-dropdown-item n-dropdown-item--disabled" data-key="disabled">Disabled item</div>
    </>
  );

  const menu2 = (
    <>
      <div class="n-dropdown-item" data-key="profile">Profile</div>
      <div class="n-dropdown-item" data-key="settings">Settings</div>
      <div class="n-dropdown-item" data-key="billing">Billing</div>
      <div class="n-dropdown-divider"></div>
      <div class="n-dropdown-item" data-key="logout">Logout</div>
    </>
  );

  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Dropdown</h1>
      <p class="nova-ui-page-desc">Navigate or take action via a popup menu. Supports returning data on click and complete HTML removal.</p>

      <div class="nova-section">
        <h2 class="nova-section-title">Hover Trigger (Default)</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview">
            <Dropdown menu={menu1} onSelect={(key) => selectedHover.value = key}>
              <a class="n-typography-link">Hover me <span style="font-size: 10px">▼</span></a>
            </Dropdown>
            
            {() => selectedHover.value && (
              <div style="margin-left: 24px; display: inline-block; color: var(--n-text-3);">
                Selected: <strong>{selectedHover.value}</strong>
              </div>
            )}
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">Returns key on click and removes DOM when closed.</span>
          </div>
        </div>
      </div>

      <div class="nova-section">
        <h2 class="nova-section-title">Click Trigger (Appended to Body)</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview" style="height: 120px; overflow: hidden; border: 2px dashed var(--n-border);">
            <p style="margin-bottom: 20px; color: var(--n-text-3);">
              This container has <code>overflow: hidden</code>. <br/>
              Because we use <code>body={`{true}`}</code>, the menu escapes the hidden overflow!
            </p>
            <Dropdown trigger="click" body={true} menu={menu2} onSelect={(key) => selectedClick.value = key}>
              <button class="n-btn n-btn--primary">
                Click me (body=true) <span style="font-size: 10px; margin-left: 4px">▼</span>
              </button>
            </Dropdown>
            
            {() => selectedClick.value && (
              <div style="margin-top: 12px; color: var(--n-primary);">
                Selected Body Item: <strong>{selectedClick.value}</strong>
              </div>
            )}
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">Appends to document.body, avoiding overflow issues.</span>
          </div>
        </div>
      </div>

      <table class="nova-api-table">
        <thead><tr><th>Property</th><th>Description</th><th>Type</th><th>Default</th></tr></thead>
        <tbody>
          <tr><td><code>menu</code></td><td>The dropdown menu content</td><td><code>JSX</code></td><td>-</td></tr>
          <tr><td><code>trigger</code></td><td>Trigger mode</td><td><code>'hover' | 'click'</code></td><td><code>'hover'</code></td></tr>
          <tr><td><code>body</code></td><td>Append the menu to document.body</td><td><code>boolean</code></td><td><code>false</code></td></tr>
        </tbody>
      </table>
    </div>
  );
}
