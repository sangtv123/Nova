import { createElement } from '@nova/runtime';
import { NovaFormElementProps, SizeType, SignalOrValue, StatusType } from '../core/types';
import { classNames, resolveSignal } from '../core/utils';
import { useId } from '../hooks/useId';

export interface InputProps extends NovaFormElementProps<string> {
  /** Input type (e.g. text, password, number) */
  type?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Input size */
  size?: SizeType;
  /** Validation status */
  status?: SignalOrValue<StatusType>;
  /** Error state (deprecated, use status="error") */
  error?: SignalOrValue<boolean>;
  /** Prefix icon or element */
  prefix?: any;
  /** Suffix icon or element */
  suffix?: any;
  /** Allow clear input */
  allowClear?: boolean;
  /** Native input handler */
  onInput?: (e: Event) => void;
  /** Keyboard handler */
  onKeyDown?: (e: KeyboardEvent) => void;
  /** Press enter handler */
  onPressEnter?: (e: KeyboardEvent) => void;
}

export function Input(props: InputProps) {
  const id = props.id || useId('n-input');

  const getValue = () => resolveSignal(props.value) ?? props.defaultValue ?? '';
  const getDisabled = () => resolveSignal(props.disabled) ?? false;
  const getReadonly = () => resolveSignal(props.readonly) ?? false;
  
  const getStatus = () => {
    const status = resolveSignal(props.status);
    const hasError = resolveSignal(props.error);
    return status || (hasError ? 'error' : '');
  };

  const wrapperClasses = classNames(
    'n-input-wrapper',
    props.size === 'small' && 'n-input-wrapper--sm',
    props.size === 'large' && 'n-input-wrapper--lg',
    props.class,
    () => getStatus() ? `n-input-wrapper--${getStatus()}` : '',
    () => getDisabled() ? 'n-input-wrapper--disabled' : '',
    () => getReadonly() ? 'n-input-wrapper--readonly' : ''
  );

  const handleInput = (e: Event) => {
    if (props.onInput) props.onInput(e);
    if (props.onChange) {
      const target = e.target as HTMLInputElement;
      props.onChange(target.value);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (props.onKeyDown) props.onKeyDown(e);
    if (e.key === 'Enter' && props.onPressEnter) {
      props.onPressEnter(e);
    }
  };

  return (
    <div class={wrapperClasses} style={props.style}>
      {props.prefix && <span class="n-input-prefix">{props.prefix}</span>}
      <input
        id={id}
        name={props.name}
        type={props.type || 'text'}
        class="n-input"
        placeholder={props.placeholder}
        value={getValue}
        disabled={getDisabled}
        readonly={getReadonly}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        aria-invalid={() => getStatus() === 'error'}
      />
      {props.suffix && <span class="n-input-suffix">{props.suffix}</span>}
    </div>
  );
}

export interface TextareaProps extends NovaFormElementProps<string> {
  placeholder?: string;
  rows?: number;
  status?: SignalOrValue<StatusType>;
  error?: SignalOrValue<boolean>;
  onInput?: (e: Event) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  onPressEnter?: (e: KeyboardEvent) => void;
}

export function Textarea(props: TextareaProps) {
  const id = props.id || useId('n-textarea');
  
  const getValue = () => resolveSignal(props.value) ?? props.defaultValue ?? '';
  const getDisabled = () => resolveSignal(props.disabled) ?? false;
  const getReadonly = () => resolveSignal(props.readonly) ?? false;
  
  const getStatus = () => {
    const status = resolveSignal(props.status);
    const hasError = resolveSignal(props.error);
    return status || (hasError ? 'error' : '');
  };

  const handleInput = (e: Event) => {
    if (props.onInput) props.onInput(e);
    if (props.onChange) {
      const target = e.target as HTMLTextAreaElement;
      props.onChange(target.value);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (props.onKeyDown) props.onKeyDown(e);
    if (e.key === 'Enter' && !e.shiftKey && props.onPressEnter) {
      props.onPressEnter(e);
    }
  };

  const classes = classNames(
    'n-textarea',
    props.class,
    () => getStatus() ? `n-input--${getStatus()}` : '',
    () => getDisabled() ? 'n-input--disabled' : ''
  );

  return (
    <textarea
      id={id}
      name={props.name}
      class={classes}
      style={props.style}
      placeholder={props.placeholder}
      value={getValue}
      disabled={getDisabled}
      readonly={getReadonly}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onFocus={props.onFocus}
      onBlur={props.onBlur}
      rows={props.rows || 3}
      aria-invalid={() => getStatus() === 'error'}
    />
  );
}
