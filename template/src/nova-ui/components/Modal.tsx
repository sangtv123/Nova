import { createElement, onMount, onCleanup } from '@nova/runtime';
import { effect } from '@nova/signals';
import { motion } from '@nova/motion';
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

// Helper to query all focusable child elements for the focus trap
function getFocusableElements(el: HTMLElement): HTMLElement[] {
  return Array.from(
    el.querySelectorAll(
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
    )
  ) as HTMLElement[];
}

// Hardware-accelerated CSS transition keyframes via GPU composite layer
const maskMotion = motion({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease: 'ease-out' }
});

const dialogMotion = motion({
  initial: { opacity: 0, scale: 0.95, y: -20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -20 },
  transition: { duration: 0.2, ease: 'ease-out' }
});

export function Modal(props: ModalProps) {
  const getVisible = () => resolveSignal(props.visible) ?? false;
  const id = props.id || useId('n-modal');
  const titleId = `${id}-title`;

  const handleMaskClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget && props.maskClosable !== false && props.onCancel) {
      props.onCancel();
    }
  };

  const modalClasses = classNames('n-modal', props.class);

  // Store the active element to restore focus when the modal closes
  let previouslyFocusedElement: HTMLElement | null = null;

  // Reactively track visibility changes to manage focus trap state
  effect(() => {
    const isVisible = getVisible();
    if (isVisible) {
      if (typeof document !== 'undefined') {
        previouslyFocusedElement = document.activeElement as HTMLElement;
        
        // Let the DOM mount, then autofocus the first interactive element
        setTimeout(() => {
          const modalEl = document.getElementById(id);
          if (modalEl) {
            const focusables = getFocusableElements(modalEl);
            if (focusables.length > 0) {
              focusables[0].focus();
            } else {
              modalEl.focus();
            }
          }
        }, 30);
      }
    } else {
      if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
        previouslyFocusedElement.focus();
        previouslyFocusedElement = null;
      }
    }
  });

  // Handle keyboard events: Escape to dismiss, Tab key trap
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!getVisible()) return;

    if (e.key === 'Escape') {
      if (props.onCancel) {
        props.onCancel();
      }
      return;
    }

    if (e.key === 'Tab') {
      const modalEl = document.getElementById(id);
      if (!modalEl) return;

      const focusables = getFocusableElements(modalEl);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        // Shift + Tab: trap backwards
        if (active === first || !modalEl.contains(active)) {
          last.focus();
          e.preventDefault();
        }
      } else {
        // Tab: trap forwards
        if (active === last || !modalEl.contains(active)) {
          first.focus();
          e.preventDefault();
        }
      }
    }
  };

  onMount(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
    }
  });

  onCleanup(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeyDown);
    }
  });

  return (
    <div class="n-modal-container" style={{ display: 'contents' }}>
      {() => {
        if (!getVisible()) return null;

        return (
          <div 
            class="n-modal-mask" 
            ref={maskMotion} 
            onClick={handleMaskClick} 
            role="dialog" 
            aria-modal="true" 
            tabindex="-1"
            id={id}
            aria-labelledby={props.title ? titleId : undefined}
          >
            <div 
              class={modalClasses} 
              ref={dialogMotion}
              style={(() => {
                const styleObj: any = typeof props.style === 'object' ? { ...props.style } : {};
                if (props.width) {
                  styleObj.width = typeof props.width === 'number' ? `${props.width}px` : props.width;
                  styleObj.maxWidth = 'calc(100vw - 32px)';
                }
                return styleObj;
              })()} 
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
      }}
    </div>
  );
}
