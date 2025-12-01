export const validators = {
  required: (value) => {
    if (!value || value.toString().trim() === '') {
      return 'Este campo es obligatorio';
    }
    return '';
  },

  email: (value) => {
    if (!value) return '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Ingresa un email válido';
    }
    return '';
  },

  minLength: (min) => (value) => {
    if (!value) return '';
    if (value.length < min) {
      return `Mínimo ${min} caracteres`;
    }
    return '';
  },

  maxLength: (max) => (value) => {
    if (!value) return '';
    if (value.length > max) {
      return `Máximo ${max} caracteres`;
    }
    return '';
  },

  number: (value) => {
    if (!value) return '';
    if (isNaN(value) || value === '') {
      return 'Debe ser un número válido';
    }
    return '';
  },

  minValue: (min) => (value) => {
    if (!value) return '';
    if (parseFloat(value) < min) {
      return `El valor mínimo es ${min}`;
    }
    return '';
  },

  maxValue: (max) => (value) => {
    if (!value) return '';
    if (parseFloat(value) > max) {
      return `El valor máximo es ${max}`;
    }
    return '';
  }
};

// Validaciones específicas para forms
export const groupValidators = {
  name: (value) => {
    const required = validators.required(value);
    if (required) return required;
    return validators.minLength(3)(value);
  },

  section: (value) => {
    const required = validators.required(value);
    if (required) return required;
    return validators.minLength(2)(value);
  }
};