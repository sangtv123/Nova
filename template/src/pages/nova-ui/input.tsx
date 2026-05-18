import { createElement } from '@nova/runtime';
import { signal } from '@nova/signals';
import { Input, Textarea } from '../../nova-ui/components/Input';

export function InputPage() {
  const text = signal('');
  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Input</h1>
      <div class="nova-demo-block" style={{ flexDirection: 'column', gap: '16px', maxWidth: '300px' }}>
        <Input placeholder="Basic input" value={text} onInput={v => text.value = v} />
        <Input placeholder="Disabled input" disabled />
        <Input placeholder="Error status" status="error" />
        <Input placeholder="Large size" size="large" />
        <Textarea placeholder="Textarea..." rows={4} />
      </div>
    </div>
  );
}
