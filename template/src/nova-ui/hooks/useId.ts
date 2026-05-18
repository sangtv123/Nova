let idCounter = 0;

/**
 * Generates a unique, SSR-safe ID for accessibility purposes (ARIA attributes).
 */
export function useId(prefix: string = 'nova'): string {
  idCounter++;
  return `${prefix}-${idCounter}`;
}
