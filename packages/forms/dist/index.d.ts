import { Signal } from '@nova/signals';
export type Validator<T> = (value: T) => string | null | boolean;
export interface ValidationRule<T> {
    name: string;
    validate: Validator<T>;
    message?: string;
}
export interface FormControl<T> {
    value: Signal<T>;
    error: Signal<string | null>;
    isDirty: Signal<boolean>;
    isTouched: Signal<boolean>;
    isValid: Signal<boolean>;
    validate: () => boolean;
}
/**
 * Built-in validators
 */
export declare const Validators: {
    required: (msg?: string) => ValidationRule<any>;
    email: (msg?: string) => ValidationRule<string>;
    minLength: (min: number, msg?: string) => ValidationRule<string>;
};
/**
 * useForm Hook - Enhanced version for Giai đoạn 3
 */
export declare function useForm<T extends Record<string, any>>(initialValues: T, schema?: Partial<Record<keyof T, ValidationRule<any>[]>>): {
    controls: Record<keyof T, FormControl<any>>;
    isSubmitting: Signal<boolean>;
    isFormValid: Signal<boolean>;
    handleSubmit: (callback: (values: T) => Promise<void> | void) => (e: Event) => Promise<void>;
    register: (key: keyof T) => {
        value: () => any;
        onInput: (e: any) => void;
        onBlur: () => void;
    };
    reset: () => void;
    values: Record<keyof T, Signal<any>>;
    errors: Record<keyof T, Signal<string | null>>;
};
//# sourceMappingURL=index.d.ts.map