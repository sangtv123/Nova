// Global environment definitions for TypeScript

declare module '*?inline' {
  const content: string;
  export default content;
}

declare module '*.scss?inline' {
  const content: string;
  export default content;
}

declare module '*.css?inline' {
  const content: string;
  export default content;
}

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
