import { signal } from '@nova/signals';

interface TagProps {
  type?: 'primary' | 'success' | 'warning' | 'error' | 'processing' | 'default';
  closable?: boolean;
  onClose?: () => void;
  checkable?: boolean;
  checked?: boolean | (() => boolean);
  onChange?: (checked: boolean) => void;
  class?: string;
  style?: string;
  children?: any;
}

export function Tag(props: TagProps) {
  const visible = signal(true);
  const typeClass = props.type && props.type !== 'default' ? ` n-tag--${props.type}` : '';
  const checkableClass = props.checkable ? ' n-tag--checkable' : '';
  
  const getChecked = () => typeof props.checked === 'function' ? props.checked() : !!props.checked;
  
  const checkedClass = () => (props.checkable && getChecked()) ? ' n-tag--checkable--checked' : '';
  const customClass = props.class ? ` ${props.class}` : '';

  function handleClose(e: MouseEvent) {
    e.stopPropagation();
    visible.value = false;
    if (props.onClose) props.onClose();
  }

  function handleClick() {
    if (props.checkable && props.onChange) {
      const currentChecked = getChecked();
      props.onChange(!currentChecked);
    }
  }

  return (
    <span
      class={() => `n-tag${typeClass}${checkableClass}${checkedClass()}${customClass}${visible.value ? '' : ' n-hidden'}`}
      style={props.style}
      onClick={handleClick}
    >
      {props.children}
      {props.closable && (
        <span class="n-tag-close" onClick={handleClose}>✕</span>
      )}
    </span>
  );
}
