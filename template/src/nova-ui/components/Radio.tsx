interface RadioProps {
  checked?: boolean | (() => boolean);
  disabled?: boolean | (() => boolean);
  value?: any;
  onChange?: (value: any) => void;
  children?: any;
  class?: string;
  style?: string;
}

export function Radio(props: RadioProps) {
  const getChecked = () => typeof props.checked === 'function' ? props.checked() : !!props.checked;
  const getDisabled = () => typeof props.disabled === 'function' ? props.disabled() : !!props.disabled;

  const customClass = props.class ? ` ${props.class}` : '';

  function handleClick() {
    if (getDisabled() || getChecked()) return;
    if (props.onChange) {
      props.onChange(props.value);
    }
  }

  return (
    <label
      class={() => {
        const checkedClass = getChecked() ? ' n-radio--checked' : '';
        const disabledClass = getDisabled() ? ' n-radio--disabled' : '';
        return `n-radio${checkedClass}${disabledClass}${customClass}`;
      }}
      style={props.style}
      onClick={handleClick}
    >
      <span class="n-radio-inner"></span>
      {props.children && <span>{props.children}</span>}
    </label>
  );
}

interface RadioGroupProps {
  value?: any | (() => any);
  onChange?: (value: any) => void;
  children?: any;
  class?: string;
  style?: string;
  type?: 'default' | 'button';
}

export function RadioGroup(props: RadioGroupProps) {
  const customClass = props.class ? ` ${props.class}` : '';
  const groupClass = props.type === 'button' ? 'n-radio-button-group' : 'n-radio-group';

  return (
    <div class={`${groupClass}${customClass}`} style={props.style}>
      {props.children}
    </div>
  );
}

export function RadioButton(props: RadioProps) {
  const getChecked = () => typeof props.checked === 'function' ? props.checked() : !!props.checked;
  const getDisabled = () => typeof props.disabled === 'function' ? props.disabled() : !!props.disabled;

  const customClass = props.class ? ` ${props.class}` : '';

  function handleClick() {
    if (getDisabled() || getChecked()) return;
    if (props.onChange) {
      props.onChange(props.value);
    }
  }

  return (
    <div
      class={() => {
        const checkedClass = getChecked() ? ' n-radio-button--checked' : '';
        const disabledClass = getDisabled() ? ' n-radio-button--disabled' : '';
        return `n-radio-button${checkedClass}${disabledClass}${customClass}`;
      }}
      style={props.style}
      onClick={handleClick}
    >
      {props.children}
    </div>
  );
}
