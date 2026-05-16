import { Signal } from '@nova/signals';
export type Validator<T> = (value: T) => string | null | boolean;
export interface FormControl<T> {
    value: Signal<T>;
    error: Signal<string | null>;
    isDirty: Signal<boolean>;
    validate: () => boolean;
}
/**
 * useForm Hook - The standard way to handle forms in Nova.
 */
export declare function useForm<T extends Record<string, any>>(initialValues: T, validators?: Partial<Record<keyof T, Validator<any>>>): {
    controls: Record<keyof T, FormControl<any>>;
    isSubmitting: Signal<boolean>;
    handleSubmit: (callback: (values: T) => Promise<void> | void) => (e: Event) => Promise<void>;
    register: (key: keyof T) => {
        value: () => any;
        checked: () => boolean | undefined;
        onInput: (e: any) => void;
        onChange: (e: any) => void;
    };
    values: Record<keyof T, Signal<any>>;
    errors: Record<keyof T, Signal<string | null>>;
};
//# sourceMappingURL=index.d.ts.map