import { createElement } from '@nova/runtime';
import { NovaFormElementProps, SignalOrValue } from '../core/types';
import { classNames, resolveSignal } from '../core/utils';

export interface RadioProps extends NovaFormElementProps<any> {
  checked?: SignalOrValue<boolean>;
}

export function Radio(props: RadioProps) {
  const getChecked = () => resolveSignal(props.checked) ?? false;
  const getDisabled = () => resolveSignal(props.disabled) ?? false;

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    if (getDisabled() || getChecked()) return;
    if (props.onChange) props.onChange(props.value);
  };

  const classes = classNames(
    'n-radio',
    props.class,
    () => getChecked() ? 'n-radio--checked' : '',
    () => getDisabled() ? 'n-radio--disabled' : ''
  );

  return (
    <label class={classes} style={props.style} onClick={handleClick}>
      <span class="n-radio-inner" aria-hidden="true"></span>
      <input type="radio" checked={getChecked} disabled={getDisabled} style={{ display: 'none' }} value={props.value} />
      {props.children && <span>{props.children}</span>}
    </label>
  );
}

export interface RadioGroupProps extends NovaFormElementProps<any> {
  type?: 'default' | 'button';
}

export function RadioGroup(props: RadioGroupProps) {
  const groupClass = props.type === 'button' ? 'n-radio-button-group' : 'n-radio-group';
  return (
    <div class={classNames(groupClass, props.class)} style={props.style} role="radiogroup">
      {props.children}
    </div>
  );
}

export function RadioButton(props: RadioProps) {
  const getChecked = () => resolveSignal(props.checked) ?? false;
  const getDisabled = () => resolveSignal(props.disabled) ?? false;

  const handleClick = () => {
    if (getDisabled() || getChecked()) return;
    if (props.onChange) props.onChange(props.value);
  };

  const classes = classNames(
    'n-radio-button',
    props.class,
    () => getChecked() ? 'n-radio-button--checked' : '',
    () => getDisabled() ? 'n-radio-button--disabled' : ''
  );

  return (
    <div class={classes} style={props.style} onClick={handleClick} role="radio" aria-checked={getChecked}>
      {props.children}
    </div>
  );
}
