import { createElement } from '@nova/runtime';
import { NovaComponentProps, SignalOrValue } from '../core/types';
import { classNames, resolveSignal } from '../core/utils';
import { useId } from '../hooks/useId';

export interface DrawerProps extends NovaComponentProps {
  visible?: SignalOrValue<boolean>;
  title?: any;
  placement?: 'left' | 'right' | 'top' | 'bottom';
  footer?: any;
  onClose?: () => void;
  maskClosable?: boolean;
}

export function Drawer(props: DrawerProps) {
  const getVisible = () => resolveSignal(props.visible) ?? false;
  const placement = props.placement || 'right';
  const id = props.id || useId('n-drawer');
  const titleId = `${id}-title`;

  const handleMaskClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget && props.maskClosable !== false && props.onClose) {
      props.onClose();
    }
  };

  const maskClasses = classNames(
    'n-drawer-mask',
    () => !getVisible() ? 'n-hidden' : ''
  );

  const drawerClasses = classNames(
    'n-drawer',
    `n-drawer--${placement}`,
    props.class,
    () => getVisible() ? 'n-drawer--open' : ''
  );

  return (
    <div class={maskClasses} onClick={handleMaskClick} role="dialog" aria-modal="true" aria-labelledby={props.title ? titleId : undefined}>
      <div class={drawerClasses} style={props.style} onClick={(e: MouseEvent) => e.stopPropagation()}>
        <div class="n-drawer-header">
          {props.title && <div id={titleId} class="n-modal-title">{props.title}</div>}
          <button class="n-modal-close" onClick={props.onClose} aria-label="Close">✕</button>
        </div>
        <div class="n-drawer-body">{props.children}</div>
        {props.footer && <div class="n-drawer-footer">{props.footer}</div>}
      </div>
    </div>
  );
}
