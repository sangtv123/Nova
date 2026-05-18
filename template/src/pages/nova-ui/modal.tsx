import { createElement } from '@nova/runtime';
import { signal } from '@nova/signals';
import { Modal } from '../../nova-ui/components/Modal';
import { Button } from '../../nova-ui/components/Button';

export function ModalPage() {
  const visible = signal(false);
  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Modal</h1>
      <div class="nova-demo-block">
        <Button type="primary" onClick={() => visible.value = true}>Open Modal</Button>
        <Modal visible={visible} title="Basic Modal" onCancel={() => visible.value = false} onOk={() => visible.value = false}>
          <p>Some contents...</p>
          <p>Some contents...</p>
          <p>Some contents...</p>
        </Modal>
      </div>
    </div>
  );
}
