import { defineStore } from '@nova/store';

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 42,
    userName: 'Nova Developer',
    isActive: true
  }),
  getters: {
    doubleCount: (state) => state.count * 2
  },
  actions: {
    increment() {
      this.count++;
    },
    decrement() {
      this.count--;
    },
    updateUserName(newName: string) {
      this.userName = newName;
    },
    toggleActive() {
      this.isActive = !this.isActive;
    }
  },
  persist: true // Automatically persist to localStorage!
});
