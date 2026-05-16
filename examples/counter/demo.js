import { signal, computed, effect } from '@nova/signals';

console.log('--- 🚀 Nova Signals Demo ---');

// Create signals
const count = signal(0);
const step = signal(1);

// Derived values
const doubled = computed(() => count.value * 2);
const quadrupled = computed(() => doubled.value * 2);

// Side effects
effect(() => {
  console.log(`[Effect] Count changed to: ${count.value} (Doubled: ${doubled.value}, Quadrupled: ${quadrupled.value})`);
});

console.log('\n--- Actions ---');
console.log('Adding step (1)...');
count.value += step.value;

console.log('Adding step (1)...');
count.value += step.value;

console.log('Changing step to 5...');
step.value = 5;

console.log('Adding step (5)...');
count.value += step.value;

console.log('Resetting...');
count.value = 0;

console.log('\n--- Done ---');
