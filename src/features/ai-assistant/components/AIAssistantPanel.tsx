'use client';

import React from 'react';
import { Sparkles, Upload } from 'lucide-react';
import styles from './AIAssistantPanel.module.css';
import DocumentUpload from './DocumentUpload';
import ExtractionProgress from './ExtractionProgress';
import ChatAssistant from '@/features/chat/components/ChatAssistant';

export default function AIAssistantPanel() {
  return (
    <aside className={styles.panel} aria-label="Pharma Complaint AI Assistant">
      {/* ─── Panel Header ──────────────────────────────────── */}
      <div className={styles.panelHeader}>
        <div className={styles.panelTitleRow}>
          <div className={styles.panelIcon}>
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className={styles.panelTitle}>Pharma Complaint AI Assistant</h2>
            <p className={styles.panelSubtitle}>Automated Extraction &amp; Copilot</p>
          </div>
        </div>
        <div className={styles.aiStatus}>
          <span className={styles.aiDot} />
          Active
        </div>
      </div>

      {/* ─── Card 1: Document Upload + Extraction Timeline ──── */}
      <div className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <span className={styles.cardIcon}><Upload size={13} /></span>
          <h3 className={styles.cardTitle}>Upload or Paste Complaint</h3>
        </div>
        <DocumentUpload />
        <ExtractionProgress />
      </div>

      {/* ─── Card 2: AI Chat Assistant (Permanently Visible) ── */}
      <div className={styles.chatCard}>
        <ChatAssistant />
      </div>
    </aside>
  );
}
