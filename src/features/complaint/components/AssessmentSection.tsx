'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';
import CollapsibleSection from './CollapsibleSection';
import { Select } from '@/shared/components/ui/FormField';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateField, confirmAiField } from '@/store/complaintSlice';
import { SEVERITY_OPTIONS, PRIORITY_OPTIONS } from '@/data/mockData';
import type { ComplaintFormFields } from '@/types';

export default function AssessmentSection() {
  const dispatch = useAppDispatch();
  const fields   = useAppSelector((s) => s.complaint.current.fields);
  const errors   = useAppSelector((s) => s.complaint.validationErrors);

  function handleChange<K extends keyof ComplaintFormFields>(key: K) {
    return (e: React.ChangeEvent<HTMLSelectElement>) => {
      dispatch(updateField({ key, value: e.target.value as never }));
      if (fields[key].meta.isAiFilled) dispatch(confirmAiField(key));
    };
  }

  const isComplete = Boolean(fields.initialSeverity.value && fields.priority.value);

  // Severity color mapping for visual cue
  const severityHint: Record<string, string> = {
    critical: '⛔ Immediate action required — potential patient safety impact',
    major:    '⚠️ Significant deviation — batch-level investigation warranted',
    minor:    'ℹ️ Minor deviation — standard review process applies',
    observation: '📋 Observation — no immediate action, log for trending',
  };

  return (
    <CollapsibleSection
      id="section-assessment"
      title="Initial Assessment & Priority"
      subtitle="Classify severity and set complaint priority"
      icon={<ShieldAlert size={15} />}
      isComplete={isComplete}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Select
          label="Initial Severity"
          required
          options={SEVERITY_OPTIONS}
          value={fields.initialSeverity.value}
          aiMeta={fields.initialSeverity.meta}
          error={errors.initialSeverity}
          hint={fields.initialSeverity.value ? severityHint[fields.initialSeverity.value] : undefined}
          onChange={handleChange('initialSeverity')}
        />
        <Select
          label="Priority"
          options={PRIORITY_OPTIONS}
          value={fields.priority.value}
          aiMeta={fields.priority.meta}
          onChange={handleChange('priority')}
        />
      </div>
    </CollapsibleSection>
  );
}
