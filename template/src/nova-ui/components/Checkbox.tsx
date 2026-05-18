interface CheckboxProps {
  checked?: boolean | (() => boolean);
  indeterminate?: boolean | (() => boolean);
  disabled?: boolean | (() => boolean);
  onChange?: (checked: boolean) => void;
  children?: any;
  class?: string;
  style?: string;
}

export function Checkbox(props: CheckboxProps) {
  const getChecked = () => typeof props.checked === 'function' ? props.checked() : !!props.checked;
  const getIndeterminate = () => typeof props.indeterminate === 'function' ? props.indeterminate() : !!props.indeterminate;
  const getDisabled = () => typeof props.disabled === 'function' ? props.disabled() : !!props.disabled;

  const customClass = props.class ? ` ${props.class}` : '';

  function handleClick() {
    if (getDisabled()) return;
    if (props.onChange) {
      props.onChange(!getChecked());
    }
  }

  return (
    <label
      class={() => {
        const checkedClass = getChecked() ? ' n-checkbox--checked' : '';
        const indeterClass = getIndeterminate() ? ' n-checkbox--indeterminate' : '';
        const disabledClass = getDisabled() ? ' n-checkbox--disabled' : '';
        return `n-checkbox${checkedClass}${indeterClass}${disabledClass}${customClass}`;
      }}
      style={props.style}
      onClick={handleClick}
    >
      <span class="n-checkbox-inner"></span>
      {props.children && <span>{props.children}</span>}
    </label>
  );
}
