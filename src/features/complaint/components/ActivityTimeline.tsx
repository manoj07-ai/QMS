'use client';

import React, { useState, useEffect } from 'react';
import { History, FileUp, Sparkles, ShieldAlert, Edit3, CheckCircle2, ChevronDown } from 'lucide-react';
import styles from './ActivityTimeline.module.css';
import { useAppSelector } from '@/store';
import type { ActivityItem } from '@/types';

function getIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'upload':
      return <FileUp size={12} />;
    case 'extraction':
      return <Sparkles size={12} />;
    case 'risk':
      return <ShieldAlert size={12} />;
    case 'edit':
      return <Edit3 size={12} />;
    case 'validate':
    case 'save':
      return <CheckCircle2 size={12} />;
    default:
      return <History size={12} />;
  }
}

export default function ActivityTimeline() {
  const timeline = useAppSelector((s) => s.complaint.timeline);
  const [isOpen, setIsOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || timeline.length === 0) return null;

  return (
    <div className={styles.container}>
      <button
        className={styles.headerBtn}
        onClick={() => setIsOpen((o) => !o)}
        type="button"
        aria-expanded={isOpen}
      >
        <div className={styles.headerLeft}>
          <History size={14} className={styles.headerIcon} />
          <span className={styles.headerTitle}>Complaint Activity Timeline</span>
          <span className={styles.countBadge}>{timeline.length} events</span>
        </div>
        <ChevronDown size={14} className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
      </button>

      {isOpen && (
        <div className={`${styles.timelineBody} animate-fade-in`}>
          <div className={styles.list}>
            {timeline.map((item) => (
              <div key={item.id} className={styles.item}>
                <span className={styles.timeStr} suppressHydrationWarning>{item.timestamp}</span>
                <div className={styles.bulletCol}>
                  <span className={`${styles.bulletIcon} ${styles[`bullet_${item.type}`]}`}>
                    {getIcon(item.type)}
                  </span>
                  <span className={styles.line} />
                </div>
                <div className={styles.content}>
                  <div className={styles.titleRow}>
                    <span className={styles.itemTitle}>{item.title}</span>
                    {item.actor && (
                      <span className={`${styles.actorBadge} ${item.actor.includes('AI') ? styles.actorAi : styles.actorUser}`}>
                        {item.actor}
                      </span>
                    )}
                  </div>
                  {item.description && <p className={styles.itemDesc}>{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
