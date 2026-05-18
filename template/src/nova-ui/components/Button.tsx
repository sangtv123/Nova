import { createElement, Fragment } from '@nova/runtime';
import { NovaComponentProps, SizeType, SignalOrValue } from '../core/types';
import { classNames, resolveSignal } from '../core/utils';

export interface ButtonProps extends NovaComponentProps {
  /** Button type */
  type?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
  /** Button size */
  size?: SizeType;
  /** Set the danger status of button */
  danger?: boolean;
  /** Make background transparent and invert text and border colors */
  ghost?: boolean;
  /** Set the loading status of button */
  loading?: SignalOrValue<boolean>;
  /** Can be set to circle or round */
  shape?: 'circle' | 'round';
  /** Option to fit button width to its parent width */
  block?: boolean;
  /** Disabled state of button */
  disabled?: SignalOrValue<boolean>;
  /** HTML button type */
  htmlType?: 'submit' | 'button' | 'reset';
  /** Redirect url of link button */
  href?: string;
  /** Target of link button */
  target?: string;
  /** Click handler */
  onClick?: (e: MouseEvent) => void;
  /** Custom icon component */
  icon?: any;
}

export function Button(props: ButtonProps) {
  const getLoading = () => resolveSignal(props.loading) ?? false;
  const getDisabled = () => resolveSignal(props.disabled) ?? false;

  const isLink = !!props.href;
  const type = props.type || 'default';

  const classes = classNames(
    'n-btn',
    type !== 'default' && `n-btn--${type}`,
    props.size === 'small' && 'n-btn--sm',
    props.size === 'large' && 'n-btn--lg',
    props.danger && 'n-btn--danger',
    props.ghost && 'n-btn--ghost',
    props.shape && `n-btn--${props.shape}`,
    props.block && 'n-btn--block',
    props.class,
    () => getLoading() && 'n-btn--loading'
  );

  const handleClick = (e: MouseEvent) => {
    if (getLoading() || getDisabled()) {
      e.preventDefault();
      return;
    }
    if (props.onClick) props.onClick(e);
  };

  const innerContent = (
    <>
      {() => getLoading() && <span class="n-btn-loading-icon" aria-hidden="true">⏳</span>}
      {props.icon && <span class="n-btn-icon" aria-hidden="true">{props.icon}</span>}
      {props.children && <span>{props.children}</span>}
    </>
  );

  if (isLink) {
    return (
      <a
        class={classes}
        style={props.style}
        href={props.href}
        target={props.target}
        onClick={handleClick}
        role="button"
        aria-disabled={() => getDisabled() || getLoading()}
      >
        {innerContent}
      </a>
    );
  }

  return (
    <button
      class={classes}
      style={props.style}
      type={props.htmlType || 'button'}
      disabled={() => getDisabled() || getLoading()}
      onClick={handleClick}
      aria-busy={() => getLoading()}
    >
      {innerContent}
    </button>
  );
}
