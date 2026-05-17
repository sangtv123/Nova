import { signal, Signal, computed } from '@nova/signals';

export type Validator<T> = (value: T) => string | null | boolean | Promise<string | null | boolean>;

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
  reset: () => void;
  markAsTouched: () => void;
  markAsDirty: () => void;
  setValue: (val: T, options?: { validate?: boolean; dirty?: boolean }) => void;
}

/**
 * Built-in validators covering comprehensive form use cases
 */
export const Validators = {
  required: (msg = 'This field is required'): ValidationRule<any> => ({
    name: 'required',
    validate: (val) => {
      if (val === null || val === undefined) return msg;
      if (typeof val === 'string' && val.trim() === '') return msg;
      if (Array.isArray(val) && val.length === 0) return msg;
      return null;
    }
  }),
  requiredTrue: (msg = 'This field must be checked/true'): ValidationRule<any> => ({
    name: 'requiredTrue',
    validate: (val) => val === true ? null : msg
  }),
  email: (msg = 'Invalid email address'): ValidationRule<any> => ({
    name: 'email',
    validate: (val) => {
      if (val === null || val === undefined || val === '') return null; // Optional behavior unless required
      return (typeof val === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) ? null : msg;
    }
  }),
  minLength: (min: number, msg?: string): ValidationRule<any> => ({
    name: 'minLength',
    validate: (val) => {
      if (val === null || val === undefined || val === '') return null;
      return ((typeof val === 'string' || Array.isArray(val)) && val.length >= min) ? null : (msg || `Minimum length is ${min}`);
    }
  }),
  maxLength: (max: number, msg?: string): ValidationRule<any> => ({
    name: 'maxLength',
    validate: (val) => {
      if (val === null || val === undefined || val === '') return null;
      return ((typeof val === 'string' || Array.isArray(val)) && val.length <= max) ? null : (msg || `Maximum length is ${max}`);
    }
  }),
  min: (min: number, msg?: string): ValidationRule<any> => ({
    name: 'min',
    validate: (val) => {
      if (val === null || val === undefined || val === '') return null;
      const num = Number(val);
      return (!isNaN(num) && num >= min) ? null : (msg || `Minimum value is ${min}`);
    }
  }),
  max: (max: number, msg?: string): ValidationRule<any> => ({
    name: 'max',
    validate: (val) => {
      if (val === null || val === undefined || val === '') return null;
      const num = Number(val);
      return (!isNaN(num) && num <= max) ? null : (msg || `Maximum value is ${max}`);
    }
  }),
  pattern: (regex: RegExp, msg = 'Invalid format'): ValidationRule<any> => ({
    name: 'pattern',
    validate: (val) => {
      if (val === null || val === undefined || val === '') return null;
      return (typeof val === 'string' && regex.test(val)) ? null : msg;
    }
  })
};

/**
 * useForm Hook - Robust Form Validation & Management System
 */
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  schema: Partial<Record<keyof T, (ValidationRule<any> | Validator<any>)[] | (ValidationRule<any> | Validator<any>)>> = {}
) {
  const currentInitialValues = { ...initialValues };
  const currentSchema = { ...schema } as Record<string, any>;
  const controls = {} as Record<keyof T, FormControl<any>>;
  const controlsVersion = signal(0); // Bumped on structure change
  const isSubmitting = signal(false);
  const isValidating = signal(false);

  const createControl = (key: string, initialVal: any): FormControl<any> => {
    const s = signal(initialVal);
    const error = signal<string | null>(null);
    const isDirty = signal(false);
    const isTouched = signal(false);
    const isValid = signal(true);
    const controlValidating = signal(false);

    const validate = async (): Promise<boolean> => {
      const rules = currentSchema[key];
      if (rules) {
        controlValidating.value = true;
        isValidating.value = true;
        try {
          const rulesArray = Array.isArray(rules) ? rules : [rules];
          for (const rule of rulesArray) {
            if (!rule) continue;
            const validateFn = typeof rule === 'function' ? rule : rule.validate;
            if (typeof validateFn !== 'function') continue;
            const result = await validateFn(s.value);
            
            if (result && typeof result === 'string') {
              error.value = result;
              isValid.value = false;
              return false;
            } else if (result === false) {
              error.value = typeof rule === 'object' && rule.message ? rule.message : 'Invalid value';
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

    const reset = () => {
      s.value = key in currentInitialValues ? currentInitialValues[key] : initialVal;
      isDirty.value = false;
      isTouched.value = false;
      error.value = null;
      isValid.value = true;
      controlValidating.value = false;
    };

    const markAsTouched = () => {
      isTouched.value = true;
      validate();
    };

    const markAsDirty = () => {
      isDirty.value = true;
    };

    const setValue = (val: any, options: { validate?: boolean; dirty?: boolean } = {}) => {
      s.value = val;
      if (options.dirty !== false) isDirty.value = true;
      if (options.validate !== false) validate();
    };

    return {
      value: s,
      error,
      isDirty,
      isTouched,
      isValid,
      isValidating: controlValidating,
      validate,
      reset,
      markAsTouched,
      markAsDirty,
      setValue
    };
  };

  for (const key in currentInitialValues) {
    controls[key] = createControl(key, currentInitialValues[key]);
  }

  // Dynamic values and errors objects kept in sync with controls
  const values = {} as Record<keyof T, Signal<any>>;
  const errors = {} as Record<keyof T, Signal<string | null>>;

  const syncValuesAndErrors = () => {
    for (const key of Object.keys(values)) {
      if (!(key in controls)) {
        delete (values as any)[key];
        delete (errors as any)[key];
      }
    }
    for (const key in controls) {
      (values as any)[key] = controls[key].value;
      (errors as any)[key] = controls[key].error;
    }
    controlsVersion.value++;
  };

  syncValuesAndErrors();

  const isFormValid = computed(() => {
    controlsVersion.value; // Track control structure changes
    return Object.values(controls).every(c => c.isValid.value);
  });

  const isFormDirty = computed(() => {
    controlsVersion.value;
    return Object.values(controls).some(c => c.isDirty.value);
  });

  const isFormTouched = computed(() => {
    controlsVersion.value;
    return Object.values(controls).some(c => c.isTouched.value);
  });

  const handleSubmit = (callback: (values: T, e?: Event) => Promise<void> | void) => {
    return async (e?: Event) => {
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      
      isSubmitting.value = true;
      try {
        // Mark all fields as touched prior to validation so UI errors immediately appear
        for (const key in controls) {
          controls[key].isTouched.value = true;
        }

        // Run all validations in parallel
        const results = await Promise.all(Object.values(controls).map(c => c.validate()));
        const allValid = results.every(r => r === true);
        
        if (allValid) {
          const formValues = {} as T;
          for (const key in controls) {
            formValues[key] = controls[key].value.value;
          }
          await callback(formValues, e);
        }
      } finally {
        isSubmitting.value = false;
      }
    };
  };

  const register = (key: keyof T, options: { validateOnInput?: boolean; validateOnBlur?: boolean } = {}) => {
    const control = controls[key];
    if (!control) {
      throw new Error(`FormControl for key "${String(key)}" does not exist.`);
    }
    const { validateOnInput = true, validateOnBlur = true } = options;

    return {
      name: key as string,
      value: () => control.value.value,
      onInput: (e: any) => {
        if (!e || !e.target) return;
        const target = e.target;
        let val = target.type === 'checkbox' ? target.checked : target.value;
        if (target.type === 'number' && val !== '') {
          const num = Number(val);
          if (!isNaN(num)) val = num;
        } else if (target.multiple && target.options) {
          val = Array.from(target.selectedOptions)
            .filter((o: any) => o.selected)
            .map((o: any) => o.value);
        }
        control.value.value = val;
        control.isDirty.value = true;
        if (validateOnInput) {
          control.validate();
        }
      },
      onBlur: () => {
        control.isTouched.value = true;
        if (validateOnBlur) {
          control.validate();
        }
      }
    };
  };

  const setFieldValue = (key: keyof T, value: any, shouldValidate = true) => {
    const control = controls[key];
    if (control) {
      control.setValue(value, { validate: shouldValidate, dirty: true });
    }
  };

  const setError = (key: keyof T, errorMessage: string | null) => {
    const control = controls[key];
    if (control) {
      control.error.value = errorMessage;
      control.isValid.value = !errorMessage;
    }
  };

  const markAsTouched = (key: keyof T) => {
    const control = controls[key];
    if (control) {
      control.markAsTouched();
    }
  };

  const markAllAsTouched = () => {
    for (const key in controls) {
      controls[key].markAsTouched();
    }
  };

  const addControl = (key: string, initialVal: any, rules?: (ValidationRule<any> | Validator<any>)[] | (ValidationRule<any> | Validator<any>)) => {
    if (controls[key as keyof T]) return;
    (currentInitialValues as any)[key] = initialVal;
    if (rules) {
      currentSchema[key] = rules;
    }
    controls[key as keyof T] = createControl(key, initialVal);
    syncValuesAndErrors();
  };

  const removeControl = (key: string) => {
    if (!controls[key as keyof T]) return;
    delete (currentInitialValues as any)[key];
    delete currentSchema[key];
    delete controls[key as keyof T];
    syncValuesAndErrors();
  };

  const reset = (newInitialValues?: Partial<T>) => {
    if (newInitialValues) {
      Object.assign(currentInitialValues, newInitialValues);
    }
    for (const key in controls) {
      controls[key].reset();
    }
    isSubmitting.value = false;
    isValidating.value = false;
  };

  return {
    controls,
    isSubmitting,
    isValidating,
    isFormValid,
    isFormDirty,
    isFormTouched,
    handleSubmit,
    register,
    setFieldValue,
    setError,
    markAsTouched,
    markAllAsTouched,
    addControl,
    removeControl,
    reset,
    values,
    errors
  };
}
