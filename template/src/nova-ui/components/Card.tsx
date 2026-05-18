import { createElement } from '@nova/runtime';
import { NovaComponentProps } from '../core/types';
import { classNames } from '../core/utils';

export interface CardProps extends NovaComponentProps {
  title?: any;
  extra?: any;
  cover?: any;
  actions?: any[];
}

export function Card(props: CardProps) {
  const classes = classNames('n-card', props.class);

  return (
    <div class={classes} style={props.style}>
      {props.cover && <div class="n-card-cover">{props.cover}</div>}
      {(props.title || props.extra) && (
        <div class="n-card-head">
          {props.title && <div class="n-card-head-title">{props.title}</div>}
          {props.extra && <div class="n-card-head-extra">{props.extra}</div>}
        </div>
      )}
      <div class="n-card-body">{props.children}</div>
      {props.actions && props.actions.length > 0 && (
        <div class="n-card-actions">
          {props.actions.map(action => (
            <div>{action}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface CardMetaProps extends NovaComponentProps {
  avatar?: any;
  title?: any;
  description?: any;
}

export function CardMeta(props: CardMetaProps) {
  const classes = classNames('n-card-meta', props.class);

  return (
    <div class={classes} style={props.style}>
      {props.avatar && <div class="n-avatar n-avatar--md">{props.avatar}</div>}
      <div class="n-card-meta-detail">
        {props.title && <div class="n-card-meta-title">{props.title}</div>}
        {props.description && <div class="n-card-meta-description">{props.description}</div>}
      </div>
    </div>
  );
}
