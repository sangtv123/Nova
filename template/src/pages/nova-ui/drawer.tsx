import { createElement } from '@nova/runtime';
import { signal } from '@nova/signals';
import { Drawer } from '../../nova-ui/components/Drawer';
import { Button } from '../../nova-ui/components/Button';

export function DrawerPage() {
  const visible = signal(false);
  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Drawer</h1>
      <div class="nova-demo-block">
        <Button type="primary" onClick={() => visible.value = true}>Open Drawer</Button>
        <Drawer visible={visible} title="Basic Drawer" placement="right" onClose={() => visible.value = false}>
          <p>Some contents...</p>
          <p>Some contents...</p>
          <p>Some contents...</p>
        </Drawer>
      </div>
    </div>
  );
}
