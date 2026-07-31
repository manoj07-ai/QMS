'use client';

import React from 'react';
import {
  FileCheck2,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Send,
} from 'lucide-react';
import styles from './ComplaintForm.module.css';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  resetForm,
  setLifecycleStatus,
  runValidationGate,
} from '@/store/complaintSlice';
import OriginSection from './OriginSection';
import ProductSection from './ProductSection';
import ComplaintDetailsSection from './ComplaintDetailsSection';
import AssessmentSection from './AssessmentSection';
import ActivityTimeline from './ActivityTimeline';
import ValidationModal from './ValidationModal';
import RiskAssessment from '@/features/ai-assistant/components/RiskAssessment';
import CompletenessChecker from '@/features/ai-assistant/components/CompletenessChecker';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import type { ComplaintLifecycleStatus } from '@/types';

const STATUS_BADGE_MAP: Record<ComplaintLifecycleStatus, { label: string; variant: 'warning' | 'info' | 'primary' | 'success' }> = {
  pending_triage: { label: 'Pending Triage', variant: 'warning' },
  under_review: { label: 'Under Review', variant: 'info' },
  investigation: { label: 'Investigation', variant: 'primary' },
  closed: { label: 'Closed', variant: 'success' },
};

export default function ComplaintForm() {
  const dispatch = useAppDispatch();
  const lifecycleStatus = useAppSelector((s) => s.complaint.current.lifecycleStatus);
  const formState       = useAppSelector((s) => s.complaint.formState);
  const complaintNumber = useAppSelector((s) => s.complaint.current.complaintNumber);
  const isSaving        = useAppSelector((s) => s.complaint.isSaving);
  const validation      = useAppSelector((s) => s.complaint.validationResult);

  const currentBadge = STATUS_BADGE_MAP[lifecycleStatus];

  const handleValidateAndSave = () => {
    dispatch(runValidationGate());
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all form fields?')) {
      dispatch(resetForm());
    }
  };

  const isPopulated = formState === 'ai_populated' || formState === 'user_edited' || formState === 'validated' || formState === 'saved';

  return (
    <div className={styles.container}>
      {/* ─── Form Header ───────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Log Customer Complaint</h1>
            <span className={styles.complaintNo}>{complaintNumber}</span>
          </div>
          <p className={styles.subtitle}>API &amp; FDF Quality Assurance Module</p>

          {/* Single Global Extraction Status Banner */}
          {isPopulated && (
            <div className={`${styles.globalAiBanner} animate-fade-in`}>
              <Sparkles size={13} className={styles.aiBannerIcon} />
              <span className={styles.aiBannerText}>
                <strong>13 / 13 Fields Extracted</strong> • Overall AI Confidence: <strong>95%</strong>
              </span>
            </div>
          )}
        </div>

        <div className={styles.headerRight}>
          <div className={styles.statusDropdownWrap}>
            <label className={styles.statusLabel}>Lifecycle Status</label>
            <select
              className={styles.statusSelect}
              value={lifecycleStatus}
              onChange={(e) => dispatch(setLifecycleStatus(e.target.value as ComplaintLifecycleStatus))}
            >
              <option value="pending_triage">Pending Triage</option>
              <option value="under_review">Under Review</option>
              <option value="investigation">Investigation</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <Badge variant={currentBadge.variant} showDot pulseDot={lifecycleStatus === 'pending_triage'}>
            {currentBadge.label}
          </Badge>
        </div>
      </div>

      {/* ─── Validation Result Banner ─────────────────────── */}
      {validation && (
        <div className={`${styles.alertStack} animate-fade-in`}>
          {validation.isValid ? (
            <div className={styles.alertSuccess}>
              <CheckCircle2 size={16} />
              <span>Complaint validated successfully according to QMS guidelines.</span>
            </div>
          ) : (
            <div className={styles.alertError}>
              <AlertTriangle size={16} />
              <span>
                Validation failed: {validation.errorsCount} required field(s) missing before QMS submission.
              </span>
            </div>
          )}
        </div>
      )}

      {/* ─── 4 Collapsible Form Sections ──────────────────── */}
      <form onSubmit={(e) => e.preventDefault()} className={styles.formStack}>
        <OriginSection />
        <ProductSection />
        <ComplaintDetailsSection />
        <AssessmentSection />

        {/* ─── Sticky Bottom Action Bar ───────────────────── */}
        <div className={styles.actionsBar}>
          <div className={styles.actionsLeft}>
            <Button variant="ghost" size="sm" onClick={handleReset} leftIcon={<RotateCcw size={13} />}>
              Reset Form
            </Button>
          </div>

          <div className={styles.actionsRight}>
            <Button
              variant="secondary"
              size="md"
              onClick={handleValidateAndSave}
              leftIcon={<FileCheck2 size={15} />}
            >
              Validate Complaint
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isSaving}
              onClick={handleValidateAndSave}
              leftIcon={<Send size={15} />}
            >
              Save Complaint
            </Button>
          </div>
        </div>
      </form>

      {/* ─── Review Panels After Complaint Form ─────────────── */}
      <div className={styles.reviewPanelsStack}>
        <div className={styles.reviewPanelCard}>
          <RiskAssessment />
        </div>
        <div className={styles.reviewPanelCard}>
          <CompletenessChecker />
        </div>
        <div className={styles.reviewPanelCard}>
          <ActivityTimeline />
        </div>
      </div>

      {/* ─── Validation Modal ───────────────────────────────── */}
      <ValidationModal />
    </div>
  );
}
