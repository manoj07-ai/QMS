'use client';

import React from 'react';
import styles from './Badge.module.css';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  showDot?: boolean;
  pulseDot?: boolean;
  className?: string;
}

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  showDot = false,
  pulseDot = false,
  className = '',
}: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${styles[size]} ${className}`}>
      {showDot && (
        <span className={`${styles.dot} ${pulseDot ? styles.pulseDot : ''}`} />
      )}
      {children}
    </span>
  );
}

// ─── Preset Variants for Domain Concepts ─────────────────────

export function RiskBadge({ level }: { level: string }) {
  const map: Record<string, BadgeVariant> = {
    critical: 'danger',
    high: 'warning',
    medium: 'info',
    low: 'success',
  };
  return (
    <Badge variant={map[level] ?? 'neutral'} showDot size="md">
      {level.charAt(0).toUpperCase() + level.slice(1)} Risk
    </Badge>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, BadgeVariant> = {
    critical: 'danger',
    major: 'warning',
    minor: 'info',
    observation: 'neutral',
  };
  return (
    <Badge variant={map[severity] ?? 'neutral'} size="md">
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </Badge>
  );
}

export function LifecycleBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    pending_triage:  { variant: 'warning', label: 'Pending Triage' },
    under_review:    { variant: 'info',    label: 'Under Review' },
    investigation:   { variant: 'primary', label: 'Investigation' },
    closed:          { variant: 'success', label: 'Closed' },
  };
  const cfg = map[status] ?? { variant: 'neutral', label: status };
  return (
    <Badge variant={cfg.variant} showDot pulseDot={status === 'pending_triage'} size="md">
      {cfg.label}
    </Badge>
  );
}
