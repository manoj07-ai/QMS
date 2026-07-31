'use client';

import React, { useId } from 'react';
import styles from './FormField.module.css';

// ─── Shared types ─────────────────────────────────────────────

interface AiMeta {
  isAiFilled?: boolean;
  confidence?: number;
  isDirty?: boolean;
}

interface BaseFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  aiMeta?: AiMeta;
  className?: string;
}

// ─── Input ────────────────────────────────────────────────────

interface InputProps extends BaseFieldProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {}

export function Input({
  label,
  required,
  error,
  hint,
  aiMeta,
  className = '',
  id: externalId,
  ...inputProps
}: InputProps) {
  const autoId = useId();
  const id = externalId ?? autoId;
  const isAiHighlighted = Boolean(aiMeta?.isAiFilled && !aiMeta?.isDirty);

  return (
    <div className={`${styles.field} ${className}`}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required} aria-hidden="true">*</span>}
        </label>
      </div>
      <div className={styles.inputWrap}>
        <input
          id={id}
          className={[
            styles.input,
            error ? styles.inputError : '',
            isAiHighlighted ? styles.inputAi : '',
          ].join(' ')}
          aria-invalid={!!error}
          aria-required={required}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...inputProps}
        />
      </div>
      {error && <p id={`${id}-error`} className={styles.errorText} role="alert">{error}</p>}
      {!error && hint && <p id={`${id}-hint`} className={styles.hintText}>{hint}</p>}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────

interface SelectOption { value: string; label: string; }

interface SelectProps extends BaseFieldProps, Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  options: SelectOption[];
  placeholder?: string;
}

export function Select({
  label,
  required,
  error,
  hint,
  aiMeta,
  options,
  placeholder = 'Select...',
  className = '',
  id: externalId,
  ...selectProps
}: SelectProps) {
  const autoId = useId();
  const id = externalId ?? autoId;
  const isAiHighlighted = Boolean(aiMeta?.isAiFilled && !aiMeta?.isDirty);

  return (
    <div className={`${styles.field} ${className}`}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required} aria-hidden="true">*</span>}
        </label>
      </div>
      <div className={styles.selectWrap}>
        <select
          id={id}
          className={[
            styles.select,
            error ? styles.inputError : '',
            isAiHighlighted ? styles.inputAi : '',
          ].join(' ')}
          aria-invalid={!!error}
          aria-required={required}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...selectProps}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className={styles.selectArrow} aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
      {error && <p id={`${id}-error`} className={styles.errorText} role="alert">{error}</p>}
      {!error && hint && <p id={`${id}-hint`} className={styles.hintText}>{hint}</p>}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────

interface TextareaProps extends BaseFieldProps, Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {}

export function Textarea({
  label,
  required,
  error,
  hint,
  aiMeta,
  className = '',
  id: externalId,
  ...textareaProps
}: TextareaProps) {
  const autoId = useId();
  const id = externalId ?? autoId;
  const isAiHighlighted = Boolean(aiMeta?.isAiFilled && !aiMeta?.isDirty);

  return (
    <div className={`${styles.field} ${className}`}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required} aria-hidden="true">*</span>}
        </label>
      </div>
      <textarea
        id={id}
        className={[
          styles.textarea,
          error ? styles.inputError : '',
          isAiHighlighted ? styles.inputAi : '',
        ].join(' ')}
        aria-invalid={!!error}
        aria-required={required}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...textareaProps}
      />
      {error && <p id={`${id}-error`} className={styles.errorText} role="alert">{error}</p>}
      {!error && hint && <p id={`${id}-hint`} className={styles.hintText}>{hint}</p>}
    </div>
  );
}
