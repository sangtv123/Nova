import { signal } from '@nova/signals';
import { Input } from '../../nova-ui/components/Input';
import { Checkbox } from '../../nova-ui/components/Checkbox';
import { Radio, RadioGroup } from '../../nova-ui/components/Radio';
import { Switch } from '../../nova-ui/components/Switch';
import { Select } from '../../nova-ui/components/Select';

export function DataEntryPage() {
  const checked = signal(false);
  const radio = signal('a');
  const switched = signal(true);
  const selected = signal('1');

  const options = [
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' },
    { label: 'Option 3', value: '3' },
  ];

  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Data Entry</h1>
      <p class="nova-ui-page-desc">Input, Select, Checkbox, Radio, Switch.</p>
      
      <div style="width:100%;max-width:400px;gap:var(--n-lg);display:flex;flex-direction:column">
        {/* Input */}
        <div>
          <h3 style="margin-bottom:var(--n-sm)">Input</h3>
          <Input placeholder="Basic input" style="width:100%" />
        </div>

        {/* Select */}
        <div>
          <h3 style="margin-bottom:var(--n-sm)">Select</h3>
          <Select
            value={() => selected.value}
            options={options}
            onChange={(v) => { selected.value = v; }}
            style="width:100%"
          />
        </div>
        
        {/* Checkbox */}
        <div>
          <h3 style="margin-bottom:var(--n-sm)">Checkbox</h3>
          <Checkbox checked={() => checked.value} onChange={(v) => { checked.value = v; }}>
            {() => checked.value ? 'Checked' : 'Unchecked'}
          </Checkbox>
        </div>

        {/* Radio */}
        <div>
          <h3 style="margin-bottom:var(--n-sm)">Radio</h3>
          <RadioGroup value={() => radio.value}>
            <Radio value="a" checked={() => radio.value === 'a'} onChange={(v) => { radio.value = v; }}>Option A</Radio>
            <Radio value="b" checked={() => radio.value === 'b'} onChange={(v) => { radio.value = v; }}>Option B</Radio>
          </RadioGroup>
        </div>

        {/* Switch */}
        <div>
          <h3 style="margin-bottom:var(--n-sm)">Switch</h3>
          <div style="display:flex;align-items:center;gap:8px">
            <Switch checked={() => switched.value} onChange={(v) => { switched.value = v; }} />
            <span>{() => switched.value ? 'ON' : 'OFF'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
