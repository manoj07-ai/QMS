'use client';

import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  noBorder?: boolean;
}

export default function Card({
  children,
  className = '',
  padding = 'md',
  hoverable = false,
  noBorder = false,
}: CardProps) {
  return (
    <div
      className={[
        styles.card,
        styles[`padding-${padding}`],
        hoverable ? styles.hoverable : '',
        noBorder ? styles.noBorder : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`${styles.cardHeader} ${className}`}>{children}</div>;
}

export function CardBody({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`${styles.cardBody} ${className}`}>{children}</div>;
}

export function CardDivider() {
  return <div className={styles.divider} />;
}
