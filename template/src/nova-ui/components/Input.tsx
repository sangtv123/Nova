interface InputProps {
  value?: string | (() => string);
  placeholder?: string;
  disabled?: boolean | (() => boolean);
  error?: boolean | (() => boolean);
  prefix?: any;
  suffix?: any;
  onInput?: (e: Event) => void;
  onChange?: (e: Event) => void;
  class?: string;
  style?: string;
  type?: string;
}

export function Input(props: InputProps) {
  const getValue = () => typeof props.value === 'function' ? props.value() : props.value || '';
  const getDisabled = () => typeof props.disabled === 'function' ? props.disabled() : !!props.disabled;
  const getError = () => typeof props.error === 'function' ? props.error() : !!props.error;

  const customClass = props.class ? ` ${props.class}` : '';
  
  return (
    <div class={() => {
      const errorClass = getError() ? ' n-input-wrapper--error' : '';
      const disabledClass = getDisabled() ? ' n-input-wrapper--disabled' : '';
      return `n-input-wrapper${errorClass}${disabledClass}${customClass}`;
    }} style={props.style}>
      {props.prefix && <span class="n-input-prefix">{props.prefix}</span>}
      <input
        type={props.type || 'text'}
        class="n-input"
        placeholder={props.placeholder}
        value={getValue}
        disabled={getDisabled}
        onInput={props.onInput}
        onChange={props.onChange}
      />
      {props.suffix && <span class="n-input-suffix">{props.suffix}</span>}
    </div>
  );
}

interface TextareaProps {
  value?: string | (() => string);
  placeholder?: string;
  disabled?: boolean | (() => boolean);
  error?: boolean | (() => boolean);
  onInput?: (e: Event) => void;
  onChange?: (e: Event) => void;
  class?: string;
  style?: string;
  rows?: number;
}

export function Textarea(props: TextareaProps) {
  const getValue = () => typeof props.value === 'function' ? props.value() : props.value || '';
  const getDisabled = () => typeof props.disabled === 'function' ? props.disabled() : !!props.disabled;
  const getError = () => typeof props.error === 'function' ? props.error() : !!props.error;

  const customClass = props.class ? ` ${props.class}` : '';

  return (
    <textarea
      class={() => {
        const errorClass = getError() ? ' n-input--error' : '';
        return `n-textarea${errorClass}${customClass}`;
      }}
      style={props.style}
      placeholder={props.placeholder}
      value={getValue}
      disabled={getDisabled}
      onInput={props.onInput}
      onChange={props.onChange}
      rows={props.rows}
    />
  );
}
