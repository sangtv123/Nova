/**
 * Nova UI - Core Type Definitions
 * Enterprise-grade standardized types for all components.
 */

export type SignalOrValue<T> = T | (() => T);

export interface NovaComponentProps {
  /** Custom class name */
  class?: string | (() => string);
  /** Inline styles */
  style?: string | Record<string, string | number> | (() => Record<string, string | number>);
  /** Component unique ID */
  id?: string;
  /** Children elements */
  children?: any;
}

export interface NovaFormElementProps<T = any> extends NovaComponentProps {
  /** Form control name */
  name?: string;
  /** Value of the control */
  value?: SignalOrValue<T>;
  /** Default value for uncontrolled usage */
  defaultValue?: T;
  /** Disabled state */
  disabled?: SignalOrValue<boolean>;
  /** Read-only state */
  readonly?: SignalOrValue<boolean>;
  /** Value change handler */
  onChange?: (val: T) => void;
  /** Focus handler */
  onFocus?: (e: FocusEvent) => void;
  /** Blur handler */
  onBlur?: (e: FocusEvent) => void;
}

export type SizeType = 'small' | 'default' | 'large';
export type StatusType = 'success' | 'warning' | 'error' | 'validating' | '';
