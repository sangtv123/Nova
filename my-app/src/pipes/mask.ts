import { definePipe, createPipe } from '@nova/signals';

export const mask = createPipe((val: any, keepLeft: number = 3, keepRight: number = 3, maskChar: string = '*') => {
  if (val == null) return '';
  const str = String(val);
  if (str.length <= keepLeft + keepRight) {
    return str;
  }
  const maskedLength = str.length - keepLeft - keepRight;
  const maskStr = maskChar.repeat(maskedLength);
  return str.slice(0, keepLeft) + maskStr + str.slice(str.length - keepRight);
});

export const maskPipe = definePipe({
  name: 'mask',
  transform(val: any, keepLeft: number = 3, keepRight: number = 3, maskChar: string = '*') {
    if (val == null) return '';
    const str = String(val);
    if (str.length <= keepLeft + keepRight) {
      return str;
    }
    const maskedLength = str.length - keepLeft - keepRight;
    const maskStr = maskChar.repeat(maskedLength);
    return str.slice(0, keepLeft) + maskStr + str.slice(str.length - keepRight);
  }
});
