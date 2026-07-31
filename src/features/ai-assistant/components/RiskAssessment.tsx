'use client';

import React, { useState } from 'react';
import { Brain, TrendingUp, ChevronRight, Loader2, Clock, HelpCircle, AlertTriangle, Layers } from 'lucide-react';
import styles from './RiskAssessment.module.css';
import { RiskBadge, SeverityBadge } from '@/shared/components/ui/Badge';
import { SkeletonCard } from '@/shared/components/ui/Skeleton';
import { useAppSelector } from '@/store';

export default function RiskAssessment() {
  const riskState      = useAppSelector((s) => s.aiAssistant.riskAssessmentState);
  const riskAssessment = useAppSelector((s) => s.aiAssistant.riskAssessment);
  const [showExplanation, setShowExplanation] = useState(true);

  // ─── Waiting State ────────────────────────────────────────
  if (riskState === 'waiting') {
    return (
      <div className={styles.waiting}>
        <div className={styles.waitingIcon}>
          <Clock size={20} />
        </div>
        <p className={styles.waitingTitle}>AI Risk Assessment</p>
        <p className={styles.waitingSubtitle}>
          Upload or paste a complaint document to run automated AI risk classification &amp; factor analysis
        </p>
      </div>
    );
  }

  // ─── Analyzing State ──────────────────────────────────────
  if (riskState === 'analyzing') {
    return (
      <div className={styles.analyzing}>
        <div className={styles.analyzingHeader}>
          <Loader2 size={14} className={styles.spin} />
          <span>AI Copilot evaluating risk factors &amp; regulatory impact...</span>
        </div>
        <div className={styles.skeletons}>
          <SkeletonCard />
        </div>
      </div>
    );
  }

  // ─── Classified / Updated State ──────────────────────────
  if (!riskAssessment) return null;

  const rawConfidence = (riskAssessment as any).confidence ?? 90;
  const confidenceColor =
    rawConfidence >= 85 ? 'var(--color-success)' :
    rawConfidence >= 70 ? 'var(--color-primary)' :
    'var(--color-warning)';

  const topFactors: Array<{ factor: string; impact: string; description: string }> =
    (riskAssessment as any).topContributingFactors ||
    (riskAssessment as any).top_contributing_factors ||
    [];

  const bullets: string[] =
    (riskAssessment as any).reasoningBullets ||
    (riskAssessment as any).reasoning_bullets ||
    [];

  const actions: string[] =
    (riskAssessment as any).suggestedActions ||
    (riskAssessment as any).suggested_actions ||
    [];

  const summary: string =
    (riskAssessment as any).complaintSummary ||
    (riskAssessment as any).complaint_summary ||
    '';

  const riskLevel = (riskAssessment as any).riskLevel || (riskAssessment as any).risk_level || 'medium';
  const severity = (riskAssessment as any).severity || 'major';

  return (
    <div className={`${styles.wrapper} animate-fade-in-up`}>
      {/* ─── Risk Header ──────────────────────────────────── */}
      <div className={styles.riskHeader}>
        <div className={styles.riskHeaderLeft}>
          <div className={styles.brainIcon}>
            <Brain size={15} />
          </div>
          <div>
            <p className={styles.riskTitle}>AI Copilot Risk Classification</p>
            <p className={styles.riskSubtitle}>Confidence: {rawConfidence}%</p>
          </div>
        </div>
        <div className={styles.riskHeaderRight}>
          <RiskBadge level={riskLevel} />
        </div>
      </div>

      {/* ─── Confidence Meter ─────────────────────────────── */}
      <div className={styles.confidenceMeter}>
        <div className={styles.confidenceMeta}>
          <span className={styles.confidenceLabel}>AI Model Confidence Score</span>
          <span className={styles.confidenceVal} style={{ color: confidenceColor }}>
            {rawConfidence}%
          </span>
        </div>
        <div className={styles.confidenceTrack}>
          <div
            className={styles.confidenceFill}
            style={{ width: `${rawConfidence}%`, background: confidenceColor }}
          />
        </div>
      </div>

      {/* ─── Severity Indicator ────────────────────────────── */}
      <div className={styles.infoRow}>
        <span className={styles.infoLabel}>QMS Severity Indicator</span>
        <SeverityBadge severity={severity} />
      </div>

      {/* ─── EXPLAINABLE AI SECTION: "Why this classification?" ─── */}
      <div className={styles.explainSection}>
        <button
          className={styles.explainHeaderBtn}
          onClick={() => setShowExplanation((o) => !o)}
          type="button"
          aria-expanded={showExplanation}
        >
          <div className={styles.explainHeaderLeft}>
            <HelpCircle size={14} className={styles.explainIcon} />
            <span className={styles.explainTitle}>Why this classification?</span>
          </div>
          <span className={styles.explainToggleText}>
            {showExplanation ? 'Hide Details' : 'Show Details'}
          </span>
        </button>

        {showExplanation && (
          <div className={`${styles.explainBody} animate-fade-in`}>
            {/* Top Contributing Factors */}
            {topFactors.length > 0 && (
              <div className={styles.factorsBlock}>
                <p className={styles.factorsBlockTitle}>
                  <Layers size={11} />
                  Top Contributing Factors
                </p>
                <div className={styles.factorsList}>
                  {topFactors.map((item, idx) => (
                    <div key={idx} className={styles.factorChip}>
                      <div className={styles.factorHeader}>
                        <span className={`${styles.impactBadge} ${styles[`impact_${item.impact}`]}`}>
                          {(item.impact || 'MEDIUM').toUpperCase()} IMPACT
                        </span>
                        <span className={styles.factorName}>{item.factor}</span>
                      </div>
                      <p className={styles.factorDesc}>{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reasoning Bullets */}
            {bullets.length > 0 && (
              <div className={styles.bulletsBlock}>
                <p className={styles.bulletsTitle}>
                  <AlertTriangle size={11} />
                  AI Reasoning Analysis
                </p>
                <ul className={styles.bulletsList}>
                  {bullets.map((bullet, i) => (
                    <li key={i} className={styles.bulletItem}>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Complaint Summary Card ────────────────────────── */}
      {summary && (
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>
            <TrendingUp size={12} />
            Executive Complaint Summary
          </p>
          <p className={styles.summaryText}>{summary}</p>
        </div>
      )}

      {/* ─── Suggested Next Actions ────────────────────────── */}
      {actions.length > 0 && (
        <div className={styles.actionsSection}>
          <p className={styles.actionsLabel}>Suggested Next Actions</p>
          <div className={styles.actionsList}>
            {actions.map((action, i) => (
              <div key={i} className={styles.actionItem}>
                <span className={styles.actionNum}>{i + 1}</span>
                <span className={styles.actionText}>{action}</span>
                <ChevronRight size={12} className={styles.actionArrow} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
