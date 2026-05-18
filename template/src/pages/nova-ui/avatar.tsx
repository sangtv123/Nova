import { createElement } from '@nova/runtime';
import { Avatar, AvatarGroup } from '../../nova-ui/components/Avatar';

export function AvatarPage() {
  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Avatar</h1>
      <div class="nova-demo-block" style={{ gap: '16px', alignItems: 'center' }}>
        <Avatar size="large" style={{ background: '#1677ff' }}>U</Avatar>
        <Avatar style={{ background: '#722ed1' }}>M</Avatar>
        <Avatar size="small" style={{ background: '#52c41a' }}>S</Avatar>
        <Avatar shape="square" style={{ background: '#fa8c16' }}>SQ</Avatar>
        <AvatarGroup>
          <Avatar style={{ background: '#1677ff' }}>A</Avatar>
          <Avatar style={{ background: '#722ed1' }}>B</Avatar>
          <Avatar style={{ background: 'var(--n-border)', color: 'var(--n-text-2)' }}>+2</Avatar>
        </AvatarGroup>
      </div>
    </div>
  );
}
