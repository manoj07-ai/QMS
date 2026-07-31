'use client';

import React from 'react';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  value: number; // 0–100
  label?: string;
  showValue?: boolean;
  size?: 'xs' | 'sm' | 'md';
  color?: 'primary' | 'success' | 'warning' | 'danger';
  animated?: boolean;
  className?: string;
}

export default function ProgressBar({
  value,
  label,
  showValue = false,
  size = 'sm',
  color = 'primary',
  animated = false,
  className = '',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {(label || showValue) && (
        <div className={styles.meta}>
          {label && <span className={styles.label}>{label}</span>}
          {showValue && <span className={styles.value}>{pct}%</span>}
        </div>
      )}
      <div className={`${styles.track} ${styles[size]}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={[
            styles.fill,
            styles[color],
            animated ? styles.animated : '',
          ].join(' ')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
