import { createElement } from '@nova/runtime';
import { Card, CardMeta } from '../../nova-ui/components/Card';

export function CardPage() {
  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Card</h1>
      <p class="nova-ui-page-desc">Simple rectangular container.</p>

      <div class="nova-section">
        <h2 class="nova-section-title">Basic Card</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview" style="background:#f5f5f5; padding: 30px;">
            <Card title="Default size card" extra={<a href="#">More</a>} style={{ width: '300px' }}>
              <p style={{ margin: '0 0 8px 0' }}>Card content</p>
              <p style={{ margin: '0 0 8px 0' }}>Card content</p>
              <p style={{ margin: 0 }}>Card content</p>
            </Card>
          </div>
        </div>
      </div>

      <div class="nova-section">
        <h2 class="nova-section-title">Card with Cover & Meta</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview" style="background:#f5f5f5; padding: 30px;">
            <Card
              style={{ width: '240px' }}
              cover={<div style={{ height: '120px', background: 'linear-gradient(135deg,#1677ff,#722ed1)' }}></div>}
              actions={[
                <span>👍</span>,
                <span>💬</span>,
                <span>↗</span>
              ]}
            >
              <CardMeta
                avatar={<div style={{ width: '32px', height: '32px', borderRadius: '16px', background: '#fa8c16', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>JD</div>}
                title="John Doe"
                description="Frontend Engineer"
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
