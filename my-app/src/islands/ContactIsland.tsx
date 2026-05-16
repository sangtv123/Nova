import { registerIsland } from '@nova/islands';
import { useForm } from '@nova/forms';

import { onMount, onUnmount, onHydrated } from '@nova/runtime';

export function ContactIsland() {
  onMount(() => {
    console.log('[ContactIsland] Component logic initialized');
  });

  onHydrated(() => {
    console.log('[ContactIsland] Island fully hydrated and interactive');
    // Example: Focus the first input
    const firstInput = document.querySelector('.contact-form input');
    if (firstInput) (firstInput as HTMLElement).focus();
  });

  onUnmount(() => {
    console.log('[ContactIsland] Component being destroyed');
  });

  const form = useForm(
    { name: '', email: '', message: '' },
    {
      name: (v) => v.length >= 2 || 'Name must be at least 2 characters',
      email: (v) => v.includes('@') || 'Invalid email address',
      message: (v) => v.length >= 10 || 'Message is too short'
    }
  );

  const onSubmit = form.handleSubmit(async (values) => {
    console.log('Sending data:', values);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    alert(`Thank you ${values.name}! Your message has been sent.`);
  });

  return (
    <div class="interactive-island contact-form" data-island="contact">
      <h3>Send us a message</h3>
      
      <form onSubmit={onSubmit}>
        <div class="form-group">
          <label>Your Name</label>
          <input 
            type="text" 
            placeholder="John Doe"
            value={form.register('name').value} 
            onInput={form.register('name').onInput}
          />
          {() => form.errors.name.value && <span class="error">{form.errors.name.value}</span>}
        </div>

        <div class="form-group">
          <label>Email</label>
          <input 
            type="email" 
            placeholder="example@gmail.com"
            value={form.register('email').value} 
            onInput={form.register('email').onInput}
          />
          {() => form.errors.email.value && <span class="error">{form.errors.email.value}</span>}
        </div>

        <div class="form-group">
          <label>Message</label>
          <textarea 
            placeholder="Write something..."
            value={form.register('message').value} 
            onInput={form.register('message').onInput}
          />
          {() => form.errors.message.value && <span class="error">{form.errors.message.value}</span>}
        </div>

        <button type="submit" class="btn primary" disabled={() => form.isSubmitting.value}>
          {() => form.isSubmitting.value ? 'Sending...' : 'Send Now'}
        </button>
      </form>
    </div>
  );
}

registerIsland('contact', ContactIsland);
