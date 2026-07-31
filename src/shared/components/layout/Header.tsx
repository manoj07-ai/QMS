'use client';

import React from 'react';
import { FlaskConical, Bell, HelpCircle, Search, ChevronDown } from 'lucide-react';
import styles from './Header.module.css';
import { LifecycleBadge } from '@/shared/components/ui/Badge';
import { useAppSelector } from '@/store';

export default function Header() {
  const lifecycleStatus = useAppSelector((s) => s.complaint.current.lifecycleStatus);
  const complaintNumber = useAppSelector((s) => s.complaint.current.complaintNumber);
  const formState = useAppSelector((s) => s.complaint.formState);

  const formStateLabel: Record<string, string> = {
    empty: 'New Complaint',
    ai_populated: 'AI Populated',
    user_edited: 'Editing',
    validated: 'Ready to Save',
    saved: 'Saved',
  };

  return (
    <header className={styles.header} role="banner">
      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.logoMark}>
          <FlaskConical size={18} strokeWidth={2} />
        </div>
        <div className={styles.brandText}>
          <span className={styles.appName}>Pharma Complaint AI</span>
          <span className={styles.appSub}>QA Module</span>
        </div>
        <div className={styles.breadcrumbDivider} />
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <span className={styles.breadcrumbItem}>Complaints</span>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>
            {formState === 'saved' && complaintNumber ? complaintNumber : 'New Complaint'}
          </span>
        </nav>
      </div>

      {/* Center — Status Bar */}
      <div className={styles.statusBar}>
        <div className={styles.formStateIndicator}>
          <span
            className={[
              styles.formStateDot,
              formState === 'saved' ? styles.dotSuccess :
              formState === 'validated' ? styles.dotPrimary :
              formState === 'ai_populated' ? styles.dotAi :
              formState === 'user_edited' ? styles.dotWarning : styles.dotNeutral,
            ].join(' ')}
          />
          <span className={styles.formStateLabel}>{formStateLabel[formState] ?? 'Draft'}</span>
        </div>
        <div className={styles.statusDivider} />
        <LifecycleBadge status={lifecycleStatus} />
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button className={styles.actionBtn} aria-label="Search">
          <Search size={16} />
        </button>
        <button className={styles.actionBtn} aria-label="Help">
          <HelpCircle size={16} />
        </button>
        <button className={styles.actionBtn} aria-label="Notifications">
          <Bell size={16} />
          <span className={styles.notifDot} />
        </button>
        <div className={styles.dividerV} />
        <button className={styles.userBtn} aria-label="User menu">
          <span className={styles.avatar}>QA</span>
          <div className={styles.userInfo}>
            <span className={styles.userName}>QA Analyst</span>
          </div>
          <ChevronDown size={12} className={styles.chevron} />
        </button>
      </div>
    </header>
  );
}
