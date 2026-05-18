import { createElement } from '@nova/runtime';
import { NovaFormElementProps, SignalOrValue, SizeType } from '../core/types';
import { classNames, resolveSignal } from '../core/utils';

export interface SwitchProps extends NovaFormElementProps<boolean> {
  checked?: SignalOrValue<boolean>;
  size?: SizeType;
}

export function Switch(props: SwitchProps) {
  const getChecked = () => resolveSignal(props.checked) ?? false;
  const getDisabled = () => resolveSignal(props.disabled) ?? false;

  const handleClick = () => {
    if (getDisabled()) return;
    if (props.onChange) props.onChange(!getChecked());
  };

  const classes = classNames(
    'n-switch',
    props.size === 'small' && 'n-switch--sm',
    props.class,
    () => getChecked() ? 'n-switch--checked' : '',
    () => getDisabled() ? 'n-switch--disabled' : ''
  );

  return (
    <button
      type="button"
      role="switch"
      aria-checked={getChecked}
      class={classes}
      style={props.style}
      onClick={handleClick}
      disabled={getDisabled}
    >
      <span class="n-switch-inner"></span>
    </button>
  );
}
