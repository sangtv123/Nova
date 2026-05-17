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
  isValidating: Signal<boolean>;
  validate: () => Promise<boolean>;
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
 * useForm Hook - Final Giai đoạn 3 Version
 */
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  schema: Partial<Record<keyof T, (ValidationRule<any> | Validator<any>)[] | (ValidationRule<any> | Validator<any>)>> = {}
) {
  const controls = {} as Record<keyof T, FormControl<any>>;
  const isSubmitting = signal(false);
  const isValidating = signal(false);

  for (const key in initialValues) {
    const s = signal(initialValues[key]);
    const error = signal<string | null>(null);
    const isDirty = signal(false);
    const isTouched = signal(false);
    const isValid = signal(true);
    const controlValidating = signal(false);

    const validate = async () => {
      const rules = schema[key];
      if (rules) {
        controlValidating.value = true;
        isValidating.value = true;
        try {
          const rulesArray = Array.isArray(rules) ? rules : [rules];
          for (const rule of rulesArray) {
            // Support both ValidationRule objects and simple Validator functions
            const validateFn = typeof rule === 'function' ? rule : rule.validate;
            const result = await validateFn(s.value);
            
            if (result && typeof result === 'string') {
              error.value = result;
              isValid.value = false;
              return false;
            } else if (result === false) {
              error.value = 'Invalid value';
              isValid.value = false;
              return false;
            }
          }
        } finally {
          controlValidating.value = false;
          isValidating.value = Object.values(controls).some(c => c.isValidating.value);
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
      isValidating: controlValidating,
      validate
    };
  }

  const isFormValid = computed(() => {
    return Object.values(controls).every(c => c.isValid.value);
  });

  const handleSubmit = (callback: (values: T) => Promise<void> | void) => {
    return async (e: Event) => {
      e.preventDefault();
      
      isSubmitting.value = true;
      try {
        // Run all validations in parallel
        const results = await Promise.all(Object.values(controls).map(c => c.validate()));
        const allValid = results.every(r => r === true);
        
        if (allValid) {
          const values = {} as T;
          for (const key in controls) {
            values[key] = controls[key].value.value;
          }
          await callback(values);
        }
      } finally {
        isSubmitting.value = false;
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
        // Debounced or immediate validation can be chosen here
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
    isValidating,
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
