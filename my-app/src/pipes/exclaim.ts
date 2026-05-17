import { definePipe, createPipe } from '@nova/signals';

export const exclaim = createPipe((val: any, suffix: string = '!!! 🌟') => {
  return val == null ? '' : `${val} ${suffix}`;
});

export const exclaimPipe = definePipe({
  name: 'exclaim',
  transform(val: any, suffix: string = '!!! 🌟') {
    return val == null ? '' : `${val} ${suffix}`;
  }
});
