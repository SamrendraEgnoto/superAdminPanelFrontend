// Common reusable validators

export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) return 'Invalid email format';
  return '';
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';

  // Strong password: min 8, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!regex.test(password)) {
    return 'Password must be 8+ chars, include uppercase, lowercase, number & special character';
  }

  return '';
};

export const validateName = (name, field = 'Name') => {
  if (!name) return `${field} is required`;

  const regex = /^[A-Za-z\s]+$/;
  if (!regex.test(name)) return `${field} should contain only letters`;

  return '';
};

export const validatePhone = (phone) => {
  if (!phone) return 'Contact number is required';

  const regex = /^[0-9]{10}$/;
  if (!regex.test(phone)) return 'Contact number must be exactly 10 digits';

  return '';
};

export const validateRequired = (value, field) => {
  if (!value || value.trim() === '') {
    return `${field} is required`;
  }
  return '';
};