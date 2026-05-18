interface DrawerProps {
  visible?: boolean | (() => boolean);
  title?: any;
  placement?: 'left' | 'right' | 'top' | 'bottom';
  children?: any;
  footer?: any;
  onClose?: () => void;
  class?: string;
  style?: string;
}

export function Drawer(props: DrawerProps) {
  const getVisible = () => typeof props.visible === 'function' ? props.visible() : !!props.visible;
  const placement = props.placement || 'right';
  const customClass = props.class ? ` ${props.class}` : '';

  return (
    <div class={() => `n-drawer-mask${getVisible() ? '' : ' n-hidden'}`} onClick={props.onClose}>
      <div class={() => {
        const openClass = getVisible() ? ' n-drawer--open' : ''; // Assuming we need this or styles handle it via mask
        return `n-drawer n-drawer--${placement}${openClass}${customClass}`;
      }} style={props.style} onClick={(e: MouseEvent) => e.stopPropagation()}>
        <div class="n-drawer-header">
          {props.title && <div class="n-modal-title">{props.title}</div>}
          <button class="n-modal-close" onClick={props.onClose}>✕</button>
        </div>
        <div class="n-drawer-body">
          {props.children}
        </div>
        {props.footer && (
          <div class="n-drawer-footer">
            {props.footer}
          </div>
        )}
      </div>
    </div>
  );
}
