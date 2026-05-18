import { createElement } from '@nova/runtime';
import { Tag } from '../../nova-ui/components/Tag';

export function TagPage() {
  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Tag</h1>
      <div class="nova-demo-block" style={{ gap: '8px', flexWrap: 'wrap' }}>
        <Tag>Default</Tag>
        <Tag type="primary">Primary</Tag>
        <Tag type="success">Success</Tag>
        <Tag type="warning">Warning</Tag>
        <Tag type="error">Error</Tag>
        <Tag type="processing">Processing</Tag>
        <Tag closable>Closable</Tag>
        <Tag checkable>Checkable</Tag>
      </div>
    </div>
  );
}
