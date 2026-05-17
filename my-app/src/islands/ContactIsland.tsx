import { registerIsland } from '@nova/islands';
import { useForm } from '@nova/forms';
import { onMount, onUnmount, onHydrated } from '@nova/runtime';
import styles from './ContactIsland.scss?inline';

export function ContactIsland() {
  // ── State ──────────────────────────────────────────────────────────────────
  const form = useForm(
    { name: '', email: '', message: '' },
    {
      name: (v: string) => v.length >= 2 || 'Name must be at least 2 characters',
      email: (v: string) => v.includes('@') || 'Invalid email address',
      message: (v: string) => v.length >= 10 || 'Message is too short',
    }
  );

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  onMount(() => {
    console.log('[ContactIsland] Component logic initialized');
  });

  onHydrated(() => {
    console.log('[ContactIsland] Island fully hydrated and interactive');
    // Scope focus to the specific input via ID — avoids global querySelector fragility
    document.getElementById('contact-name-input')?.focus();
  });

  onUnmount(() => {
    console.log('[ContactIsland] Component being destroyed');
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const onSubmit = form.handleSubmit(async (values: any) => {
    console.log('Sending data:', values);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // Use the app-wide toast system instead of blocking alert()
    window.dispatchEvent(
      new CustomEvent('nova:toast', {
        detail: {
          message: `Thank you ${values.name}! Your message has been sent.`,
          type: 'success',
        },
      })
    );
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div class="interactive-island contact-form-custom" data-island="contact">
      <style>{styles}</style>
      <h3>
        Send us a message
      </h3>

      <form onSubmit={onSubmit}>
        <div class="form-group">
          <label for="contact-name-input">Your Name</label>
          <input
            id="contact-name-input"
            type="text"
            placeholder="John Doe"
            value={form.register('name').value}
            onInput={form.register('name').onInput}
          />
          {() => form.errors.name.value && <span class="error">{form.errors.name.value}</span>}
        </div>

        <div class="form-group">
          <label for="contact-email-input">Email</label>
          <input
            id="contact-email-input"
            type="email"
            placeholder="example@gmail.com"
            value={form.register('email').value}
            onInput={form.register('email').onInput}
          />
          {() => form.errors.email.value && <span class="error">{form.errors.email.value}</span>}
        </div>

        <div class="form-group">
          <label for="contact-message-input">Message</label>
          <textarea
            id="contact-message-input"
            placeholder="Write something..."
            value={form.register('message').value}
            onInput={form.register('message').onInput}
          />
          {() => form.errors.message.value && <span class="error">{form.errors.message.value}</span>}
        </div>

        <button 
          type="submit" 
          class={() => `btn primary ${form.isSubmitting.value ? 'submitting' : ''}`}
          disabled={() => form.isSubmitting.value}
        >
          {() => (form.isSubmitting.value ? 'Sending…' : 'Send Now')}
        </button>
      </form>
    </div>
  );
}

registerIsland('contact', ContactIsland);
