'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Circle } from 'lucide-react';
import styles from './CompletenessChecker.module.css';
import ProgressBar from '@/shared/components/ui/ProgressBar';
import { useAppSelector } from '@/store';

export default function CompletenessChecker() {
  const items      = useAppSelector((s) => s.aiAssistant.completenessItems);
  const percentage = useAppSelector((s) => s.aiAssistant.completenessPercentage);

  const required = items.filter((i) => i.isRequired);
  const optional = items.filter((i) => !i.isRequired);
  const requiredComplete = required.filter((i) => i.isComplete).length;

  const allDone = requiredComplete === required.length;

  return (
    <div className={styles.wrapper}>
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={styles.title}>Completeness</p>
          <p className={styles.subtitle}>
            {requiredComplete}/{required.length} required fields
          </p>
        </div>
        <div className={`${styles.pctBadge} ${allDone ? styles.pctBadgeDone : ''}`}>
          {percentage}%
        </div>
      </div>

      {/* ─── Progress Bar ───────────────────────────────────── */}
      <ProgressBar
        value={percentage}
        color={allDone ? 'success' : percentage >= 50 ? 'primary' : 'warning'}
        size="sm"
      />

      {/* ─── Required Items ──────────────────────────────────── */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Required</p>
        <div className={styles.items}>
          {required.map((item) => (
            <div
              key={item.id}
              className={`${styles.item} ${item.isComplete ? styles.itemComplete : styles.itemMissing}`}
            >
              <span className={styles.itemIcon}>
                {item.isComplete
                  ? <CheckCircle2 size={13} />
                  : <AlertCircle size={13} />
                }
              </span>
              <span className={styles.itemLabel}>{item.label}</span>
              <span className={styles.itemStatus}>
                {item.isComplete ? 'Filled' : 'Missing'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Optional Items ──────────────────────────────────── */}
      {optional.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>Optional</p>
          <div className={styles.items}>
            {optional.map((item) => (
              <div
                key={item.id}
                className={`${styles.item} ${item.isComplete ? styles.itemComplete : styles.itemOptional}`}
              >
                <span className={styles.itemIcon}>
                  {item.isComplete ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                </span>
                <span className={styles.itemLabel}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── All Done Banner ─────────────────────────────────── */}
      {allDone && (
        <div className={`${styles.allDone} animate-fade-in`}>
          <CheckCircle2 size={14} />
          All required fields are complete — ready to save
        </div>
      )}
    </div>
  );
}
