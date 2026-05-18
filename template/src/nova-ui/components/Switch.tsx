interface SwitchProps {
  checked?: boolean | (() => boolean);
  disabled?: boolean | (() => boolean);
  size?: 'small' | 'default';
  onChange?: (checked: boolean) => void;
  class?: string;
  style?: string;
}

export function Switch(props: SwitchProps) {
  const getChecked = () => typeof props.checked === 'function' ? props.checked() : !!props.checked;
  const getDisabled = () => typeof props.disabled === 'function' ? props.disabled() : !!props.disabled;

  const sizeClass = props.size === 'small' ? ' n-switch--sm' : '';
  const customClass = props.class ? ` ${props.class}` : '';

  function handleClick() {
    if (getDisabled()) return;
    if (props.onChange) {
      props.onChange(!getChecked());
    }
  }

  return (
    <span
      class={() => {
        const checkedClass = getChecked() ? ' n-switch--checked' : '';
        const disabledClass = getDisabled() ? ' n-switch--disabled' : '';
        return `n-switch${checkedClass}${sizeClass}${disabledClass}${customClass}`;
      }}
      style={props.style}
      onClick={handleClick}
    >
    </span>
  );
}
