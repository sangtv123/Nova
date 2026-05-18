interface BadgeProps {
  count?: number | string;
  dot?: boolean;
  status?: 'success' | 'warning' | 'error' | 'processing' | 'default';
  children?: any;
  class?: string;
  style?: string;
}

export function Badge(props: BadgeProps) {
  const statusClass = props.status && props.status !== 'default' ? ` n-badge--${props.status}` : '';
  const customClass = props.class ? ` ${props.class}` : '';

  if (!props.children) {
    return (
      <span class={`n-badge-standalone${statusClass}${customClass}`} style={props.style}>
        {props.count}
      </span>
    );
  }

  return (
    <div class={`n-badge${statusClass}${customClass}`} style={props.style}>
      {props.children}
      {props.dot ? (
        <span class="n-badge-dot"></span>
      ) : props.count !== undefined ? (
        <span class="n-badge-count">{props.count}</span>
      ) : null}
    </div>
  );
}
