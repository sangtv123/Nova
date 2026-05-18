interface AvatarProps {
  size?: 'small' | 'default' | 'large' | 'xl';
  shape?: 'circle' | 'square';
  src?: string;
  children?: any;
  class?: string;
  style?: string;
}

export function Avatar(props: AvatarProps) {
  const sizeClass = props.size === 'small' ? ' n-avatar--sm' : 
                    props.size === 'large' ? ' n-avatar--lg' : 
                    props.size === 'xl' ? ' n-avatar--xl' : ' n-avatar--md'; // default is md in styles
  const shapeClass = props.shape === 'square' ? ' n-avatar--square' : '';
  const customClass = props.class ? ` ${props.class}` : '';

  const classes = `n-avatar${sizeClass}${shapeClass}${customClass}`;

  return (
    <div class={classes} style={props.style}>
      {props.src ? (
        <img src={props.src} alt="avatar" />
      ) : (
        props.children
      )}
    </div>
  );
}

interface AvatarGroupProps {
  children?: any;
  class?: string;
  style?: string;
}

export function AvatarGroup(props: AvatarGroupProps) {
  const customClass = props.class ? ` ${props.class}` : '';
  return (
    <div class={`n-avatar-group${customClass}`} style={props.style}>
      {props.children}
    </div>
  );
}
