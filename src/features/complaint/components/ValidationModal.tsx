'use client';

import React from 'react';
import { ShieldCheck, AlertOctagon, CheckCircle2, AlertTriangle, Info, X, ArrowRight } from 'lucide-react';
import styles from './ValidationModal.module.css';
import Button from '@/shared/components/ui/Button';
import { useAppDispatch, useAppSelector } from '@/store';
import { closeValidationModal, startSave, saveSuccess } from '@/store/complaintSlice';

export default function ValidationModal() {
  const dispatch            = useAppDispatch();
  const showModal           = useAppSelector((s) => s.complaint.showValidationModal);
  const validationResult    = useAppSelector((s) => s.complaint.validationResult);
  const isSaving            = useAppSelector((s) => s.complaint.isSaving);

  if (!showModal || !validationResult) return null;

  const { isValid, errorsCount, warningsCount, items } = validationResult;

  const handleConfirmSave = () => {
    dispatch(startSave());
    setTimeout(() => {
      dispatch(saveSuccess());
    }, 1200);
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="val-modal-title">
      <div className={`${styles.modal} animate-fade-in-up`}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleRow}>
            <div className={`${styles.iconWrap} ${isValid ? styles.iconValid : styles.iconInvalid}`}>
              {isValid ? <ShieldCheck size={20} /> : <AlertOctagon size={20} />}
            </div>
            <div>
              <h3 id="val-modal-title" className={styles.title}>
                QMS Quality Gate &amp; Compliance Check
              </h3>
              <p className={styles.subtitle}>
                {isValid
                  ? 'All mandatory GMP rules verified successfully'
                  : `${errorsCount} error(s) must be resolved before saving`}
              </p>
            </div>
          </div>
          <button
            className={styles.closeBtn}
            onClick={() => dispatch(closeValidationModal())}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Status Summary Banner */}
        <div className={`${styles.summaryBanner} ${isValid ? styles.bannerSuccess : styles.bannerError}`}>
          <div className={styles.bannerMeta}>
            <span className={styles.statusBadge}>
              {isValid ? 'VALIDATED ✓' : 'ACTION REQUIRED ⚠'}
            </span>
            <span className={styles.bannerText}>
              {isValid
                ? `7 mandatory field validations passed. ${warningsCount > 0 ? `${warningsCount} warning(s) noted.` : ''}`
                : `${errorsCount} required field(s) missing or incomplete.`}
            </span>
          </div>
        </div>

        {/* Validation Item List */}
        <div className={styles.body}>
          <p className={styles.listHeading}>Validation Checklist</p>
          <div className={styles.itemList}>
            {items.map((item, idx) => (
              <div
                key={idx}
                className={[
                  styles.itemRow,
                  item.type === 'error'   ? styles.rowError : '',
                  item.type === 'warning' ? styles.rowWarning : '',
                  item.type === 'info'    ? styles.rowInfo : '',
                ].join(' ')}
              >
                <span className={styles.itemIcon}>
                  {item.type === 'error'   && <AlertOctagon size={14} />}
                  {item.type === 'warning' && <AlertTriangle size={14} />}
                  {item.type === 'info'    && <CheckCircle2 size={14} />}
                </span>
                <div className={styles.itemMeta}>
                  <span className={styles.itemLabel}>{item.label}</span>
                  <span className={styles.itemMessage}>{item.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
          <Button
            variant="ghost"
            size="md"
            onClick={() => dispatch(closeValidationModal())}
            disabled={isSaving}
          >
            {isValid ? 'Review Form' : 'Fix Errors'}
          </Button>

          {isValid && (
            <Button
              variant="success"
              size="md"
              rightIcon={<ArrowRight size={14} />}
              isLoading={isSaving}
              onClick={handleConfirmSave}
            >
              {isSaving ? 'Logging to QMS...' : 'Confirm & Save Complaint'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
