import { createElement } from '@nova/runtime';
import { NovaComponentProps } from '../core/types';
import { classNames } from '../core/utils';

export interface BadgeProps extends NovaComponentProps {
  count?: number | string;
  dot?: boolean;
  status?: 'success' | 'warning' | 'error' | 'processing' | 'default';
}

export function Badge(props: BadgeProps) {
  const classes = classNames(
    props.children ? 'n-badge' : 'n-badge-standalone',
    props.status && props.status !== 'default' && `n-badge--${props.status}`,
    props.class
  );

  return (
    <div class={classes} style={props.style}>
      {props.children}
      {props.dot ? (
        <span class="n-badge-dot" aria-hidden="true"></span>
      ) : props.count !== undefined ? (
        <span class="n-badge-count">{props.count}</span>
      ) : null}
    </div>
  );
}
