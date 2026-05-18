import { createElement } from '@nova/runtime';
import { signal } from '@nova/signals';
import { Radio, RadioGroup, RadioButton } from '../../nova-ui/components/Radio';

export function RadioPage() {
  const radioVal = signal('a');
  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Radio</h1>
      <div class="nova-demo-block" style={{ flexDirection: 'column', gap: '16px' }}>
        <RadioGroup>
          <Radio value="a" checked={() => radioVal.value === 'a'} onChange={v => radioVal.value = v}>Option A</Radio>
          <Radio value="b" checked={() => radioVal.value === 'b'} onChange={v => radioVal.value = v}>Option B</Radio>
          <Radio disabled>Disabled</Radio>
        </RadioGroup>
        <RadioGroup type="button">
          <RadioButton value="a" checked={() => radioVal.value === 'a'} onChange={v => radioVal.value = v}>Option A</RadioButton>
          <RadioButton value="b" checked={() => radioVal.value === 'b'} onChange={v => radioVal.value = v}>Option B</RadioButton>
        </RadioGroup>
      </div>
    </div>
  );
}
