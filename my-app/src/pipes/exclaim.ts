import { definePipe } from '@nova/signals';

/**
 * A custom reusable exclaim pipe plugin
 */
export const exclaimPipe = definePipe({
  name: 'exclaim',
  transform(val: any, suffix: string = '!!! 🌟') {
    return val == null ? '' : `${val} ${suffix}`;
  }
});
