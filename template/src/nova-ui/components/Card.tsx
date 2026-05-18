interface CardProps {
  title?: any;
  extra?: any;
  cover?: any;
  actions?: any[];
  children?: any;
  class?: string;
  style?: string;
}

export function Card(props: CardProps) {
  const customClass = props.class ? ` ${props.class}` : '';
  const classes = `n-card${customClass}`;

  return (
    <div class={classes} style={props.style}>
      {props.cover && (
        <div class="n-card-cover">{props.cover}</div>
      )}
      {(props.title || props.extra) && (
        <div class="n-card-head">
          {props.title && <div class="n-card-head-title">{props.title}</div>}
          {props.extra && <div class="n-card-head-extra">{props.extra}</div>}
        </div>
      )}
      <div class="n-card-body">
        {props.children}
      </div>
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

interface CardMetaProps {
  avatar?: any;
  title?: any;
  description?: any;
  class?: string;
  style?: string;
}

export function CardMeta(props: CardMetaProps) {
  const customClass = props.class ? ` ${props.class}` : '';
  const classes = `n-card-meta${customClass}`;

  return (
    <div class={classes} style={props.style}>
      {props.avatar && (
        <div class="n-avatar n-avatar--md">{props.avatar}</div>
      )}
      <div class="n-card-meta-detail">
        {props.title && <div class="n-card-meta-title">{props.title}</div>}
        {props.description && <div class="n-card-meta-description">{props.description}</div>}
      </div>
    </div>
  );
}
