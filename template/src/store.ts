import { defineStore } from '@nova/store';

export interface CounterState {
  count: number;
  userName: string;
  isActive: boolean;
  doubleCount?: number; // Optional getter mapping
}

export const useCounterStore = defineStore('counter', {
  state: (): CounterState => ({
    count: 42,
    userName: 'Nova Developer',
    isActive: true
  }),
  getters: {
    doubleCount: (state: CounterState) => state.count * 2
  },
  actions: {
    increment(this: CounterState) {
      this.count++;
    },
    decrement(this: CounterState) {
      this.count--;
    },
    updateUserName(this: CounterState, newName: string) {
      this.userName = newName;
    },
    toggleActive(this: CounterState) {
      this.isActive = !this.isActive;
    }
  },
  persist: true // Automatically persist to localStorage!
});
export type CounterStoreInstance = CounterState & {
  increment(): void;
  decrement(): void;
  updateUserName(name: string): void;
  toggleActive(): void;
};
