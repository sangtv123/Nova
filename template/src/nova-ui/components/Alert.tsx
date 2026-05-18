import { signal } from '@nova/signals';
import { createElement } from '@nova/runtime';
import { NovaComponentProps } from '../core/types';
import { classNames } from '../core/utils';

export interface AlertProps extends NovaComponentProps {
  type?: 'success' | 'info' | 'warning' | 'error';
  message: any;
  description?: any;
  showIcon?: boolean;
  closable?: boolean;
  onClose?: () => void;
}

export function Alert(props: AlertProps) {
  const visible = signal(true);
  const type = props.type || 'info';

  const defaultIcons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };

  const handleClose = () => {
    visible.value = false;
    if (props.onClose) props.onClose();
  };

  const classes = classNames(
    'n-alert',
    `n-alert--${type}`,
    props.description && 'n-alert--with-desc',
    props.class,
    () => !visible.value ? 'n-hidden' : ''
  );

  return (
    <div class={classes} style={props.style} role="alert">
      {props.showIcon && <span class="n-alert-icon" aria-hidden="true">{defaultIcons[type]}</span>}
      <div class="n-alert-content">
        <div class="n-alert-message">{props.message}</div>
        {props.description && <div class="n-alert-description">{props.description}</div>}
      </div>
      {props.closable && <span class="n-alert-close" onClick={handleClose} aria-label="Close">✕</span>}
    </div>
  );
}
