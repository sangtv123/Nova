import { signal } from '@nova/signals';

interface SelectOption {
  label: string;
  value: any;
}

interface SelectProps {
  value?: any | (() => any);
  options: SelectOption[];
  onChange?: (value: any) => void;
  placeholder?: string;
  class?: string;
  style?: string;
}

export function Select(props: SelectProps) {
  const isOpen = signal(false);
  const getValue = () => typeof props.value === 'function' ? props.value() : props.value;
  
  const customClass = props.class ? ` ${props.class}` : '';

  function handleSelect(val: any) {
    if (props.onChange) {
      props.onChange(val);
    }
    isOpen.value = false;
  }

  return (
    <div class={`n-select${customClass}`} style={props.style}>
      <div class="n-select-selector" onClick={() => { isOpen.value = !isOpen.value; }}>
        <span class="n-select-value">
          {() => {
            const val = getValue();
            const option = props.options.find(o => o.value === val);
            return option ? option.label : props.placeholder || 'Select...';
          }}
        </span>
        <span class="n-select-arrow">▾</span>
      </div>
      
      {() => isOpen.value && (
        <div class="n-select-dropdown">
          {props.options.map(option => (
            <div
              class={() => {
                const isSelected = getValue() === option.value;
                return `n-select-option${isSelected ? ' n-select-option--selected' : ''}`;
              }}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
