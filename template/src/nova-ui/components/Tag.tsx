import { signal } from '@nova/signals';
import { createElement } from '@nova/runtime';
import { NovaComponentProps, SignalOrValue } from '../core/types';
import { classNames, resolveSignal } from '../core/utils';

export interface TagProps extends NovaComponentProps {
  type?: 'primary' | 'success' | 'warning' | 'error' | 'processing' | 'default';
  closable?: boolean;
  onClose?: () => void;
  checkable?: boolean;
  checked?: SignalOrValue<boolean>;
  onChange?: (checked: boolean) => void;
}

export function Tag(props: TagProps) {
  const visible = signal(true);
  const getChecked = () => resolveSignal(props.checked) ?? false;

  const handleClose = (e: MouseEvent) => {
    e.stopPropagation();
    visible.value = false;
    if (props.onClose) props.onClose();
  };

  const handleClick = () => {
    if (props.checkable && props.onChange) {
      props.onChange(!getChecked());
    }
  };

  const classes = classNames(
    'n-tag',
    props.type && props.type !== 'default' && `n-tag--${props.type}`,
    props.checkable && 'n-tag--checkable',
    props.class,
    () => (props.checkable && getChecked()) ? 'n-tag--checkable--checked' : '',
    () => !visible.value ? 'n-hidden' : ''
  );

  return (
    <span class={classes} style={props.style} onClick={handleClick}>
      {props.children}
      {props.closable && <span class="n-tag-close" onClick={handleClose}>✕</span>}
    </span>
  );
}
