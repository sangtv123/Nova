import { registerIsland } from '@nova/islands';
import { useForm } from '@nova/forms';

export function ContactIsland() {
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

      <style>{`
        .contact-form {
          margin-top: 2rem;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .form-group {
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group label {
          font-size: 0.9rem;
          color: #aaa;
        }
        .form-group input, .form-group textarea {
          padding: 0.8rem;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: white;
          outline: none;
        }
        .form-group input:focus {
          border-color: #4a90e2;
        }
        .error {
          color: #ff4d4f;
          font-size: 0.8rem;
        }
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

registerIsland('contact', ContactIsland);
