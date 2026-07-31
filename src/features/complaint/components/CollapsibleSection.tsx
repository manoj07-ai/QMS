'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import styles from './CollapsibleSection.module.css';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isComplete?: boolean;
  badge?: React.ReactNode;
}

export default function CollapsibleSection({
  id,
  title,
  subtitle,
  icon,
  children,
  defaultOpen = true,
  isComplete = false,
  badge,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto');

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  // Recalculate height when children change (e.g. AI populates fields)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isOpen && contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  });

  return (
    <section className={styles.section} id={id}>
      <button
        className={`${styles.header} ${isOpen ? styles.headerOpen : ''}`}
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        aria-controls={`${id}-content`}
        type="button"
      >
        <div className={styles.headerLeft}>
          {icon && (
            <span className={`${styles.iconWrap} ${isComplete ? styles.iconComplete : ''}`}>
              {isComplete ? <CheckCircle2 size={15} /> : icon}
            </span>
          )}
          <div className={styles.titleGroup}>
            <h2 className={styles.title}>{title}</h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        </div>
        <div className={styles.headerRight}>
          {badge}
          {isComplete && (
            <span className={styles.completeTag}>Complete</span>
          )}
          <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>
            <ChevronDown size={16} />
          </span>
        </div>
      </button>

      <div
        id={`${id}-content`}
        ref={contentRef}
        className={styles.content}
        style={{
          height: isOpen ? (contentHeight === 'auto' ? 'auto' : `${contentHeight}px`) : 0,
          overflow: isOpen ? 'visible' : 'hidden',
        }}
        aria-hidden={!isOpen}
      >
        <div className={styles.contentInner}>
          {children}
        </div>
      </div>
    </section>
  );
}
