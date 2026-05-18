interface ButtonProps {
  type?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
  size?: 'small' | 'default' | 'large';
  danger?: boolean;
  ghost?: boolean;
  loading?: boolean | (() => boolean);
  shape?: 'circle' | 'round';
  block?: boolean;
  disabled?: boolean | (() => boolean);
  onClick?: (e: MouseEvent) => void;
  children?: any;
  class?: string;
  style?: string;
}

export function Button(props: ButtonProps) {
  const typeClass = props.type && props.type !== 'default' ? ` n-btn--${props.type}` : '';
  const sizeClass = props.size === 'small' ? ' n-btn--sm' : props.size === 'large' ? ' n-btn--lg' : '';
  const dangerClass = props.danger ? ' n-btn--danger' : '';
  const ghostClass = props.ghost ? ' n-btn--ghost' : '';
  const shapeClass = props.shape ? ` n-btn--${props.shape}` : '';
  const blockClass = props.block ? ' n-btn--block' : '';
  const customClass = props.class ? ` ${props.class}` : '';

  const getLoading = () => typeof props.loading === 'function' ? props.loading() : !!props.loading;
  const getDisabled = () => typeof props.disabled === 'function' ? props.disabled() : !!props.disabled;

  return (
    <button
      class={() => {
        const loadingClass = getLoading() ? ' n-btn--loading' : '';
        return `n-btn${typeClass}${sizeClass}${dangerClass}${ghostClass}${loadingClass}${shapeClass}${blockClass}${customClass}`;
      }}
      style={props.style}
      disabled={() => getDisabled() || getLoading()}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}
