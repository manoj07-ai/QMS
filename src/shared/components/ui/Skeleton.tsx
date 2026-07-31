'use client';

import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = '16px',
  borderRadius = '6px',
  className = '',
}: SkeletonProps) {
  return (
    <span
      className={`${styles.skeleton} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius,
      }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`${styles.skeletonText} ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '65%' : '100%'}
          height="13px"
        />
      ))}
    </div>
  );
}

export function SkeletonField({ className = '' }: { className?: string }) {
  return (
    <div className={`${styles.skeletonField} ${className}`}>
      <Skeleton width="30%" height="11px" />
      <Skeleton width="100%" height="36px" borderRadius="8px" />
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`${styles.skeletonCard} ${className}`}>
      <div className={styles.skeletonCardHeader}>
        <Skeleton width="40%" height="16px" />
        <Skeleton width="60px" height="22px" borderRadius="9999px" />
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}
