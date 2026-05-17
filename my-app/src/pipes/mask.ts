import { definePipe } from '@nova/signals';

/**
 * A custom reusable mask pipe plugin
 * Masks a string by keeping a few characters on both ends and replacing the rest with a masking character.
 * Example: "0123456789" -> "012****789"
 */
export const maskPipe = definePipe({
  name: 'mask',
  transform(val: any, keepLeft: number = 3, keepRight: number = 3, maskChar: string = '*') {
    if (val == null) return '';
    const str = String(val);
    if (str.length <= keepLeft + keepRight) {
      return str;
    }
    const maskedLength = str.length - keepLeft - keepRight;
    const mask = maskChar.repeat(maskedLength);
    return str.slice(0, keepLeft) + mask + str.slice(str.length - keepRight);
  }
});
