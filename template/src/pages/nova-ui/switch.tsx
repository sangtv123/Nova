import { createElement } from '@nova/runtime';
import { signal } from '@nova/signals';
import { Switch } from '../../nova-ui/components/Switch';

export function SwitchPage() {
  const s = signal(true);
  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Switch</h1>
      <div class="nova-demo-block" style={{ gap: '16px' }}>
        <Switch checked={s} onChange={v => s.value = v} />
        <Switch checked={s} size="small" />
        <Switch disabled />
        <Switch checked disabled />
      </div>
    </div>
  );
}
