import { signal, Signal, computed } from '@nova/signals';

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
export const Validators = {
  required: (msg = 'This field is required'): ValidationRule<any> => ({
    name: 'required',
    validate: (val) => (val != null && val !== '' && val !== false) ? null : msg
  }),
  email: (msg = 'Invalid email address'): ValidationRule<string> => ({
    name: 'email',
    validate: (val) => (typeof val === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) ? null : msg
  }),
  minLength: (min: number, msg?: string): ValidationRule<string> => ({
    name: 'minLength',
    validate: (val) => (val != null && (typeof val === 'string' || Array.isArray(val)) && val.length >= min) ? null : (msg || `Minimum length is ${min}`)
  })
};

/**
 * useForm Hook - Enhanced version for Giai đoạn 3
 */
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  schema: Partial<Record<keyof T, ValidationRule<any>[]>> = {}
) {
  const controls = {} as Record<keyof T, FormControl<any>>;
  const isSubmitting = signal(false);

  for (const key in initialValues) {
    const s = signal(initialValues[key]);
    const error = signal<string | null>(null);
    const isDirty = signal(false);
    const isTouched = signal(false);
    const isValid = signal(true);

    const validate = () => {
      const rules = schema[key];
      if (rules) {
        for (const rule of rules) {
          const result = rule.validate(s.value);
          if (result && typeof result === 'string') {
            error.value = result;
            isValid.value = false;
            return false;
          }
        }
      }
      error.value = null;
      isValid.value = true;
      return true;
    };

    controls[key] = {
      value: s,
      error,
      isDirty,
      isTouched,
      isValid,
      validate
    };
  }

  const isFormValid = computed(() => {
    return Object.values(controls).every(c => c.isValid.value);
  });

  const handleSubmit = (callback: (values: T) => Promise<void> | void) => {
    return async (e: Event) => {
      e.preventDefault();
      
      let allValid = true;
      const values = {} as T;
      
      for (const key in controls) {
        if (!controls[key].validate()) {
          allValid = false;
        }
        values[key] = controls[key].value.value;
      }

      if (allValid) {
        isSubmitting.value = true;
        try {
          await callback(values);
        } finally {
          isSubmitting.value = false;
        }
      }
    };
  };

  const register = (key: keyof T) => {
    const control = controls[key];
    return {
      value: () => control.value.value,
      onInput: (e: any) => {
        const target = e.target;
        const val = target.type === 'checkbox' ? target.checked : target.value;
        control.value.value = val;
        control.isDirty.value = true;
        control.validate();
      },
      onBlur: () => {
        control.isTouched.value = true;
        control.validate();
      }
    };
  };

  return {
    controls,
    isSubmitting,
    isFormValid,
    handleSubmit,
    register,
    reset: () => {
      for (const key in initialValues) {
        controls[key].value.value = initialValues[key];
        controls[key].isDirty.value = false;
        controls[key].isTouched.value = false;
        controls[key].error.value = null;
      }
    },
    // Backward compatibility
    values: Object.fromEntries(Object.entries(controls).map(([k, v]) => [k, v.value])) as Record<keyof T, Signal<any>>,
    errors: Object.fromEntries(Object.entries(controls).map(([k, v]) => [k, v.error])) as Record<keyof T, Signal<string | null>>
  };
}
