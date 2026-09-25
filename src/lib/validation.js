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

export const validatePhone = (phone, required = true) => {
  if (!phone || !phone.toString().trim()) {
    return required ? 'Contact number is required' : '';
  }

  // Count pure digits (allowing between 7 and 15 digits as requested)
  const digits = phone.toString().replace(/\D/g, '');
  if (!digits) {
    return required ? 'Contact number is required' : '';
  }

  if (digits.length < 7 || digits.length > 15) {
    return 'Contact number must be between 7 and 15 digits';
  }

  return '';
};

// Sanitize phone: keep only digits, max 15 — blocks alphabets & special chars, allows 7 to 15 digits
export const sanitizePhone = (value = '') => {
  if (!value) return '';
  return value.toString().replace(/\D/g, '').slice(0, 15);
};

export const validateRequired = (value, field) => {
  if (!value || value.trim() === '') {
    return `${field} is required`;
  }
  return '';
};

export const COUNTRY_CODES = [
  { code: '+1', country: 'US', name: 'United States', flag: '🇺🇸' },
  { code: '+1', country: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: '+44', country: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+91', country: 'IN', name: 'India', flag: '🇮🇳' },
  { code: '+61', country: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: '+971', country: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+966', country: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+49', country: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'FR', name: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: '+31', country: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: '+41', country: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: '+46', country: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: '+47', country: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: '+45', country: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: '+353', country: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: '+65', country: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: '+81', country: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: '+86', country: 'CN', name: 'China', flag: '🇨🇳' },
  { code: '+852', country: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  { code: '+60', country: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+62', country: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: '+63', country: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: '+64', country: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: '+27', country: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: '+55', country: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: '+52', country: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: '+54', country: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: '+57', country: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: '+56', country: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: '+20', country: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: '+234', country: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: '+254', country: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: '+92', country: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: '+880', country: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+90', country: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: '+974', country: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: '+965', country: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: '+968', country: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: '+973', country: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: '+351', country: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: '+30', country: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: '+48', country: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: '+43', country: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: '+32', country: 'BE', name: 'Belgium', flag: '🇧🇪' }
];

export function parsePhoneNumber(raw = '', defaultCode = '+1') {
  if (!raw || typeof raw !== 'string') {
    return { countryCode: defaultCode, number: '' };
  }

  const trimmed = raw.trim();

  // If it starts with '+', search matching country code
  if (trimmed.startsWith('+')) {
    const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
    for (const c of sorted) {
      if (trimmed.startsWith(c.code)) {
        const numberPart = trimmed.slice(c.code.length).replace(/\D/g, '').slice(0, 15);
        return { countryCode: c.code, number: numberPart };
      }
    }
  }

  // If no '+', check if starts with digits
  const allDigits = trimmed.replace(/\D/g, '').slice(0, 15);
  return { countryCode: defaultCode, number: allDigits };
}

