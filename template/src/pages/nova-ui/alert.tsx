import { createElement } from '@nova/runtime';
import { Alert } from '../../nova-ui/components/Alert';

export function AlertPage() {
  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Alert</h1>
      <div class="nova-demo-block" style={{ flexDirection: 'column', gap: '16px', width: '100%' }}>
        <Alert message="Info text" type="info" showIcon />
        <Alert message="Success text" type="success" showIcon closable />
        <Alert message="Warning text" type="warning" showIcon />
        <Alert message="Error text" type="error" showIcon description="Detailed error description goes here." />
      </div>
    </div>
  );
}
