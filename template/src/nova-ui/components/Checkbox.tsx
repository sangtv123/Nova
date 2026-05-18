import { createElement } from '@nova/runtime';
import { NovaFormElementProps, SignalOrValue } from '../core/types';
import { classNames, resolveSignal } from '../core/utils';

export interface CheckboxProps extends NovaFormElementProps<boolean> {
  checked?: SignalOrValue<boolean>;
  indeterminate?: SignalOrValue<boolean>;
}

export function Checkbox(props: CheckboxProps) {
  const getChecked = () => resolveSignal(props.checked) ?? false;
  const getIndeterminate = () => resolveSignal(props.indeterminate) ?? false;
  const getDisabled = () => resolveSignal(props.disabled) ?? false;

  const handleClick = (e: MouseEvent) => {
    if (getDisabled()) { e.preventDefault(); return; }
    if (props.onChange) { props.onChange(!getChecked()); }
  };

  const classes = classNames(
    'n-checkbox',
    props.class,
    () => getChecked() ? 'n-checkbox--checked' : '',
    () => getIndeterminate() ? 'n-checkbox--indeterminate' : '',
    () => getDisabled() ? 'n-checkbox--disabled' : ''
  );

  return (
    <label class={classes} style={props.style} onClick={handleClick}>
      <span class="n-checkbox-inner" aria-hidden="true"></span>
      <input type="checkbox" checked={getChecked} disabled={getDisabled} style="display:none" />
      {props.children && <span>{props.children}</span>}
    </label>
  );
}
