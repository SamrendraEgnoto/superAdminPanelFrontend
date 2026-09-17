'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import styles from './LoadingSpinner.module.scss';

export default function LoadingSpinner({
  size = 'md',
  text = '',
  fullScreen = false,
  className = ''
}) {
  if (fullScreen) {
    return (
      <div className={styles.overlay}>
        <div className={styles.content}>
          <Loader2 className={`${styles.icon} ${styles[size]} ${styles.spin}`} />
          {text && <p className={styles.text}>{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.spinner} ${className}`}>
      <Loader2 className={`${styles.icon} ${styles[size]} ${styles.spin}`} />
      {text && <span className={styles.text}>{text}</span>}
    </div>
  );
}