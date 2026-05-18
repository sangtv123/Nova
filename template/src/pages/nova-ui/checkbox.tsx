import { createElement } from '@nova/runtime';
import { signal } from '@nova/signals';
import { Checkbox } from '../../nova-ui/components/Checkbox';

export function CheckboxPage() {
  const checked = signal(false);
  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Checkbox</h1>
      <div class="nova-demo-block">
        <Checkbox checked={checked} onChange={v => checked.value = v}>
          {() => checked.value ? 'Checked' : 'Unchecked'}
        </Checkbox>
        <Checkbox disabled>Disabled</Checkbox>
        <Checkbox checked disabled>Checked Disabled</Checkbox>
        <Checkbox indeterminate>Indeterminate</Checkbox>
      </div>
    </div>
  );
}
