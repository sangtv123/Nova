import { signal } from '@nova/signals';

interface AlertProps {
  type?: 'success' | 'info' | 'warning' | 'error';
  message: any;
  description?: any;
  showIcon?: boolean;
  closable?: boolean;
  onClose?: () => void;
  class?: string;
  style?: string;
}

export function Alert(props: AlertProps) {
  const visible = signal(true);
  const type = props.type || 'info';
  
  const typeClass = ` n-alert--${type}`;
  const withDescClass = props.description ? ' n-alert--with-desc' : '';
  const customClass = props.class ? ` ${props.class}` : '';
  const classes = `n-alert${typeClass}${withDescClass}${customClass}`;

  const defaultIcons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };

  function handleClose() {
    visible.value = false;
    if (props.onClose) props.onClose();
  }

  return (
    <div class={() => `${classes}${visible.value ? '' : ' n-hidden'}`} style={props.style}>
      {props.showIcon && (
        <span class="n-alert-icon">{defaultIcons[type]}</span>
      )}
      <div class="n-alert-content">
        <div class="n-alert-message">{props.message}</div>
        {props.description && (
          <div class="n-alert-description">{props.description}</div>
        )}
      </div>
      {props.closable && (
        <span class="n-alert-close" onClick={handleClose}>✕</span>
      )}
    </div>
  );
}
