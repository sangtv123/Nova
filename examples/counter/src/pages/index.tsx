import { signal, computed, effect } from '@nova/signals';

/**
 * Counter component - demonstrates signals reactivity
 */
export default function Counter() {
  const count = signal(0);
  const step = signal(1);
  
  // Derived value
  const doubled = computed(() => count.value * 2);
  const quadrupled = computed(() => doubled.value * 2);
  
  // Side effect
  effect(() => {
    console.log(`Count changed to: ${count.value}`);
  });

  return (
    <div style={{
      maxWidth: '400px',
      margin: '50px auto',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <h1>Counter App</h1>
      
      <div style={{
        padding: '20px',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        marginBottom: '20px',
      }}>
        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
          Count: {count.value}
        </p>
        <p style={{ color: '#666' }}>
          Doubled: {doubled.value}
        </p>
        <p style={{ color: '#666' }}>
          Quadrupled: {quadrupled.value}
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>
          Step:
          <input
            type="number"
            value={step.value}
            onChange={(e) => step.value = parseInt(e.target.value)}
            style={{ marginLeft: '10px' }}
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => count.value += step.value}
          style={buttonStyle}
        >
          +{step.value}
        </button>
        
        <button
          onClick={() => count.value -= step.value}
          style={buttonStyle}
        >
          -{step.value}
        </button>
        
        <button
          onClick={() => count.value = 0}
          style={buttonStyle}
        >
          Reset
        </button>

        <button
          onClick={() => count.value = Math.floor(Math.random() * 100)}
          style={buttonStyle}
        >
          Random
        </button>
      </div>

      <p style={{
        marginTop: '20px',
        fontSize: '12px',
        color: '#999',
      }}>
        This example demonstrates Nova's signals-based reactivity.
        All updates are fine-grained and efficient.
      </p>
    </div>
  );
}

const buttonStyle = {
  padding: '8px 16px',
  backgroundColor: '#0066cc',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold',
  transition: 'background-color 0.2s',
};
