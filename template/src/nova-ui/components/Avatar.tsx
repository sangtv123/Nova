import { createElement } from '@nova/runtime';
import { NovaComponentProps } from '../core/types';
import { classNames } from '../core/utils';

export interface AvatarProps extends NovaComponentProps {
  size?: 'small' | 'default' | 'large' | 'xl';
  shape?: 'circle' | 'square';
  src?: string;
}

export function Avatar(props: AvatarProps) {
  const classes = classNames(
    'n-avatar',
    props.size === 'small' && 'n-avatar--sm',
    props.size === 'large' && 'n-avatar--lg',
    props.size === 'xl' && 'n-avatar--xl',
    (!props.size || props.size === 'default') && 'n-avatar--md',
    props.shape === 'square' && 'n-avatar--square',
    props.class
  );

  return (
    <div class={classes} style={props.style}>
      {props.src ? <img src={props.src} alt="avatar" /> : props.children}
    </div>
  );
}

export interface AvatarGroupProps extends NovaComponentProps {}

export function AvatarGroup(props: AvatarGroupProps) {
  return (
    <div class={classNames('n-avatar-group', props.class)} style={props.style}>
      {props.children}
    </div>
  );
}
