import { signal, domEffect } from '@nova/signals';
import { createElement } from '@nova/runtime';
import { NovaFormElementProps } from '../core/types';
import { classNames, resolveSignal } from '../core/utils';
import { useId } from '../hooks/useId';

export interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
}

export interface SelectProps extends NovaFormElementProps<any> {
  options: SelectOption[];
  placeholder?: string;
  showSearch?: boolean;
}

export function Select(props: SelectProps) {
  const id = props.id || useId('n-select');
  const isOpen = signal(false);
  
  const getValue = () => resolveSignal(props.value) ?? props.defaultValue;
  const getDisabled = () => resolveSignal(props.disabled) ?? false;

  const handleSelect = (val: any, disabled?: boolean) => {
    if (disabled) return;
    if (props.onChange) props.onChange(val);
    isOpen.value = false;
  };

  const toggleOpen = () => {
    if (getDisabled()) return;
    isOpen.value = !isOpen.value;
  };

  if (typeof window !== 'undefined') {
    domEffect(() => {
      const handler = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest(`#${id}`)) isOpen.value = false;
      };
      if (isOpen.value) document.addEventListener('click', handler);
      else document.removeEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    });
  }

  const classes = classNames(
    'n-select',
    props.class,
    () => isOpen.value ? 'n-select--open' : '',
    () => getDisabled() ? 'n-select--disabled' : ''
  );

  return (
    <div id={id} class={classes} style={props.style} role="combobox" aria-expanded={() => isOpen.value}>
      <div class="n-select-selector" onClick={toggleOpen} aria-controls={`${id}-popup`}>
        <span class="n-select-value">
          {() => {
            const val = getValue();
            const option = props.options.find(o => o.value === val);
            return option ? option.label : props.placeholder || 'Select...';
          }}
        </span>
        <span class="n-select-arrow" aria-hidden="true">▼</span>
      </div>
      
      {() => isOpen.value && (
        <div id={`${id}-popup`} class="n-select-dropdown" role="listbox">
          {props.options.map(option => (
            <div
              role="option"
              aria-selected={() => getValue() === option.value}
              class={() => classNames(
                'n-select-option',
                getValue() === option.value ? 'n-select-option--selected' : '',
                option.disabled ? 'n-select-option--disabled' : ''
              )}
              onClick={(e: MouseEvent) => { e.stopPropagation(); handleSelect(option.value, option.disabled); }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
