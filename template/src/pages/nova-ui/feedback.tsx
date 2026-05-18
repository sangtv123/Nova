import { signal } from '@nova/signals';
import { Alert } from '../../nova-ui/components/Alert';
import { Button } from '../../nova-ui/components/Button';
import { Modal } from '../../nova-ui/components/Modal';
import { Drawer } from '../../nova-ui/components/Drawer';
import { Input } from '../../nova-ui/components/Input';

export function FeedbackPage() {
  const showModal = signal(false);
  const showDrawer = signal(false);
  const progress = signal(65);

  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Feedback</h1>
      <p class="nova-ui-page-desc">Alert, Modal, Drawer, Notification, Message, Skeleton, Spin, Progress.</p>

      {/* Alert */}
      <div class="nova-section">
        <h2 class="nova-section-title">Alert</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="width:100%;gap:var(--n-sm)">
            <Alert type="info" message="Info — This is an informational alert." showIcon />
            <Alert type="success" message="Success — Operation completed successfully." showIcon />
            <Alert type="warning" message="Warning" description="This action may have consequences. Please review before proceeding." showIcon closable />
            <Alert type="error" message="Error — Something went wrong. Please try again." showIcon />
          </div>
        </div>
      </div>

      {/* Progress */}
      <div class="nova-section">
        <h2 class="nova-section-title">Progress</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="width:100%;gap:var(--n-lg)">
            <div class="n-progress">
              <div class="n-progress-outer">
                <div class="n-progress-inner"><div class="n-progress-bg" style={() => ({ width: `${progress.value}%` })}></div></div>
                <span class="n-progress-info">{() => `${progress.value}%`}</span>
              </div>
            </div>
            <div class="n-progress">
              <div class="n-progress-outer">
                <div class="n-progress-inner"><div class="n-progress-bg n-progress-bg--success" style="width:100%"></div></div>
                <span class="n-progress-info" style="color:var(--n-success)">✓</span>
              </div>
            </div>
            <div class="n-progress">
              <div class="n-progress-outer">
                <div class="n-progress-inner n-progress-inner--lg"><div class="n-progress-bg n-progress-bg--striped" style="width:78%"></div></div>
                <span class="n-progress-info">78%</span>
              </div>
            </div>
            <div style="display:inline-flex;gap:var(--n-sm);flex-wrap:wrap">
              <Button size="small" onClick={() => { progress.value = Math.max(0, progress.value - 10); }}>−10%</Button>
              <Button type="primary" size="small" onClick={() => { progress.value = Math.min(100, progress.value + 10); }}>+10%</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Spin */}
      <div class="nova-section">
        <h2 class="nova-section-title">Spin</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview" style="gap:var(--n-3xl)">
            <div class="n-spin n-spin--sm"><div class="n-spin-dot"></div></div>
            <div class="n-spin"><div class="n-spin-dot"></div></div>
            <div class="n-spin n-spin--lg"><div class="n-spin-dot"></div></div>
            <div class="n-spin"><div class="n-spin-dot"></div><span class="n-spin-text">Loading...</span></div>
          </div>
        </div>
      </div>

      {/* Skeleton */}
      <div class="nova-section">
        <h2 class="nova-section-title">Skeleton</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="width:100%">
            <div style="display:flex;gap:var(--n-md);width:100%">
              <div class="n-skeleton n-skeleton-element n-skeleton-avatar"></div>
              <div style="flex:1">
                <div class="n-skeleton n-skeleton-element n-skeleton-title"></div>
                <div class="n-skeleton-paragraph">
                  <p class="n-skeleton-element"></p>
                  <p class="n-skeleton-element"></p>
                  <p class="n-skeleton-element"></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <div class="nova-section">
        <h2 class="nova-section-title">Modal</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview">
            <Button type="primary" onClick={() => { showModal.value = true; }}>Open Modal</Button>
          </div>
        </div>
      </div>
      
      <Modal
        visible={() => showModal.value}
        title="Confirm Action"
        onCancel={() => { showModal.value = false; }}
        onOk={() => { showModal.value = false; }}
      >
        <p>Are you sure you want to perform this action? This cannot be undone.</p>
        <Alert type="warning" message="This action is irreversible." showIcon style="margin-top:var(--n-md)" />
      </Modal>

      {/* Drawer */}
      <div class="nova-section">
        <h2 class="nova-section-title">Drawer</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview">
            <Button onClick={() => { showDrawer.value = true; }}>Open Drawer</Button>
          </div>
        </div>
      </div>
      
      <Drawer
        visible={() => showDrawer.value}
        title="Drawer Title"
        onClose={() => { showDrawer.value = false; }}
        footer={
          <div style="display:flex;justify-content:flex-end;gap:var(--n-sm)">
            <Button onClick={() => { showDrawer.value = false; }}>Cancel</Button>
            <Button type="primary">Submit</Button>
          </div>
        }
      >
        <p>This is drawer content. You can put any content here.</p>
        <div style="margin-top:var(--n-lg)">
          <div class="n-form-item">
            <label class="n-form-item-label n-form-item-label--required">Name</label>
            <div class="n-form-item-control">
              <Input placeholder="Enter name" style="width:100%" />
            </div>
          </div>
          <div class="n-form-item">
            <label class="n-form-item-label">Email</label>
            <div class="n-form-item-control">
              <Input placeholder="Enter email" style="width:100%" />
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
