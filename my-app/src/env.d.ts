import '@nova/runtime';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: {
        class?: string | (() => string);
        id?: string;
        onClick?: (e: MouseEvent) => void;
        onInput?: (e: InputEvent) => void;
        [attrName: string]: any;
      };
    }
  }
}
