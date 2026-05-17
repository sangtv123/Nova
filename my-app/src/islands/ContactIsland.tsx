import { registerIsland } from '@nova/islands';
import { useForm, Validators } from '@nova/forms';
import { onMount, onUnmount, onHydrated } from '@nova/runtime';
import styles from './ContactIsland.scss?inline';

export function ContactIsland() {
  // ── State ──────────────────────────────────────────────────────────────────
  const form = useForm(
    { name: '', email: '', subject: '', message: '', agreeTerms: false },
    {
      name: [
        Validators.required('Vui lòng nhập tên của bạn'),
        Validators.minLength(2, 'Tên phải chứa ít nhất 2 ký tự')
      ],
      email: [
        Validators.required('Vui lòng nhập email'),
        Validators.email('Địa chỉ email không hợp lệ')
      ],
      subject: [
        Validators.required('Vui lòng chọn chủ đề liên hệ')
      ],
      message: [
        Validators.required('Vui lòng nhập nội dung tin nhắn'),
        Validators.minLength(10, 'Nội dung tin nhắn tối thiểu 10 ký tự')
      ],
      agreeTerms: [
        Validators.requiredTrue('Bạn cần đồng ý với các điều khoản và chính sách')
      ]
    }
  );

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  onMount(() => {
    console.log('[ContactIsland] Component logic initialized');
  });

  onHydrated(() => {
    console.log('[ContactIsland] Island fully hydrated and interactive');
    document.getElementById('contact-name-input')?.focus();
  });

  onUnmount(() => {
    console.log('[ContactIsland] Component being destroyed');
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const onSubmit = form.handleSubmit(async (values: any) => {
    console.log('Sending data:', values);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    window.dispatchEvent(
      new CustomEvent('nova:toast', {
        detail: {
          message: `Cảm ơn ${values.name}! Tin nhắn của bạn đã được gửi thành công.`,
          type: 'success',
        },
      })
    );
    
    // Đặt lại form sau khi gửi thành công
    form.reset();
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div class="interactive-island contact-form-custom" data-island="contact">
      <style>{styles}</style>
      <h3>Liên hệ với chúng tôi</h3>

      <form onSubmit={onSubmit}>
        <div class="form-group">
          <label for="contact-name-input">Họ và tên</label>
          <input
            id="contact-name-input"
            type="text"
            placeholder="Ví dụ: Nguyễn Văn A"
            value={form.register('name').value}
            onInput={form.register('name').onInput}
            onBlur={form.register('name').onBlur}
          />
          {() => form.controls.name.isTouched.value && form.errors.name.value && (
            <span class="error">{form.errors.name.value}</span>
          )}
        </div>

        <div class="form-group">
          <label for="contact-email-input">Email</label>
          <input
            id="contact-email-input"
            type="email"
            placeholder="example@gmail.com"
            value={form.register('email').value}
            onInput={form.register('email').onInput}
            onBlur={form.register('email').onBlur}
          />
          {() => form.controls.email.isTouched.value && form.errors.email.value && (
            <span class="error">{form.errors.email.value}</span>
          )}
        </div>

        <div class="form-group">
          <label for="contact-subject-input">Chủ đề</label>
          <select
            id="contact-subject-input"
            value={form.register('subject').value}
            onInput={form.register('subject').onInput}
            onBlur={form.register('subject').onBlur}
          >
            <option value="">-- Chọn chủ đề --</option>
            <option value="Hỗ trợ kỹ thuật">Hỗ trợ kỹ thuật</option>
            <option value="Hợp tác kinh doanh">Hợp tác kinh doanh</option>
            <option value="Góp ý sản phẩm">Góp ý sản phẩm</option>
          </select>
          {() => form.controls.subject.isTouched.value && form.errors.subject.value && (
            <span class="error">{form.errors.subject.value}</span>
          )}
        </div>

        <div class="form-group">
          <label for="contact-message-input">Nội dung tin nhắn</label>
          <textarea
            id="contact-message-input"
            placeholder="Nhập nội dung cần liên hệ..."
            rows="4"
            value={form.register('message').value}
            onInput={form.register('message').onInput}
            onBlur={form.register('message').onBlur}
          />
          {() => form.controls.message.isTouched.value && form.errors.message.value && (
            <span class="error">{form.errors.message.value}</span>
          )}
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={form.register('agreeTerms').value}
              onInput={form.register('agreeTerms').onInput}
              onBlur={form.register('agreeTerms').onBlur}
            />
            Tôi đồng ý với điều khoản dịch vụ và chính sách bảo mật
          </label>
          {() => form.controls.agreeTerms.isTouched.value && form.errors.agreeTerms.value && (
            <span class="error">{form.errors.agreeTerms.value}</span>
          )}
        </div>

        <div class="button-group">
          <button 
            type="submit" 
            class={() => `btn primary ${form.isSubmitting.value ? 'submitting' : ''}`}
            disabled={() => form.isSubmitting.value}
          >
            {() => (form.isSubmitting.value ? 'Đang gửi…' : 'Gửi Tin Nhắn')}
          </button>
          <button 
            type="button" 
            class="btn secondary" 
            onClick={() => form.reset()}
            disabled={() => form.isSubmitting.value}
          >
            Đặt lại
          </button>
        </div>
      </form>
    </div>
  );
}

registerIsland('contact', ContactIsland);
