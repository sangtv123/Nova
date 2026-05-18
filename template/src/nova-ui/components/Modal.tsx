import { createElement } from '@nova/runtime';
import { NovaComponentProps, SignalOrValue } from '../core/types';
import { classNames, resolveSignal } from '../core/utils';
import { Button } from './Button';
import { useId } from '../hooks/useId';

export interface ModalProps extends NovaComponentProps {
  visible?: SignalOrValue<boolean>;
  title?: any;
  footer?: any;
  onCancel?: () => void;
  onOk?: () => void;
  width?: number | string;
  maskClosable?: boolean;
}

export function Modal(props: ModalProps) {
  const getVisible = () => resolveSignal(props.visible) ?? false;
  const id = props.id || useId('n-modal');
  const titleId = `${id}-title`;

  const handleMaskClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget && props.maskClosable !== false && props.onCancel) {
      props.onCancel();
    }
  };

  const maskClasses = classNames(
    'n-modal-mask',
    () => !getVisible() ? 'n-hidden' : ''
  );

  const modalClasses = classNames('n-modal', props.class);

  return (
    <div class={maskClasses} onClick={handleMaskClick} role="dialog" aria-modal="true" aria-labelledby={props.title ? titleId : undefined}>
      <div 
        class={modalClasses} 
        style={() => {
          const w = props.width;
          let s = typeof props.style === 'string' ? props.style : '';
          if (w) s += `;width:${typeof w === 'number' ? w + 'px' : w};max-width:calc(100vw - 32px);`;
          return s;
        }} 
        onClick={(e: MouseEvent) => e.stopPropagation()}
      >
        <div class="n-modal-header">
          {props.title && <div id={titleId} class="n-modal-title">{props.title}</div>}
          <button class="n-modal-close" onClick={props.onCancel} aria-label="Close">✕</button>
        </div>
        <div class="n-modal-body">{props.children}</div>
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
