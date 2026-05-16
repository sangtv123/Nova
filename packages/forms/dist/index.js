import { signal, computed } from '@nova/signals';
/**
 * Built-in validators
 */
export const Validators = {
    required: (msg = 'This field is required') => ({
        name: 'required',
        validate: (val) => (val != null && val !== '' && val !== false) ? null : msg
    }),
    email: (msg = 'Invalid email address') => ({
        name: 'email',
        validate: (val) => (typeof val === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) ? null : msg
    }),
    minLength: (min, msg) => ({
        name: 'minLength',
        validate: (val) => (val != null && (typeof val === 'string' || Array.isArray(val)) && val.length >= min) ? null : (msg || `Minimum length is ${min}`)
    })
};
/**
 * useForm Hook - Enhanced version for Giai đoạn 3
 */
export function useForm(initialValues, schema = {}) {
    const controls = {};
    const isSubmitting = signal(false);
    for (const key in initialValues) {
        const s = signal(initialValues[key]);
        const error = signal(null);
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
    const handleSubmit = (callback) => {
        return async (e) => {
            e.preventDefault();
            let allValid = true;
            const values = {};
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
                }
                finally {
                    isSubmitting.value = false;
                }
            }
        };
    };
    const register = (key) => {
        const control = controls[key];
        return {
            value: () => control.value.value,
            onInput: (e) => {
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
        values: Object.fromEntries(Object.entries(controls).map(([k, v]) => [k, v.value])),
        errors: Object.fromEntries(Object.entries(controls).map(([k, v]) => [k, v.error]))
    };
}
//# sourceMappingURL=index.js.map