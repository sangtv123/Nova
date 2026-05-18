import { Button } from './Button';

interface ModalProps {
  visible?: boolean | (() => boolean);
  title?: any;
  children?: any;
  footer?: any;
  onCancel?: () => void;
  onOk?: () => void;
  class?: string;
  style?: string;
}

export function Modal(props: ModalProps) {
  const getVisible = () => typeof props.visible === 'function' ? props.visible() : !!props.visible;
  const customClass = props.class ? ` ${props.class}` : '';

  function handleMaskClick(e: MouseEvent) {
    if (e.target === e.currentTarget && props.onCancel) {
      props.onCancel();
    }
  }

  return (
    <div class={() => `n-modal-mask${getVisible() ? '' : ' n-hidden'}`} onClick={handleMaskClick}>
      <div class={`n-modal${customClass}`} style={props.style} onClick={(e: MouseEvent) => e.stopPropagation()}>
        <div class="n-modal-header">
          {props.title && <div class="n-modal-title">{props.title}</div>}
          <button class="n-modal-close" onClick={props.onCancel}>✕</button>
        </div>
        <div class="n-modal-body">
          {props.children}
        </div>
        <div class="n-modal-footer">
          {props.footer !== undefined ? props.footer : [
            <Button onClick={props.onCancel}>Cancel</Button>,
            <Button type="primary" onClick={props.onOk}>OK</Button>
          ]}
        </div>
      </div>
    </div>
  );
}
