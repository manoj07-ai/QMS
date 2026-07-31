'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';
import CollapsibleSection from './CollapsibleSection';
import { Input, Select, Textarea } from '@/shared/components/ui/FormField';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateField, confirmAiField } from '@/store/complaintSlice';
import { COMPLAINT_TYPE_OPTIONS } from '@/data/mockData';
import type { ComplaintFormFields } from '@/types';

export default function ComplaintDetailsSection() {
  const dispatch = useAppDispatch();
  const fields   = useAppSelector((s) => s.complaint.current.fields);
  const errors   = useAppSelector((s) => s.complaint.validationErrors);

  function handleChange<K extends keyof ComplaintFormFields>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      dispatch(updateField({ key, value: e.target.value as never }));
      if (fields[key].meta.isAiFilled) dispatch(confirmAiField(key));
    };
  }

  const isComplete = Boolean(
    fields.complaintType.value &&
    fields.complaintDate.value &&
    fields.complaintDescription.value
  );

  return (
    <CollapsibleSection
      id="section-complaint"
      title="Complaint Details"
      subtitle="Describe the nature and specifics of the complaint"
      icon={<MessageSquare size={15} />}
      isComplete={isComplete}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Select
          label="Complaint Type"
          required
          options={COMPLAINT_TYPE_OPTIONS}
          value={fields.complaintType.value}
          aiMeta={fields.complaintType.meta}
          onChange={handleChange('complaintType')}
        />
        <Input
          label="Complaint Date"
          type="date"
          required
          value={fields.complaintDate.value}
          aiMeta={fields.complaintDate.meta}
          error={errors.complaintDate}
          onChange={handleChange('complaintDate')}
        />
      </div>

      <Textarea
        label="Detailed Complaint Description"
        required
        placeholder="Provide a thorough description of the complaint, including observed symptoms, conditions, and any relevant context..."
        value={fields.complaintDescription.value}
        aiMeta={fields.complaintDescription.meta}
        error={errors.complaintDescription}
        rows={5}
        onChange={handleChange('complaintDescription')}
      />
    </CollapsibleSection>
  );
}
