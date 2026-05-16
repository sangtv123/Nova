import { signal } from '@nova/signals';
/**
 * useForm Hook - The standard way to handle forms in Nova.
 */
export function useForm(initialValues, validators = {}) {
    const controls = {};
    const isSubmitting = signal(false);
    for (const key in initialValues) {
        const s = signal(initialValues[key]);
        const error = signal(null);
        const isDirty = signal(false);
        const validate = () => {
            const validator = validators[key];
            if (validator) {
                const result = validator(s.value);
                if (typeof result === 'string') {
                    error.value = result;
                    return false;
                }
                else if (result === false) {
                    error.value = 'This field is invalid';
                    return false;
                }
            }
            error.value = null;
            return true;
        };
        controls[key] = {
            value: s,
            error,
            isDirty,
            validate
        };
    }
    /**
     * High-order function for form submission.
     * Handles preventDefault, validation, and loading state.
     */
    const handleSubmit = (callback) => {
        return async (e) => {
            e.preventDefault();
            let isValid = true;
            const values = {};
            for (const key in controls) {
                if (!controls[key].validate()) {
                    isValid = false;
                }
                values[key] = controls[key].value.value;
            }
            if (isValid) {
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
    /**
     * Register an input field to the form state.
     */
    const register = (key) => {
        const control = controls[key];
        return {
            value: () => control.value.value,
            checked: () => typeof control.value.value === 'boolean' ? control.value.value : undefined,
            onInput: (e) => {
                const target = e.target;
                const val = target.type === 'checkbox' ? target.checked : target.value;
                control.value.value = val;
                control.isDirty.value = true;
                control.validate();
            },
            onChange: (e) => {
                const target = e.target;
                const val = target.type === 'checkbox' ? target.checked : target.value;
                control.value.value = val;
                control.isDirty.value = true;
                control.validate();
            }
        };
    };
    return {
        controls,
        isSubmitting,
        handleSubmit,
        register,
        // Direct access to signals if needed
        values: Object.fromEntries(Object.entries(controls).map(([k, v]) => [k, v.value])),
        errors: Object.fromEntries(Object.entries(controls).map(([k, v]) => [k, v.error]))
    };
}
//# sourceMappingURL=index.js.map