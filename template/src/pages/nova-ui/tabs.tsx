import { signal } from '@nova/signals';
import { createElement, Fragment } from '@nova/runtime';
import { Tabs, TabPane } from '../../nova-ui/components/Tabs';
import { Button } from '../../nova-ui/components/Button';

export function TabsPage() {
  const activeKey = signal('1');
  const position = signal<'top' | 'right' | 'bottom' | 'left'>('top');

  const dynamicTabs = signal([
    { key: '1', title: 'Tab 1', content: 'Content of Tab 1' },
    { key: '2', title: 'Tab 2', content: 'Content of Tab 2' },
  ]);

  const addTab = () => {
    const newKey = String(dynamicTabs.value.length + 1);
    dynamicTabs.value = [
      ...dynamicTabs.value,
      { key: newKey, title: `Tab ${newKey}`, content: `New Tab Content ${newKey}` }
    ];
  };

  const removeTab = (targetKey: string) => {
    dynamicTabs.value = dynamicTabs.value.filter(t => t.key !== targetKey);
  };

  const onEdit = (action: 'add' | 'remove', key?: string) => {
    if (action === 'add') addTab();
    else if (action === 'remove' && key) removeTab(key);
  };

  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Tabs</h1>
      <p class="nova-ui-page-desc">Tabs make it easy to explore and switch between different views.</p>

      {/* Basic */}
      <div class="nova-section">
        <h2 class="nova-section-title">Basic Usage</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview">
            <Tabs defaultActiveKey="1">
              <TabPane key="1" title="Tab 1">
                <div style="padding: 16px 0">Content of Tab Pane 1</div>
              </TabPane>
              <TabPane key="2" title="Tab 2">
                <div style="padding: 16px 0">Content of Tab Pane 2</div>
              </TabPane>
              <TabPane key="3" title="Tab 3" disabled>
                <div style="padding: 16px 0">Content of Tab Pane 3</div>
              </TabPane>
            </Tabs>
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">Default activate first tab, and disabled tab example.</span>
          </div>
        </div>
      </div>

      {/* Position */}
      <div class="nova-section">
        <h2 class="nova-section-title">Position</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="gap: 24px">
            <div style="display:flex;gap:8px;margin-bottom:16px;">
              <Button onClick={() => position.value = 'top'}>Top</Button>
              <Button onClick={() => position.value = 'bottom'}>Bottom</Button>
              <Button onClick={() => position.value = 'left'}>Left</Button>
              <Button onClick={() => position.value = 'right'}>Right</Button>
            </div>
            <div style="height: 200px; width: 100%">
              <Tabs position={() => position.value} defaultActiveKey="1">
                <TabPane key="1" title="Tab 1">Content of Tab 1</TabPane>
                <TabPane key="2" title="Tab 2">Content of Tab 2</TabPane>
                <TabPane key="3" title="Tab 3">Content of Tab 3</TabPane>
              </Tabs>
            </div>
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">Tabs can be positioned at top, bottom, left, or right.</span>
          </div>
        </div>
      </div>

      {/* Card & Editable */}
      <div class="nova-section">
        <h2 class="nova-section-title">Editable Card Tabs</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview">
            <Tabs 
              type="editable-card" 
              items={() => dynamicTabs.value}
              onEdit={onEdit}
            />
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">Config-driven tabs supporting dynamic add/remove.</span>
          </div>
        </div>
      </div>

      {/* API Table */}
      <table class="nova-api-table">
        <thead>
          <tr><th>Prop</th><th>Description</th><th>Type</th><th>Default</th></tr>
        </thead>
        <tbody>
          <tr><td><code>activeKey</code></td><td>Current active tab's key</td><td><code>string | signal</code></td><td>—</td></tr>
          <tr><td><code>type</code></td><td>Basic style of tabs</td><td><code>'line' | 'card' | 'editable-card'</code></td><td><code>'line'</code></td></tr>
          <tr><td><code>position</code></td><td>Position of tabs</td><td><code>'top' | 'right' | 'bottom' | 'left'</code></td><td><code>'top'</code></td></tr>
          <tr><td><code>items</code></td><td>Data-driven array of tab configs</td><td><code>TabPaneProps[]</code></td><td>—</td></tr>
          <tr><td><code>onChange</code></td><td>Callback executed when active tab changes</td><td><code>(key: string) =&gt; void</code></td><td>—</td></tr>
          <tr><td><code>onEdit</code></td><td>Callback executed when tab is added/removed</td><td><code>(action, key) =&gt; void</code></td><td>—</td></tr>
          <tr><td><code>lazy</code></td><td>Lazy load tab content</td><td><code>boolean</code></td><td><code>true</code></td></tr>
          <tr><td><code>destroyInactive</code></td><td>Destroy DOM of inactive tabs</td><td><code>boolean</code></td><td><code>false</code></td></tr>
        </tbody>
      </table>
    </div>
  );
}
