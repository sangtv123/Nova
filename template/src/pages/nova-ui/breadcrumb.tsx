import { createElement, Fragment } from '@nova/runtime';
import { Breadcrumb, BreadcrumbItem } from '../../nova-ui/components/Breadcrumb';

export function BreadcrumbPage() {
  const menu = (
    <div style="background:var(--n-bg-container);border:1px solid var(--n-border);border-radius:var(--n-border-r);padding:4px;box-shadow:var(--n-shadow-md);min-width:120px;">
      <div class="n-breadcrumb-link n-breadcrumb-link--interactive" onClick={() => alert('Layout clicked')}>Layout</div>
      <div class="n-breadcrumb-link n-breadcrumb-link--interactive" onClick={() => alert('Navigation clicked')}>Navigation</div>
      <div class="n-breadcrumb-link n-breadcrumb-link--interactive" onClick={() => alert('Data Entry clicked')}>Data Entry</div>
    </div>
  );

  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Breadcrumb</h1>
      <p class="nova-ui-page-desc">A breadcrumb displays the current location within a hierarchy. It allows going back to states higher up in the hierarchy.</p>

      {/* Basic Breadcrumb */}
      <div class="nova-section">
        <h2 class="nova-section-title">Basic Usage</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview">
            <Breadcrumb>
              <BreadcrumbItem href="#">Home</BreadcrumbItem>
              <BreadcrumbItem href="#">Application Center</BreadcrumbItem>
              <BreadcrumbItem href="#">Application List</BreadcrumbItem>
              <BreadcrumbItem>An Application</BreadcrumbItem>
            </Breadcrumb>
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">The simplest use case using JSX children.</span>
          </div>
        </div>
      </div>

      {/* With Icons */}
      <div class="nova-section">
        <h2 class="nova-section-title">With Icons</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview">
            <Breadcrumb>
              <BreadcrumbItem href="#">🏠 Home</BreadcrumbItem>
              <BreadcrumbItem href="#">👤 User Profile</BreadcrumbItem>
              <BreadcrumbItem>⚙️ Settings</BreadcrumbItem>
            </Breadcrumb>
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">Icons can be placed within the title.</span>
          </div>
        </div>
      </div>

      {/* Custom Separator */}
      <div class="nova-section">
        <h2 class="nova-section-title">Custom Separator</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="gap:24px;">
            <Breadcrumb separator=">">
              <BreadcrumbItem href="#">Home</BreadcrumbItem>
              <BreadcrumbItem href="#">Application Center</BreadcrumbItem>
              <BreadcrumbItem href="#">Application List</BreadcrumbItem>
              <BreadcrumbItem>An Application</BreadcrumbItem>
            </Breadcrumb>
            
            <Breadcrumb separator="👉">
              <BreadcrumbItem href="#">Home</BreadcrumbItem>
              <BreadcrumbItem href="#">Application Center</BreadcrumbItem>
              <BreadcrumbItem href="#">Application List</BreadcrumbItem>
              <BreadcrumbItem>An Application</BreadcrumbItem>
            </Breadcrumb>
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">The separator can be customized via the <code>separator</code> prop.</span>
          </div>
        </div>
      </div>

      {/* Data Driven (Items Prop) */}
      <div class="nova-section">
        <h2 class="nova-section-title">Data Driven (Items Prop) & Dropdown</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview">
            <Breadcrumb
              items={[
                { title: 'Home', href: '#', icon: '🏠' },
                { title: 'Components', href: '#', menu },
                { title: 'Breadcrumb' }
              ]}
            />
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">Configure via <code>items</code> prop. Supports dropdown menus for complex navigation.</span>
          </div>
        </div>
      </div>
      
      {/* API Table */}
      <table class="nova-api-table">
        <thead>
          <tr><th>Prop</th><th>Description</th><th>Type</th><th>Default</th></tr>
        </thead>
        <tbody>
          <tr><td><code>items</code></td><td>The routing stack information of router</td><td><code>BreadcrumbItemType[]</code></td><td>—</td></tr>
          <tr><td><code>separator</code></td><td>Custom separator</td><td><code>string | Element</code></td><td><code>'/'</code></td></tr>
        </tbody>
      </table>
    </div>
  );
}
