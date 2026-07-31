'use client';

import React from 'react';
import { CheckCircle2, Loader2, Circle, AlertCircle, Activity } from 'lucide-react';
import styles from './ExtractionProgress.module.css';
import { useAppSelector } from '@/store';

export default function ExtractionProgress() {
  const uploadState           = useAppSelector((s) => s.aiAssistant.uploadState);
  const extractionSteps       = useAppSelector((s) => s.aiAssistant.extractionSteps);
  const currentExtractionTask = useAppSelector((s) => s.aiAssistant.currentExtractionTask);
  const extractedCount        = useAppSelector((s) => s.aiAssistant.extractedFieldsCount);

  const isVisible = uploadState !== 'idle';
  if (!isVisible) return null;

  const doneStepsCount = extractionSteps.filter((s) => s.status === 'done').length;
  const totalSteps = extractionSteps.length;

  return (
    <div className={`${styles.wrapper} animate-fade-in`}>
      {/* Current AI Task Header */}
      <div className={styles.taskBanner}>
        <div className={styles.taskBannerLeft}>
          <Activity size={14} className={uploadState === 'completed' ? styles.iconComplete : styles.iconActive} />
          <div>
            <p className={styles.taskTitle}>{currentExtractionTask}</p>
            <p className={styles.taskMetrics}>
              {uploadState === 'completed'
                ? `Extraction complete — ${doneStepsCount} of ${totalSteps} workflow steps verified`
                : `${extractedCount} of 13 fields extracted • Step ${Math.min(doneStepsCount + 1, totalSteps)} of ${totalSteps}`}
            </p>
          </div>
        </div>
      </div>

      {/* 9-Step Sequential Timeline Checklist */}
      <div className={styles.timeline}>
        {extractionSteps.map((step, idx) => (
          <div
            key={step.id}
            className={[
              styles.timelineItem,
              step.status === 'extracting' ? styles.stepExtracting : '',
              step.status === 'done'       ? styles.stepDone : '',
              step.status === 'failed'     ? styles.stepFailed : '',
            ].join(' ')}
          >
            <div className={styles.stepConnector}>
              <span className={styles.stepIcon}>
                {step.status === 'done'       && <CheckCircle2 size={14} />}
                {step.status === 'extracting' && <Loader2 size={14} className={styles.spin} />}
                {step.status === 'failed'     && <AlertCircle size={14} />}
                {step.status === 'pending'    && <Circle size={14} />}
              </span>
              {idx < totalSteps - 1 && <span className={styles.line} />}
            </div>

            <div className={styles.stepContent}>
              <div className={styles.stepTitleRow}>
                <span className={styles.stepLabel}>{step.label}</span>
                {step.status === 'done' && step.confidence != null && (
                  <span className={styles.confidenceBadge}>{step.confidence}%</span>
                )}
                {step.status === 'extracting' && (
                  <span className={styles.extractingBadge}>In Progress</span>
                )}
              </div>
              {step.subLabel && <span className={styles.stepSub}>{step.subLabel}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
