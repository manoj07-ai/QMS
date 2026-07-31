'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import styles from './Alert.module.css';
import type { AlertType } from '@/types';

interface AlertProps {
  type: AlertType;
  title: string;
  message: string;
  onDismiss?: () => void;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
}

const ICON_MAP = {
  success: <CheckCircle2 size={16} />,
  error:   <AlertCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info:    <Info size={16} />,
};

export default function Alert({
  type,
  title,
  message,
  onDismiss,
  autoDismiss = false,
  autoDismissDelay = 5000,
}: AlertProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!autoDismiss) return;
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss?.(), 300);
    }, autoDismissDelay);
    return () => clearTimeout(timer);
  }, [autoDismiss, autoDismissDelay, onDismiss]);

  if (!visible) return null;

  return (
    <div className={`${styles.alert} ${styles[type]} animate-fade-in-up`} role="alert">
      <span className={styles.icon}>{ICON_MAP[type]}</span>
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        <p className={styles.message}>{message}</p>
      </div>
      {onDismiss && (
        <button
          className={styles.dismiss}
          onClick={() => { setVisible(false); setTimeout(() => onDismiss(), 300); }}
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
