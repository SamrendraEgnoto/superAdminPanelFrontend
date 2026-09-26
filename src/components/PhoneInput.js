'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from './PhoneInput.module.scss';
import { sanitizePhone, COUNTRY_CODES, parsePhoneNumber } from '@/src/lib/validation';
import SearchableSelect from './SearchableSelect';

export { COUNTRY_CODES, parsePhoneNumber };

export default function PhoneInput({
  value = '',
  onChange,
  name,
  id,
  placeholder = '7 to 15 digits',
  required = false,
  disabled = false,
  defaultCountryCode = '+1',
  className = '',
  showDigitCount = false
}) {
  const parsed = useMemo(() => parsePhoneNumber(value, defaultCountryCode), [value, defaultCountryCode]);
  const [selectedCode, setSelectedCode] = useState(parsed.countryCode);
  const [digits, setDigits] = useState(parsed.number);

  useEffect(() => {
    setSelectedCode(parsed.countryCode);
    setDigits(parsed.number);
  }, [parsed.countryCode, parsed.number]);

  const countryOptions = useMemo(() => {
    return COUNTRY_CODES.map((c, idx) => ({
      value: c.code,
      label: `${c.code}`,
      sublabel: c.country,
      flag: c.flag,
      key: `${c.country}-${c.code}-${idx}`
    }));
  }, []);

  const notifyChange = (code, num) => {
    const combinedValue = num ? `${code} ${num}` : '';
    if (typeof onChange === 'function') {
      const syntheticEvent = {
        target: {
          name: name || '',
          value: combinedValue,
          countryCode: code,
          phoneNumber: num
        }
      };
      onChange(syntheticEvent);
    }
  };

  const handleCountryChange = (newCode) => {
    setSelectedCode(newCode);
    notifyChange(newCode, digits);
  };

  const handleDigitsChange = (e) => {
    const cleanDigits = sanitizePhone(e.target.value);
    setDigits(cleanDigits);
    notifyChange(selectedCode, cleanDigits);
  };

  const handleKeyDown = (e) => {
    if (['e', 'E', '+', '-', '.'].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className={`${styles.phoneInputGroup} ${disabled ? styles.disabled : ''} ${className}`}>
      <div className={styles.countryPickerWrapper}>
        <SearchableSelect
          options={countryOptions}
          value={selectedCode}
          onChange={handleCountryChange}
          disabled={disabled}
          searchPlaceholder="Search country/code..."
          placeholder="+1"
        />
      </div>
      <input
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={15}
        id={id}
        name={name}
        className={styles.phoneInputField}
        placeholder={placeholder}
        value={digits}
        onChange={handleDigitsChange}
        onKeyDown={handleKeyDown}
        required={required}
        disabled={disabled}
      />
      {showDigitCount && (
        <span className={styles.digitIndicator} title="Number of digits (7-15 digits allowed)">
          {digits.length}/15
        </span>
      )}
    </div>
  );
}
