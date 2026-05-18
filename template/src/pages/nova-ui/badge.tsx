import { createElement } from '@nova/runtime';
import { Badge } from '../../nova-ui/components/Badge';
import { Avatar } from '../../nova-ui/components/Avatar';

export function BadgePage() {
  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Badge</h1>
      <p class="nova-ui-page-desc">Small numerical value or status descriptor for UI elements.</p>

      <div class="nova-section">
        <h2 class="nova-section-title">Basic Usage</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview" style="gap:24px;">
            <Badge count={5}>
              <Avatar size="large" shape="square" style={{ background: '#f5f5f5' }} />
            </Badge>
            <Badge count={0}>
              <Avatar size="large" shape="square" style={{ background: '#f5f5f5' }} />
            </Badge>
          </div>
        </div>
      </div>

      <div class="nova-section">
        <h2 class="nova-section-title">Standalone & Status</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview" style="gap:24px; align-items: center;">
            <Badge count={25} />
            <Badge count={4} status="success" />
            <Badge count={109} status="error" />
            
            <Badge dot status="processing">
              <span style={{ fontSize: '14px' }}>Processing</span>
            </Badge>
            <Badge dot status="warning">
              <span style={{ fontSize: '14px' }}>Warning</span>
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
