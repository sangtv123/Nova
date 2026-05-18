import { createElement, onMount, onCleanup } from '@nova/runtime';
import { effect } from '@nova/signals';
import { motion } from '@nova/motion';
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

// Helper to query all focusable child elements for the focus trap
function getFocusableElements(el: HTMLElement): HTMLElement[] {
  return Array.from(
    el.querySelectorAll(
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
    )
  ) as HTMLElement[];
}

const maskMotion = motion({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25, ease: 'ease-out' }
});

const drawerMotion = (placement: 'left' | 'right' | 'top' | 'bottom') => {
  let initialTransform = '';
  if (placement === 'right') initialTransform = 'translate3d(100%, 0, 0)';
  else if (placement === 'left') initialTransform = 'translate3d(-100%, 0, 0)';
  else if (placement === 'top') initialTransform = 'translate3d(0, -100%, 0)';
  else if (placement === 'bottom') initialTransform = 'translate3d(0, 100%, 0)';

  return motion({
    initial: { transform: initialTransform, opacity: 0.5 },
    animate: { transform: 'translate3d(0, 0, 0)', opacity: 1 },
    exit: { transform: initialTransform, opacity: 0.5 },
    transition: { duration: 0.25, ease: 'ease-out' }
  });
};

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

  const drawerClasses = classNames(
    'n-drawer',
    `n-drawer--${placement}`,
    props.class
  );

  // Store the active element to restore focus when the drawer closes
  let previouslyFocusedElement: HTMLElement | null = null;

  // Reactively track visibility changes to manage focus trap state
  effect(() => {
    const isVisible = getVisible();
    if (isVisible) {
      if (typeof document !== 'undefined') {
        previouslyFocusedElement = document.activeElement as HTMLElement;
        
        // Let the DOM mount, then autofocus the first interactive element or container
        setTimeout(() => {
          const drawerEl = document.getElementById(id);
          if (drawerEl) {
            const focusables = getFocusableElements(drawerEl);
            if (focusables.length > 0) {
              focusables[0].focus();
            } else {
              drawerEl.focus();
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
      if (props.onClose) {
        props.onClose();
      }
      return;
    }

    if (e.key === 'Tab') {
      const drawerEl = document.getElementById(id);
      if (!drawerEl) return;

      const focusables = getFocusableElements(drawerEl);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        // Shift + Tab: trap backwards
        if (active === first || !drawerEl.contains(active)) {
          last.focus();
          e.preventDefault();
        }
      } else {
        // Tab: trap forwards
        if (active === last || !drawerEl.contains(active)) {
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

  const motionInstance = drawerMotion(placement);

  return (
    <div class="n-drawer-container" style={{ display: 'contents' }}>
      {() => {
        if (!getVisible()) return null;

        return (
          <div 
            class="n-drawer-mask" 
            ref={maskMotion} 
            onClick={handleMaskClick} 
            role="dialog" 
            aria-modal="true" 
            tabindex="-1"
            id={id}
            aria-labelledby={props.title ? titleId : undefined}
          >
            <div 
              class={drawerClasses} 
              ref={motionInstance}
              style={props.style} 
              onClick={(e: MouseEvent) => e.stopPropagation()}
            >
              <div class="n-drawer-header">
                {props.title && <div id={titleId} class="n-modal-title">{props.title}</div>}
                <button class="n-modal-close" onClick={props.onClose} aria-label="Close">✕</button>
              </div>
              <div class="n-drawer-body">{props.children}</div>
              {props.footer && <div class="n-drawer-footer">{props.footer}</div>}
            </div>
          </div>
        );
      }}
    </div>
  );
}
