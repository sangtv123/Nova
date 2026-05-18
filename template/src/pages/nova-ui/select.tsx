import { createElement } from '@nova/runtime';
import { signal } from '@nova/signals';
import { Select } from '../../nova-ui/components/Select';

export function SelectPage() {
  const sel = signal('1');
  const opts = [
    { label: 'Apple', value: '1' },
    { label: 'Banana', value: '2' },
    { label: 'Cherry (Disabled)', value: '3', disabled: true }
  ];
  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Select</h1>
      <div class="nova-demo-block" style={{ flexDirection: 'column', gap: '16px', maxWidth: '300px' }}>
        <Select options={opts} value={sel} onChange={v => sel.value = v} placeholder="Select fruit" />
        <Select options={opts} disabled placeholder="Disabled select" />
      </div>
    </div>
  );
}
