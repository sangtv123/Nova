import { signal, computed, effect } from '@nova/signals';

// 1. Initialize State
const count = signal(0);
const step = signal(1);

// 2. Derived State
const doubled = computed(() => count.value * 2);
const quadrupled = computed(() => doubled.value * 2);

// 3. Bind to DOM elements
const countEl = document.getElementById('val-count');
const doubledEl = document.getElementById('val-doubled');
const quadrupledEl = document.getElementById('val-quadrupled');

// Create effects to update DOM whenever signals change
// This demonstrates fine-grained reactivity! Only the exact DOM node updates.
effect(() => {
  countEl.textContent = count.value;
});

effect(() => {
  doubledEl.textContent = doubled.value;
});

effect(() => {
  quadrupledEl.textContent = quadrupled.value;
});

// 4. Bind Events
document.getElementById('input-step').addEventListener('input', (e) => {
  const val = parseInt(e.target.value);
  if (!isNaN(val)) step.value = val;
});

document.getElementById('btn-add').addEventListener('click', () => {
  count.value += step.value;
});

document.getElementById('btn-sub').addEventListener('click', () => {
  count.value -= step.value;
});

document.getElementById('btn-reset').addEventListener('click', () => {
  count.value = 0;
});

document.getElementById('btn-random').addEventListener('click', () => {
  count.value = Math.floor(Math.random() * 100);
});

console.log('✅ Nova Signals successfully initialized in browser!');
