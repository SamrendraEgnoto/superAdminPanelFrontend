'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import styles from './SearchableSelect.module.scss';

export default function SearchableSelect({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  disabled = false,
  className = '',
  renderCustomOption = null,
  renderTrigger = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const q = searchTerm.toLowerCase();
    return options.filter((opt) => {
      const label = String(opt.label || opt.name || opt.value || '').toLowerCase();
      const sub = String(opt.sublabel || opt.country || opt.code || '').toLowerCase();
      return label.includes(q) || sub.includes(q);
    });
  }, [options, searchTerm]);

  const selectedOption = useMemo(() => {
    return options.find((opt) => String(opt.value) === String(value));
  }, [options, value]);

  const handleSelect = (val) => {
    if (typeof onChange === 'function') {
      onChange(val);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`${styles.container} ${className}`}>
      {renderTrigger ? (
        renderTrigger({
          selectedOption,
          isOpen,
          toggle: () => !disabled && setIsOpen(!isOpen),
          disabled
        })
      ) : (
        <button
          type="button"
          className={styles.trigger}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <span className={styles.selectedContent}>
            {selectedOption ? (
              <>
                {selectedOption.flag && <span>{selectedOption.flag}</span>}
                <span>{selectedOption.label || selectedOption.value}</span>
              </>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>{placeholder}</span>
            )}
          </span>
          <ChevronDown
            size={16}
            className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}
          />
        </button>
      )}

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.searchBox}>
            <Search size={15} className={styles.searchIcon} />
            <input
              ref={searchInputRef}
              type="text"
              className={styles.searchInput}
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className={styles.optionsList}>
            {filteredOptions.length === 0 ? (
              <div className={styles.noResults}>No matches found</div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={`${opt.value}-${idx}`}
                    type="button"
                    className={`${styles.option} ${isSelected ? styles.selected : ''}`}
                    onClick={() => handleSelect(opt.value)}
                  >
                    {renderCustomOption ? (
                      renderCustomOption(opt, isSelected)
                    ) : (
                      <>
                        <span className={styles.optionLabel}>
                          {opt.flag && <span>{opt.flag}</span>}
                          <span>{opt.label || opt.value}</span>
                          {opt.sublabel && (
                            <span className={styles.sublabel}>({opt.sublabel})</span>
                          )}
                        </span>
                        {isSelected && <Check size={14} />}
                      </>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
